#!/usr/bin/env node
/**
 * Production static build of the GUI playground for Vercel (or any static host).
 *
 * Output: packages/scratch-gui/build/ (index.html, gui.js, library, actividades).
 */

import {spawnSync} from 'child_process';
import {rmSync} from 'fs';
import {fileURLToPath} from 'url';
import path from 'path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const run = (command, args, extraEnv = {}) => {
    const result = spawnSync(command, args, {
        cwd: repoRoot,
        stdio: 'inherit',
        env: {...process.env, ...extraEnv},
        shell: false
    });
    if (result.status !== 0) {
        process.exit(result.status || 1);
    }
};

const workspaceDeps = [
    'task-herder',
    'scratch-storage',
    'scratch-svg-renderer',
    'scratch-paint',
    'scratch-render',
    'scratch-vm'
];

for (const name of workspaceDeps) {
    run('npm', ['run', 'build', '--workspace', `packages/${name}`], {
        NODE_ENV: 'production'
    });
}

rmSync(path.join(repoRoot, 'packages/scratch-gui/build'), {recursive: true, force: true});

run('npm', ['run', 'build:dev', '--workspace', '@scratch/scratch-gui'], {
    NODE_ENV: 'production',
    NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=4096']
        .filter(Boolean)
        .join(' '),
    ST_PLAYGROUND_WEB: '1'
});
