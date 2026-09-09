import {EditorState, createStandaloneRoot, setAppElement} from '../index-standalone';
import HashParserHOC from '../lib/hash-parser-hoc.jsx';
import STPlaygroundActividadHOC from '../lib/st-playground-actividad-hoc.jsx';
import {parseActividadId} from '../lib/st-playground-actividad.js';
import {PLATFORM} from '../lib/platform.js';

/*
 * Render the GUI playground. This is a separate function because importing anything
 * that instantiates the VM causes unsupported browsers to crash
 * {object} appTarget - the DOM element to render to
 */
export default appTarget => {
    setAppElement(appTarget);

    const scratchDesktopMatches = window.location.href.match(/[?&]isScratchDesktop=([^&]+)/);
    let simulateScratchDesktop;
    if (scratchDesktopMatches) {
        try {
            // parse 'true' into `true`, 'false' into `false`, etc.
            simulateScratchDesktop = JSON.parse(scratchDesktopMatches[1]);
        } catch {
            // it's not JSON so just use the string
            // note that a typo like "falsy" will be treated as true
            simulateScratchDesktop = scratchDesktopMatches[1];
        }
    }

    if (process.env.NODE_ENV === 'production' && typeof window === 'object') {
        window.onbeforeunload = () => true;
    }

    const hasActividad = Boolean(parseActividadId(
        typeof window !== 'undefined' ? window.location.search : ''
    ));
    const state = new EditorState({});
    const gui = createStandaloneRoot(state, appTarget, {
        wrappers: hasActividad ?
            [STPlaygroundActividadHOC] :
            [HashParserHOC, STPlaygroundActividadHOC]
    });

    gui.render({
        canEditTitle: true,
        canRemix: false,
        canSave: false,
        canShare: false,
        enableCommunity: false,
        backpackVisible: false,
        showTutorials: false,
        platform: simulateScratchDesktop ? PLATFORM.DESKTOP : undefined
    });
};
