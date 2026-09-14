## What this changes

<!-- One paragraph. What behaviour is different afterwards, and why. -->

## How it was tested

<!--
`npm test` is the minimum - it runs the unit tests and the runtime verification
that guards the hand-edited runtime. Say what else you ran and on what.
-->

- [ ] `npm test`
- [ ] `npm run format:check`
- [ ] Built and installed once (`.\build\build.ps1`) — needed for anything that
      touches packaging, `extraResources`, the PDF guide, or the installer
- [ ] `npm run verify:safestorage` — needed for anything that touches the
      product name, userData, or the API key vault

## Checklist

- [ ] No credential, token, cookie, certificate or personal account data is
      added to the repository, to a test fixture, or to a screenshot
- [ ] `%APPDATA%\ClaudeAccountManager` is still the data root (renaming it
      orphans every existing install — see README)
- [ ] Provider-specific "Claude" / "Anthropic" wording still refers to the
      provider, not to this app
- [ ] Documentation updated if behaviour changed
