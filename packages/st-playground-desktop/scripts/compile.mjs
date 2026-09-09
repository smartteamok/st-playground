#!/usr/bin/env node
/**
 * Compile the desktop shell: GUI dist (unless --skip-gui), then Electron main
 * and renderer bundles. `--check-assets` verifies the media library first.
 */

import {spawnSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pkgRoot, '../..');
const skipGui = process.argv.includes('--skip-gui');
const checkAssets = process.argv.includes('--check-assets');

const run = (command, args, cwd) => {
    const result = spawnSync(command, args, {
        cwd,
        stdio: 'inherit',
        env: process.env,
        shell: false
    });
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
};

if (checkAssets) {
    run(process.execPath, ['scripts/fetch-library-assets.mjs', '--check'], repoRoot);
}

const guiDist = path.join(repoRoot, 'packages/scratch-gui/dist/scratch-gui.js');
if (!skipGui || !fs.existsSync(guiDist)) {
    run('npm', ['run', 'build:dist', '--workspace', '@scratch/scratch-gui'], repoRoot);
}

process.env.NODE_ENV = 'production';
run(process.execPath, ['-e', "require('electron')"], pkgRoot);
run('npx', ['webpack', '--config', 'webpack.main.js'], pkgRoot);
run('npx', ['webpack', '--config', 'webpack.renderer.js'], pkgRoot);
