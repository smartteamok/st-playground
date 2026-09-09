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

import {
    fetchActividadBytes,
    fetchCatalog,
    findActividad,
    isValidActividadId,
    parseActividadId
} from '../../../scratch-gui/src/lib/st-playground-actividad.js';

const desktopApi = () => (typeof window !== 'undefined' ? window.desktop : null);

const isShowingProject = loadingState => (
    loadingState === 'SHOWING_WITH_ID' || loadingState === 'SHOWING_WITHOUT_ID'
);

/**
 * Desktop host for scratch-gui.
 *
 * Platform DESKTOP turns on the six offline extensions from D-19. Saving is
 * the native dialog in the main process via session.will-download, so canSave
 * stays false. Classroom starters (D-21) load through the shared actividad
 * helper. The Actividades menu is hidden for now; starters still load via
 * `?actividad=` and `st-playground://actividad/`.
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
            this.handleSelectActividad = this.handleSelectActividad.bind(this);
            this.flushQueuedActividad = this.flushQueuedActividad.bind(this);
            this.loadProjectBuffer = this.loadProjectBuffer.bind(this);
            this.loadIncomingProject = this.loadIncomingProject.bind(this);
            this.loadActividadById = this.loadActividadById.bind(this);
            this.failLoad = this.failLoad.bind(this);

            this.loadGeneration = 0;
            this.loadChain = Promise.resolve();
            this.queuedActividadId = null;

            this.catalogPromise = fetchCatalog().catch(() => []);

            this.props.onLoadingStarted();
            const api = desktopApi();
            const initialPromise = api && api.getInitialProjectData ?
                api.getInitialProjectData() :
                Promise.resolve(null);
            const actividadId = parseActividadId(
                typeof window !== 'undefined' ? window.location.search : ''
            );

            initialPromise.then(initialProjectData => {
                const bytes = initialProjectData && (initialProjectData.byteLength || initialProjectData.length);
                const hasInitialProject = Boolean(bytes);
                if (hasInitialProject) {
                    this.props.onHasInitialProject(true, this.props.loadingState);
                    return this.beginExclusiveLoad(generation =>
                        this.loadProjectBuffer(initialProjectData, generation));
                }
                if (actividadId) {
                    this.props.onHasInitialProject(true, this.props.loadingState);
                    return this.beginExclusiveLoad(generation =>
                        this.loadActividadById(actividadId, generation));
                }
                this.props.onHasInitialProject(false, this.props.loadingState);
                this.props.onLoadingCompleted();
            }).catch(error => {
                this.props.onLoadingCompleted();
                this.failLoad(error);
            });
        }

        componentDidUpdate () {
            if (this.queuedActividadId && isShowingProject(this.props.loadingState)) {
                this.flushQueuedActividad();
            }
        }

        beginExclusiveLoad (work) {
            const generation = ++this.loadGeneration;
            this.loadChain = this.loadChain.catch(() => {}).then(() => {
                if (generation !== this.loadGeneration) return;
                return work(generation);
            });
            return this.loadChain;
        }

        componentDidMount () {
            window.onbeforeunload = () => true;
            const api = desktopApi();
            if (!api) return;
            if (api.onSetTitleFromSave) api.onSetTitleFromSave(this.handleSetTitleFromSave);
            if (api.onOpenProject) api.onOpenProject(this.loadIncomingProject);
            if (api.onOpenActividad) api.onOpenActividad(this.handleSelectActividad);
        }

        handleClickAbout () {
            const api = desktopApi();
            if (api && api.openAbout) api.openAbout();
        }

        handleSelectActividad (id) {
            this.queuedActividadId = id;
            this.props.onLoadingStarted();
            if (isShowingProject(this.props.loadingState)) {
                return this.flushQueuedActividad();
            }
            return Promise.resolve();
        }

        flushQueuedActividad () {
            const id = this.queuedActividadId;
            if (!id) return Promise.resolve();
            this.queuedActividadId = null;
            this.props.onHasInitialProject(true, this.props.loadingState);
            return this.beginExclusiveLoad(generation => this.loadActividadById(id, generation));
        }

        handleSetTitleFromSave (args) {
            this.handleUpdateProjectTitle(args && args.title);
        }

        handleUpdateProjectTitle (newTitle) {
            this.setState({projectTitle: newTitle});
        }

        failLoad (error) {
            this.loadGeneration += 1;
            console.error('st-playground load failed', error);
            const api = desktopApi();
            const detail = error && error.message ? error.message : String(error || '');
            const shown = api && api.showLoadError ? api.showLoadError(detail) : Promise.resolve();
            return shown.then(() => {
                this.props.onHasInitialProject(false, this.props.loadingState);
                this.props.onRequestNewProject();
            });
        }

        loadProjectBuffer (projectData, generation) {
            const gen = generation || this.loadGeneration;
            return this.props.vm.loadProject(projectData).then(
                () => {
                    if (gen !== this.loadGeneration) return;
                    this.props.onLoadingCompleted();
                    this.props.onLoadedProject(this.props.loadingState, true);
                },
                error => {
                    if (gen !== this.loadGeneration) return;
                    this.props.onLoadingCompleted();
                    this.props.onLoadedProject(this.props.loadingState, false);
                    return this.failLoad(error);
                }
            );
        }

        loadIncomingProject (projectData) {
            this.props.onLoadingStarted();
            if (!isShowingProject(this.props.loadingState)) {
                this.props.onHasInitialProject(true, this.props.loadingState);
            }
            return this.beginExclusiveLoad(generation =>
                this.loadProjectBuffer(projectData, generation));
        }

        loadActividadById (id, generation) {
            const gen = generation || this.loadGeneration;
            return this.catalogPromise.then(catalog => {
                if (gen !== this.loadGeneration) return;
                const entry = isValidActividadId(id) ? findActividad(catalog, id) : null;
                if (!entry) {
                    throw new Error(`actividad desconocida: ${id}`);
                }
                this.handleUpdateProjectTitle(entry.titulo);
                return fetchActividadBytes(entry).then(buffer => {
                    if (gen !== this.loadGeneration) return;
                    return this.loadProjectBuffer(buffer, gen);
                });
            }).catch(error => {
                if (gen !== this.loadGeneration) return;
                return this.failLoad(error);
            });
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
            // SBFileUploaderHOC cancels a file-upload state with no File, so
            // loadingState may already be SHOWING_* when the VM finishes.
            // onLoadedProject() then returns undefined; dispatching that throws.
            const action = onLoadedProject(loadingState, false, loadSuccess);
            if (action) return dispatch(action);
        },
        onRequestNewProject: () => dispatch(requestNewProject(false))
    });

    return connect(mapStateToProps, mapDispatchToProps)(DesktopGUI);
};

export default DesktopGUIHOC;
