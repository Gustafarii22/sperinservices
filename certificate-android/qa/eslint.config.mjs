import js from "@eslint/js";
import globals from "globals";
export default [
  {
    files: ["public/certificates/app.js", "public/certificates/iet-forms.js"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
      "no-empty": "off",
      "no-useless-escape": "off",
    },
  },
];
