const path = require('path');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const common = {
    mode,
    context: path.resolve(__dirname),
    externals: {
        electron: 'commonjs2 electron'
    },
    node: {
        __dirname: false,
        __filename: false
    },
    module: {
        rules: []
    },
    resolve: {
        extensions: ['.js']
    },
    devtool: mode === 'production' ? false : 'source-map'
};

module.exports = [
    {
        ...common,
        target: 'electron-main',
        entry: {
            main: './src/main/index.js'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist/main'),
            libraryTarget: 'commonjs2'
        }
    },
    {
        ...common,
        target: 'electron-preload',
        entry: {
            preload: './src/preload.js'
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist/preload'),
            libraryTarget: 'commonjs2'
        }
    }
];
