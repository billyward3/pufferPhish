const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    // ...any other plugins you might have

    new CopyWebpackPlugin({
      patterns: [
        {
          // Assumes your manifest is at 'packages/extension/src/manifest.json'
          // Change 'src/manifest.json' if it's located somewhere else
          from: 'manifest.json', 
          to: 'manifest.json' // This will copy it to the root of dist/
        },
        {// --- ADD THIS BLOCK ---
          // This copies your images folder
          from: 'src/images',
          to: 'images'
          // --- END OF NEW BLOCK ---
        }
      ]
    })
  ]
};