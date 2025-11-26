const path = require('path');

module.exports = {
  entry: {
    "byteconnect": './src/byteconnect.ts'
  },
  mode: 'production',
  target: 'node',
  node: {
    __dirname: true,
  },
  externals: [
    function (context, request, callback) {
      if ([
        "assert",
        "buffer",
        "child_process",
        "crypto",
        "dgram",
        "events",
        "fs",
        "http",
        "net",
        "os",
        "path",
        "tls",
        "url",
        "util",
        "node-ipc"
      ].indexOf(request) !== -1) {
        return callback(null, `require('${request}')`);
      } else if (request.indexOf("../config/config") !== -1) {
        return callback(null, `require('./config/config')`);
      }
      const i = request.indexOf('.d.ts');
      const ext = request.substring(request.lastIndexOf('.'), request.length);
      if (['.proto', '.css', '.md', '.txt', '.html', '.png', '.jpg', '.eot', '.woff2', '.woff', '.otf', '.ttf'].indexOf(ext) !== -1 ||
        (i !== -1 && i === request.length - 5)) {
        return callback(null, `require('${request}')`);
      }
      callback();
    }
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: [/node_modules/]
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  output: {
    filename: 'dist/[name].js',
    path: path.resolve(__dirname, './')
  }
};

