#!/usr/bin/env node
/**
 * Verify the classroom starter catalog: 20 ids 5.1–8.5, each .sb3 exists
 * and is a zip that contains project.json.
 */

import fs from 'fs';
import path from 'path';
import {spawnSync} from 'child_process';
import {fileURLToPath} from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'actividades');
const catalogPath = path.join(dir, 'catalogo.json');

const expectedIds = [];
for (const libro of [5, 6, 7, 8]) {
    for (const numero of [1, 2, 3, 4, 5]) {
        expectedIds.push(`${libro}.${numero}`);
    }
}

const failures = [];
const fail = message => failures.push(message);

if (!fs.existsSync(catalogPath)) {
    fail(`falta ${path.relative(root, catalogPath)}`);
} else {
    let catalog;
    try {
        const parsed = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        catalog = Array.isArray(parsed) ? parsed : parsed.actividades;
    } catch (error) {
        fail(`catalogo.json no es JSON válido: ${error.message}`);
        catalog = null;
    }

    if (!Array.isArray(catalog)) {
        fail('catalogo.json debe ser un array o {actividades: [...]}');
    } else {
        const ids = catalog.map(item => item && item.id);
        for (const id of expectedIds) {
            if (!ids.includes(id)) fail(`falta el id ${id} en el catálogo`);
        }
        const unexpected = ids.filter(id => id && !expectedIds.includes(id));
        for (const id of unexpected) fail(`id fuera de 5.1–8.5: ${id}`);
        if (catalog.length !== 20) fail(`se esperaban 20 entradas, hay ${catalog.length}`);

        for (const item of catalog) {
            if (!item || typeof item !== 'object') {
                fail('entrada de catálogo inválida');
                continue;
            }
            for (const field of ['id', 'libro', 'numero', 'titulo', 'archivo']) {
                if (item[field] === undefined || item[field] === '') {
                    fail(`${item.id || '?'}: falta ${field}`);
                }
            }
            if (item.id && item.libro && item.numero &&
                item.id !== `${item.libro}.${item.numero}`) {
                fail(`${item.id}: no coincide con libro ${item.libro} numero ${item.numero}`);
            }
            const filePath = path.join(dir, item.archivo || '');
            if (!item.archivo || !fs.existsSync(filePath)) {
                fail(`${item.id}: no existe ${item.archivo}`);
                continue;
            }
            const zipCheck = spawnSync('python3', ['-c', `
import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
ok = 'project.json' in z.namelist()
sys.exit(0 if ok else 1)
`, filePath], {encoding: 'utf8'});
            if (zipCheck.status !== 0) {
                fail(`${item.id}: ${item.archivo} no es un .sb3 con project.json`);
            }
        }
    }
}

if (failures.length) {
    console.error(`check-actividades: ${failures.length} problema(s)`);
    for (const failure of failures) console.error(`  ${failure}`);
    process.exit(1);
}

console.log('check-actividades: ok (20 ids, .sb3 con project.json)');
