module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          alias: {
            '@components': './components',
            '@screens': './screens',
            '@utils': './utils',
            '@context': './context',
            '@backend': './backend',
          },
        },
      ],
    ],
  };
};