module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    requireConfigFile: false, // ✅ IMPORTANT FIX
  },
  rules: {
    "quotes": ["error", "double"],
    "indent": ["error", 2],
  },
};
