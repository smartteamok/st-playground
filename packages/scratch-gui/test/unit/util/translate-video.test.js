import {translateVideo} from '../../../src/lib/libraries/decks/translate-video.js';

describe('translateVideo', () => {
    test('returns the id unchanged after tutorials were removed', () => {
        expect(translateVideo('not-a-key', 'en')).toEqual('not-a-key');
        expect(translateVideo('intro-move-sayhello', 'ja')).toEqual('intro-move-sayhello');
        expect(translateVideo('intro-move-sayhello', 'en')).toEqual('intro-move-sayhello');
    });
});
