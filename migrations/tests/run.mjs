import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import pg from 'pg';

const run = promisify(execFile);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TESTS = resolve(ROOT, 'tests');
const NEONCTL = resolve(ROOT, 'node_modules', '.bin', 'neonctl');
const PROJECT_ID = 'spring-wind-69847430';
const PARENT_BRANCH = 'production';
const DATABASE = 'neondb';
const ROLE = 'neondb_owner';
const TRUE_VALUES = new Set(['on', 'true', '1', 'yes', 't', 'y']);
const CONNECT_ATTEMPTS = 5;
const CONNECT_PAUSE_MS = 2000;
const DOLLAR_TAG = /\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/y;

function display(file) {
  return relative(ROOT, file);
}

async function neonctl(args, json = true) {
  const full = [...args, '--project-id', PROJECT_ID, ...(json ? ['-o', 'json'] : [])];
  let stdout;
  try {
    ({ stdout } = await run(NEONCTL, full, { env: process.env, maxBuffer: 16 * 1024 * 1024 }));
  } catch (error) {
    throw new Error(`neonctl ${args[0]} ${args[1] ?? ''} failed: ${error.stderr?.trim() || error.message}`);
  }
  if (!json) {
    return stdout.trim();
  }
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`neonctl ${args[0]} ${args[1] ?? ''} printed output that is not JSON`);
  }
}

async function createBranch(branch) {
  branch.requested = true;
  const created = await neonctl(['branches', 'create', '--name', branch.name, '--parent', PARENT_BRANCH]);
  branch.id = created.branch?.id ?? null;
  if (!branch.id) {
    throw new Error(`neonctl did not report the id of branch ${branch.name}`);
  }
  branch.endpointIds = new Set(
    (created.endpoints ?? []).filter((endpoint) => endpoint.branch_id === branch.id).map((endpoint) => endpoint.id),
  );
}

async function connectionStringFor(branch) {
  const uri = await neonctl(
    ['connection-string', branch.id, '--database-name', DATABASE, '--role-name', ROLE],
    false,
  );
  let host;
  try {
    host = new URL(uri).hostname;
  } catch {
    throw new Error('neonctl connection-string did not print a connection string');
  }
  const endpoint = host.split('.')[0].replace(/-pooler$/, '');
  if (!branch.endpointIds.has(endpoint)) {
    throw new Error(`endpoint ${endpoint} is not an endpoint of branch ${branch.name}; refusing to connect`);
  }
  return uri;
}

async function removeBranch(branch) {
  if (!branch.requested) {
    return;
  }
  try {
    await neonctl(['branches', 'delete', branch.id ?? branch.name], false);
  } catch (error) {
    console.error(`could not delete branch ${branch.name}: ${error.message}`);
    process.exitCode = 1;
  }
}

function cleanup(branch) {
  branch.removal ??= removeBranch(branch);
  return branch.removal;
}

async function connect(connectionString) {
  for (let attempt = 1; ; attempt += 1) {
    const client = new pg.Client({ connectionString });
    client.on('error', (error) => console.error(`connection error: ${error.message}`));
    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt === CONNECT_ATTEMPTS) {
        throw new Error(`could not connect to the test branch: ${error.message}`);
      }
      await delay(CONNECT_PAUSE_MS);
    }
  }
}

async function withClient(connectionString, work) {
  const client = await connect(connectionString);
  try {
    return await work(client);
  } finally {
    await client.end().catch(() => {});
  }
}

function isIdentChar(character) {
  return character !== undefined && /[A-Za-z0-9_$]/.test(character);
}

function skipQuoted(text, from, quote, escapes) {
  let i = from + 1;
  while (i < text.length) {
    if (escapes && text[i] === '\\') {
      i += 2;
    } else if (text[i] === quote) {
      if (text[i + 1] !== quote) {
        return i + 1;
      }
      i += 2;
    } else {
      i += 1;
    }
  }
  return text.length;
}

function skipBlockComment(text, from) {
  let depth = 0;
  let i = from;
  while (i < text.length) {
    if (text.startsWith('/*', i)) {
      depth += 1;
      i += 2;
    } else if (text.startsWith('*/', i)) {
      depth -= 1;
      i += 2;
      if (depth === 0) {
        return i;
      }
    } else {
      i += 1;
    }
  }
  return text.length;
}

