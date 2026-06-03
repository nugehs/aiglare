# aiglare

**Lint your AI features for governance guardrails.** Point it at any JS/TS repo and it finds every place an LLM/AI output reaches a user or triggers a side-effect (payment, booking, email, database write) — then flags which of those have no confidence handling, no fallback, no output validation, and no human-in-the-loop.

Most AI incidents aren't model failures. They're governance failures: the model output flowed straight to a user or an irreversible action with nothing in between. This tool makes those paths visible, and lets you block them in CI.

```
npx aiglare            # audit current repo
npx aiglare ./src --ci # fail the build on a red side-effectful surface
```

## What it reports

Each AI surface is classified by **sink** — where the output goes:

- `user-facing` — returned from a route/controller, or rendered in a component
- `side-effectful` — feeds a payment, booking, email, db/file write, or shell
- `internal` — logged or cached only

…and scored on five **guardrail** dimensions: confidence handling, fallback/uncertain path, output validation, human-in-the-loop (for side-effects), and error isolation.

| Severity | Meaning |
|----------|---------|
| 🔴 red   | model output hits a user or a side-effect with no guardrails — review now |
| 🟡 amber | partial coverage |
| 🟢 green | guardrails present |

The CI gate (`--ci`) fails only on **red + side-effectful** surfaces — the "AI auto-triggers an irreversible action with no confirmation" case — so it's safe to adopt without drowning a team in warnings.

## Provider-agnostic

Detection is driven by a [provider registry](src/providers.js) covering OpenAI, Anthropic, Google, Cohere, Mistral, Replicate, the Vercel AI SDK, LangChain/LangGraph, Ollama, AWS Bedrock, Cloudflare Workers AI, and Hugging Face — plus raw `fetch`/`axios` calls to known inference hosts. Adding a provider is a one-line PR.

## Optional: repoctx acceleration

If a [repoctx](https://github.com/nugehs/repoctx) index (`.dev-context/index.json`) is present, the tool uses it automatically to prioritize likely AI files and sharpen sink classification via repoctx's `kind`/`domain` data (e.g. a file repoctx marks as a `controller` route is correctly treated as user-facing even when the native scanner can't see the call graph). Without it, a built-in TypeScript-compiler scanner does the same job at lower fidelity. **Same tool, two fidelity levels** — standalone for everyone, richer for repoctx users.

## Honest limitations

This is static, advisory analysis — a linter, not a verifier. It produces false positives (a guardrail two call-hops away can be missed) and false negatives (a `confidence` variable that doesn't actually gate anything reads as present). Treat output as *surfaces to review*, not *violations*. The single-file native scanner cannot follow the call graph; the repoctx adapter exists precisely to close that gap.

## Options

```
aiglare [path] [options]
  --json            JSON output for tooling
  --ci              Exit non-zero on a red side-effectful surface
  --severity <lvl>  Show only red, or amber-and-worse
  --sinks <list>    Filter: user-facing,side-effectful,internal
```

## License

MIT
