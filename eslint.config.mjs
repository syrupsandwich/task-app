import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
    js.configs.recommended,
    eslintConfigPrettier,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals:{
        ...globals.browser
      }
    }
  }
];

