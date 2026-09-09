import messages from '../../../src/lib/st-playground-messages';

describe('st-playground-messages', () => {
    test('overlays Spanish load-from-computer (missing from scratch-l10n)', () => {
        expect(messages.es['gui.sharedMessages.loadFromComputerTitle'])
            .toBe('Cargar desde tu ordenador');
        expect(messages['es-419']['gui.sharedMessages.loadFromComputerTitle'])
            .toBe('Cargar desde tu computador');
    });
});
