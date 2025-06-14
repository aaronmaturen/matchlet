/// <reference types="vite/client" />

// Extend the ImportMetaEnv interface from Vite
interface ImportMetaEnv {
  readonly VITE_SIGNALING_URL: string;
  // BASE_URL is already defined by Vite
  // Add other env variables as needed
}

// This is already defined in vite/client, but we're being explicit
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
