# Plan de implementación: fork de Scratch para escuelas

Este documento es la guía de trabajo del fork. Cada fase tiene objetivo,
prerrequisitos, tareas con archivos concretos, comandos y criterios de
aceptación. Una fase no se da por cerrada hasta que todos sus criterios se
cumplen y el trabajo está commiteado en `main`.

Las decisiones de arquitectura que sustentan este plan están en
[`DECISIONES.md`](./DECISIONES.md). Las referencias `D-xx` apuntan ahí.

Versiones verificadas al escribir este plan (2026-09-09):

| Componente | Versión | Nota |
|---|---|---|
| `scratchfoundation/scratch-editor` | v15.1.1 | AGPL-3.0-only, monorepo de 8 workspaces |
| Node | 24.20.0 | según `.nvmrc` de upstream |
| npm | 10.9.x | |
| `scratch-blocks` | 2.1.19 | dependencia npm precompilada, no está en el monorepo |
| `scratchfoundation/scratch-desktop` | 3.32.0 | Electron 42; pinea `@scratch/scratch-gui@13.7.4-svg` |

Placeholder `<marca>`: nombre del producto, pendiente en D-08.

---

## Mapa de fases

```
Fase 0  Decisiones y toolchain           sin código
Fase 1  Traer upstream y build verde     este repo pasa a ser el fork
Fase 2  Rebranding y limpieza            packages/scratch-gui
Fase 3  Assets propios y self-hosting    packages/scratch-gui + scripts
Fase 4  Desktop offline                  packages/<marca>-desktop      <- producto entregable
------- validar en aula -------
Fase 5  Web + LTI 1.3 + guardado         packages/<marca>-web          <- solo si hace falta
```

Las fases 0 a 4 producen algo instalable en una escuela sin red. La fase 5
introduce el único backend del proyecto y se decide después de validar.

---

## Fase 0. Decisiones y toolchain

### Objetivo

Cerrar las decisiones que bloquean la fase 2 y dejar el entorno de desarrollo
alineado con upstream.

### Tareas

1. Cerrar D-08 (nombre), D-09 (scope npm) y D-10 (URL del logo) en
   `DECISIONES.md`.
2. Reemplazar el placeholder `<marca>` en este plan.
3. Instalar la toolchain:

```bash
nvm install 24.20.0
nvm use 24.20.0
npm install -g npm@10.9.9
node --version   # v24.20.0
```

4. Agregar `.nvmrc` con `24.20.0` en la raíz. Upstream lo trae; al mergear en
   la fase 1 va a coincidir.

### Criterios de aceptación

- [ ] D-08, D-09 y D-10 en estado `decidida`.
- [ ] `<marca>` no aparece más en este archivo.
- [ ] `node --version` devuelve `v24.20.0`.

---

## Fase 1. Traer upstream y build verde

### Objetivo

Convertir este repo en el fork del monorepo (D-02) y confirmar que compila y
corre sin ninguna modificación. No se toca ningún archivo de upstream en esta
fase.

### Prerrequisitos

Fase 0 completa.

### Tareas

1. Agregar upstream y traer la historia:

```bash
git remote add upstream https://github.com/scratchfoundation/scratch-editor.git
git fetch upstream --tags
git merge --allow-unrelated-histories v15.1.1
```

   Conflicto esperado: `README.md`. Resolver conservando ambos contenidos: la
   sección del fork arriba, el README de upstream debajo bajo un título
   "Upstream: scratch-editor". `PLAN_IMPLEMENTACION.md` y `DECISIONES.md` no
   existen en upstream, no conflictúan.

2. Instalar y levantar:

```bash
npm ci
npm start                      # webpack serve, http://localhost:8601
```

   `npm start` delega en `npm --workspace @scratch/scratch-gui start`. La
   primera instalación es larga; anotar el tiempo en el commit de cierre de
   fase para dimensionar CI.

3. Build de distribución y tests unitarios de la GUI:

```bash
cd packages/scratch-gui
npm run test:unit
npm run build:dist              # dist/scratch-gui.js + dist/types/
cd ../..
```

   No correr `test:playwright` ni `test:integration` en esta fase: son lentos
   y todavía no validan nada propio.

4. Registrar en `README.md` los comandos de arranque y la política de merge de
   upstream (ver sección "Mantenimiento" al final).

