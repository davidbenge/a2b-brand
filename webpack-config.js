const webpack = require('webpack');
require('dotenv').config();

// Get all environment variables with AIO_ prefix and other required variables
const aioEnvVars = Object.keys(process.env)
  .filter(key => key.startsWith('AIO_') || key === 'AGENCY_BASE_URL')
  .reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
    return acc;
  }, {});

module.exports = {
    devtool: 'inline-source-map',
    module: {
      rules: [
        {
          // includes, excludes are in tsconfig.json
          test: /\.ts?$/,
          exclude: /node_modules/,
          use: 'ts-loader'
        }
      ]
    },
    resolve: {
      modules: ['node_modules'], // default, but good to be explicit
      extensions: ['.ts', '.js'], // include necessary extensions
    },
    plugins: [
      new webpack.DefinePlugin(aioEnvVars)
    ]
}