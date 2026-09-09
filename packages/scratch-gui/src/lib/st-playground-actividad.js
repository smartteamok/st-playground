/**
 * Classroom starter activities (D-21).
 *
 * Ids are `libro.numero` (5.1–8.5). The query string is `?actividad=5.1`.
 * This module only parses, looks up, and fetches; hosts load the buffer
 * into the VM with the same upload dance they already use for .sb3 files.
 */

const ID_PATTERN = /^[5-8]\.[1-5]$/;

const catalogEntries = catalog => {
    if (Array.isArray(catalog)) return catalog;
    if (catalog && Array.isArray(catalog.actividades)) return catalog.actividades;
    return [];
};

/**
 * @param {string} [search] location.search or a query string
 * @returns {string|null} raw actividad value, or null if absent
 */
const parseActividadId = search => {
    const raw = search || '';
    const query = raw.startsWith('?') ? raw.slice(1) : raw;
    const value = new URLSearchParams(query).get('actividad');
    if (value === null || value === '') return null;
    return value;
};

const isValidActividadId = id => typeof id === 'string' && ID_PATTERN.test(id);

const joinBase = (base, file) => {
    const prefix = (base || 'actividades').replace(/\/+$/, '');
    const rest = String(file || '').replace(/^\/+/, '');
    return `${prefix}/${rest}`;
};

const catalogUrl = (base = 'actividades') => joinBase(base, 'catalogo.json');

const actividadFileUrl = (entry, base = 'actividades') => joinBase(base, entry.archivo);

const findActividad = (catalog, id) => (
    catalogEntries(catalog).find(item => item && item.id === id) || null
);

const fetchCatalog = (base = 'actividades', fetchFn = fetch) => (
    fetchFn(catalogUrl(base)).then(response => {
        if (!response.ok) {
            throw new Error(`catalogo ${response.status}`);
        }
        return response.json();
    }).then(catalogEntries)
);

const fetchActividadBytes = (entry, base = 'actividades', fetchFn = fetch) => {
    if (!entry || !entry.archivo) {
        return Promise.reject(new Error('actividad sin archivo'));
    }
    return fetchFn(actividadFileUrl(entry, base)).then(response => {
        if (!response.ok) {
            throw new Error(`actividad ${entry.id} ${response.status}`);
        }
        return response.arrayBuffer();
    });
};

const menuTitle = entry => (
    entry && entry.titulo ? `${entry.id} · ${entry.titulo}` : String(entry && entry.id)
);

export {
    ID_PATTERN,
    actividadFileUrl,
    catalogUrl,
    fetchActividadBytes,
    fetchCatalog,
    findActividad,
    isValidActividadId,
    menuTitle,
    parseActividadId
};