### Archivos tocados

- `README.md` (resolución de conflicto)
- Nada dentro de `packages/`

### Criterios de aceptación

- [ ] `git log --oneline | grep -c .` muestra la historia de upstream y
      `git remote -v` lista `upstream`.
- [ ] `http://localhost:8601` abre el editor y carga el proyecto por defecto
      (el gato; en esta fase todavía es el de upstream).
- [ ] `packages/scratch-gui/dist/scratch-gui.js` y
      `packages/scratch-gui/dist/types/index.d.ts` existen.
- [ ] `npm run test:unit` en `packages/scratch-gui` pasa.
- [ ] `git diff v15.1.1 --stat -- packages/` está vacío.

### Riesgos

- `prepare` corre `husky install` en la raíz y `scripts/prepare.mjs` en la
  GUI. Si `npm ci` falla, mirar ahí primero.
- El build de webpack de la GUI consume mucha memoria. Si falla con
  `heap out of memory`, exportar `NODE_OPTIONS=--max-old-space-size=8192`.

---

## Fase 2. Rebranding y limpieza de comunidad

### Objetivo

Que ninguna pantalla del flujo principal muestre la marca "Scratch" ni el
Scratch Cat, que no haya funciones de comunidad/cuenta visibles, y que no
salga telemetría ni analytics. Todo dentro de `packages/scratch-gui/` y
respetando D-05 (mínima fricción con upstream).

### Prerrequisitos

Fase 1 completa. D-08, D-09 y D-10 decididas. Logo en SVG (versión normal y
compacta) e ícono en PNG 512x512 disponibles en `brand/` (carpeta nueva en la
raíz, fuera de `packages/`).

### Tareas

Ordenadas por la regla D-05: primero assets, luego props, al final JSX.

#### 2.1 Reemplazo de assets con el mismo nombre

| Archivo en `packages/scratch-gui/` | Qué es | Acción |
|---|---|---|
| `src/components/menu-bar/scratch-logo.svg` | Logo de la barra de menú | Reemplazar por el propio |
| `src/components/menu-bar/scratch-logo-android.svg` | Variante compacta | Reemplazar por el propio |
| `src/components/menu-bar/nineties_logo.svg`, `cat_logo.svg`, `oldtimey-logo.svg`, `prehistoric-logo.svg` | Logos del easter egg "viaje en el tiempo" (`menu-bar.jsx` líneas 228-238) | Reemplazar por variantes propias, o copiar el logo principal en los cuatro |
| `static/favicon.ico` | Favicon del playground | Reemplazar |
| `src/lib/default-project/*.svg`, `*.wav` | Disfraces y sonidos del gato en el proyecto por defecto | Reemplazar por sprite propio; ajustar `src/lib/default-project/index.js` (nombres, md5, `rotationCenterX/Y`) |

#### 2.2 Configuración por props en el punto de montaje

El punto de montaje de desarrollo es `src/playground/render-gui.jsx`. Ahí se
cambia:

- `onClickLogo`: hoy navega a `https://scratch.mit.edu`. Apuntar a D-10 o
  eliminar el handler (sin handler, el logo no es clickeable).
- Quitar `showComingSoon` y `backpackVisible`.
- Agregar `canShare={false}`, `enableCommunity={false}`, sin
  `accountMenuOptions`.
- `showTelemetryModal` no debe pasarse nunca.

Desktop (fase 4) y web (fase 5) tienen su propio punto de montaje y repiten
esta configuración.

#### 2.3 Textos

- `src/playground/index.ejs`: `<title>`.
- `webpack.config.js`: los cinco `title: 'Scratch 3.0 GUI...'` de
  `HtmlWebpackPlugin`.
- Auditar strings visibles:

```bash
grep -n -i '"scratch' packages/scratch-gui/translations/en.json
```

  Las que aparezcan en el flujo principal se pisan en el punto de montaje
  pasando `messages` a `AppStateHOC`/`LocalizationHOC` (react-intl hace merge
  de mensajes), no editando `scratch-l10n`. Las que solo aparecen en
  tutoriales o en extensiones de hardware pueden quedar.

#### 2.4 Telemetría y analytics (D-07)

