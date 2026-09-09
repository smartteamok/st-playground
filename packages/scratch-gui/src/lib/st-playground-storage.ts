import {ScratchStorage} from '@scratch/scratch-storage';

import defaultProject from './default-project';
import {GUIStorage, ProjectId, TranslatorFunction} from '../gui-config';

/** Where the media library lives, relative to the document that hosts the editor. */
const DEFAULT_LIBRARY_ASSET_BASE = 'static/library-assets';

/**
 * Storage for ST-Playground.
 *
 * Every media library asset is read from disk, so opening the sprite, costume,
 * backdrop or sound library works with no network at all. The only registered
 * store is the local one: a missing file shows an empty thumbnail instead of
 * silently falling back to a remote service, which is what
 * `scripts/fetch-library-assets.mjs --check` is there to prevent.
 *
 * Persisting projects is the host application's job (the desktop app writes
 * `.sb3` files through its own dialogs), so `saveProject` always rejects.
 *
 * Neither `backpackStorage` nor `cloudVariables` are provided, which is what
 * hides the backpack and disables cloud variables in the editor.
 */
export class STPlaygroundStorage implements GUIStorage {
    readonly scratchStorage = new ScratchStorage();

    private translator?: TranslatorFunction;

    constructor (private readonly libraryAssetBase: string = DEFAULT_LIBRARY_ASSET_BASE) {
        this.cacheDefaultProject();

        const {AssetType} = this.scratchStorage;
        this.scratchStorage.addWebStore(
            [AssetType.ImageVector, AssetType.ImageBitmap, AssetType.Sound],
            (asset): string => this.getLibraryAssetUrl(
                String(asset.assetId),
                asset.dataFormat ?? asset.assetType.runtimeFormat
            )
        );
    }

    getLibraryAssetUrl (assetId: string, dataFormat: string): string {
        const relative = `${this.libraryAssetBase}/${assetId}.${dataFormat}`;

        // `scratch-storage` fetches assets from a web worker when one is
        // available, and there a relative URL resolves against the worker
        // script instead of the document, which 404s. Hand it an absolute URL.
        if (typeof document === 'undefined') return relative;

        return new URL(relative, document.baseURI).href;
    }

    setTranslatorFunction (translator: TranslatorFunction): void {
        this.translator = translator;

        this.cacheDefaultProject();
    }

    /**
     * The editor reports the hosts of the Scratch web services as they change.
     * ST-Playground talks to none of them, so these are deliberately inert:
     * ignoring them here is what neutralizes the remote defaults in
     * `project-fetcher-hoc.jsx` without having to pass props from every mount
     * point.
     */
    setProjectHost (): void {
        // no remote project service
    }

    setProjectToken (): void {
        // no remote project service
    }

    setProjectMetadata (): void {
        // no request metadata to attach
    }

    setAssetHost (): void {
        // assets come from disk, see `libraryAssetBase`
    }

    saveProject (): Promise<{id: ProjectId}> {
        return Promise.reject(new Error(
            'ST-Playground no guarda proyectos en un servidor: se guardan como archivos .sb3'
        ));
    }

    private cacheDefaultProject () {
        const storage = this.scratchStorage;

        for (const asset of defaultProject(this.translator)) {
            storage.builtinHelper._store(
                storage.AssetType[asset.assetType],
                storage.DataFormat[asset.dataFormat],
                asset.data,
                asset.id
            );
        }
    }
}
