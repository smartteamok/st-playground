/**
 * Overlay ST-Playground brand strings onto scratch-l10n editor messages.
 *
 * Webpack aliases `scratch-l10n/locales/editor-msgs` to this file so every
 * locale picks up the product name. Import the original via the `.js`
 * suffix so the alias (which matches the extensionless request) does not
 * recurse.
 */

import original from 'scratch-l10n/locales/editor-msgs.js';

const BRAND = 'ST-Playground';

const KEYS = [
    'gui.gui.defaultProjectTitle',
    'gui.menuBar.joinScratch',
    'gui.alerts.lostPeripheralConnection',
    'gui.crashMessage.description',
    'gui.webglModal.description',
    'gui.unsupportedBrowser.notRecommended',
    'gui.unsupportedBrowser.description',
    'gui.telemetryOptIn.label',
    'gui.telemetryOptIn.body1',
    'gui.telemetryOptIn.optInText',
    'gui.telemetryOptIn.optOutText'
];

/**
 * Keys whose value is the same in every locale. The default sprite's sound is a
 * blip, not a cat, so scratch-l10n's translations of "Meow" would name it after
 * a sound it no longer makes.
 */
const FIXED = {
    'gui.defaultProject.meow': 'Blip'
};

const overlayLocale = messages => {
    const next = {...messages};
    for (const key of KEYS) {
        const value = next[key];
        if (typeof value !== 'string') continue;
        next[key] = value
            .replaceAll('Scratch Team', `${BRAND} team`)
            .replaceAll('Scratch 3.0', BRAND)
            .replaceAll('Scratch', BRAND);
    }
    return {...next, ...FIXED};
};

const overlaid = {};
for (const [locale, messages] of Object.entries(original)) {
    overlaid[locale] = overlayLocale(messages);
}

overlaid.en = {
    ...overlaid.en,
    'gui.gui.defaultProjectTitle': `${BRAND} Project`
};

export default overlaid;
