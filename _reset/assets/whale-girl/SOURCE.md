# Whale Girl sprite atlas provenance

This directory vendors the DeepSeek Girl / whale-girl Codex pet sprite atlas for Town's non-official pet prototype.

- Upstream repository: `f0909172434/deepseek-girl-codex-pet`
- Pinned upstream commit: `2572709632b0e81401b9e92994f2c3786c186397`
- Upstream path: `pet/spritesheet.webp`
- SHA-256: `234f24a97c18195a00c6093da0090773e675993c169e92e7e13a24c37b323fa2`
- Atlas: 1536 × 2288 WebP, 8 columns × 11 rows, 192 × 208 per frame
- License declared by upstream: MIT

Town Pet v0.4 uses:
- row 0: idle animation
- row 1: source moving-right row, re-timed as a Town walking cycle
- row 2: source moving-left row, re-timed as a Town walking cycle
- walking frame sequence: 0, 2, 4, 6 (contact/passing poses only)
- gait phase is synchronized to world distance rather than restarting on direction changes

No upstream artwork is overwritten. Town-specific animation logic lives only in this repository.

All Town integration and adaptation code lives in this repository. The upstream repository is treated as read-only.

This is community-made fan content and is not affiliated with or endorsed by DeepSeek, OpenAI, or Codex.
