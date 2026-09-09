# Actividades de aula

Veinte proyectos de arranque, uno por consigna de los libros 5 a 8.
Cada archivo es la consigna, no el trabajo del alumno: «Guardar en tu
computadora» pide siempre una ruta nueva.

| Campo | Convención |
|---|---|
| Id | `{libro}.{numero}` → `5.1` … `8.5` |
| URL | `?actividad=5.1` |
| Archivo | `libro-05/01.sb3` |

`catalogo.json` es la fuente de títulos y del menú Actividades. Para
reemplazar un arranque, editalo en ST-Playground, guardalo y pisá el
`.sb3` correspondiente; el id y el nombre de archivo no cambian.

Verificación:

```bash
node scripts/check-actividades.mjs
```
