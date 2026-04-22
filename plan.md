# Swapchat2 Frontend Update Plan

## Goal
Update swapchat2 React frontend to work with the modernized swapchat_engine (v0.2.0) on Node 22, using local Bee node with real postage stamps.

## Steps
1. ~~Update .nvmrc from 14 → 22~~
2. ~~Migrate from Create React App to Vite~~
3. ~~Update package.json: dependency path to ../swapchat_engine, React 18, TS 5~~
4. ~~Update .env for localhost:1633, stamps (VITE_* format), non-gateway mode~~
5. ~~Update Chat.tsx constructor call (5 params → 4, removed debugURL)~~
6. ~~Update App.tsx to remove debugURL, add stamp config, use import.meta.env~~
7. ~~Set BatchID on SwapChat instance before initiate/respond~~
8. ~~Update index.tsx to React 18 createRoot API~~
9. ~~Install deps and test build~~

## Bee Configuration
- Node: bee-0d4 at localhost:1633
- Stamps:
  - 7f9bae3b2ca293c5e696add592f86a8f254b0f5d447b5c4af0011ba1d2777517
  - dd78f2ce6e4a112dc6a640d68e8cf319337ed7ba792531ff601f7ec818ce0349
- Amount: 1000000000, Depth: 20, Usable: true
- Gateway mode: OFF (using real stamps)

## Architecture Changes
- CRA → Vite 6 (6.4.2) - 107 packages vs 1497, builds in 2.3s
- Vite resolves swapchat engine directly from TypeScript source (../swapchat_engine/src/index.ts)
- Browser polyfills (buffer, crypto-browserify, stream-browserify, process) as direct deps
- React 17 → React 18 (createRoot API)
- REACT_APP_* env vars → VITE_* env vars (import.meta.env)

## Current Status
- **Status**: Complete - build successful, dev server runs on port 3000
- **Timestamp**: 2026-04-22T22:55:00Z
