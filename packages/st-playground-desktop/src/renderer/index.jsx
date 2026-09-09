import React from 'react';
import {createRoot} from 'react-dom/client';
import {compose} from 'redux';
import GUI, {AppStateHOC} from '@scratch/scratch-gui';

import DesktopGUIHOC from './DesktopGUIHOC.jsx';
import './app.css';

const appTarget = document.getElementById('app');
appTarget.className = 'app';

GUI.setAppElement(appTarget);

const WrappedGui = compose(
    AppStateHOC,
    DesktopGUIHOC
)(GUI);

const root = createRoot(appTarget);
root.render(<WrappedGui />);
