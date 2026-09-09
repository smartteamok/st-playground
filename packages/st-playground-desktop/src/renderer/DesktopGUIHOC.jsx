import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {
    LoadingStates,
    onLoadedProject,
    defaultProjectId,
    requestNewProject,
    requestProjectUpload,
    setProjectId,
    openLoadingProject,
    closeLoadingProject
} from '@scratch/scratch-gui';

const desktopApi = () => (typeof window !== 'undefined' ? window.desktop : null);

/**
 * Desktop host for scratch-gui.
 *
 * Lives entirely in this package (D-05): no changes to scratch-gui. Platform
 * DESKTOP is what turns on the six offline extensions from D-19. Saving is the
 * native dialog in the main process via session.will-download, so canSave stays
 * false and the GUI just emits a blob download as it does on the web.
 * @param {object} WrappedComponent - GUI-like component to wrap.
 * @returns {object} - the wrapped component.
 */
const DesktopGUIHOC = function (WrappedComponent) {
    class DesktopGUI extends React.Component {
        constructor (props) {
            super(props);
            this.state = {projectTitle: undefined};
            this.handleSetTitleFromSave = this.handleSetTitleFromSave.bind(this);
            this.handleUpdateProjectTitle = this.handleUpdateProjectTitle.bind(this);
            this.handleClickAbout = this.handleClickAbout.bind(this);
            this.loadProjectBuffer = this.loadProjectBuffer.bind(this);
            this.loadIncomingProject = this.loadIncomingProject.bind(this);

            this.props.onLoadingStarted();
            const api = desktopApi();
            const initialPromise = api && api.getInitialProjectData ?
                api.getInitialProjectData() :
                Promise.resolve(null);

            initialPromise.then(initialProjectData => {
                const hasInitialProject = Boolean(initialProjectData && initialProjectData.byteLength);
                this.props.onHasInitialProject(hasInitialProject, this.props.loadingState);
                if (!hasInitialProject) {
                    this.props.onLoadingCompleted();
                    return;
                }
                return this.loadProjectBuffer(initialProjectData);
            }).catch(error => {
                this.props.onLoadingCompleted();
                this.failLoad(error);
            });
        }

        componentDidMount () {
            window.onbeforeunload = () => true;
            const api = desktopApi();
            if (!api) return;
            if (api.onSetTitleFromSave) api.onSetTitleFromSave(this.handleSetTitleFromSave);
            if (api.onOpenProject) api.onOpenProject(this.loadIncomingProject);
        }

        handleClickAbout () {
            const api = desktopApi();
            if (api && api.openAbout) api.openAbout();
        }

        handleSetTitleFromSave (args) {
            this.handleUpdateProjectTitle(args && args.title);
        }

        handleUpdateProjectTitle (newTitle) {
            this.setState({projectTitle: newTitle});
        }

        failLoad (error) {
            const api = desktopApi();
            const detail = error && error.message ? error.message : String(error || '');
            const shown = api && api.showLoadError ? api.showLoadError(detail) : Promise.resolve();
            return shown.then(() => {
                this.props.onHasInitialProject(false, this.props.loadingState);
                this.props.onRequestNewProject();
            });
        }

        loadProjectBuffer (projectData) {
            return this.props.vm.loadProject(projectData).then(
                () => {
                    this.props.onLoadingCompleted();
                    this.props.onLoadedProject(this.props.loadingState, true);
                },
                error => {
                    this.props.onLoadingCompleted();
                    this.props.onLoadedProject(this.props.loadingState, false);
                    return this.failLoad(error);
                }
            );
        }

        loadIncomingProject (projectData) {
            this.props.onLoadingStarted();
            this.props.onHasInitialProject(true, this.props.loadingState);
            return this.loadProjectBuffer(projectData);
        }

        render () {
            const {
                loadingState,
                onHasInitialProject,
                onLoadedProject,
                onLoadingCompleted,
                onLoadingStarted,
                onRequestNewProject,
                vm,
                ...childProps
            } = this.props;

            return (
                <WrappedComponent
                    {...childProps}
                    backpackVisible={false}
                    canEditTitle
                    canModifyCloudData={false}
                    canRemix={false}
                    canSave={false}
                    canShare={false}
                    enableCommunity={false}
                    platform="DESKTOP"
                    projectTitle={this.state.projectTitle}
                    showTutorials={false}
                    onClickAbout={this.handleClickAbout}
                    onUpdateProjectTitle={this.handleUpdateProjectTitle}
                />
            );
        }
    }

    DesktopGUI.propTypes = {
        loadingState: PropTypes.oneOf(LoadingStates),
        onHasInitialProject: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onLoadingCompleted: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        onRequestNewProject: PropTypes.func,
        vm: PropTypes.any
    };

    const mapStateToProps = state => ({
        loadingState: state.scratchGui.projectState.loadingState,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        onLoadingStarted: () => dispatch(openLoadingProject()),
        onLoadingCompleted: () => dispatch(closeLoadingProject()),
        onHasInitialProject: (hasInitialProject, loadingState) => {
            if (hasInitialProject) {
                return dispatch(requestProjectUpload(loadingState));
            }
            return dispatch(setProjectId(defaultProjectId));
        },
        onLoadedProject: (loadingState, loadSuccess) => {
            const canSaveToServer = false;
            return dispatch(onLoadedProject(loadingState, canSaveToServer, loadSuccess));
        },
        onRequestNewProject: () => dispatch(requestNewProject(false))
    });

    return connect(mapStateToProps, mapDispatchToProps)(DesktopGUI);
};

export default DesktopGUIHOC;
