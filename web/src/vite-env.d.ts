/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the API the browser talks to, e.g. http://127.0.0.1:3000. See web/README.md. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
