const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const resolve = dir => path.join(__dirname, dir)
// 分离css插件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// vue配置
const VueLoaderPlugin = require('vue-loader/lib/plugin')
// 压缩js和css
const UgligyjsWebpackPlugin = require('uglifyjs-webpack-plugin')
const OptimizeCSSAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')

// 开启gzip
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']
// 去除多余的css
const PurgecssPlugin = require('purgecss-webpack-plugin')
const glob = require('glob-all')

// 增加项目打包进度和打包时间
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const chalk = require('chalk')

// 友好的提示
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
// 系统通知
const notifier = require('node-notifier')
const getIp = require('./config/getIp')
const networkIp = getIp()
const PORT = 8880

const webpackConfig = (env, argv) => {
  const isProduction = argv.mode === 'production'
  return {
    entry: {
      app: resolve('./src/main.js')
    },
    output: {
      // 文件可以不定义，会自动生成
      path: resolve('love'),
      filename: 'js/[name].[hash].js',
      // 打包后的静态资源文件夹
      publicPath: ''
    },
    devServer: {
      contentBase: resolve('public'),
      compress: true,
      host: 'localhost',
      port: PORT,
      open: true,
      hot: true,
      inline: true,
      quiet: true,
      overlay: {
        warnings: true,
        errors: false
      }
    },
    // 配置别名
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': resolve('src')
      }
    },
    devtool: 'inline-source-map',
    module: {
      rules: [
        // 编译vue
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        // 编译js
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            resolve('src'),
            resolve('node_modules/webpack-dev-server/client')
          ]
        },
        // 用了MiniCssExtractPlugin插件后修改css配置
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                // publicPath: '../',
                reloadAll: true
              }
            },
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        // 配置字体图片
        {
          test: /\.(png|svg|jpg|gif)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                limit: 5000,
                // 分离图片至imgs文件夹
                name: 'imgs/[name].[ext]'
              }
            },
            // 压缩图片优化
            {
              loader: 'image-webpack-loader',
              options: {
                //   bypassOnDebug: true,
                mozjpeg: {
                  progressive: true,
                  quality: 65
                },
                optipng: {
                  enabled: false
                },
                pngquant: {
                  quality: '65-90',
                  speed: 4
                },
                gifsicle: {
                  interlaced: false
                }
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      // 处理vue
      new VueLoaderPlugin(),
      // 友好的提示
      new FriendlyErrorsWebpackPlugin({
        compilationSuccessInfo: {
          messages: [`
            App running at:
            - Local:   ${chalk.hex('#66D9EF')('http://localhost:' + PORT)}
            - Network: ${chalk.hex('#66D9EF')('http://' + networkIp + ':' + PORT)}
          `],
          clearConsole: true,
          onErrors: (severity, errors) => {
            if (severity !== 'error') return
            const error = errors[0]
            const filename = error.file && error.file.split('!').pop()
            notifier.notify({
              title: packageConfig.name,
              message: severity + ': ' + error.name,
              subtitle: filename || '',
              // icon: path.join(__dirname, 'logo.png')
            })
          }
        }
      }),
      // 分离css
      new MiniCssExtractPlugin({
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[id].[hash].css'
      }),
      // 打包时间
      new ProgressBarPlugin({
        format: '  编译进度：[:bar] ' + chalk.green.bold(':percent') + ' (已用时 :elapsed 秒)',
        clear: false
      }),
      // // 去除无用的css
      new PurgecssPlugin({
        paths: glob.sync([
          path.join(__dirname, './src/index.html'),
          path.join(__dirname, './**/*.vue'),
          path.join(__dirname, './src/**/*.js')
        ])
      }),
      // 打gz包
      new CompressionWebpackPlugin({
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
        threshold: 10240,
        minRatio: 0.8
      }),
      // 处理html
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            // 源文件模板
            template: resolve('public/index.html'),
            // 输出的文件
            filename: 'index.html',
            title: 'webpack构建项目',
            inject: true,
            hash: true,
            favicon: resolve('public/favicon.ico'),
            // chunks: ['app'],
            showErrors: true
          },
          isProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true
                }
              }
            : undefined
        )
      )
    ],
    optimization: {
      // 分离chunks
      splitChunks: isProduction
        ? {
            chunks: 'all',
            cacheGroups: {
              libs: {
                name: 'chunk-libs',
                test: /[\\/]node_modules[\\/]/,
                priority: 10,
                chunks: 'initial' // 只打包初始时依赖的第三方
              },
              vue: {
                name: 'vue',
                test: /[\\/]node_modules[\\/]vue[\\/]/,
                priority: 11,
              },
              // vueRouter: {
              //   name: 'vue-router',
              //   test: /[\\/]node_modules[\\/]vue-router[\\/]/,
              //   priority: 12,
              // }
            }
          }
        : undefined,
      // 压缩js和css
      minimizer: isProduction
        ? [
            new UgligyjsWebpackPlugin({
              uglifyOptions: {
                compress: {
                  drop_debugger: true,
                  drop_console: true,
                  collapse_vars: true, // 内嵌定义了但是只用到一次的变量
                  reduce_vars: true // 提取出出现多次但是没有定义成变量去引用的静态值
                },
                warnings: false,
                cache: true, // 开启缓存
                parallel: true, // 平行压缩
                sourceMap: false
              }
            }),
            new OptimizeCSSAssetsWebpackPlugin({})
          ]
        : []
    }
  }
}
module.exports = webpackConfig
