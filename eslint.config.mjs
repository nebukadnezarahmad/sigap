import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [
      ".claude/**",
      "**/.claude/**",
      ".next/**",
      "**/.next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "**/node_modules/**",
      "next-env.d.ts",
      "*.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