- `webpack.config.js`: `DefinePlugin` inyecta `GA_ID` con default
  `'UA-000000-01'` y `GTM_ID`. Fijar ambos a cadena vacía y `null`.
- `src/lib/analytics.js`: neutralizar la inicialización de `react-ga`.
- `src/playground/index.ejs`: quitar el snippet de Google Tag Manager
  condicionado por `gtm_id`.
- Confirmar que el modal de telemetría no se muestra (prop
  `showTelemetryModal` ausente).

#### 2.5 Único cambio de JSX aceptado

- `src/components/menu-bar/menu-bar.jsx`, `<img id="logo_img" alt="Scratch">`
  (alrededor de la línea 337): cambiar el `alt` al nombre del producto.

Cualquier otro cambio de JSX necesita justificación en el mensaje de commit.

#### 2.6 Imágenes del gato fuera de la barra de menú

Revisar y decidir por cada una:

- `src/components/loader/`: animación de carga.
- `src/lib/libraries/decks/`: tarjetas de tutoriales (muchas capturas con el
  gato). Opción barata: deshabilitar la biblioteca de tutoriales desde props
  hasta rehacerlas.
- `src/components/gui/`, `src/components/stage-header/`: íconos varios.

```bash
grep -ril 'cat' packages/scratch-gui/src/components --include=*.svg --include=*.png -l
```

### Archivos tocados

- Assets listados en 2.1
- `src/playground/render-gui.jsx`, `src/playground/index.ejs`
- `webpack.config.js`
- `src/lib/analytics.js`
- `src/lib/default-project/index.js`
- `src/components/menu-bar/menu-bar.jsx` (una línea)
- `brand/` (nuevo, raíz)

### Criterios de aceptación

- [ ] Checklist con captura de pantalla de: barra de menú, proyecto nuevo,
      pantalla de carga, pestaña Disfraces, pestaña Sonidos, biblioteca de
      extensiones. Sin la palabra "Scratch" ni el gato en ninguna.
- [ ] Con la pestaña Network abierta durante dos minutos de uso, cero
      requests a `google-analytics.com`, `googletagmanager.com` ni
      `*.scratch.mit.edu` salvo los assets de biblioteca (esos se resuelven
      en la fase 3).
- [ ] `git diff v15.1.1 --stat -- packages/scratch-gui` muestra cambios
      concentrados en assets, `render-gui.jsx`, `index.ejs`,
      `webpack.config.js`, `analytics.js`, `default-project/` y una línea de
      `menu-bar.jsx`.
- [ ] `npm run test:unit` sigue pasando.

---

## Fase 3. Assets propios y self-hosting de la biblioteca

### Objetivo

Que la biblioteca de sprites, fondos y sonidos funcione sin acceso a
`assets.scratch.mit.edu`, y que no contenga personajes de marca de Scratch.
Esta fase alimenta directamente el `static/fetched` del desktop, por eso va
antes de la fase 4.

### Prerrequisitos

Fase 2 completa.

### Tareas

#### 3.1 Depurar la biblioteca

Archivos: `packages/scratch-gui/src/lib/libraries/sprites.json`,
`costumes.json`, `backdrops.json`, `sounds.json`.

Quitar entradas de personajes propios de Scratch (marca): Cat, Cat 2,
Cat Flying, Gobo, Pico, Nano, Tera, Giga y sus disfraces. El resto de la
biblioteca está bajo CC BY-SA 2.0; conservar y atribuir.

Si se agregan sprites propios, `packages/scratch-media-lib-scripts` regenera
los JSON a partir de una carpeta de assets (ver su `README.md`).

#### 3.2 Descarga de assets

Crear `scripts/fetch-library-assets.mjs` (raíz del repo). Derivado de
`scratch-desktop/scripts/fetchMediaLibraryAssets.js`: recorre los cuatro JSON,
junta los `md5ext` únicos (incluyendo disfraces y sonidos anidados en
`sprites.json`) y descarga cada uno desde
`https://assets.scratch.mit.edu/internalapi/asset/<md5ext>/get/` a
`static-assets/library/<md5ext>`.

`static-assets/` se ignora en git (son ~300 MB) y se genera en build.

#### 3.3 Resolución de assets desde la GUI

Crear `packages/scratch-gui/src/lib/<marca>-storage.js` con una
implementación de `GUIStorage` (interfaz en `src/gui-config.ts`):

