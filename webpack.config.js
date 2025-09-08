const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// [新增] 1. 引入 package.json 文件
const packageJson = require('./package.json');
// [新增] 2. 从版本号中提取主版本号 (例如 "1.0.0" -> "v1")
const majorVersion = `v${packageJson.version.split('.')[0]}`;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      analects: './src/index.js',
      'analects.min': './src/index.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      // [修改] 3. 动态修改输出的 JS 文件名，为其加上版本目录前缀
      filename: (pathData) => {
        const name = pathData.chunk.name === 'analects.min' ? 'analects.min.js' : 'analects.js';
        return `${majorVersion}/${name}`; // 修改后的效果: "v1/analects.js"
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
        // [修改] 4. 动态修改输出的 CSS 文件名
        filename: (pathData) => {
          const name = pathData.chunk.name === 'analects.min' ? 'analects.min.css' : 'analects.css';
          return `${majorVersion}/${name}`; // 修改后的效果: "v1/analects.min.css"
        }
      }),
	  
      new CopyWebpackPlugin({
        // [修改] 5. 确保静态文件复制到 dist 根目录
        patterns: [
          { from: 'index.html', to: '.' },
          { from: 'og-image.png', to: '.' },
          { from: 'robots.txt', to: '.' },
          { from: 'sitemap.xml', to: '.' },
          { from: 'favicon.ico', to: '.' }
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