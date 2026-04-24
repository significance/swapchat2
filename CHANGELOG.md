# Changelog

## 3.0.0

### Infrastructure
- Migrated from Create React App to Vite 6
- Upgraded React 17 to React 18 (createRoot API)
- Upgraded Node 14 to Node 22, TypeScript 4 to 5
- Added vite-plugin-node-polyfills for browser compatibility
- Fixed production build for external engine source resolution

### Post-Quantum Cryptography
- Updated for swapchat engine v0.3.0 with hybrid PQ encryption
- ECDH + ML-KEM-768 key exchange via HKDF-SHA256
- Token format changed from 194 hex chars to base64url (~1859 chars)
- Fixed base64url encoding for browser Buffer polyfill compatibility

### Client-Side Stamping
- Support for client-side stamp construction (no server-side stamp needed)
- Signer key and batch ID input via DOS-style setup screens
- Stamp bucket state persisted in localStorage to prevent collisions
- Stamp validation on entry and on reload

### UI / UX
- DOS BSOD-style terms acceptance screen (Y/N/R)
- Paged terms reader with space/arrow navigation
- Signer key and batch ID entry screens with localStorage persistence
- /qr command for fullscreen blue/white QR code overlay
- /reset command to clear localStorage and restart setup
- /clear, /help, /links, /copy code, /copy link slash commands
- PageUp/PageDown to scroll message history
- 1s polling (was 5s)
- 2048 char message limit
- Empty message guard
- 0x prefix auto-stripped on key/batch inputs
- Fixed scrollbar gutter shift (scrollbar-gutter: stable)
- Fixed scrollIntoView crash when no messages exist
- QR code error correction set to L for dense PQ tokens

### Terms
- Rewrote terms for accuracy (E2E encrypted, no data collection)
- Terms configurable via VITE_REQUIRE_TERMS env var
- N key rick rolls to Windows 98 launch video

### Testing
- 40+ Playwright e2e tests covering all functionality
- Two-browser-context pattern for initiator/respondent flows
- Page Object Model with ChatPage helper
- Tests for: connection, messaging, slash commands, terms, setup screens, QR
- Bee node health check in global setup
