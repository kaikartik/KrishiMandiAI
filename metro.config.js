const { getDefaultConfig } = require('@react-native/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('onnx');

module.exports = config;