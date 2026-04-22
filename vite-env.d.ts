/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BEE_API: string
  readonly VITE_BEE_GATEWAY_MODE: string
  readonly VITE_BEE_STAMP: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
