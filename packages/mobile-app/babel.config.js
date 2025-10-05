const nativewind = require('nativewind/babel');
const { version: reanimatedVersion } = require('react-native-reanimated/package.json');

module.exports = function (api) {
  api.cache(true);

  const nativewindConfig = nativewind();
  const shouldUseWorkletsPlugin = /^4\./.test(reanimatedVersion);
  const nativewindPlugins = (nativewindConfig.plugins || []).filter((plugin) => {
    if (shouldUseWorkletsPlugin) {
      return true;
    }
    if (typeof plugin === 'string') {
      return plugin !== 'react-native-worklets/plugin';
    }
    if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
      return plugin[0] !== 'react-native-worklets/plugin';
    }
    return true;
  });

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: [...nativewindPlugins, "react-native-reanimated/plugin"],
  };
};
