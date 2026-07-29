---
"@patricktree/pkg-consumption-test": patch
---

Write a valid base64 `_auth` value into the temporary `.npmrc`. pnpm 11 validates the value and rejected the previous literal placeholder with "[ERROR] Invalid character", which broke every package consumption scenario.
