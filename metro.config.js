const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add platform-specific resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude react-native-maps from web builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.alias = {
  ...(config.resolver.alias || {}),
};

// Platform-specific module resolution
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.alias['react-native-maps'] = false;
}

module.exports = config;