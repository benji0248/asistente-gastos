/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string
  readonly VITE_BANK_IMPORT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
