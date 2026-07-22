import { frontendConfig } from "@repo/eslint-config/index.mjs";

export default [
  // Vendored dorm 3D engine (plain JS, imported from the dorms prototype) —
  // linted by its own conventions, not the app's TS/React rules.
  { ignores: ["src/app/Dorms/rooms/**"] },
  ...frontendConfig,
];