- `scratchStorage`: instancia de `ScratchStorage` con un `WebStore` apuntando
  al host propio (web) o al helper de disco (desktop, fase 4).
- `getLibraryAssetUrl(assetId, dataFormat)`: devuelve la URL local.
- `setAssetHost(host)`: guarda el host.
- `saveProject()`: en esta fase, rechaza con un error claro (no hay backend).

Este archivo es nuevo (regla D-05, punto 3). El punto de montaje lo pasa por
`AppStateHOC` como `config.storage`.

#### 3.4 Créditos

Crear `CREDITS.md` en la raíz con la atribución CC BY-SA 2.0 de la biblioteca
de medios de Scratch y las licencias de assets propios.

### Archivos tocados

- `packages/scratch-gui/src/lib/libraries/*.json`
- `packages/scratch-gui/src/lib/<marca>-storage.js` (nuevo)
- `packages/scratch-gui/src/playground/render-gui.jsx` (pasa el storage)
- `scripts/fetch-library-assets.mjs` (nuevo)
- `CREDITS.md` (nuevo)
- `.gitignore` (`static-assets/`)

### Criterios de aceptación

- [ ] Con `assets.scratch.mit.edu` y `cdn.assets.scratch.mit.edu`
      redirigidos a `127.0.0.1` en `/etc/hosts`, la biblioteca de sprites,
      fondos y sonidos abre, muestra miniaturas, y los sonidos se reproducen.
- [ ] Ninguna entrada de la biblioteca contiene los personajes listados en
      3.1.
- [ ] `node scripts/fetch-library-assets.mjs` termina sin errores y el conteo
      de archivos en `static-assets/library/` coincide con el conteo de
      `md5ext` únicos en los JSON.
- [ ] `CREDITS.md` existe y se enlaza desde el "Acerca de".

---

## Fase 4. Desktop offline

### Objetivo

Un instalador que funcione en una computadora sin red: abre, crea, guarda y
reabre `.sb3`, con la biblioteca completa embebida. Es el primer producto
entregable.

### Prerrequisitos

Fase 3 completa. D-11 decidida.

### Tarea 4.0: spike de medio día

Antes de escribir nada, decidir entre dos rutas:

- Ruta A: forkear `scratch-desktop` y migrarlo de `@scratch/scratch-gui@13.7.4-svg`
  a la GUI 15.x del workspace.
- Ruta B: shell Electron propio mínimo en `packages/<marca>-desktop`,
  copiando de `scratch-desktop` solo las piezas necesarias.

Procedimiento: clonar `scratch-desktop` en `/tmp`, apuntar su dependencia a
`file:../../packages/scratch-gui` y correr `npm run compile`. Si en medio día
no compila y corre, se elige la ruta B. La expectativa es que sea B, porque
entre 13.x y 15.x cambió cómo se inyecta la configuración (`AppStateHOC` +
`GUIConfig`) y `scratch-desktop` todavía usa `electron.remote`.

El resto de esta fase asume ruta B.

### Tareas

#### 4.1 Workspace nuevo

Agregar `packages/<marca>-desktop` al array `workspaces` de `package.json`
raíz (D-03). Estructura:

```
packages/<marca>-desktop/
  package.json            productName, appId, electron, electron-builder
  webpack.main.js
  webpack.renderer.js
  src/main/index.js       ventana, menú nativo, diálogos, asociación .sb3
  src/main/menu.js
  src/preload.js          contextBridge para IPC (sin electron.remote)
  src/renderer/index.jsx  monta la GUI
  src/renderer/DesktopGUIHOC.jsx
  src/common/DiskStorageHelper.js
  buildResources/         icon.ico, icon.icns, icon.png
  static/                 index.html
```

Referencias en `scratch-desktop` para cada pieza: `src/main/index.js`,
`src/renderer/ScratchDesktopGUIHOC.jsx`, `src/common/ElectronStorageHelper.js`,
`webpack.renderer.js`, `scripts/electron-builder-wrapper.js`.

#### 4.2 Renderer

`DesktopGUIHOC.jsx` monta la GUI con:

