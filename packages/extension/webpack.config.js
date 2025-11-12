const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
require('dotenv').config();

module.exports = {
  mode: 'production', // or 'development'
  
  // Entry points for your extension
  entry: {
    popup: './src/popup.ts',
    background: './src/background.ts', // Add other files as needed
    content: './src/content.ts',
  },
  
  // Where the bundled files will go
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // Creates popup.js, background.js etc.
    clean: true, // Cleans the dist/ folder before each build
  },

  // --- THIS IS THE FIX ---
  // Rules for how to handle different file types
  module: {
    rules: [
      {
        // How to handle TypeScript files
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        // How to handle CSS files
        test: /\.css$/,
        use: [
          'style-loader', // 2. Injects styles into the DOM
          'css-loader'    // 1. Reads the CSS file
        ],
      },
    ],
  },
  // --- END OF FIX ---

  // Which file extensions to resolve
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  // Plugins to copy static files and generate HTML
  plugins: [
    // Inject environment variables
    new webpack.DefinePlugin({
      'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001'),
      'process.env.VITE_DEMO_MODE': JSON.stringify(process.env.VITE_DEMO_MODE === 'true'),
      'process.env.VITE_ENVIRONMENT': JSON.stringify(process.env.VITE_ENVIRONMENT || 'development'),
    }),

    // Copies your manifest.json and images
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/images', to: 'images' },
        // Add any other static assets here
      ],
    }),

    // Generates popup.html and injects popup.js
    new HtmlWebpackPlugin({
      template: './src/popup.html',
      filename: 'popup.html',
      chunks: ['popup'], // Only include the 'popup' script
    }),

    // Add other HtmlWebpackPlugin instances if you have other HTML pages
    // (e.g., an options page)
  ],
};