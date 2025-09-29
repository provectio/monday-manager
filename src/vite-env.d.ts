/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONDAY_API_TOKEN: string
  readonly VITE_MONDAY_WORKSPACE_ID: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}