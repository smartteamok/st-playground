#!/usr/bin/env node
/**
 * Download every media library asset referenced by the GUI's library catalogs
 * into `assets/library/`, so the editor never needs the Scratch asset service.
 *
 * The catalogs address assets by content: the file name is the MD5 of the
 * bytes, so every download is verified against its own name.
 *
 * Usage:
 *   node scripts/fetch-library-assets.mjs            download what is missing
 *   node scripts/fetch-library-assets.mjs --check    verify only, never write
 *   node scripts/fetch-library-assets.mjs --prune    also delete unreferenced files
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import {fileURLToPath} from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_DIR = path.join(ROOT, 'packages/scratch-gui/src/lib/libraries');
const CATALOGS = ['sprites.json', 'costumes.json', 'backdrops.json', 'sounds.json'];
const TARGET_DIR = path.join(ROOT, 'assets/library');
const ASSET_HOST = 'https://cdn.assets.scratch.mit.edu';
const CONCURRENCY = 16;
const ATTEMPTS = 3;

const checkOnly = process.argv.includes('--check');
const prune = process.argv.includes('--prune');

const md5 = buffer => crypto.createHash('md5').update(buffer).digest('hex');

/**
 * Collect every `md5ext` in a catalog, including the ones nested inside a
 * sprite's costumes and sounds.
 * @param {unknown} node - a catalog, entry, or any value inside one.
 * @param {Set<string>} found - accumulator.
 * @returns {Set<string>} - the accumulator.
 */
const collectMd5exts = (node, found) => {
    if (!node || typeof node !== 'object') return found;
    if (Array.isArray(node)) {
        for (const item of node) collectMd5exts(item, found);
        return found;
    }
    if (typeof node.md5ext === 'string') found.add(node.md5ext);
    for (const value of Object.values(node)) collectMd5exts(value, found);
    return found;
};

const readCatalogs = async () => {
    const found = new Set();
    for (const catalog of CATALOGS) {
        const raw = await fs.readFile(path.join(CATALOG_DIR, catalog), 'utf8');
        collectMd5exts(JSON.parse(raw), found);
    }
    return [...found].sort();
};

/**
 * Report whether a local asset exists and its bytes hash to its own name.
 * @param {string} md5ext - the asset file name, `<md5>.<ext>`.
 * @returns {Promise<'ok'|'missing'|'corrupt'>} - the state on disk.
 */
const inspectLocal = async md5ext => {
    const [expected] = md5ext.split('.');
    let data;
    try {
        data = await fs.readFile(path.join(TARGET_DIR, md5ext));
    } catch {
        return 'missing';
    }
    return md5(data) === expected ? 'ok' : 'corrupt';
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const download = async md5ext => {
    const [expected] = md5ext.split('.');
    const url = `${ASSET_HOST}/internalapi/asset/${md5ext}/get/`;
    let lastError;

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = Buffer.from(await response.arrayBuffer());
            const actual = md5(data);
            if (actual !== expected) throw new Error(`md5 mismatch, got ${actual}`);
            await fs.writeFile(path.join(TARGET_DIR, md5ext), data);
            return;
        } catch (error) {
            lastError = error;
            if (attempt < ATTEMPTS) await sleep(500 * (2 ** (attempt - 1)));
        }
    }

    throw new Error(`${md5ext}: ${lastError.message}`);
};

/**
 * Run an async worker over a queue with bounded concurrency.
 * @param {string[]} items - the queue.
 * @param {(item: string) => Promise<void>} worker - what to do with each item.
 * @returns {Promise<Error[]>} - the errors that happened, if any.
 */
const runPool = async (items, worker) => {
    const queue = [...items];
    const errors = [];
    let done = 0;

    const run = async () => {
        for (let item = queue.shift(); item; item = queue.shift()) {
            try {
                await worker(item);
            } catch (error) {
                errors.push(error);
            }
            if (++done % 100 === 0 || done === items.length) {
                process.stdout.write(`\r  ${done}/${items.length}`);
            }
        }
    };

    await Promise.all(Array.from({length: Math.min(CONCURRENCY, queue.length)}, run));
    if (items.length) process.stdout.write('\n');
    return errors;
};

const wanted = await readCatalogs();
console.log(`catálogos: ${wanted.length} assets referenciados`);

if (!checkOnly) await fs.mkdir(TARGET_DIR, {recursive: true});

let present;
try {
    present = (await fs.readdir(TARGET_DIR)).filter(name => !name.startsWith('.'));
} catch {
    present = [];
}

const wantedSet = new Set(wanted);
const unreferenced = present.filter(name => !wantedSet.has(name));

const needed = [];
const inspectErrors = await runPool(wanted, async md5ext => {
    if (await inspectLocal(md5ext) !== 'ok') needed.push(md5ext);
});

if (inspectErrors.length) {
    console.error('no se pudo inspeccionar la carpeta local');
    for (const error of inspectErrors) console.error(`  ${error.message}`);
    process.exit(1);
}

console.log(`en disco: ${present.length} archivos, faltantes o corruptos: ${needed.length}` +
    (unreferenced.length ? `, sin referencia: ${unreferenced.length}` : ''));

if (checkOnly) {
    const problems = [];
    if (needed.length) problems.push(`${needed.length} faltante(s) o corrupto(s)`);
    if (unreferenced.length) problems.push(`${unreferenced.length} sin referencia en los catálogos`);
    if (problems.length) {
        console.error(`fetch-library-assets --check: ${problems.join(', ')}`);
        for (const md5ext of [...needed, ...unreferenced].slice(0, 20)) console.error(`  ${md5ext}`);
        if (needed.length + unreferenced.length > 20) console.error('  ...');
        process.exit(1);
    }
    console.log('fetch-library-assets --check: ok');
    process.exit(0);
}

if (needed.length) {
    console.log(`descargando desde ${ASSET_HOST}`);
    const errors = await runPool(needed, download);
    if (errors.length) {
        console.error(`fallaron ${errors.length} descarga(s)`);
        for (const error of errors.slice(0, 20)) console.error(`  ${error.message}`);
        process.exit(1);
    }
}

if (unreferenced.length) {
    if (prune) {
        for (const name of unreferenced) await fs.unlink(path.join(TARGET_DIR, name));
        console.log(`borrados ${unreferenced.length} archivo(s) sin referencia`);
    } else {
        console.log(`${unreferenced.length} archivo(s) sin referencia; correr con --prune para borrarlos`);
    }
}

console.log(`fetch-library-assets: ok, ${wanted.length} assets en assets/library/`);
