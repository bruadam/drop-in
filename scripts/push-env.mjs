#!/usr/bin/env node
/**
 * Publish a local .env-shaped file into EAS's environment-variable store,
 * so EAS Build / EAS Workflows / EAS Update can read it without the file
 * ever being committed.
 *
 * Usage:
 *   node scripts/push-env.mjs <path-to-env-file> <development|preview|production>
 *
 * Examples:
 *   node scripts/push-env.mjs .env.dev development
 *   node scripts/push-env.mjs .env.staging preview
 *   node scripts/push-env.mjs .env.production production
 *
 * Requires: `eas login` already done locally (or EXPO_TOKEN set in your shell).
 *
 * Visibility rules (see docs/ENVIRONMENTS.md for the full list):
 *   - anything containing SECRET, PASSWORD, or SERVICE_ROLE  -> "secret"
 *   - CLERK_SECRET_KEY, POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_*   -> "secret"
 *   - everything else (EXPO_PUBLIC_*, APP_ENV, EAS_PROJECT_ID) -> "plaintext"
 * "secret" values are never readable again, even by you, once set — EAS
 * only lets you overwrite them. That's intentional for keys that can leak.
 */

import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const [, , envFilePath, environment] = process.argv;

const VALID_ENVIRONMENTS = ["development", "preview", "production"];

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

if (!envFilePath || !environment) {
  fail(
    "Usage: node scripts/push-env.mjs <path-to-env-file> <development|preview|production>",
  );
}
if (!VALID_ENVIRONMENTS.includes(environment)) {
  fail(
    `"${environment}" isn't one of EAS's environments: ${VALID_ENVIRONMENTS.join(", ")}. ` +
      "Custom environment names need an Enterprise EAS plan — see eas.json's comments.",
  );
}
if (!existsSync(envFilePath)) {
  fail(`No file at ${envFilePath}. Copy the matching .env.*.example first.`);
}

const SECRET_PATTERNS = [/SECRET/i, /PASSWORD/i, /SERVICE_ROLE/i, /POLAR_ACCESS_TOKEN/, /POLAR_WEBHOOK/];

function visibilityFor(key) {
  return SECRET_PATTERNS.some((re) => re.test(key)) ? "secret" : "plaintext";
}

function parseEnvFile(text) {
  const entries = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    // Strip a single layer of surrounding quotes, if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("REPLACE_WITH_")) {
      console.warn(`  ⚠ skipping ${key}: still a placeholder value`);
      continue;
    }
    entries.push([key, value]);
  }
  return entries;
}

const entries = parseEnvFile(readFileSync(envFilePath, "utf8"));

if (entries.length === 0) {
  fail(`No real values found in ${envFilePath} — did you fill in the placeholders?`);
}

console.log(`\nPublishing ${entries.length} variable(s) from ${envFilePath} to EAS "${environment}"...\n`);

let failures = 0;
for (const [key, value] of entries) {
  const visibility = visibilityFor(key);
  try {
    execFileSync(
      "eas",
      [
        "env:create",
        "--name", key,
        "--value", value,
        "--environment", environment,
        "--visibility", visibility,
        "--non-interactive",
      ],
      { stdio: "pipe" },
    );
    console.log(`  ✓ ${key} (${visibility})`);
  } catch (err) {
    // Most common failure: the variable already exists. eas env:create has
    // no upsert flag in older CLI versions, so fall back to env:update.
    try {
      execFileSync(
        "eas",
        [
          "env:update",
          "--name", key,
          "--value", value,
          "--environment", environment,
          "--visibility", visibility,
          "--non-interactive",
        ],
        { stdio: "pipe" },
      );
      console.log(`  ✓ ${key} (${visibility}, updated)`);
    } catch (err2) {
      console.error(`  ✗ ${key}: ${err2.message.split("\n")[0]}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  fail(`${failures} variable(s) failed to publish. See errors above.`);
}

console.log(`\nDone. Verify with: eas env:list --environment ${environment}\n`);
