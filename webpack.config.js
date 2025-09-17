const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// [新增] 1. 引入 package.json 文件
const packageJson = require('./package.json');
// [新增] 2. 从版本号中提取主版本号 (例如 "2.0.0" -> "v2")
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
      // [新增] 确保所有资源路径都从根目录 / 开始
      publicPath: '/',
      // [修改] 3. 动态修改输出的 JS 文件名，为其加上版本目录前缀
      filename: (pathData) => {
        const name = pathData.chunk.name === 'analects.min' ? 'analects.min.js' : 'analects.js';
        return `${majorVersion}/${name}`; // 修改后的效果: "v2/analects.js"
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
            // [问题2修复] 无论开发还是生产环境，都使用 MiniCssExtractPlugin.loader
            // 这可以确保始终生成独立的 CSS 文件，从根本上解决“无样式内容闪烁” (FOUC) 问题。
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
        },
        // [新增] 在这里添加下面的字体处理规则
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            // [核心] 定义字体文件的输出位置和名称
            // 这会把字体文件输出到 'dist/v2/fonts/' 文件夹下
            filename: `${majorVersion}/fonts/[name][ext]`
          }
        }		
      ]
    },

    plugins: [
      new MiniCssExtractPlugin({
        // [修改] 4. 动态修改输出的 CSS 文件名
        filename: (pathData) => {
          // 注意：由于我们统一了入口名称，这里不再需要检查 .min
          // Webpack 的 optimization.minimizer 会处理压缩
          return `${majorVersion}/analects.css`; // 修改后的效果: "v2/analects.css"
        }
      }),
	  
      new CopyWebpackPlugin({
        // [修改] 5. 确保静态文件复制到 dist 根目录
        patterns: [
		    { from: 'index.html', to: 'index.html', noErrorOnMissing: true },
		    { from: 'og-image.png', to: 'og-image.png', noErrorOnMissing: true },
		    { from: 'robots.txt', to: 'robots.txt', noErrorOnMissing: true },
		    { from: 'sitemap.xml', to: 'sitemap.xml', noErrorOnMissing: true },
		    { from: 'favicon.ico', to: 'favicon.ico', noErrorOnMissing: true },
		    { from: 'my-favorites.html', to: 'my-favorites.html', noErrorOnMissing: true },
		    { from: 'account.html', to: 'account.html', noErrorOnMissing: true },
			{ from: 'public', to: '.', noErrorOnMissing: true }, 
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
           // 默认会压缩所有输出的 CSS，这里无需额外配置
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
