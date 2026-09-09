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
    getIsShowingProject
} from '../reducers/project-state';
import {setProjectTitle} from '../reducers/project-title';
import {
    openLoadingProject,
    closeLoadingProject
} from '../reducers/modals';

import {
    fetchActividadBytes,
    fetchCatalog,
    findActividad,
    isValidActividadId,
    menuTitle,
    parseActividadId
} from './st-playground-actividad';

const ACTIVIDAD_LOAD_ERROR = 'No se pudo abrir la actividad. Se carga un proyecto nuevo.';

/**
 * Playground host for `?actividad=` (D-21).
 *
 * Lives in this package as a new HOC (D-05). Does not wrap HashParserHOC:
 * the playground omits HashParser when the query is present so the default
 * project fetch does not race the starter .sb3.
 * @param {object} WrappedComponent - GUI-like component to wrap.
 * @returns {object} - the wrapped component.
 */
const STPlaygroundActividadHOC = function (WrappedComponent) {
    class ActividadLoader extends React.Component {
        constructor (props) {
            super(props);
            this.state = {
                projectTitle: undefined,
                actividadMenu: []
            };
            this.handleSelectActividad = this.handleSelectActividad.bind(this);
            this.flushQueuedActividad = this.flushQueuedActividad.bind(this);
            this.loadActividadById = this.loadActividadById.bind(this);
            this.failLoad = this.failLoad.bind(this);

            this.loadGeneration = 0;
            this.loadChain = Promise.resolve();
            this.queuedActividadId = null;

            this.catalogPromise = fetchCatalog().then(catalog => {
                this.setState({
                    actividadMenu: catalog.map(entry => ({
                        title: menuTitle(entry),
                        onClick: () => this.handleSelectActividad(entry.id)
                    }))
                });
                return catalog;
            }).catch(() => []);

            const initialId = parseActividadId(
                typeof window !== 'undefined' ? window.location.search : ''
            );
            if (initialId) {
                this.props.onLoadingStarted();
                this.props.onHasInitialProject(true, this.props.loadingState);
                this.pendingInitial = this.beginExclusiveLoad(generation =>
                    this.loadActividadById(initialId, generation));
            }
        }

        componentDidUpdate () {
            if (this.queuedActividadId && getIsShowingProject(this.props.loadingState)) {
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

        handleSelectActividad (id) {
            this.queuedActividadId = id;
            this.props.onLoadingStarted();
            if (getIsShowingProject(this.props.loadingState)) {
                return this.flushQueuedActividad();
            }
            return Promise.resolve();
        }

        flushQueuedActividad () {
            const id = this.queuedActividadId;
            if (!id) return Promise.resolve();
            this.queuedActividadId = null;
            return this.beginExclusiveLoad(generation => this.loadActividadById(id, generation));
        }

        failLoad (generation) {
            if (generation && generation !== this.loadGeneration) return;
            this.loadGeneration += 1;
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(ACTIVIDAD_LOAD_ERROR);
            }
            this.props.onLoadingCompleted();
            this.props.onLoadedProject(this.props.loadingState, false);
            this.props.onHasInitialProject(false, this.props.loadingState);
            this.props.onRequestNewProject();
        }

        loadActividadById (id, generation) {
            const gen = generation || this.loadGeneration;
            return this.catalogPromise.then(catalog => {
                if (gen !== this.loadGeneration) return;
                const entry = isValidActividadId(id) ? findActividad(catalog, id) : null;
                if (!entry) {
                    throw new Error(`actividad desconocida: ${id}`);
                }
                return fetchActividadBytes(entry).then(buffer => {
                    if (gen !== this.loadGeneration) return;
                    this.setState({projectTitle: entry.titulo});
                    this.props.onSetProjectTitle(entry.titulo);
                    return this.props.vm.loadProject(buffer);
                }).then(() => {
                    if (gen !== this.loadGeneration) return;
                    this.props.onLoadingCompleted();
                    this.props.onLoadedProject(this.props.loadingState, true);
                });
            }).catch(() => this.failLoad(gen));
        }

        render () {
            const {
                loadingState,
                onHasInitialProject,
                onLoadedProject,
                onLoadingCompleted,
                onLoadingStarted,
                onRequestNewProject,
                onSetProjectTitle,
                vm,
                ...childProps
            } = this.props;

            return (
                <WrappedComponent
                    {...childProps}
                    onClickActividad={this.state.actividadMenu.length ?
                        this.state.actividadMenu : undefined}
                    projectTitle={this.state.projectTitle}
                    vm={vm}
                />
            );
        }
    }

    ActividadLoader.propTypes = {
        loadingState: PropTypes.oneOf(LoadingStates),
        onHasInitialProject: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onLoadingCompleted: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        onRequestNewProject: PropTypes.func,
        onSetProjectTitle: PropTypes.func,
        vm: PropTypes.any
    };

    const mapStateToProps = state => ({
        loadingState: state.scratchGui.projectState.loadingState,
        vm: state.scratchGui.vm
    });

    const mapDispatchToProps = dispatch => ({
        onLoadingStarted: () => dispatch(openLoadingProject()),
        onLoadingCompleted: () => dispatch(closeLoadingProject()),
        onSetProjectTitle: title => dispatch(setProjectTitle(title)),
        onHasInitialProject: (hasInitialProject, loadingState) => {
            if (hasInitialProject) {
                return dispatch(requestProjectUpload(loadingState));
            }
            return dispatch(setProjectId(defaultProjectId));
        },
        onLoadedProject: (loadingState, loadSuccess) => {
            // File-upload state can already be SHOWING_* if the empty-file
            // cancel ran; onLoadedProject then returns undefined.
            const action = onLoadedProject(loadingState, false, loadSuccess);
            if (action) return dispatch(action);
        },
        onRequestNewProject: () => dispatch(requestNewProject(false))
    });

    return connect(mapStateToProps, mapDispatchToProps)(ActividadLoader);
};

export default STPlaygroundActividadHOC;
