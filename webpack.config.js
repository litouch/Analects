
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const packageJson = require('./package.json');
const majorVersion = `v${packageJson.version.split('.')[0]}`;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      'analects': './src/index.js',
      'analects-embed': './src/embed.js'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: '/',
      filename: (pathData) => {
        if (pathData.chunk.name === 'analects-embed') {
          return 'v1/analects.js';
        }
        return `${majorVersion}/analects.js`;
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
                  }
                }]
              ]
            }
          }
        },
		    {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            // [核心修正] 将所有字体文件统一输出到 dist/fonts/ 目录下。
            // Webpack会自动处理 v1/analects.css 和 v2/analects.css 中
            // 对这些字体文件的相对路径引用，这个方法更简洁、更可靠。
            filename: 'fonts/[name][ext]'
          }
        }		
      ]
    },

    plugins: [
      new MiniCssExtractPlugin({
        filename: (pathData) => {
          if (pathData.chunk.name === 'analects-embed') {
            return 'v1/analects.css';
          }
          return `${majorVersion}/analects.css`;
        }
      }),
	  
      new CopyWebpackPlugin({
        patterns: [
		    { from: 'index.html', to: 'index.html', noErrorOnMissing: true },
        { from: 'test.html', to: 'test.html', noErrorOnMissing: true },
		    { from: 'og-image.png', to: 'og-image.png', noErrorOnMissing: true },
		    { from: 'robots.txt', to: 'robots.txt', noErrorOnMissing: true },
		    { from: 'sitemap.xml', to: 'sitemap.xml', noErrorOnMissing: true },
		    { from: 'favicon.ico', to: 'favicon.ico', noErrorOnMissing: true },
			  { from: 'logo.png', to: 'logo.png', noErrorOnMissing: true },
		    { from: 'my-favorites.html', to: 'my-favorites.html', noErrorOnMissing: true },
		    { from: 'account.html', to: 'account.html', noErrorOnMissing: true },
			  { from: 'stories.html', to: 'stories.html', noErrorOnMissing: true },
			  { from: 'public', to: '.', noErrorOnMissing: true }, 
			  { from: 'chapters', to: 'chapters', noErrorOnMissing: true },
			  { from: 'stories', to: 'stories', noErrorOnMissing: true },
		  ]
      })
    ],

    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
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
        new CssMinimizerPlugin()
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
    
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map'
  };
};