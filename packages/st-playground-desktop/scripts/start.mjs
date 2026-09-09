#!/usr/bin/env node
/**
 * Development launcher: webpack-dev-server for the renderer, compiled main
 * process, then Electron pointed at http://127.0.0.1:8611/.
 */

import {spawn, spawnSync} from 'child_process';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pkgRoot, '../..');
const port = Number(process.env.ST_PLAYGROUND_DEV_PORT || 8611);
const devUrl = `http://127.0.0.1:${port}/`;

const guiDist = path.join(repoRoot, 'packages/scratch-gui/dist/scratch-gui.js');
if (!fs.existsSync(guiDist)) {
    const gui = spawnSync('npm', ['run', 'build:dist', '--workspace', '@scratch/scratch-gui'], {
        cwd: repoRoot,
        stdio: 'inherit'
    });
    if (gui.status !== 0) process.exit(gui.status || 1);
}

const main = spawnSync('npx', ['webpack', '--config', 'webpack.main.js'], {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: {...process.env, NODE_ENV: 'development'}
});
if (main.status !== 0) process.exit(main.status || 1);

const server = spawn('npx', ['webpack', 'serve', '--config', 'webpack.renderer.js'], {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: {...process.env, NODE_ENV: 'development', ST_PLAYGROUND_DEV_PORT: String(port)}
});

const waitForServer = () => new Promise((resolve, reject) => {
    const started = Date.now();
    const ping = () => {
        const request = http.get(devUrl, response => {
            response.resume();
            resolve();
        });
        request.on('error', () => {
            if (Date.now() - started > 120000) {
                reject(new Error(`webpack-dev-server did not start at ${devUrl}`));
                return;
            }
            setTimeout(ping, 400);
        });
    };
    ping();
});

const shutdown = () => {
    if (!server.killed) server.kill('SIGTERM');
};

process.on('SIGINT', () => {
    shutdown();
    process.exit(130);
});
process.on('SIGTERM', shutdown);

try {
    await waitForServer();
} catch (error) {
    console.error(error.message);
    shutdown();
    process.exit(1);
}

const electronBinary = path.join(repoRoot, 'node_modules/electron/dist/electron');
const electron = spawn(electronBinary, [
    path.join(pkgRoot, 'dist/main/main.js')
], {
    cwd: pkgRoot,
    stdio: 'inherit',
    env: {
        ...process.env,
        ST_PLAYGROUND_DEV: '1',
        ST_PLAYGROUND_DEV_URL: devUrl,
        ST_PLAYGROUND_SWIFTSHADER: process.env.ST_PLAYGROUND_SWIFTSHADER || '1',
        ST_PLAYGROUND_NO_SANDBOX: process.env.ST_PLAYGROUND_NO_SANDBOX || '1'
    }
});

electron.on('exit', code => {
    shutdown();
    process.exit(code || 0);
});
