import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

const BACKEND_ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const SECRET_SCAN_TIMEOUT_MS = 120_000;
const HOOK_TIMEOUT_MS = SECRET_SCAN_TIMEOUT_MS + 10_000;
const FIXTURE_TEST_TIMEOUT_MS = 60_000;
const LINKED_TOOLING = [".bin", "secretlint", "@secretlint"];

interface Manifest {
  scripts: Record<string, string>;
  secretlint: unknown;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface Lockfile {
  packages: Record<string, { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>;
}

function readBackendFile(relativePath: string): string {
  return readFileSync(join(BACKEND_ROOT, relativePath), "utf8");
}

function readManifest(): Manifest {
  return JSON.parse(readBackendFile("package.json")) as Manifest;
}

function recognizedCredentials(): string {
  const awsAccessKeyId = ["AKIA", "Q7ZX4MN2PL8RT5VB"].join("");
  const githubToken = ["ghp", "_", "a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8"].join("");
  return `const awsAccessKeyId = "${awsAccessKeyId}";\nconst githubToken = "${githubToken}";\n`;
}

function writeFixtureFile(fixtureRoot: string, relativePath: string, content: string): void {
  const target = join(fixtureRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

function linkTooling(fixtureRoot: string): void {
  mkdirSync(join(fixtureRoot, "node_modules"), { recursive: true });
  for (const entry of LINKED_TOOLING) {
    symlinkSync(join(BACKEND_ROOT, "node_modules", entry), join(fixtureRoot, "node_modules", entry));
  }
}

function describeOutput(result: SpawnSyncReturns<string>): string {
  return `${result.stdout}\n${result.stderr}`;
}

function runSecretScan(directory: string): SpawnSyncReturns<string> {
  return spawnSync("npm", ["run", "secret-scan"], {
    cwd: directory,
    encoding: "utf8",
    timeout: SECRET_SCAN_TIMEOUT_MS,
  });
}

describe("secret-scan over a fixture built from the backend's own manifest and ignore file", () => {
  const fixtures: string[] = [];

  function buildFixture(files: Record<string, string>): string {
    const manifest = readManifest();
    const fixtureRoot = mkdtempSync(join(tmpdir(), "backend-secret-scan-"));
    fixtures.push(fixtureRoot);
    writeFixtureFile(
      fixtureRoot,
      "package.json",
      JSON.stringify({
        name: "secret-scan-fixture",
        private: true,
        scripts: { "secret-scan": manifest.scripts["secret-scan"] },
        secretlint: manifest.secretlint,
      }),
    );
    writeFixtureFile(fixtureRoot, ".secretlintignore", readBackendFile(".secretlintignore"));
    linkTooling(fixtureRoot);
    for (const [relativePath, content] of Object.entries(files)) {
      writeFixtureFile(fixtureRoot, relativePath, content);
    }
    return fixtureRoot;
  }

  afterEach(() => {
    for (const fixtureRoot of fixtures.splice(0)) {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it(
    "exits non-zero and reports the file when a source file holds a recognized credential",
    () => {
      const reportedPath = "src/nested/leaked.ts";
      const fixtureRoot = buildFixture({ [reportedPath]: recognizedCredentials() });

      const result = runSecretScan(fixtureRoot);

      expect(result.status).not.toBe(0);
      expect(describeOutput(result)).toContain(reportedPath);
    },
    FIXTURE_TEST_TIMEOUT_MS,
  );

  it(
    "exits non-zero and reports .env.example when it holds a recognized credential",
    () => {
      const fixtureRoot = buildFixture({ ".env.example": recognizedCredentials() });

      const result = runSecretScan(fixtureRoot);

      expect(result.status).not.toBe(0);
      expect(describeOutput(result)).toContain(".env.example");
    },
    FIXTURE_TEST_TIMEOUT_MS,
  );

  it.each([
    ["node_modules/", "node_modules/fixture-package/leaked.js"],
    ["dist/", "dist/leaked.js"],
    ["coverage/", "coverage/leaked.txt"],
    [".env", ".env"],
  ])(
    "exits zero when the only recognized credential sits under the ignored path %s",
    (_ignoredPath, plantedPath) => {
      const fixtureRoot = buildFixture({ [plantedPath]: recognizedCredentials() });

      const result = runSecretScan(fixtureRoot);

      expect(result.status).toBe(0);
    },
    FIXTURE_TEST_TIMEOUT_MS,
  );
});

describe("secret-scan over the backend tree", () => {
  let elapsedMs = 0;
  let result: SpawnSyncReturns<string>;

  beforeAll(() => {
    const startedAt = Date.now();
    result = runSecretScan(BACKEND_ROOT);
    elapsedMs = Date.now() - startedAt;
  }, HOOK_TIMEOUT_MS);

  it("exits zero over the tree when no recognized credential sits outside the ignored paths", () => {
    expect(result.status).toBe(0);
  });

  it("completes within the secret-scan step's 120-second timeout", () => {
    expect(elapsedMs).toBeLessThan(SECRET_SCAN_TIMEOUT_MS);
  });
});

describe("secret-scan dependency declarations", () => {
  it.each(["secretlint", "@secretlint/secretlint-rule-preset-recommend"])(
    "declares %s at ^8.0.0 as a devDependency",
    (packageName) => {
      expect(readManifest().devDependencies[packageName]).toBe("^8.0.0");
    },
  );

  it("keeps package-lock.json's root dependency ranges identical to package.json's so npm ci finds no mismatch", () => {
    const manifest = readManifest();
    const lockfile = JSON.parse(readBackendFile("package-lock.json")) as Lockfile;
    const lockRoot = lockfile.packages[""];

    expect({
      dependencies: lockRoot?.dependencies,
      devDependencies: lockRoot?.devDependencies,
    }).toEqual({
      dependencies: manifest.dependencies,
      devDependencies: manifest.devDependencies,
    });
  });
});
