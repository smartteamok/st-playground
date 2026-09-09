import {GUIConfig} from './gui-config';
import {STPlaygroundStorage} from './lib/st-playground-storage';

/**
 * ST-Playground replaces the instance upstream builds here (`LegacyStorage`,
 * which talks to the Scratch web services) instead of passing a
 * `configFactory` to `AppStateHOC`, because `components/scratch-image` reads
 * this singleton directly rather than the configured storage, and that is the
 * path every library thumbnail takes on the desktop app. Injecting by
 * `configFactory` would leave two `ScratchStorage` instances in play and break
 * those thumbnails. See D-17 in DECISIONES.md.
 */
export const legacyConfig: GUIConfig = {
    storage: new STPlaygroundStorage()
};
