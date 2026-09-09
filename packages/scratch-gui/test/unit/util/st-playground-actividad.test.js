import {
    fetchActividadBytes,
    fetchCatalog,
    findActividad,
    isValidActividadId,
    menuTitle,
    parseActividadId
} from '../../../src/lib/st-playground-actividad.js';

const catalog = [
    {id: '5.1', libro: 5, numero: 1, titulo: 'Libro 5 · Proyecto 1', archivo: 'libro-05/01.sb3'},
    {id: '8.5', libro: 8, numero: 5, titulo: 'Libro 8 · Proyecto 5', archivo: 'libro-08/05.sb3'}
];

test('parseActividadId reads the query value', () => {
    expect(parseActividadId('?actividad=5.1')).toBe('5.1');
    expect(parseActividadId('actividad=6.3&x=1')).toBe('6.3');
});

test('parseActividadId returns null when absent', () => {
    expect(parseActividadId('')).toBe(null);
    expect(parseActividadId('?foo=1')).toBe(null);
    expect(parseActividadId('?actividad=')).toBe(null);
});

test('parseActividadId keeps unknown ids so the host can warn', () => {
    expect(parseActividadId('?actividad=9.9')).toBe('9.9');
});

test('isValidActividadId accepts 5.1–8.5', () => {
    expect(isValidActividadId('5.1')).toBe(true);
    expect(isValidActividadId('8.5')).toBe(true);
    expect(isValidActividadId('9.9')).toBe(false);
    expect(isValidActividadId('5.6')).toBe(false);
    expect(isValidActividadId('4.1')).toBe(false);
});

test('findActividad looks up by id', () => {
    expect(findActividad(catalog, '5.1').archivo).toBe('libro-05/01.sb3');
    expect(findActividad({actividades: catalog}, '8.5').id).toBe('8.5');
    expect(findActividad(catalog, '9.9')).toBe(null);
});

test('menuTitle includes id and catalog title', () => {
    expect(menuTitle(catalog[0])).toBe('5.1 · Libro 5 · Proyecto 1');
});

test('fetchCatalog and fetchActividadBytes use the actividades base', async () => {
    const fetchFn = jest.fn(url => {
        if (url === 'actividades/catalogo.json') {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({actividades: catalog})
            });
        }
        if (url === 'actividades/libro-05/01.sb3') {
            return Promise.resolve({
                ok: true,
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
            });
        }
        return Promise.resolve({ok: false, status: 404});
    });

    const loaded = await fetchCatalog('actividades', fetchFn);
    expect(loaded).toHaveLength(2);
    const bytes = await fetchActividadBytes(catalog[0], 'actividades', fetchFn);
    expect(bytes.byteLength).toBe(8);
});

test('fetchCatalog throws when the catalog is missing', async () => {
    const fetchFn = () => Promise.resolve({ok: false, status: 404});
    await expect(fetchCatalog('actividades', fetchFn)).rejects.toThrow(/catalogo 404/);
});
