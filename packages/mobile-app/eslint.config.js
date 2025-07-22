//  "eslint.config.js"
//  metropolitan app
//  Created by Ahmet on 13.06.2025.

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
]);
