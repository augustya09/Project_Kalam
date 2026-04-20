declare module '*?raw' {
  const content: string;
  export default content;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string;
  // Add other env variables as needed
}
