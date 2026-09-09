import {PLATFORM} from './platform.js';

/**
 * Extensions that work with no connectivity, which is the only kind of session
 * the desktop app is built for (D-19).
 *
 * Everything left out either calls a Scratch web service on every block
 * (`text2speech`, `translate`) or needs hardware the schools do not have
 * (`gdxfor`, `ev3`, `boost`, `wedo2`). `microbit` is in: it talks to the board
 * over Bluetooth through Scratch Link, and its firmware is served from
 * `static/microbit/`.
 */
export const OFFLINE_EXTENSION_IDS = [
    'music',
    'pen',
    'videoSensing',
    'faceSensing',
    'makeymakey',
    'microbit'
];

/**
 * Narrow the extension library down to what the given platform can actually
 * run. The web build keeps the full catalog.
 * @param {object[]} extensions - the extension library catalog.
 * @param {string} platform - one of `PLATFORM`.
 * @returns {object[]} - the extensions to offer.
 */
export const filterExtensionsForPlatform = (extensions, platform) => {
    if (platform !== PLATFORM.DESKTOP) return extensions;

    return extensions.filter(extension => OFFLINE_EXTENSION_IDS.includes(extension.extensionId));
};
