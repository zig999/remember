import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const LINT_TIMEOUT_MS = 180_000;
const SEVERITY_WARN = 1;
const SEVERITY_ERROR = 2;
const FUNCTION_LINE_LIMIT = 30;
const PARAMETER_LIMIT = 3;

const NON_TEST_FILE = "src/modules/example/example.service.ts";

const NO_CONSOLE = "no-console";
const NO_EMPTY = "no-empty";
const NO_NAMESPACE = "@typescript-eslint/no-namespace";
const NO_REQUIRE_IMPORTS = "@typescript-eslint/no-require-imports";
const NO_EXPLICIT_ANY = "@typescript-eslint/no-explicit-any";
const NO_UNUSED_VARS = "@typescript-eslint/no-unused-vars";
const BOUNDARY_TYPES = "@typescript-eslint/explicit-module-boundary-types";
const NAMING = "@typescript-eslint/naming-convention";
const MAX_LINES = "max-lines-per-function";
const MAX_PARAMS = "max-params";

const ANY_ANNOTATION = "export const value: any = 1;\n";
const UNUSED_IMPORT = 'import { readFileSync } from "node:fs";\n';
const MISSING_RETURN_TYPE = "export function total(value: number) {\n  return value;\n}\n";

const eslint = new ESLint({ cwd: BACKEND_ROOT });

async function severitiesReported(
  code: string,
  relativePath: string,
  ruleId: string
): Promise<readonly number[]> {
  const [result] = await eslint.lintText(code, { filePath: resolve(BACKEND_ROOT, relativePath) });
  const fatal = result.messages.find((message) => message.fatal === true);
  if (fatal !== undefined) {
    throw new Error(`${relativePath} could not be linted: ${fatal.message}`);
  }
  const severities = result.messages
    .filter((message) => message.ruleId === ruleId)
    .map((message) => message.severity);
  return [...new Set(severities)];
}

function functionOfLines(total: number): string {
  const body = Array.from({ length: total - 2 }, (_unused, index) => `  void ${index};`);
  return ["function work(): void {", ...body, "}"].join("\n") + "\n";
}

function functionWithParameters(count: number): string {
  const parameters = Array.from({ length: count }, (_unused, index) => `p${index}: number`);
  return `function work(${parameters.join(", ")}): void {\n  void 0;\n}\n`;
}

interface RuleCase {
  readonly name: string;
  readonly code: string;
  readonly ruleId: string;
  readonly expected: readonly number[];
}

const NON_TEST_CASES: readonly RuleCase[] = [
  {
    name: "reports a rule only the recommended configuration enables as an error",
    code: "namespace Shapes {\n  export const size = 1;\n}\n",
    ruleId: NO_NAMESPACE,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports a console call as an error",
    code: 'console.log("started");\n',
    ruleId: NO_CONSOLE,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports a require call as an error",
    code: 'export const fs = require("node:fs");\n',
    ruleId: NO_REQUIRE_IMPORTS,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports an empty catch block as an error",
    code: 'try {\n  JSON.parse("{}");\n} catch {}\n',
    ruleId: NO_EMPTY,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports a value annotated with any as an error",
    code: ANY_ANNOTATION,
    ruleId: NO_EXPLICIT_ANY,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports an exported function without a declared return type as an error",
    code: MISSING_RETURN_TYPE,
    ruleId: BOUNDARY_TYPES,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports an exported function with an untyped parameter as an error",
    code: "export function echo(value): number {\n  return 1;\n}\n",
    ruleId: BOUNDARY_TYPES,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports an unused import as an error",
    code: UNUSED_IMPORT,
    ruleId: NO_UNUSED_VARS,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "reports an unused parameter without an underscore prefix as an error",
    code: "export function ignore(unused: number): number {\n  return 1;\n}\n",
    ruleId: NO_UNUSED_VARS,
    expected: [SEVERITY_ERROR],
  },
  {
    name: "does not report an unused parameter whose name begins with an underscore",
    code: "export function ignore(_unused: number): number {\n  return 1;\n}\n",
    ruleId: NO_UNUSED_VARS,
    expected: [],
  },
  {
    name: "reports a function of thirty-one lines as a warning",
    code: functionOfLines(FUNCTION_LINE_LIMIT + 1),
    ruleId: MAX_LINES,
    expected: [SEVERITY_WARN],
  },
  {
    name: "does not report a function of thirty lines",
    code: functionOfLines(FUNCTION_LINE_LIMIT),
    ruleId: MAX_LINES,
    expected: [],
  },
  {
    name: "reports a function with four positional parameters as a warning",
    code: functionWithParameters(PARAMETER_LIMIT + 1),
    ruleId: MAX_PARAMS,
    expected: [SEVERITY_WARN],
  },
  {
    name: "does not report a function with three positional parameters",
    code: functionWithParameters(PARAMETER_LIMIT),
    ruleId: MAX_PARAMS,
    expected: [],
  },
  {
    name: "reports a type alias that is not PascalCase as a warning",
    code: "export type bad_name = string;\n",
    ruleId: NAMING,
    expected: [SEVERITY_WARN],
  },
  {
    name: "reports an interface that is not PascalCase as a warning",
    code: "export interface order_shape {\n  id: string;\n}\n",
    ruleId: NAMING,
    expected: [SEVERITY_WARN],
  },
  {
    name: "does not report a PascalCase interface without an I prefix",
    code: "export interface Order {\n  id: string;\n}\n",
    ruleId: NAMING,
    expected: [],
  },
];

