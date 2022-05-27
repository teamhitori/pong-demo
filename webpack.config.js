const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { ProvidePlugin} = require('webpack');
const fs = require('fs');
const path = require('path');
var cwd = process.cwd();
const configRaw = fs.readFileSync('frakas.json');
const config = JSON.parse(configRaw);
const hostName = process.env.HOST_NAME || "localhost"
const gamePrimaryName = process.env.GAME_PRIMARY_NAME || "";
const clientDir = "web";
const serverDir = "server";

console.log("frakas.json: ", config)

var frontendConfig = {
    target: 'web',
    devtool: 'inline-source-map',
    entry: {
        web: config.entryPoint
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader, // instead of style-loader
                    'css-loader'
                ]
            },
            {
                test: /\.ttf$/,
                use: ['file-loader']
            }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            "express": false,
            "stream": false,
            "crypto": false,
            "https": false,
            "zlib": false,
            "net": false,
            "tls": false,
            "os": false,
            "fs": false,
            "ws": false,
            "child_process": false,
            "http2": false,
            "http": false
          },
          fallback: {
            "path": require.resolve("path-browserify")
          },
        
        modules: [
            /* assuming that one up is where your node_modules sit,
               relative to the currently executing script
            */
            path.join(__dirname, './node_modules')
          ]
    },
    output: {
        globalObject: 'self',
        filename: '[name].bundle.main.js',
        path: path.resolve(__dirname, clientDir)
    },
    plugins: [new HtmlWebpackPlugin({
        title: 'Custom template',
        // Load a custom template (lodash by default)
        templateContent: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="ie=edge">
                    <title>${config.gameName}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                    #renderCanvas {
                        position: relative;
                        top: 0px;
                        bottom: 0px;
                        max-width: 100%;
                        margin: auto auto;
                        border: 1px solid white;
                        background-color: #383838;
                        height: 100%;
                      }
                      
                      .cavas-holder-inner {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        position: absolute;
                        background-color: #585858;
                      }
                      
                      body{
                        margin:0;
                        overflow:hidden;
                        overscroll-behavior-y: contain;
                      }
                    </style>
                </head>
                <body>
                  <input type="hidden" value="assets" id="assets-root" />
                  <input type="hidden" value="ws://${hostName}:${config.webPort}/ws" id="ws-url" />
                  <input type="hidden" value="http://${hostName}:${config.webPort}" id="remote-http-base" />
                  <input type="hidden" value="${config.webPort}" id="ws-port" />
                  <input type="hidden" value="${config.fillScreen}" id="fill-screen" />
                  <input type="hidden" value="${config.screenRatio}" id="screen-ratio" />
                  <input type="hidden" value="${gamePrimaryName}" id="game-primary-name"/>
                  <div class="cavas-holder-inner" id="renderCanvas-holder">
                    <canvas tabindex="0" autofocus width="2000" id="renderCanvas"></canvas>
                  </div>
                </body>
                </html>`
    }),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: 'assets',
                to:'assets',
                noErrorOnMissing: true
            },
            {
                from: 'frakas.json'
            }
        ]
    }),
    new ProvidePlugin({
        process: 'process/browser',
      })
    ],
    
};

var backendConfig = {
    target: 'node',
    devtool: 'inline-source-map',
    entry: {
        node: config.entryPoint
    },
    module: {
        rules: [
        {
            test: /\.(ts|tsx)$/,
            use: [
                {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    },
                }
            ],
            exclude: /node_modules/
        },
        {
            test: /\.js$/,
            enforce: "pre",
            use: ["source-map-loader"],
            exclude: /node_modules/
        },

        {
            test: /\.ttf$/,
            use: ['file-loader']
        }
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: [
            /* assuming that one up is where your node_modules sit,
               relative to the currently executing script
            */
            path.join(__dirname, './node_modules')
          ]
    },
    output: {
        globalObject: 'self',
        filename: '[name].bundle.main.js',
        path: path.resolve(__dirname, serverDir)
    },
    plugins: [new CopyWebpackPlugin({
        patterns: [
            {
                from: 'frakas.json'
            }
        ]
    })]
};

module.exports = [
    backendConfig, 
    frontendConfig
];