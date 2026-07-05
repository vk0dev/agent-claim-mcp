# Changelog

All notable changes to `@vk0/agent-claim-mcp` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-07-05

### Added
- GitHub Pages landing (`docs/index.html`) with install snippets for Claude Desktop, Claude Code, Cursor, Cline
- README FAQ section
- README translations: 日本語, 中文, Русский, Español
- Claim-conflict demo (GIF + asciinema cast + script)

### Fixed
- `server.json` description shortened to meet the Official MCP Registry 100-char limit (publishes were failing with HTTP 422)
- Publish workflow: replaced non-functional Smithery CLI publish step with a listing liveness check; added dashboard refresh notify
- Dev-dependency security advisories resolved (`npm audit` clean)

## [1.0.0] - 2026-05-05

- Initial public release: `claim_files`, `whose_claim`, `release_claim` tools over a local JSON ledger