- `canSave={false}`, `canEditTitle`, `platform="DESKTOP"`.
- `onStorageInit`: agrega `DiskStorageHelper` a `scratchStorage`. El helper
  lee de `static/fetched/<md5ext>` (relativo al `resourcesPath` de la app
  empaquetada).
- La misma configuración de props de la fase 2 (sin comunidad, sin cuenta,
  sin telemetría).
- `onClickAbout`: abre una ventana "Acerca de" con nombre, versión,
  licencia AGPL, enlace a este repo y `CREDITS.md`.

#### 4.3 Main

- Menú nativo: Archivo (Nuevo, Abrir, Guardar, Guardar como, Salir), Edición,
  Ayuda (Acerca de).
- IPC `save-project`: recibe el `.sb3` como buffer, muestra `dialog.showSaveDialog`
  con filtro `*.sb3`, escribe, y devuelve el título para actualizar la
  ventana.
- IPC `get-initial-project-data`: si la app se abrió por doble clic sobre un
  `.sb3` (`process.argv` en Windows, `open-file` en macOS), devuelve el
  contenido.
- Sin auto-update, sin telemetría, sin ventana de privacidad.

#### 4.4 Assets embebidos

Script `fetch` en el `package.json` del desktop que invoca
`scripts/fetch-library-assets.mjs` (fase 3) y copia el resultado a
`static/fetched/`. `electron-builder` lo incluye en `extraResources`.

#### 4.5 Instaladores

`electron-builder` en el `package.json` del desktop:

- Windows: `nsis`, `oneClick: false`, `perMachine: true`, `allowElevation: true`.
  Debe soportar `instalador.exe /S` para instalación silenciosa en imagen de
  disco.
- Linux (si D-11 lo pide): `AppImage`.
- `fileAssociations`: `.sb3`.
- Sin firma (D-12).

Scripts:

```bash
npm run --workspace @<scope>/<marca>-desktop start        # dev con hot reload
npm run --workspace @<scope>/<marca>-desktop dist         # fetch + compile + instalador
```

#### 4.6 Documentación para la escuela

Crear `docs/instalacion-escuela.md`:

- Instalación silenciosa y ubicación del ejecutable.
- Recomendación de carpeta por alumno o pendrive para los `.sb3`.
- Advertencia de SmartScreen y cómo evitarla (instalación por el admin).

Crear `docs/guia-docente.md`:

- Cómo crear una "Tarea" en Moodle con entrega de archivo `.sb3`.
- Cómo adjuntar un `.sb3` de arranque como recurso de la actividad.
- Cómo abrir un `.sb3` entregado para corregirlo.

### Archivos tocados

- `package.json` raíz (`workspaces`)
- `packages/<marca>-desktop/**` (nuevo)
- `docs/instalacion-escuela.md`, `docs/guia-docente.md` (nuevos)

### Criterios de aceptación

Todos en una VM Windows con el adaptador de red deshabilitado:

- [ ] El instalador corre en modo interactivo y en modo silencioso (`/S`).
- [ ] La app abre, crea un proyecto, guarda `.sb3` con "Guardar como",
      cierra, reabre el archivo por doble clic y el proyecto está intacto.
- [ ] La biblioteca de sprites, fondos y sonidos abre con miniaturas y los
      sonidos se reproducen.
- [ ] El paint editor y el editor de sonidos funcionan.
- [ ] Ninguna conexión saliente durante la sesión (verificar con Wireshark o
      con el adaptador deshabilitado y sin errores en consola).
- [ ] "Acerca de" muestra nombre, versión, AGPL y enlace al repo.
- [ ] `docs/instalacion-escuela.md` y `docs/guia-docente.md` revisados por
      un docente.

### Punto de validación

Con la fase 4 cerrada, instalar en un aula real y usar durante al menos un
ciclo de actividad completo (crear, guardar, entregar por Moodle, corregir).
Recién con ese resultado se decide si la fase 5 se hace.

---

## Fase 5. Web + LTI 1.3 + guardado en servidor

### Objetivo

Editor web embebido en Moodle como Herramienta externa LTI 1.3, con autosave
por alumno y listado de proyectos para el docente. Único backend del
proyecto.

### Prerrequisitos

Fase 4 validada en aula y la validación indica que "Tarea + archivo" no
alcanza. Un Moodle de pruebas (4.x) con permisos de administrador.

