import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import tseslint from "typescript-eslint";
import { beforeAll, describe, expect, it } from "vitest";

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const LINT_TIMEOUT_MS = 180_000;

const TEST_FILE_GLOBS = ["**/__tests__/**", "**/*.spec.ts", "**/*.test.ts"];

const FILES_WRITTEN_BY_THIS_TASK = [
  "src/modules/chat/routes/chat.schemas.ts",
  "src/modules/chat/service/chat-agent.service.ts",
  "src/modules/curation/mcp/error-envelope.ts",
  "src/modules/knowledge-graph/mcp/error-envelope.ts",
  "src/modules/curation/repository/curation.repository.ts",
];

const EXPLICIT_BOUNDARY_RULE = "@typescript-eslint/explicit-module-boundary-types";
const UNUSED_VARS_RULE = "@typescript-eslint/no-unused-vars";
const PREFER_CONST_RULE = "prefer-const";

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly ruleId: string;
  readonly messageId: string;
  readonly message: string;
}

function describeFinding(finding: Finding): string {
  return `${finding.file}:${finding.line} ${finding.ruleId} (${finding.messageId}) ${finding.message}`;
}

function relativeToBackend(filePath: string): string {
  return filePath.slice(BACKEND_ROOT.length + 1);
}

function buildEslint(): ESLint {
  return new ESLint({
    cwd: BACKEND_ROOT,
    overrideConfigFile: true,
    overrideConfig: [
      { ignores: TEST_FILE_GLOBS },
      {
        files: ["src/**/*.ts"],
        languageOptions: { parser: tseslint.parser },
        plugins: { "@typescript-eslint": tseslint.plugin },
        rules: {
          [EXPLICIT_BOUNDARY_RULE]: "error",
          [UNUSED_VARS_RULE]: ["error", { argsIgnorePattern: "^_" }],
          [PREFER_CONST_RULE]: "error",
        },
      },
    ],
  });
}

function assertRunCoveredTheWrittenFiles(results: readonly ESLint.LintResult[]): void {
  const linted = results.map((result) => relativeToBackend(result.filePath));
  for (const required of FILES_WRITTEN_BY_THIS_TASK) {
    if (!linted.includes(required)) {
      throw new Error(`the lint run did not cover ${required}, so its findings prove nothing`);
    }
  }
}

function collectFindings(results: readonly ESLint.LintResult[]): readonly Finding[] {
  const findings: Finding[] = [];
  for (const result of results) {
    for (const message of result.messages) {
      if (message.fatal === true || message.ruleId === null) {
        throw new Error(`${result.filePath}:${message.line} could not be linted: ${message.message}`);
      }
      findings.push({
        file: relativeToBackend(result.filePath),
        line: message.line,
        ruleId: message.ruleId,
        messageId: message.messageId ?? "",
        message: message.message,
      });
    }
  }
  return findings;
}

async function lintNonTestSource(): Promise<readonly Finding[]> {
  const results = await buildEslint().lintFiles(["src/**/*.ts"]);
  assertRunCoveredTheWrittenFiles(results);
  return collectFindings(results);
}

function eslintDirectiveCommentsIn(relativePath: string): readonly string[] {
  const source = readFileSync(resolve(BACKEND_ROOT, relativePath), "utf8");
  const { ast } = tseslint.parser.parseForESLint(source, {
    comment: true,
    loc: true,
    range: true,
    filePath: resolve(BACKEND_ROOT, relativePath),
  });
  return (ast.comments ?? [])
    .filter((comment) => /\beslint-(disable|enable)/.test(comment.value))
    .map((comment) => `${relativePath}:${comment.loc.start.line} ${comment.value.trim()}`);
}

describe("non-test source under backend/src", () => {
  let findings: readonly Finding[] = [];

  beforeAll(async () => {
    findings = await lintNonTestSource();
  }, LINT_TIMEOUT_MS);

  it("declares a return type on every exported function", () => {
    const missing = findings
      .filter(
        (finding) =>
          finding.ruleId === EXPLICIT_BOUNDARY_RULE && finding.messageId === "missingReturnType"
      )
      .map(describeFinding);

    expect(missing).toEqual([]);
  });

  it("declares a type on every parameter of an exported function", () => {
    const missing = findings
      .filter(
        (finding) =>
          finding.ruleId === EXPLICIT_BOUNDARY_RULE &&
          finding.messageId.startsWith("missingArgType")
      )
      .map(describeFinding);

    expect(missing).toEqual([]);
  });

  it("leaves no import, variable or parameter declared and never used, apart from underscore-prefixed parameters", () => {
    const unused = findings.filter((finding) => finding.ruleId === UNUSED_VARS_RULE).map(describeFinding);

    expect(unused).toEqual([]);
  });

  it("leaves no let declaration without a reassignment", () => {
    const neverReassigned = findings
      .filter((finding) => finding.ruleId === PREFER_CONST_RULE)
      .map(describeFinding);

    expect(neverReassigned).toEqual([]);
  });

  it("adds no eslint-disable comment to any file this task wrote", () => {
    const directives = FILES_WRITTEN_BY_THIS_TASK.flatMap(eslintDirectiveCommentsIn);

    expect(directives).toEqual([]);
  });
});
