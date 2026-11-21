// main.ts — hand-in program for the gta6-meme-x-01 bounty entry.
//
// What this entry actually is: a meme posted on X. The post itself is the
// submission, so the only thing this program has to deliver is the post's
// address. That address lives in POST.json next to this file, and the job
// here is to carry it, untouched, into the output directory the grader
// points at — after checking it really looks like an X status address.
//
// The program is deliberately boring: read one small JSON file, validate
// one field, write the file back out. No network, no dependencies, nothing
// beyond the Node standard library.
//
// Usage:
//   node main.ts           validate POST.json and hand it in
//   node main.ts --check   validate POST.json and print the address it
//                          names, without writing anything anywhere

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

// The harness tells us where the entry files live (MAKEFUN_BOT_DIR) and
// where deliverables must land (MAKEFUN_OUTPUT_DIR). The defaults match
// the harness layout so the program also runs sensibly outside it.
const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail loudly and early: a clear message on stderr plus a non-zero exit
// code, so a broken hand-in can never be mistaken for a successful one.
function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// The hosts a genuine post address can live on: X's current domain, its
// www form, and the legacy twitter.com equivalents.
const POST_HOSTS = new Set([
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
]);

// A post address path is exactly /<handle>/status/<numeric id>: one
// segment for the account handle, the literal word "status", and digits
// only for the post id. Anything longer, shorter, or carrying a
// non-numeric id is not a link to a single post.
const POST_PATH = /^\/[^/]+\/status\/\d+$/;

// Check one candidate address and return it unchanged when it really is
// a post address. Every rejection names the exact rule it broke, so a
// bad POST.json can be fixed without guessing which part was wrong.
function checkPostAddress(url: string, sourcePath: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    fail(`${sourcePath}: "url" is not a parseable URL: ${JSON.stringify(url)}`);
  }
  if (u.protocol !== "https:") {
    fail(
      `${sourcePath}: "url" must use https, got ${JSON.stringify(u.protocol)} in ${url}`,
    );
  }
  if (!POST_HOSTS.has(u.hostname)) {
    fail(
      `${sourcePath}: "url" host must be x.com or twitter.com, got ${JSON.stringify(u.hostname)} in ${url}`,
    );
  }
  if (!POST_PATH.test(u.pathname)) {
    fail(
      `${sourcePath}: "url" path must look like /<handle>/status/<numeric id>, got ${JSON.stringify(u.pathname)} in ${url}`,
    );
  }
  return url;
}

// Load POST.json and return its raw text together with the validated
// post address it carries. Each failure mode — file missing, file
// unreadable, invalid JSON, wrong JSON shape, missing or malformed
// "url" — gets its own specific message.
async function loadPost(
  sourcePath: string,
): Promise<{ raw: string; url: string }> {
  let raw: string;
  try {
    raw = await readFile(sourcePath, "utf8");
  } catch (err) {
    if ((err as { code?: string }).code === "ENOENT") {
      fail(`POST.json is missing: no file at ${sourcePath}`);
    }
    fail(`could not read ${sourcePath}: ${String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    fail(`${sourcePath} is not valid JSON (${(err as Error).message})`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail(
      `${sourcePath} must contain a JSON object like {"url": "https://x.com/<handle>/status/<id>"}`,
    );
  }
  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== "string" || url.length === 0) {
    fail(`${sourcePath} needs a non-empty string "url" field naming the post`);
  }
  return { raw, url: checkPostAddress(url, sourcePath) };
}

async function main(): Promise<void> {
  // Load POST.json from the bot directory and validate the address it
  // names. Any problem stops the program here with a specific message.
  const sourcePath = join(botDir, "POST.json");
  const { raw, url } = await loadPost(sourcePath);

  // With --check the job ends here: the address is valid, so report it
  // and stop. Nothing is created and nothing is written, which makes
  // the flag safe to run against a live entry directory.
  if (process.argv.slice(2).includes("--check")) {
    console.log(`ok: ${url}`);
    return;
  }

  // Make sure the output directory exists, then hand the file in
  // exactly as it was given to us — the raw bytes, never a re-serialised
  // version, so the output POST.json is byte-identical to the input.
  try {
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, "POST.json"), raw, "utf8");
  } catch (err) {
    fail(`could not write the output POST.json: ${String(err)}`);
  }

  console.log(`handed in post: ${url}`);
}

await main();
