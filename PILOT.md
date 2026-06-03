# Pilot runbook

The tool is built and tested here, but the real pilot has to run on your Mac —
your repos live there, not in this environment. Here's the sequence.

## 1. Drop in and install

```bash
cd ~/projects/aiglare    # the repo lives here
npm install
npm test                 # expect 16 passing
```

## 2. First real run — backend AI domain

`bashbop-api` already has a repoctx index, so the adapter will engage
automatically and you'll see "accelerated by repoctx index" in the header.

```bash
# whole backend, human-readable
node src/cli.js ~/projects/bashbop-api

# zoom in on the AI surfaces only
node src/cli.js ~/projects/bashbop-api --severity amber

# only the dangerous class: AI output -> irreversible side-effect
node src/cli.js ~/projects/bashbop-api --sinks side-effectful
```

Expected real surfaces to eyeball (from the index): `src/ai/ai-provider.config.ts`
(OpenAI/DeepSeek/Ollama), `src/ai/services/ai-cost-analytics.service.ts`, and the
`recommendations`, `quotes`, `gen-image`, `cloudflare-ai` domains.

## 3. Frontend run

```bash
node src/cli.js ~/projects/bashbop-event-web --sinks user-facing
```

Watch whether `lib/compliance/legal-disclaimers.tsx` (your `AIDisclaimer`) is
credited. In v1 the disclaimer is only credited when it sits in the same file as
the AI call — cross-file crediting (the disclaimer imported into a chat
component) is the first v2 item.

## 4. Try the CI gate

```bash
node src/cli.js ~/projects/bashbop-api/src --ci; echo "exit: $?"
```

Exit 1 = a red side-effectful surface exists. Wire the commented line in
`.github/workflows/ci.yml` to a real source path once you're happy with the
signal-to-noise.

## 5. Calibrate, then publish

Expect false positives and negatives on the first run — note which, then tune
the heuristics in `src/discovery/native-scanner.js` (see CONTRIBUTING.md). Once
the BashBop run looks honest:

```bash
# under your namespace, alongside repoctx
gh repo create nugehs/aiglare --public --source=. --push
```

The name `aiglare` is confirmed free on npm; run `npm publish` once the BashBop
run looks honest and you've bumped the version past `0.1.0`.

## What's proven vs. what's pending

Proven here: provider detection, sink classification, guardrail scoring, the CI
gate, and — most importantly — that the repoctx index flips a false-negative
`internal` classification into a correct `user-facing` RED (see the
`fixtures-rc` test). Pending: cross-file guardrail crediting (needs the call
graph), and calibration against real code, which is what this pilot produces.
