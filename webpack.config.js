const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

const src = path.resolve(__dirname, 'src');
const pages = path.resolve(src, 'pages');
const dist = path.resolve(__dirname, 'dist');

module.exports = {
  mode:    isProd ? 'production' : 'development',
  devtool: isProd ? false : 'eval-source-map',
  target:  isProd ? "browserslist" : "web",

  entry:   {
    app: path.resolve(src, 'app.js'),
  },
  output:  {
    filename: 'app.js',
    path:     dist,
    // clean:    true,
  },
  resolve: {
    alias: { src },
  },

  module: {
    rules: [
      {
        test:    /\.js$/,
        exclude: /node_modules/,
        use:     [{
          loader:  'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env'],
            ],
          },
        }],
      },
      {
        test: /\.pug$/,
        // loader:  'pug-loader',
        use: [{
          loader: 'simple-pug-loader',
          // options: { pretty: true },
        }],
      },
      {
        test: /\.(scss|css)$/i,
        use:  [
          // {
          //   loader:  'style-loader',
          //   options: {
          //     insert:     'head', // insert style tag inside of <head>
          //     injectType: 'singletonStyleTag', // this is for wrap all your style in just one style tag
          //   },
          // },
          MiniCssExtractPlugin.loader,
          // '/Users/kirillzukov/projects/scvt-box-calculator/test.js',
          {
            loader:  "css-loader",
            options: {
              modules: 'local',
            },
          },
          {
            loader:  'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  "postcss-preset-env",
                ],
              },
            },
          },
          {
            loader:  "sass-loader",
            options: {
              // sassOptions: {
              //   includePaths: [path.resolve(src)],
              // },
            },

          },
        ],
      },
      {
        test:    /.(ttf|otf|eot|woff|woff2|svg)$/,
        include: /fonts/,
        use:     [{
          loader:  'file-loader',
          options: {
            name:       '[name].[ext]',
            outputPath: 'fonts',
          },
        }],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use:  [{
          loader:  'file-loader',
          options: {
            name:       ( resourcePath, resourceQuery ) => path.relative(src, resourcePath).replace(/\//g, '_'),
            esModule:   false,
            outputPath: 'img',
          },
        }],
      },
    ],
  },

  plugins: ([
    new MiniCssExtractPlugin({ filename: 'style.css?' + Date.now() }),
    isProd && new HtmlWebpackPlugin({ template: path.resolve(src, 'templates/prod.pug'), filename: "widget.html", inject: false }),
    new HtmlWebpackPlugin({ template: path.resolve(src, 'templates/dev.pug'), filename: "index.html", minify: false, inject: 'body' }),
    isProd && new HtmlInlineScriptPlugin(),
  ]).filter(Boolean),

  optimization: isProd ? {
    minimize:  true,
    minimizer: [
      new TerserPlugin({
        // cache:         true,
        parallel:      true,
        terserOptions: {
          compress: {
            drop_console: true,
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  } : undefined,

  devServer: {
    host:        '0.0.0.0',
    port:        8081,
    contentBase: dist, // для раздачи png спрайта
  },

  stats: "minimal",
};
