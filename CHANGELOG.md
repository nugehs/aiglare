# Changelog

All notable changes to aiglare are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/). Bump the version in `package.json`
and `package-lock.json` together — `npm run version:check` enforces that they
match before publish.

## [0.2.0] - 2026-06-09
### Changed
- `PILOT.md` rewritten as a generic runbook (`./my-api`, `./my-app` examples)
  — removed machine-specific paths and private project references.

### Added
- Brand alignment: toolchain footer/badges.
- `aiglare mcp` — stdio MCP server (hand-rolled JSON-RPC, no SDK dependency)
  exposing `ai_surface_audit`, `ai_surface_gate`, and `list_providers`.
- `scripts/check-version.js` (`npm run version:check`) — SemVer + lockfile
  alignment guard, wired into CI.
- npm publish readiness: scoped `@nugehs/aiglare`, `files` whitelist,
  `publishConfig.access = public`, `mcpName`.
- Tag-triggered release workflow (`.github/workflows/release.yml`): pushing a
  `vX.Y.Z` tag runs the quality gate, publishes to npm with OIDC provenance,
  creates a GitHub Release with notes extracted from this changelog, and
  publishes `server.json` to the MCP Registry.
- README polish: badge row (npm, CI, license, Node), prominent link to the
  live site (https://nugehs.github.io/aiglare-web/), an "aiglare vs
  alternatives" comparison, and a "Run a 1-week pilot" section linking
  `PILOT.md`.

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
