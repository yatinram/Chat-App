const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for ChatApp
 * https://reactnative.dev/docs/metro
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Support .jsx file resolution
    sourceExts: [...defaultConfig.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
    assetExts: defaultConfig.resolver.assetExts,
  },
};

module.exports = mergeConfig(defaultConfig, config);
