# GTA 6 meme — "The Generational Shift"

An entry for the make.fun bounty **gta6-meme-x-01** ("Post a GTA 6 meme on X").

## The joke

Two panels, twenty years apart:

- **GTA in 2004: unhinged chaos.** A CJ-style character leaping through the
  air dual-wielding SMGs while a car explodes behind him and the cops close
  in. Nobody asked permission for anything. Nobody apologised.
- **GTA VI today:** Jason — in a pink floral apron, vacuum in one hand,
  feather duster in the other, getting scolded by Lucia. *"Sorry — I
  promised Lucia I'd vacuum before the heist."*

Somewhere between San Andreas and Leonida, the most dangerous thing in GTA
stopped being a six-star wanted level and became forgetting what Lucia
asked for. The little make.fun ghost floats between them holding its sign,
watching the mighty fall.

The finished picture is in this repo as [`meme.png`](meme.png).

## The entry is the post

For this bounty the post on X **is** the entry — the meme was posted
publicly from [@ezadrop](https://x.com/ezadrop), and its address is recorded
in [`POST.json`](POST.json):

https://x.com/ezadrop/status/2124139770863562872

## What main.ts does

`main.ts` is the hand-in program. It reads `POST.json`, checks that its
`url` field is a plausible X post address, and writes the file into the
output directory. It uses only the Node standard library.

To try it locally (Node 22.18 or later):

```sh
mkdir -p /tmp/meme-out
MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=/tmp/meme-out node main.ts
cat /tmp/meme-out/POST.json
```

It prints the post address it handed in and exits non-zero with a clear
message if `POST.json` is missing, malformed, or does not point at an X
status URL.
