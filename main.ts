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

async function main(): Promise<void> {
  // Step 1 — load POST.json from the bot directory.
  const sourcePath = join(botDir, "POST.json");
  let raw: string;
  try {
    raw = await readFile(sourcePath, "utf8");
  } catch {
    fail(`could not read ${sourcePath}`);
  }

  // Step 2 — parse it and pull out the "url" field.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail(`${sourcePath} is not valid JSON`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    fail(`${sourcePath} must contain a JSON object`);
  }
  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== "string" || url.length === 0) {
    fail(`${sourcePath} needs a non-empty string "url" field`);
  }

  // Step 3 — sanity-check the address: it must be an https x.com status
  // URL (…/status/<digits>), which is the shape of a link to one post.
  let looksLikePost = false;
  try {
    const u = new URL(url);
    looksLikePost =
      u.protocol === "https:" &&
      (u.hostname === "x.com" || u.hostname === "www.x.com") &&
      /\/status\/\d+$/.test(u.pathname);
  } catch {
    looksLikePost = false;
  }
  if (!looksLikePost) {
    fail(`"url" does not look like an X post address: ${url}`);
  }

  // Step 4 — make sure the output directory exists, then hand the file
  // in exactly as it was given to us.
  try {
    await mkdir(outputDir, { recursive: true });
    await writeFile(join(outputDir, "POST.json"), raw, "utf8");
  } catch (err) {
    fail(`could not write the output POST.json: ${String(err)}`);
  }

  console.log(`handed in post: ${url}`);
}

await main();
