//  "metro.config.js"
//  metropolitan app
//  Created by Ahmet on 29.06.2025.

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Monorepo support - workspace root'u bul
const workspaceRoot = path.resolve(__dirname, "../..");
const projectRoot = __dirname;

// Shared package'i Metro'ya tanıt
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Shared package'i resolve et
config.resolver.alias = {
  "@metropolitan/shared": path.resolve(workspaceRoot, "packages/shared"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