const TEST_FILE_LOCATIONS = [
  { location: "a file under src/__tests__", path: "src/__tests__/unit/example/example.ts" },
  { location: "a *.spec.ts file under src", path: "src/modules/example/example.spec.ts" },
  { location: "a *.test.ts file under src", path: "src/modules/example/example.test.ts" },
] as const;

const RELAXED_RULES = [
  { subject: "a value annotated with any", code: ANY_ANNOTATION, ruleId: NO_EXPLICIT_ANY },
  { subject: "an unused import", code: UNUSED_IMPORT, ruleId: NO_UNUSED_VARS },
] as const;

const RELAXATION_CASES = TEST_FILE_LOCATIONS.flatMap((place) =>
  RELAXED_RULES.map((rule) => ({
    name: `reports ${rule.subject} as a warning in ${place.location}`,
    path: place.path,
    code: rule.code,
    ruleId: rule.ruleId,
  }))
);

function describeNonTestFile(): void {
  describe("in a non-test file under src", () => {
    it.each(NON_TEST_CASES)("$name", async ({ code, ruleId, expected }) => {
      const severities = await severitiesReported(code, NON_TEST_FILE, ruleId);

      expect(severities).toEqual(expected);
    });

    it("reports no rule at all for a file that reads process.env", async () => {
      const code = "export const mode = process.env.NODE_ENV;\n";

      const [result] = await eslint.lintText(code, {
        filePath: resolve(BACKEND_ROOT, NON_TEST_FILE),
      });

      expect(result.messages.map((message) => `${message.ruleId}: ${message.message}`)).toEqual([]);
    });

    it("does not report a pg import under no-restricted-imports", async () => {
      const code = 'import { Pool } from "pg";\n\nexport const pool = new Pool();\n';

      const plain = await severitiesReported(code, NON_TEST_FILE, "no-restricted-imports");
      const typed = await severitiesReported(
        code,
        NON_TEST_FILE,
        "@typescript-eslint/no-restricted-imports"
      );

      expect([...plain, ...typed]).toEqual([]);
    });
  });
}

function describeTestFiles(): void {
  describe("in a test file under src", () => {
    it.each(RELAXATION_CASES)("$name", async ({ path, code, ruleId }) => {
      const severities = await severitiesReported(code, path, ruleId);

      expect(severities).toEqual([SEVERITY_WARN]);
    });

    it.each(TEST_FILE_LOCATIONS)(
      "reports an exported function without a declared return type as an error in $location",
      async ({ path }) => {
        const severities = await severitiesReported(MISSING_RETURN_TYPE, path, BOUNDARY_TYPES);

        expect(severities).toEqual([SEVERITY_ERROR]);
      }
    );
  });
}

function describeBackendTree(): void {
  describe("over the backend tree", () => {
    it(
      "leaves no file with a lint error, so npm run lint exits 0",
      async () => {
        const results = await new ESLint({ cwd: BACKEND_ROOT }).lintFiles(["."]);

        const errors = results.flatMap((result) =>
          result.messages
            .filter((message) => message.severity === SEVERITY_ERROR)
            .map((message) => `${result.filePath}:${message.line} ${message.ruleId} ${message.message}`)
        );

        expect(errors).toEqual([]);
      },
      LINT_TIMEOUT_MS
    );
  });
}

describe("the backend lint rule table", () => {
  describeNonTestFile();
  describeTestFiles();
  describeBackendTree();
});
