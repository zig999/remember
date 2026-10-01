import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const LINT_TIMEOUT_MS = 180_000;
const SEVERITY_WARN = 1;
const SEVERITY_ERROR = 2;

const RESTRICTED_IMPORTS = "no-restricted-imports";
const SERVICE_FILE = "src/modules/example/example.service.ts";
const REPOSITORY_FILE = "src/modules/example/example.repository.ts";
const EXISTING_SERVICES = "src/modules/**/*.service.ts";

const IMPORT_OF_SERVICE =
  'import { other } from "./other.service.js";\n\nexport const value: number = other;\n';
const IMPORT_OF_REPOSITORY =
  'import { other } from "./other.repository.js";\n\nexport const value: number = other;\n';

const eslint = new ESLint({ cwd: BACKEND_ROOT });

async function restrictedImportSeverities(
  code: string,
  relativePath: string
): Promise<readonly number[]> {
  const [result] = await eslint.lintText(code, { filePath: resolve(BACKEND_ROOT, relativePath) });
  const fatal = result.messages.find((message) => message.fatal === true);
  if (fatal !== undefined) {
    throw new Error(`${relativePath} could not be linted: ${fatal.message}`);
  }
  const severities = result.messages
    .filter((message) => message.ruleId === RESTRICTED_IMPORTS)
    .map((message) => message.severity);
  return [...new Set(severities)];
}

const BOUNDARY_CASES = [
  {
    name: "reports a service file importing a module whose path ends in .service.js as a warning",
    path: SERVICE_FILE,
    code: IMPORT_OF_SERVICE,
    expected: [SEVERITY_WARN],
  },
  {
    name: "does not report a service file importing a module whose path does not end in .service.js",
    path: SERVICE_FILE,
    code: IMPORT_OF_REPOSITORY,
    expected: [],
  },
  {
    name: "does not report a repository file importing a module whose path ends in .service.js",
    path: REPOSITORY_FILE,
    code: IMPORT_OF_SERVICE,
    expected: [],
  },
] as const;

describe("the service-import boundary in the backend lint configuration", () => {
  it.each(BOUNDARY_CASES)("$name", async ({ path, code, expected }) => {
    const severities = await restrictedImportSeverities(code, path);

    expect(severities).toEqual(expected);
  });

  it(
    "raises no error-severity finding from the rule over the existing service files",
    async () => {
      const results = await eslint.lintFiles([EXISTING_SERVICES]);

      const errors = results.flatMap((result) =>
        result.messages
          .filter(
            (message) => message.ruleId === RESTRICTED_IMPORTS && message.severity === SEVERITY_ERROR
          )
          .map((message) => `${result.filePath}:${message.line} ${message.message}`)
      );

      expect(errors).toEqual([]);
    },
    LINT_TIMEOUT_MS
  );
});
