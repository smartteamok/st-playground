#!/usr/bin/env node
/**
 * Drive the packaged-or-compiled desktop app through Playwright/CDP.
 *
 * Checks: no outbound network, library thumbnails, one sound, six extensions,
 * save a .sb3 and reopen it. Usage:
 *   node scripts/check-desktop.mjs
 *   node scripts/check-desktop.mjs --app /path/to/st-playground
 */

import {spawnSync} from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {fileURLToPath} from 'url';
import {_electron as electron} from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const desktopRoot = path.join(repoRoot, 'packages/st-playground-desktop');
const appArgIndex = process.argv.indexOf('--app');
const explicitApp = appArgIndex === -1 ? null : process.argv[appArgIndex + 1];

const IMAGE_SELECTOR = 'img[class*="library-item_library-item-image"]';
const GRID_SELECTOR = '[class*="library_library-scroll-grid"]';
const FEATURED_SELECTOR = '[class*="library-item_featured-item"]';
const MIN_THUMBNAILS = 5;

const failures = [];
const fail = message => failures.push(message);

const electronBinary = () => {
    const candidate = path.join(repoRoot, 'node_modules/electron/dist/electron');
    if (fs.existsSync(candidate)) return candidate;
    const nested = path.join(desktopRoot, 'node_modules/electron/dist/electron');
    if (fs.existsSync(nested)) return nested;
    throw new Error('no se encontró el binario de Electron; corrê npm install');
};

const defaultLaunch = () => {
    const unpacked = path.join(desktopRoot, 'release/linux-unpacked/st-playground');
    if (explicitApp) return {executablePath: explicitApp, args: []};
    if (fs.existsSync(unpacked)) return {executablePath: unpacked, args: []};
    const mainJs = path.join(desktopRoot, 'dist/main/main.js');
    if (!fs.existsSync(mainJs)) {
        throw new Error('no hay app compilada: npm run compile --workspace @st-playground/desktop');
    }
    return {executablePath: electronBinary(), args: [mainJs]};
};

const isAllowedUrl = url => {
    if (/^(app|data|blob|about|file|devtools|chrome):/.test(url)) return true;
    try {
        const host = new URL(url).hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    } catch {
        return false;
    }
};

const countThumbnails = page => page.evaluate(selector => {
    const images = [...document.querySelectorAll(selector)];
    return {
        total: images.length,
        loaded: images.filter(image => image.naturalWidth > 0).length
    };
}, IMAGE_SELECTOR);

const waitForThumbnails = async page => {
    try {
        await page.waitForFunction(
            ([selector, minimum]) => [...document.querySelectorAll(selector)]
                .filter(image => image.naturalWidth > 0).length >= minimum,
            [IMAGE_SELECTOR, MIN_THUMBNAILS],
            {timeout: 20000}
        );
    } catch {
        // caller reports counts
    }
    return countThumbnails(page);
};

const openLibrary = async (page, label) => {
    await page.locator(`button[aria-label="${label}"][class*="main-button"]`).first().click();
    await page.locator(GRID_SELECTOR).first().waitFor({timeout: 20000});
};

const closeLibrary = async page => {
    const back = page.locator('[class*="modal_back-button"]').last();
    if (await back.count()) {
        await back.click();
    } else {
        await page.keyboard.press('Escape');
    }
    await page.locator(GRID_SELECTOR).first().waitFor({state: 'detached', timeout: 20000});
};

const dismissWebGlModal = async page => {
    const overlay = page.locator('[class*="webgl-modal"]');
    if (await overlay.first().isVisible().catch(() => false)) {
        await page.evaluate(() => {
            document.querySelectorAll('.ReactModalPortal').forEach(node => node.remove());
        });
    }
};

const launchWithEnv = async (extraArgs, extraEnv) => {
    const {executablePath, args} = defaultLaunch();
    const app = await electron.launch({
        executablePath,
        args: [
            ...args,
            '--no-sandbox',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--lang=en-US',
            ...extraArgs
        ],
        env: {
            ...process.env,
            DISPLAY: process.env.DISPLAY || ':1',
            ST_PLAYGROUND_SWIFTSHADER: '1',
            ST_PLAYGROUND_NO_SANDBOX: '1',
            ST_PLAYGROUND_CONFIRM_LEAVE: 'leave',
            LANG: 'en_US.UTF-8',
            LANGUAGE: 'en',
            ...extraEnv
        }
    });
    const page = await app.firstWindow();
    const blocked = [];
    const localRequests = [];
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('**/*', route => {
        const url = route.request().url();
        if (isAllowedUrl(url)) {
            localRequests.push(url);
            return route.continue();
        }
        blocked.push(url);
        return route.abort();
    });
    return {app, page, blocked, localRequests, pageErrors};
};

const waitForEditor = async page => {
    await page.locator('button[aria-label="Choose a Sprite"]').first().waitFor({timeout: 90000});
    await dismissWebGlModal(page);
};

