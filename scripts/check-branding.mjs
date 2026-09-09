#!/usr/bin/env node
/**
 * Fail if the GUI playground still carries user-visible Scratch branding
 * or third-party analytics snippets.
 *
 * Hardware names (Scratch Link) and npm package identifiers are allowed.
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'packages/scratch-gui/build');

const fetchUrl = url => new Promise((resolve, reject) => {
    http.get(url, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
});

const walk = dir => {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(full));
        else out.push(full);
    }
    return out;
};

const hits = [];
const record = (where, msg) => hits.push(`${where}: ${msg}`);

const scanHtml = (name, html) => {
    if (/googletagmanager\.com|google-analytics\.com|GTM-[A-Z0-9]+/.test(html)) {
        record(name, 'analytics/GTM snippet');
    }
    if (/<title>[^<]*Scratch/i.test(html)) {
        record(name, `title still mentions Scratch: ${html.match(/<title>[^<]+/)[0]}`);
    }
    if (/alt=["']Scratch["']/.test(html)) {
        record(name, 'alt="Scratch"');
    }
};

const htmlFiles = walk(buildDir).filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
    scanHtml(path.relative(root, file), fs.readFileSync(file, 'utf8'));
}

if (htmlFiles.length === 0) {
    try {
        const html = await fetchUrl('http://127.0.0.1:8601/');
        scanHtml('http://127.0.0.1:8601/', html);
        const js = await fetchUrl('http://127.0.0.1:8601/gui.js');
        if (/googletagmanager\.com|google-analytics\.com/.test(js)) {
            record('gui.js', 'analytics/GTM snippet');
        }
        if (/alt:\\?"Scratch\\?"/.test(js) || /alt:"Scratch"/.test(js)) {
            record('gui.js', 'alt="Scratch" still in bundle');
        }
        if (!/ST-Playground Project/.test(js)) {
            record('gui.js', 'missing overlaid title ST-Playground Project');
        }
    } catch (error) {
        record('scan', `could not reach the playground: ${error.message}`);
    }
}

if (hits.length) {
    console.error(`check-branding: ${hits.length} leftover(s)`);
    for (const hit of hits) console.error(`  ${hit}`);
    process.exit(1);
}

console.log('check-branding: ok');
