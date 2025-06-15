// eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  // Global ignores. Add any other files/directories you want to ignore.
  {
    ignores: [
      "node_modules/",
      "dist/",
      "eslint.config.js", // Ignore the ESLint config file itself
      ".eslintrc.js.bak", // Ignore the backup of the old config
      "commitlint.config.js", // From your previous ignorePatterns
    ],
  },

  // Base configurations from typescript-eslint.
  // tseslint.configs.recommended includes:
  // - ESLint's recommended rules (eslint:recommended)
  // - @typescript-eslint/eslint-plugin
  // - @typescript-eslint/parser
  // - Recommended rules from @typescript-eslint
  ...tseslint.configs.recommended,

  // Custom configurations for your project
  {
    files: ["**/*.ts"], // Apply these settings specifically to TypeScript files
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node, // For Node.js global variables
        ...globals.es2020, // For ES2020 global variables (aligns with ecmaVersion)
      },
      // parser: tseslint.parser, // Already set by tseslint.configs.recommended
      // parserOptions: { // For type-aware linting, you'd add project settings here
      //   project: true,
      //   tsconfigRootDir: import.meta.dirname,
      // },
    },
    // plugins: { // @typescript-eslint is already included by tseslint.configs.recommended
    //   // 'prettier' plugin is handled by eslintPluginPrettierRecommended
    // },
    rules: {
      // Your existing rules:
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "always-multiline",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      // 'prettier/prettier': 'error' is typically handled by eslintPluginPrettierRecommended
    },
  },

  // Prettier integration. This should be the last configuration in the array
  // to ensure it overrides any conflicting formatting rules from other configs.
  eslintPluginPrettierRecommended,
);
