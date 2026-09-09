const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isDevServer = process.argv.some(arg => arg === 'serve' || arg.includes('webpack-dev-server'));

const guiDist = path.resolve(__dirname, '../scratch-gui/dist');
const guiStatic = path.resolve(__dirname, '../scratch-gui/static');
const libraryAssets = path.resolve(__dirname, '../../assets/library');

const copyPatterns = [
    {
        from: path.join(guiDist, 'static'),
        to: 'static',
        noErrorOnMissing: true
    },
    {
        from: path.join(guiDist, 'chunks'),
        to: 'chunks',
        noErrorOnMissing: true
    },
    {
        from: path.join(guiDist, 'extension-worker.js'),
        to: 'extension-worker.js',
        noErrorOnMissing: true
    },
    {
        from: guiStatic,
        to: 'static',
        noErrorOnMissing: true
    },
    {
        from: path.resolve(__dirname, 'static/about.html'),
        to: 'about.html'
    },
    {
        from: path.resolve(__dirname, 'static/about.css'),
        to: 'about.css'
    },
    {
        from: path.resolve(__dirname, '../../brand/st-playground-icon.svg'),
        to: 'icon.svg'
    },
    {
        from: path.resolve(__dirname, '../../CREDITS.md'),
        to: 'CREDITS.md'
    }
];

// webpack-dev-server serves the library from disk (see `devServer.static`) so
// we do not copy 57 MB of media into memory on every `npm start`.
if (!isDevServer) {
    copyPatterns.push({
        from: libraryAssets,
        to: 'static/library-assets'
    });
}

module.exports = {
    mode,
    target: 'web',
    context: path.resolve(__dirname),
    entry: {
        renderer: './src/renderer/index.jsx'
    },
    output: {
        filename: '[name].js',
        chunkFilename: 'chunks/[name].[contenthash:8].js',
        assetModuleFilename: 'static/assets/[name].[hash][ext]',
        path: path.resolve(__dirname, 'dist/renderer'),
        publicPath: 'auto',
        clean: true
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            '@scratch/scratch-gui$': path.join(guiDist, 'scratch-gui.js')
        }
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                include: path.resolve(__dirname, 'src/renderer'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {targets: {chrome: 128}}],
                            ['@babel/preset-react', {runtime: 'classic'}]
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(svg|png|gif|jpg|ico)$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, 'static/index.html'),
            inject: 'body',
            minify: false
        }),
        new CopyWebpackPlugin({patterns: copyPatterns})
    ],
    devtool: mode === 'production' ? false : 'source-map',
    performance: {
        hints: false
    },
    devServer: {
        port: Number(process.env.ST_PLAYGROUND_DEV_PORT || 8611),
        hot: false,
        liveReload: true,
        host: '127.0.0.1',
        static: [
            {
                directory: libraryAssets,
                publicPath: '/static/library-assets',
                watch: false
            }
        ],
        devMiddleware: {
            writeToDisk: filePath => /about\.(html|css)$|CREDITS\.md$|icon\.svg$/.test(filePath)
        }
    }
};
