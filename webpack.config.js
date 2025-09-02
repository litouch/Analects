const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      analects: './src/index.js',
      'analects.min': './src/index.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: (pathData) => {
        return pathData.chunk.name === 'analects.min' ? 'analects.min.js' : 'analects.js';
      },
      library: {
        name: 'AnalectsSDK',
        type: 'umd',
        export: 'default'
      },
      globalObject: 'typeof self !== \'undefined\' ? self : this',
      clean: true
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'ie >= 11']
                  },
                  modules: false
                }]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer']
                  ]
                }
              }
            }
          ]
        }
      ]
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: (pathData) => {
          return pathData.chunk.name === 'analects.min' ? 'analects.min.css' : 'analects.css';
        }
      }),
      // 更新复制插件，复制静态文件到 dist 目录
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'index.html',
            to: 'index.html',
            noErrorOnMissing: true
          },
          {
            from: 'logo.png',
            to: 'logo.png',
            noErrorOnMissing: true // 如果logo文件不存在不报错
          },
          {
            from: 'robots.txt',
            to: 'robots.txt',
            noErrorOnMissing: true // 如果robots文件不存在不报错
          },
          {
            from: 'sitemap.xml',
            to: 'sitemap.xml',
            noErrorOnMissing: true // 如果sitemap文件不存在不报错
          },
          // 如果您有其他静态资源（如字体等），也可以在这里添加
          {
            from: 'favicon.ico',
            to: 'favicon.ico',
            noErrorOnMissing: true
          }
        ]
      })
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          include: /\.min\.js$/,
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true
            },
            format: {
              comments: false
            }
          },
          extractComments: false
        }),
        new CssMinimizerPlugin({
          include: /\.min\.css$/
        })
      ]
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist')
      },
      compress: true,
      port: 8080,
      open: true,
      hot: true
    },

    resolve: {
      extensions: ['.js', '.css']
    },

    externals: {
      // 如果需要排除某些依赖，可以在这里配置
    },

    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};