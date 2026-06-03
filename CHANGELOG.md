# Changelog

All notable changes to aiglare are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/). Bump the version in `package.json`
and `package-lock.json` together — `npm run version:check` enforces that they
match before publish.

## [Unreleased]

### Added
- `aiglare mcp` — stdio MCP server (hand-rolled JSON-RPC, no SDK dependency)
  exposing `ai_surface_audit`, `ai_surface_gate`, and `list_providers`.
- `scripts/check-version.js` (`npm run version:check`) — SemVer + lockfile
  alignment guard, wired into CI.
- npm publish readiness: scoped `@nugehs/aiglare`, `files` whitelist,
  `publishConfig.access = public`, `mcpName`.

## [0.1.0]

### Added
- Initial release: static linter that finds where LLM/AI output reaches a user
  or a side-effect (payment, booking, email, db/fs write, shell) and scores each
  surface on five governance guardrails.
- Provider-agnostic registry (OpenAI, Anthropic, Google, Cohere, Mistral,
  Replicate, Vercel AI SDK, LangChain, Ollama, Bedrock, Cloudflare Workers AI,
  Hugging Face + raw fetch/axios hosts).
- Sink classification (user-facing / side-effectful / internal) and a narrow CI
  gate that fails only on red + side-effectful surfaces.
- Optional repoctx index acceleration, including human-in-loop re-evaluation
  after an index-driven sink promotion.
