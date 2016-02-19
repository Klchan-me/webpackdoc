var path = require('path');
var webpack = require('webpack');
var publicPath = 'http://127.0.0.1:3000/static/people/'; // 和页面引用保持一致

/**
 * 全局路径配置
 */
var ROOT_PATH = path.resolve(__dirname);
var APP_PATH = path.resolve(ROOT_PATH, 'dev/js');
var TMPL_PATH = path.resolve(ROOT_PATH, 'dev/templates');
var BUILD_PATH = path.resolve(ROOT_PATH, 'people');
var CSS_PATH = path.resolve(ROOT_PATH, 'dev/css');

var isDebug = process.env.NODE_ENV === 'dev' ? true : false;
console.log('isDebug:', isDebug);

/**
 * webpack Entry
 */
var entry = {
  index: path.resolve(APP_PATH, 'index.js'),
  myInterviewList: path.resolve(APP_PATH, 'myInterviewList.js'),
  todayInterviewList: path.resolve(APP_PATH, 'todayInterviewList.js'),
  // 公用模块
  vendors: [
    'antd',
    'jquery',
    'utils',
    'underscore',
    path.resolve(CSS_PATH, 'vendors.css')
  ]
};

/**
 * 独立页面注入
 */
var htmls = [{
  title: 'Bytedance People',
  chunks: ['vendors', 'index'],
  template: path.resolve(TMPL_PATH, 'index.html'), // 页面入口
  filename: path.resolve(BUILD_PATH, 'index.html') // 页面出口
}, {
  title: 'Interview Today',
  chunks: ['vendors', 'todayInterviewList'],
  template: path.resolve(TMPL_PATH, 'todayInterviewList.html'),  // 页面入口
  filename: path.resolve(BUILD_PATH, 'todayInterviewList.html'), // 页面出口
}, {
  title: 'My Interview',
  chunks: ['vendors', 'myInterviewList'],
  template: path.resolve(TMPL_PATH, 'myInterviewList.html'), // 页面入口
  filename: path.resolve(BUILD_PATH, 'myInterviewList.html'), // 页面出口
}];

/**
 * 资源别名
 */
var alias = {
  'utils': 'js/libs/utils',
  'net': 'js/iface/net',
  'widget': path.join(__dirname, './dev/js', 'widget'),
  'mixins': path.join(__dirname, './dev/js', 'mixins'),
  'models': path.join(__dirname, './dev/js', 'models'),
};

/**
 * webpacｋ插件配置
 */
var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var definePlugin = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('dev')
  }
});

var plugins = [
  definePlugin,
  new CommonsChunkPlugin({
    name: 'vendors',
    filename: 'js/vendors.js'
  }),
  new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', 'window.jQuery': 'jquery' }),
  new ExtractTextPlugin('css/[name].[hash:8].css'),
  new webpack.NoErrorsPlugin()
];

htmls.forEach(function (o) {
  var template = o.template;
  var filename = o.filename;
  var params = {
    chunks: o.chunks,
    template: template,
    filename: filename,
    inject: true,
    minify: {
      removeComments: true
    }
  };
  plugins.push(new HtmlWebpackPlugin(params));
});

/**
 * 非调试环境对脚本进行压缩
 */
if (!isDebug) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      except: ['$super', '$', 'exports', 'require']
    })
  );
}

module.exports = {

  devtool: '#source-map',

  entry: entry,

  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,
    color: true,
    port: 3000,
    host: '127.0.0.1',  // 10.6.131.79
    contentBase: './dev',
    proxy: {
      '/mockapi/*': {
        // 将页面api用charles代理到mockapi
        // 然后自动匹配到：http://127.0.0.1:3001/mockapi/
        target: 'http://127.0.0.1:3001',
        secure: false
      }
    }
  },

  output: {
    path: BUILD_PATH,
    filename: 'js/[name].js',
    publicPath: publicPath,
    chunkFilename: 'js/[chunkhash:8].chunk.js'
  },

  resolve: {
    root: [process.cwd() + '/dev', process.cwd() + '/node_modules'], // 绝对路径
    extensions: ['', '.coffee', '.js', '.jsx', '.json'],
    alias: alias
  },

  module: {
    loaders: [
      {
        test: /\.js[x]?$/,
        exclude: /node_modules/,
        include: __dirname,
        loader: 'react-hot!babel-loader?presets[]=es2015&presets[]=react'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.less$/,
        loader: isDebug ? 'style!css!less' :
          ExtractTextPlugin.extract('style-loader', 'css-loader!less-loader')
      },
      {
        test: /\.css$/,
        loader: isDebug ? 'style-loader!css-loader' :
          ExtractTextPlugin.extract('style-loader', 'css-loader')
      },
      {
        test: /\.(jpeg|jpg|png|gif)$/,
        loader: 'url?limit=8192&name=images/[hash:8].[name].[ext]'
      },
      {
        test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/font-woff2'
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=application/octet-stream'
      },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file' },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=10000&mimetype=image/svg+xml'
      }
    ]
  },

  plugins: plugins
};
