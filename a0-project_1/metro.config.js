// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure web compatibility
config.resolver.sourceExts.push('web.js', 'web.ts', 'web.tsx');

// Allow metro to resolve the web-specific entry point
config.resolver.resolverMainFields.unshift('browser');

module.exports = config; 