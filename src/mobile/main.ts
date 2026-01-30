// TypeScript wrapper so TS entrypoints (like `src/bootstrap.ts`) can load the mobile app
// without importing a `.jsx` module directly (which breaks `tsc` builds).
import "./main.jsx";

export {};

