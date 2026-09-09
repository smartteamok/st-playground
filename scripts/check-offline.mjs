#!/usr/bin/env node
/**
 * Fail if the editor needs the network for anything.
 *
 * Blocks every request that does not go to the local host, then walks the four
 * media libraries checking that thumbnails render and that a sound loads. Runs
 * twice: once as the web build and once simulating the desktop, because
 * `library-item.jsx` resolves thumbnails differently on each platform.
 *
 * Needs the playground running (`npm start`). Usage:
 *   node scripts/check-offline.mjs [--url http://127.0.0.1:8601/index.html]
 */

import {chromium} from 'playwright';

const urlArgIndex = process.argv.indexOf('--url');
const BASE_URL = urlArgIndex === -1 ?
    'http://127.0.0.1:8601/index.html' :
    process.argv[urlArgIndex + 1];

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '']);
const MIN_THUMBNAILS = 5;
const IMAGE_SELECTOR = 'img[class*="library-item_library-item-image"]';
const GRID_SELECTOR = '[class*="library_library-scroll-grid"]';
const FEATURED_SELECTOR = '[class*="library-item_featured-item"]';

const failures = [];
const fail = (scenario, message) => failures.push(`${scenario}: ${message}`);

const isLocal = url => {
    if (/^(data|blob|about|file):/.test(url)) return true;
    try {
        return LOCAL_HOSTS.has(new URL(url).hostname);
    } catch {
        return false;
    }
};

/**
 * Count the library thumbnails that actually decoded.
 * @param {import('playwright').Page} page - the editor page.
 * @returns {Promise<{total: number, loaded: number}>} - thumbnails in the DOM and how many rendered.
 */
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
        // the caller reports the shortfall with the actual counts
    }
    return countThumbnails(page);
};

const openLibrary = async (page, label) => {
    await page.locator(`button[aria-label="${label}"][class*="main-button"]`).first().click();
    await page.locator(GRID_SELECTOR).first().waitFor({timeout: 20000});
};

const closeLibrary = async page => {
    // Libraries are full-screen modals, so the header shows a Back button
    // instead of the usual close button.
    const back = page.locator('[class*="modal_back-button"]').last();
    if (await back.count()) {
        await back.click();
    } else {
        await page.keyboard.press('Escape');
    }
    await page.locator(GRID_SELECTOR).first().waitFor({state: 'detached', timeout: 20000});
};

const checkLibrary = async (page, scenario, label, openLabel) => {
    await openLibrary(page, openLabel);
    const {total, loaded} = await waitForThumbnails(page);
    if (loaded < MIN_THUMBNAILS) {
        fail(scenario, `${label}: solo ${loaded} de ${total} miniaturas cargaron`);
    } else {
        console.log(`  ${label}: ${loaded}/${total} miniaturas`);
    }
    await closeLibrary(page);
};

const runScenario = async (browser, scenario, url) => {
    console.log(`\n== ${scenario} (${url})`);

    const context = await browser.newContext({viewport: {width: 1440, height: 900}});
    const page = await context.newPage();

    const blocked = [];
    const localRequests = [];
    const pageErrors = [];

    page.on('pageerror', error => pageErrors.push(error.message));
    await page.route('**/*', route => {
        const requestUrl = route.request().url();
        if (isLocal(requestUrl)) {
            localRequests.push(requestUrl);
            return route.continue();
        }
        blocked.push(requestUrl);
        return route.abort();
    });

    await page.goto(url, {waitUntil: 'load'});
    await page.locator('button[aria-label="Choose a Sprite"]').first().waitFor({timeout: 60000});

    // The dev server's error overlay sits on top of the editor and swallows
    // clicks. Uncaught exceptions are still reported through `pageerror`.
    await page.addStyleTag({content: '#webpack-dev-server-client-overlay{display:none !important}'});

    // Sprite library: selecting an item closes the modal and adds the sprite,
    // which also proves the VM could load its costumes and sounds from disk.
    await openLibrary(page, 'Choose a Sprite');
    const sprites = await waitForThumbnails(page);
    if (sprites.loaded < MIN_THUMBNAILS) {
        fail(scenario, `sprites: solo ${sprites.loaded} de ${sprites.total} miniaturas cargaron`);
    } else {
        console.log(`  sprites: ${sprites.loaded}/${sprites.total} miniaturas`);
    }
    await page.locator(`${GRID_SELECTOR} button`).first().click();
    await page.locator('[class*="sprite-selector-item_sprite-selector-item"]')
        .nth(1).waitFor({timeout: 20000});
    console.log('  sprite insertado en el escenario');

    await page.getByText('Costumes', {exact: true}).click();
    await checkLibrary(page, scenario, 'disfraces', 'Choose a Costume');

    // Sound items only preview from their play button: `containers/library-item`
    // ignores mouse enter when `showPlayButton` is set.
    await page.getByText('Sounds', {exact: true}).click();
    await openLibrary(page, 'Choose a Sound');
    const wavCount = () => localRequests.filter(u => /library-assets\/.*\.wav$/.test(u)).length;
    const wavsBefore = wavCount();
    await page.locator('[class*="play-button_play-button"]').first().click();
    await page.waitForTimeout(3000);
    if (wavCount() <= wavsBefore) {
        fail(scenario, 'sonidos: reproducir un sonido no pidió ningún .wav local');
    } else {
        console.log(`  sonidos: ${wavCount() - wavsBefore} .wav servidos localmente`);
    }
    await closeLibrary(page);

    await page.getByText('Code', {exact: true}).click();
    await checkLibrary(page, scenario, 'fondos', 'Choose a Backdrop');

    await page.locator('button[aria-label="Add Extension"]').click();
    await page.locator(FEATURED_SELECTOR).first().waitFor({timeout: 20000});
    const extensions = await page.locator(FEATURED_SELECTOR).count();
    console.log(`  extensiones ofrecidas: ${extensions}`);

    const libraryAssets = new Set(
        localRequests.filter(u => u.includes('/static/library-assets/'))
    ).size;
    console.log(`  assets locales servidos: ${libraryAssets}`);

    if (blocked.length) {
        fail(scenario, `${blocked.length} request(s) a la red: ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
    }
    if (pageErrors.length) {
        fail(scenario, `excepciones sin atrapar: ${[...new Set(pageErrors)].slice(0, 3).join(' | ')}`);
    }

    await context.close();
    return {extensions, libraryAssets};
};

const browser = await chromium.launch();
let web;
let desktop;

try {
    web = await runScenario(browser, 'web', BASE_URL);
    desktop = await runScenario(
        browser,
        'escritorio',
        `${BASE_URL}${BASE_URL.includes('?') ? '&' : '?'}isScratchDesktop=true`
    );
} finally {
    await browser.close();
}

if (web.extensions !== 12) {
    fail('web', `se esperaban 12 extensiones, hay ${web.extensions}`);
}
if (desktop.extensions !== 6) {
    fail('escritorio', `se esperaban 6 extensiones, hay ${desktop.extensions}`);
}

if (failures.length) {
    console.error(`\ncheck-offline: ${failures.length} problema(s)`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
}

console.log('\ncheck-offline: ok');
