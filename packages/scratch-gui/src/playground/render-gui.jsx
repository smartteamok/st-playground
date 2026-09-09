import React from 'react';
import ReactDomClient from 'react-dom/client';
import {compose} from 'redux';

import AppStateHOC from '../lib/app-state-hoc.jsx';
import GUI from '../containers/gui.jsx';
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
    GUI.setAppElement(appTarget);

    // note that redux's 'compose' function is just being used as a general utility to make
    // the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
    // ability to compose reducers.
    // HashParserHOC fetches the default project from #id. Skip it when an
    // actividad query is present so it does not race the starter .sb3.
    const hasActividad = Boolean(parseActividadId(
        typeof window !== 'undefined' ? window.location.search : ''
    ));
    const WrappedGui = compose(
        AppStateHOC,
        ...(hasActividad ? [] : [HashParserHOC]),
        STPlaygroundActividadHOC
    )(GUI);

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
        // Warn before navigating away
        window.onbeforeunload = () => true;
    }

    const root = ReactDomClient.createRoot(appTarget);

    root.render(
        <WrappedGui
            canEditTitle
            canRemix={false}
            canSave={false}
            canShare={false}
            enableCommunity={false}
            backpackVisible={false}
            showTutorials={false}
            platform={simulateScratchDesktop ? PLATFORM.DESKTOP : undefined}
        />
    );
};
