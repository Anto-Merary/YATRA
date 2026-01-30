/// <reference types="vite/client" />

// Allow importing JSX entrypoints from TS (used by src/bootstrap.ts)
declare module "*.jsx";

// TS doesn't apply the "*.jsx" declaration when the import specifier omits the extension.
// We import this from `src/bootstrap.ts` specifically.
declare module "./mobile/main" {
  const mod: unknown;
  export default mod;
}