function parseMeta(line) {
  const words = [...line.matchAll(/'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2]);
  return { kind: 'meta', name: words[0], args: words.slice(1) };
}

function parse(text, label) {
  const items = [];
  let start = 0;
  let depth = 0;
  let hasContent = false;
  let lineStart = true;
  let i = 0;

  const flush = (end) => {
    if (hasContent) {
      items.push({ kind: 'sql', text: text.slice(start, end) });
    }
    start = end;
    depth = 0;
    hasContent = false;
  };

  while (i < text.length) {
    const c = text[i];
    if (c === '\n') {
      lineStart = true;
      i += 1;
      continue;
    }
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    const atLineStart = lineStart;
    lineStart = false;

    if (atLineStart && c === '\\') {
      if (hasContent) {
        throw new Error(`${label}: meta-command inside an unterminated statement`);
      }
      let end = text.indexOf('\n', i);
      if (end === -1) {
        end = text.length;
      }
      items.push(parseMeta(text.slice(i + 1, end)));
      i = end;
      start = end;
      continue;
    }
    if (text.startsWith('--', i)) {
      const end = text.indexOf('\n', i);
      i = end === -1 ? text.length : end;
      continue;
    }
    if (text.startsWith('/*', i)) {
      i = skipBlockComment(text, i);
      continue;
    }

    hasContent = true;
    if (c === "'") {
      const escapes = /[eE]/.test(text[i - 1] ?? '') && !isIdentChar(text[i - 2]);
      i = skipQuoted(text, i, "'", escapes);
      continue;
    }
    if (c === '"') {
      i = skipQuoted(text, i, '"', false);
      continue;
    }
    if (c === '$' && !isIdentChar(text[i - 1])) {
      DOLLAR_TAG.lastIndex = i;
      const tag = DOLLAR_TAG.exec(text);
      if (tag) {
        const close = text.indexOf(tag[0], i + tag[0].length);
        i = close === -1 ? text.length : close + tag[0].length;
        continue;
      }
    }
    if (c === '(') {
      depth += 1;
    } else if (c === ')') {
      depth -= 1;
    } else if (c === ';' && depth <= 0) {
      flush(i + 1);
    }
    i += 1;
  }
  flush(text.length);
  return items;
}

function newState(stopOnError) {
  return { stopOnError, failed: false, stack: [] };
}

async function statement(client, file, text, state) {
  try {
    await client.query(text);
  } catch (error) {
    state.failed = true;
    console.error(`  ${display(file)}: ${error.message}`);
  }
}

async function meta(client, file, item, state) {
  if (item.name === 'set') {
    const [name, value] = item.args;
    if (name !== 'ON_ERROR_STOP' || value === undefined) {
      throw new Error(`${display(file)}: unsupported \\set ${name ?? ''}`);
    }
    state.stopOnError = TRUE_VALUES.has(value.toLowerCase());
    return;
  }
  if (item.name === 'ir') {
    if (item.args.length !== 1) {
      throw new Error(`${display(file)}: \\ir takes exactly one path`);
    }
    await execute(client, resolve(dirname(file), item.args[0]), state);
    return;
  }
  throw new Error(`${display(file)}: unsupported meta-command \\${item.name ?? ''}`);
}

async function execute(client, file, state) {
  if (state.stack.includes(file)) {
    throw new Error(`${display(file)}: \\ir cycle`);
  }
  state.stack.push(file);
  try {
    const items = parse(await readFile(file, 'utf8'), display(file));
    for (const item of items) {
      if (item.kind === 'sql') {
        await statement(client, file, item.text, state);
      } else {
        await meta(client, file, item, state);
      }
      if (state.failed && state.stopOnError) {
        return;
      }
    }
  } finally {
    state.stack.pop();
  }
}

async function applyMigration(connectionString, migration) {
  const state = newState(true);
  await withClient(connectionString, (client) => execute(client, resolve(ROOT, migration.name), state));
  if (state.failed) {
    throw new Error(`applying migration ${migration.name} failed`);
  }
  console.log(`applied ${migration.name}`);
}

async function runScript(connectionString, script) {
  const state = newState(false);
  try {
    await withClient(connectionString, (client) => execute(client, resolve(TESTS, script), state));
  } catch (error) {
    state.failed = true;
    console.error(`  ${error.message}`);
  }
  console.log(`${state.failed ? 'FAIL' : 'PASS'} tests/${script}`);
  return !state.failed;
}

async function readMarker() {
  const text = (await readFile(resolve(TESTS, 'applied.txt'), 'utf8')).trim();
  if (!/^\d{4}$/.test(text)) {
    throw new Error('tests/applied.txt must hold one four-digit migration number');
  }
  return Number(text);
}

async function listMigrations(marker) {
  const entries = await readdir(ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^\d{4}_.+\.sql$/.test(entry.name))
    .map((entry) => ({ name: entry.name, number: Number(entry.name.slice(0, 4)) }))
    .filter((migration) => migration.number > marker)
    .sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
}

async function listScripts() {
  const entries = await readdir(TESTS, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort();
}

function newBranch() {
  const stamp = new Date().toISOString().replace(/[^0-9]/g, '');
  return {
    name: `test-run-${stamp}-${randomBytes(3).toString('hex')}`,
    id: null,
    endpointIds: new Set(),
    requested: false,
    removal: null,
  };
}

async function main() {
  const marker = await readMarker();
  const migrations = await listMigrations(marker);
  const scripts = await listScripts();
  if (scripts.length === 0) {
    throw new Error('there is no tests/*.sql script to run');
  }

  const branch = newBranch();
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      process.exitCode = 1;
      cleanup(branch).finally(() => process.exit());
    });
  }

  try {
    await createBranch(branch);
    const connectionString = await connectionStringFor(branch);
    for (const migration of migrations) {
      await applyMigration(connectionString, migration);
    }
    let allPassed = true;
    for (const script of scripts) {
      allPassed = (await runScript(connectionString, script)) && allPassed;
    }
    if (!allPassed) {
      process.exitCode = 1;
    }
  } finally {
    await cleanup(branch);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