### Tareas

#### 5.1 Workspace `packages/<marca>-web`

Servidor Node con:

- `ltijs` para OIDC login, validación de JWT, JWKS, registro dinámico.
- Base de datos: SQLite para pruebas, Postgres para producción. Tablas:
  `platforms` (de ltijs), `projects` (`id`, `lti_sub`, `context_id`,
  `title`, `updated_at`), `assets` (`md5ext`, `bytes`).
- Endpoints:
  - `POST /lti/launch`: recibe el launch, crea sesión, redirige al editor con
    un token de sesión corto.
  - `GET/PUT /api/projects/:id`: `project.json`.
  - `GET/POST /api/assets/:md5ext`: assets de proyecto.
  - `GET /api/library/:md5ext`: sirve `static-assets/library/` (fase 3).
  - `GET /api/context/:contextId/projects`: listado para el docente (verifica
    rol vía claims del launch).
- Sirve el bundle de la GUI (`packages/scratch-gui/dist/`).

#### 5.2 Storage web

Completar `<marca>-storage.js` (fase 3): `saveProject()` hace `PUT` al
backend, `setProjectHost`/`setProjectToken` reciben host y token de sesión.
`ProjectSaverHOC` de la GUI ya dispara el autosave; el punto de montaje web
pasa `canSave`, `projectHost`, `projectToken` y `projectId`.

#### 5.3 Moodle

- Registro de la herramienta con URL de registro dinámico.
- Deep Linking: el docente elige "actividad con proyecto de arranque X" desde
  el selector de contenido.
- NRPS: roster del curso para el listado del docente.
- AGS (opcional): devolver "entregado" al libro de calificaciones.

#### 5.4 Privacidad

Se guarda únicamente el `sub` opaco del token LTI y el `context_id`. Ningún
nombre, correo ni dato personal sale de Moodle. Documentarlo en
`docs/privacidad.md`.

### Archivos tocados

- `package.json` raíz (`workspaces`)
- `packages/<marca>-web/**` (nuevo)
- `packages/scratch-gui/src/lib/<marca>-storage.js`
- `docs/privacidad.md`, `docs/moodle-lti.md` (nuevos)

### Criterios de aceptación

- [ ] Un alumno hace clic en la actividad de Moodle, llega al editor sin
      pantalla de login, edita, cierra la pestaña, vuelve y encuentra su
      proyecto con los últimos cambios.
- [ ] El docente, desde la misma actividad, ve la lista de proyectos del
      curso con título, alumno (según roster NRPS) y fecha.
- [ ] Deep Linking permite elegir un proyecto de arranque al crear la
      actividad.
- [ ] La base de datos no contiene nombres ni correos.
- [ ] Un launch con JWT inválido o expirado devuelve 401 sin exponer detalle.

---

## Mantenimiento: seguir a upstream

Cadencia: una vez por release estable de `scratch-editor` (tags `vX.Y.Z` sin
sufijo).

```bash
git fetch upstream --tags
git merge vX.Y.Z
npm ci
npm run test:unit --workspace @scratch/scratch-gui
```

Conflictos esperados y cómo resolverlos:

| Archivo | Causa | Resolución |
|---|---|---|
| `package.json` raíz | `workspaces` propios (D-03) | Conservar ambas listas |
| `README.md` | Sección del fork arriba | Conservar la sección del fork, tomar el resto de upstream |
| `packages/scratch-gui/webpack.config.js` | Títulos y `GA_ID` | Retomar los cambios de la fase 2 |
| `packages/scratch-gui/src/playground/render-gui.jsx` | Props del montaje | Retomar los cambios de la fase 2 |
| Assets reemplazados | Upstream cambia un SVG | Conservar el propio |

Si un merge trae un conflicto en JSX que no está en esta tabla, es señal de
que se violó D-05 en alguna fase; anotarlo en `DECISIONES.md`.

## Qué queda explícitamente afuera

- Cuentas propias, registro o login: la identidad la da Moodle (fase 5) o no
  existe (fase 4).
- Sincronización offline/online, colas de reintento, PWA.
- Extensiones personalizadas del VM (D-04). Si hace falta, se abre una
  decisión nueva.
- Auto-update del desktop.
- Firma de código (D-12) hasta que la distribución lo exija.