const checkLibraries = async (page, localRequests) => {
    await openLibrary(page, 'Choose a Sprite');
    const sprites = await waitForThumbnails(page);
    if (sprites.loaded < MIN_THUMBNAILS) {
        fail(`sprites: solo ${sprites.loaded} de ${sprites.total} miniaturas cargaron`);
    } else {
        console.log(`  sprites: ${sprites.loaded}/${sprites.total} miniaturas`);
    }
    await page.locator(`${GRID_SELECTOR} button`).first().click();
    await page.locator('[class*="sprite-selector-item_sprite-selector-item"]')
        .nth(1).waitFor({timeout: 20000});
    console.log('  sprite insertado en el escenario');

    await page.getByText('Costumes', {exact: true}).click();
    await openLibrary(page, 'Choose a Costume');
    const costumes = await waitForThumbnails(page);
    if (costumes.loaded < MIN_THUMBNAILS) {
        fail(`disfraces: solo ${costumes.loaded} de ${costumes.total} miniaturas cargaron`);
    } else {
        console.log(`  disfraces: ${costumes.loaded}/${costumes.total} miniaturas`);
    }
    await closeLibrary(page);

    await page.getByText('Sounds', {exact: true}).click();
    await openLibrary(page, 'Choose a Sound');
    const wavCount = () => localRequests.filter(url => /library-assets\/.*\.wav$/.test(url)).length;
    const wavsBefore = wavCount();
    await page.locator('[class*="play-button_play-button"]').first().click();
    await page.waitForTimeout(3000);
    if (wavCount() <= wavsBefore) {
        fail('sonidos: reproducir un sonido no pidió ningún .wav local');
    } else {
        console.log(`  sonidos: ${wavCount() - wavsBefore} .wav servidos localmente`);
    }
    await closeLibrary(page);

    await page.getByText('Code', {exact: true}).click();
    await openLibrary(page, 'Choose a Backdrop');
    const backdrops = await waitForThumbnails(page);
    if (backdrops.loaded < MIN_THUMBNAILS) {
        fail(`fondos: solo ${backdrops.loaded} de ${backdrops.total} miniaturas cargaron`);
    } else {
        console.log(`  fondos: ${backdrops.loaded}/${backdrops.total} miniaturas`);
    }
    await closeLibrary(page);

    await page.locator('button[aria-label="Add Extension"]').click();
    await page.locator(FEATURED_SELECTOR).first().waitFor({timeout: 20000});
    const extensions = await page.locator(FEATURED_SELECTOR).count();
    console.log(`  extensiones ofrecidas: ${extensions}`);
    if (extensions !== 6) fail(`se esperaban 6 extensiones, hay ${extensions}`);
    await page.keyboard.press('Escape');
};

const saveProject = async (page, dest) => {
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    await page.getByLabel('File menu').click();
    await page.getByText('Save to your computer').click();
    const started = Date.now();
    while (!fs.existsSync(dest) || fs.statSync(dest).size < 64) {
        if (Date.now() - started > 30000) {
            fail(`guardar: no apareció ${dest}`);
            return false;
        }
        await page.waitForTimeout(250);
    }
    console.log(`  guardado: ${dest} (${fs.statSync(dest).size} bytes)`);
    return true;
};

const sb3HasProjectJson = filePath => {
    const result = spawnSync('python3', ['-c', `
import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
ok = 'project.json' in z.namelist()
print('ok' if ok else 'missing')
sys.exit(0 if ok else 1)
`, filePath], {encoding: 'utf8'});
    return result.status === 0;
};

const outDir = path.join(desktopRoot, 'test-results');
fs.mkdirSync(outDir, {recursive: true});
const screenshotPath = path.join(outDir, 'desktop.png');
const savePath = path.join(os.tmpdir(), 'st-playground-check.sb3');

console.log('== escritorio');
const session = await launchWithEnv([], {ST_PLAYGROUND_SAVE_PATH: savePath});
const {app, page, blocked, localRequests, pageErrors} = session;

try {
    await waitForEditor(page);
    console.log('  baseURI:', await page.evaluate(() => document.baseURI));
    await checkLibraries(page, localRequests);

    if (blocked.length) {
        fail(`${blocked.length} request(s) a la red: ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
    }
    if (pageErrors.length) {
        fail(`excepciones: ${[...new Set(pageErrors)].slice(0, 3).join(' | ')}`);
    }

    await page.screenshot({path: screenshotPath, fullPage: true});
    console.log(`  captura: ${screenshotPath}`);

    const saved = await saveProject(page, savePath);
    if (saved && !sb3HasProjectJson(savePath)) {
        fail('el .sb3 no contiene project.json');
    }
} finally {
    await app.close();
}

if (fs.existsSync(savePath) && sb3HasProjectJson(savePath)) {
    console.log('\n== reabrir .sb3');
    const reopen = await launchWithEnv([savePath], {});
    try {
        await waitForEditor(reopen.page);
        const title = await reopen.page.locator('[class*="project-title"]').first().textContent().catch(() => '');
        const sprites = await reopen.page.locator('[class*="sprite-selector-item_sprite-selector-item"]').count();
        console.log(`  título: ${JSON.stringify(title)}`);
        console.log(`  sprites en el escenario: ${sprites}`);
        if (sprites < 2) fail('al reabrir no está el sprite extra que se había insertado');
        await reopen.page.screenshot({path: path.join(outDir, 'desktop-reopen.png')});
    } finally {
        await reopen.app.close();
    }
}

if (failures.length) {
    console.error(`\ncheck-desktop: ${failures.length} problema(s)`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
}

console.log('\ncheck-desktop: ok');
