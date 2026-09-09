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

Nombre del producto: **ST-Playground** (D-08). Scope de los workspaces
propios: `@st-playground` (D-09).

---

## Mapa de fases

```
Fase 0  Decisiones y toolchain      sin código                       completa
Fase 1  Upstream y build verde      el repo pasa a ser el fork       completa
Fase 2  Rebranding y limpieza       packages/scratch-gui             siguiente
Fase 3  Assets propios y self-host  packages/scratch-gui + scripts
Fase 4  Desktop offline             packages/st-playground-desktop   entregable
------- validar en aula -------
Fase 5  Web + LTI 1.3 + guardado    packages/st-playground-web       condicional
```

Las fases 0 a 4 producen algo instalable en una escuela sin red. La fase 5
introduce el único backend del proyecto y se decide después de validar.

---

## Fase 0. Decisiones y toolchain

### Objetivo

Cerrar las decisiones que bloquean la fase 2 y dejar el entorno de desarrollo
alineado con upstream.

### Tareas

1. Cerrar D-08 (nombre), D-09 (scope npm) y D-10 (destino del clic en el
   logo) en `DECISIONES.md`.
2. Reemplazar el placeholder de marca en este plan.
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

- [x] D-08, D-09 y D-10 en estado `decidida`.
- [x] El placeholder de marca no aparece más en este archivo.
- [x] `node --version` devuelve `v24.20.0`.

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
for p in task-herder scratch-storage scratch-svg-renderer scratch-paint scratch-render scratch-vm; do
  NODE_ENV=production npm run build --workspace=packages/$p
done
npm start                      # webpack serve, http://localhost:8601
```

   `npm start` delega en `npm --workspace @scratch/scratch-gui start`. Los
   paquetes del workspace se resuelven por symlink y la GUI importa sus
   `dist/`, por eso hay que compilarlos antes del primer arranque; sin ese
   paso webpack falla con `Can't resolve '@scratch/scratch-storage'`.
   Anotar los tiempos en el README para dimensionar CI.

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

- [x] `git log --oneline | grep -c .` muestra la historia de upstream y
      `git remote -v` lista `upstream`.
- [x] `http://localhost:8601` abre el editor y carga el proyecto por defecto
      (el gato; en esta fase todavía es el de upstream).
- [x] `packages/scratch-gui/dist/scratch-gui.js` y
      `packages/scratch-gui/dist/types/index.d.ts` existen.
- [x] `npm run test:unit` en `packages/scratch-gui` pasa (50 suites, 328 tests).
- [x] `git diff v15.1.1 --stat -- packages/` está vacío.

### Riesgos

- `prepare` corre `husky install` en la raíz y `scripts/prepare.mjs` en la
  GUI. Si `npm ci` falla, mirar ahí primero.
- El build de webpack de la GUI consume mucha memoria. Si falla con
  `heap out of memory`, exportar `NODE_OPTIONS=--max-old-space-size=8192`.
- Upstream instala husky + commitlint: desde el merge, todos los commits
  deben seguir Conventional Commits (`chore:`, `feat:`, `docs:`...).
- Upstream trae `.github/workflows/` con semantic-release y publicación a
  npm. En este forge no corren; si el repo se mueve a GitHub hay que
  deshabilitarlos. Se registra como decisión nueva en la fase 2.

---

## Fase 2. Rebranding y limpieza de comunidad

### Objetivo

Que ninguna pantalla del flujo principal muestre la marca "Scratch" ni el
Scratch Cat, que no haya funciones de comunidad/cuenta visibles, y que no
salga telemetría ni analytics. Todo dentro de `packages/scratch-gui/` y
respetando D-05 (mínima fricción con upstream).

### Prerrequisitos

Fase 1 completa. Decisiones D-08 (`ST-Playground`), D-09
(`@st-playground`), D-10 (logo no clickeable), D-13 (tutoriales fuera) y
D-14 (i18n por alias) cerradas.

### Inventario verificado

Auditoría hecha sobre el árbol ya mergeado. Los números y líneas son reales,
no estimaciones.

| Qué | Dónde | Cantidad |
|---|---|---|
| SVG de logo y gato | `src/components/menu-bar/` | 7 archivos |
| Assets del proyecto por defecto | `src/lib/default-project/` | 2 SVG de disfraz, 2 WAV, 1 SVG de fondo |
| Archivos de tutoriales | `src/lib/libraries/decks/` | 1497 (30 mazos, 29 miniaturas, 1452 pasos) |
| Mensajes i18n con "Scratch" | `scratch-l10n` vía `reducers/locales.js` | 12 claves |
| `alt="Scratch"` en JSX | `menu-bar.jsx:337`, `stage-header.jsx:220` | 2 |
| URLs `scratch.mit.edu` en `src/` | ver 2.6 | 14 |
| Importadores de `analytics.js` | ver 2.5 | 6 archivos |
| Títulos HTML con "Scratch" | `webpack.config.js:188,195,202,209,216` | 5 |

Hallazgo relevante: `translations/en.json` no está en el repo, se genera con
`npm run i18n:src`. Por eso los textos se pisan por alias (D-14) y no
editando ese archivo.

### Tareas

Ordenadas por la regla D-05: primero assets nuevos, luego reemplazo de
assets, luego configuración, y al final los tres cambios de JSX justificados.

#### 2.1 Crear los assets de marca

Carpeta nueva `brand/` en la raíz, fuera de `packages/`, como fuente de
verdad. Desde ahí se copia a los destinos de la GUI y, en la fase 4, a los
`buildResources/` del instalador.

```
brand/
  st-playground-logo.svg          wordmark horizontal, ~110x40, para la barra de menú
  st-playground-logo-compact.svg  variante corta para pantallas angostas
  st-playground-icon.svg          isotipo cuadrado
  st-playground-icon-512.png      derivado del isotipo, para instaladores y favicon
  sprite-default-a.svg            disfraz 1 del sprite por defecto
  sprite-default-b.svg            disfraz 2 (variante para animación)
  README.md                       qué es cada archivo y cómo regenerar los derivados
```

El logo se crea como SVG escrito a mano (wordmark tipográfico), no como
imagen rasterizada. Es reemplazable después sin tocar código: alcanza con
sobrescribir el archivo en `brand/` y volver a copiar.

El sprite por defecto reemplaza al gato. Tiene que ser reconocible a 96 px,
con dos disfraces para que el bloque "siguiente disfraz" siga teniendo
sentido en las primeras clases.

#### 2.2 Reemplazo de assets con el mismo nombre

Se conservan los nombres de archivo de upstream para que un merge futuro no
genere conflicto: si upstream cambia su logo, el nuestro gana sin
intervención.

| Archivo en `packages/scratch-gui/` | Origen en `brand/` |
|---|---|
| `src/components/menu-bar/scratch-logo.svg` | `st-playground-logo.svg` |
| `src/components/menu-bar/scratch-logo-android.svg` | `st-playground-logo-compact.svg` |
| `src/components/menu-bar/cat_logo.svg` | `st-playground-logo.svg` |
| `src/components/menu-bar/nineties_logo.svg` | `st-playground-logo.svg` |
| `src/components/menu-bar/oldtimey-logo.svg` | `st-playground-logo.svg` |
| `src/components/menu-bar/prehistoric-logo.svg` | `st-playground-logo.svg` |
| `src/components/menu-bar/cat-ears.svg` | isotipo sin orejas de gato (fondo del badge de avatar, `user-avatar.css:21`) |
| `static/favicon.ico` | derivado de `st-playground-icon-512.png` |

Los cuatro logos alternativos son del easter egg de "viaje en el tiempo"
(`menu-bar.jsx:228-238`, que pisa `#logo_img` por `getElementById`). Copiando
el logo propio en los cuatro, el easter egg deja de mostrar marca ajena sin
tocar esa lógica.

#### 2.3 Proyecto por defecto

Archivos: `src/lib/default-project/`. El sprite se llama `Sprite1` por
i18n (`shared-messages.ts`), así que no hace falta tocar el nombre.

Los assets son de contenido direccionable: el nombre del archivo es el MD5
del contenido y aparece en tres lugares que tienen que coincidir.

1. Calcular el MD5 de cada SVG nuevo (`md5sum`).
2. Renombrar los archivos a `<md5>.svg`.
3. `index.ts`: cambiar los `id` de los dos assets `ImageVector` de disfraz
   (hoy `bcf454acf82e4504149f7ffe07081dbc` y
   `0fb9be3e8397c983338cb71dc84d0b25`) y sus `import`.
4. `project-data.ts`: cambiar `assetId`, `md5ext`, `rotationCenterX/Y` y el
   `name` de cada disfraz.

El sonido "Meow" (`83c36d806dc92327b9e7049a565c6bff.wav`) se reemplaza por
un sonido neutro con el mismo procedimiento, o se quita del sprite dejando
solo el "pop" del escenario.

El watermark del escenario (`containers/watermark.jsx`) muestra el disfraz
del sprite activo, así que se corrige solo al cambiar esto.

#### 2.4 Textos de marca por alias de i18n (D-14)

Archivo nuevo `src/lib/st-playground-messages.js`: importa
`scratch-l10n/locales/editor-msgs` y devuelve una copia con las claves de
marca pisadas en todos los idiomas.

Claves a pisar (las 12 que contienen "Scratch"), en orden de visibilidad:

| Clave | Valor actual | Prioridad |
|---|---|---|
| `gui.gui.defaultProjectTitle` | "Scratch Project" | alta: se ve en el campo de título |
| `gui.menuBar.joinScratch` | "Join Scratch" | media: desaparece con 2.5 |
| `gui.alerts.lostPeripheralConnection` | "Scratch lost connection to..." | media: extensiones de hardware |
| `gui.crashMessage.description` | "...Scratch has crashed... Scratch Team" | baja pero visible si algo falla |
| `gui.webglModal.description` | "...needed for Scratch 3.0 to run." | baja |
| `gui.unsupportedBrowser.*` (2) | "...Scratch does not support..." | baja |
| `gui.connection.unavailable.installscratchlink` | "...Scratch Link..." | baja: dejar, es el nombre real del producto de Scratch que hay que instalar |
| `gui.telemetryOptIn.*` (4) | varias | ninguna: el modal no se muestra (2.5) |

En `webpack.config.js`, agregar al `baseConfig`:

```js
resolve: {
    alias: {
        'scratch-l10n/locales/editor-msgs':
            path.resolve(__dirname, 'src/lib/st-playground-messages.js')
    }
}
```

El alias tiene que cubrir también los tests: `jest.moduleNameMapper` ya tiene
una entrada `editor-msgs` que apunta a un mock, así que los tests no se ven
afectados.

Además, textos que no pasan por i18n:

- `src/playground/index.ejs`: `<title>` viene de webpack.
- `webpack.config.js` líneas 188, 195, 202, 209, 216: los cinco títulos
  `'Scratch 3.0 GUI...'` pasan a `ST-Playground`.

#### 2.5 Comunidad, cuenta y telemetría por configuración

El punto de montaje de desarrollo es `src/playground/render-gui.jsx`. Queda
así (sacando `onClickLogo`, `showComingSoon` y `backpackVisible`):

```jsx
<WrappedGui
    canEditTitle
    canSave={false}
    canShare={false}
    canRemix={false}
    enableCommunity={false}
    backpackVisible={false}
/>
```

Efecto por prop, con las líneas de `menu-bar.jsx` donde se decide:

| Prop | Qué apaga | Línea |
|---|---|---|
| sin `showComingSoon` | "Compartir" y "Ver página del proyecto" deshabilitados, el falso usuario `scratch-cat` y el menú de cuenta simulado | 426-430, 452-456, 583-624 |
| `enableCommunity={false}` | botón "Ver página del proyecto" | 435-456 |
| `canShare={false}` | botón "Compartir" | 404-431 |
| `canRemix={false}` | "Remix" en el menú Archivo y el botón inline | 357, 362, 432 |
| sin `accountMenuOptions` | "Únete", "Iniciar sesión", "Mis cosas", avatar | 500-626 |
| `backpackVisible={false}` | mochila (ya es el default en `gui.jsx:674`) | `gui.jsx:526-531` |
| sin `showTelemetryModal` | modal de telemetría | `editor-state.tsx:97` |

Telemetría y analytics (D-07):

- `src/playground/index.ejs` líneas 4-12 y 21-24: quitar el snippet de Google
  Tag Manager y el `noscript` con el iframe.
- `webpack.config.js` líneas 12-22 y 75-79: quitar `gtm_id`, `gtm_env_auth`,
  y las definiciones `GA_ID`, `GTM_ID`, `GTM_ENV_AUTH` del `DefinePlugin`.
  `GA_ID` ya no se usa en `src/`.
- `src/lib/analytics.js`: el objeto `GA4` empuja eventos a
  `window.dataLayer`. Sin el snippet de GTM eso es inerte, pero se convierte
  en no-op explícito para que no reviva si alguien agrega GTM. Los 6
  importadores (`reducers/cards.js`, `lib/tutorial-from-url.js`,
  `containers/tips-library.jsx`, `containers/connection-modal.jsx`,
  `containers/blocks.jsx`, `components/debug-modal/debug-modal.jsx`) no
  cambian.

#### 2.6 Quitar tutoriales (D-13)

- `src/lib/libraries/decks/index.jsx`: vaciar el catálogo de mazos.
- Borrar `src/lib/libraries/decks/thumbnails/` (29 archivos) y
  `src/lib/libraries/decks/steps/` (1452 archivos), más los `*.js` de pasos
  por idioma que queden sin uso.
- Ocultar el botón "Tutoriales" (`menu-bar.jsx:460-474`, sin prop que lo
  controle: es el cambio de JSX número 3 de 2.7).
- `decks/index.jsx:1664` y `:1675` tienen URLs a `scratch.mit.edu` y
  `scratchfoundation.org` que desaparecen con el vaciado.

Quedan sin tocar, por ser el nombre real de productos de terceros que el
docente necesita identificar: las URLs de extensiones de hardware
(`lib/libraries/extensions/index.jsx`, líneas 234, 278, 322, 368, 414) y
`connection-modal/icons/scratchlink.svg`.

#### 2.7 Los tres cambios de JSX justificados

Cada uno va en su propio commit, explicando por qué no se pudo resolver por
asset o por prop.

1. `src/components/menu-bar/menu-bar.jsx:337`: `alt="Scratch"` está fijo en
   el `<img id="logo_img">`. La prop `logo` existe (línea 673) pero la línea
   342 la ignora y usa `getScratchLogo(this.props.platform)`. Solo se cambia
   el `alt`.
2. `src/components/stage-header/stage-header.jsx:214,220`: en modo pantalla
   completa hay un logo con `alt="Scratch"` que enlaza a `scratch.mit.edu`.
   Se cambia el `alt` y se saca el enlace.
3. `src/components/menu-bar/menu-bar.jsx:460-474`: el botón "Tutoriales" no
   tiene prop que lo controle. Se envuelve en una condición sobre una prop
   nueva con default que preserve el comportamiento de upstream.

#### 2.8 Verificación

Script `scripts/check-branding.mjs` (nuevo) que falle si encuentra marca
ajena en el bundle construido:

- `grep` de "Scratch" en `packages/scratch-gui/build/*.js` filtrando los
  casos permitidos (Scratch Link, URLs de extensiones de hardware, nombres
  de módulos npm).
- `grep` de `googletagmanager|google-analytics` en `build/`.

Se corre en la fase 2 y queda como red de seguridad para cada merge de
upstream.

### Archivos tocados

Nuevos:

- `brand/**`
- `packages/scratch-gui/src/lib/st-playground-messages.js`
- `scripts/check-branding.mjs`

Reemplazados (mismo nombre): los 8 assets de 2.2, los 3-5 de 2.3.

Editados: `webpack.config.js`, `src/playground/index.ejs`,
`src/playground/render-gui.jsx`, `src/lib/analytics.js`,
`src/lib/default-project/index.ts`, `src/lib/default-project/project-data.ts`,
`src/lib/libraries/decks/index.jsx`, y los tres JSX de 2.7.

Borrados: 1481 archivos de `decks/`.

### Criterios de aceptación

- [ ] Capturas de: barra de menú, proyecto nuevo, pantalla de carga, pestaña
      Disfraces, pestaña Sonidos, biblioteca de extensiones, modo pantalla
      completa. Sin "Scratch" ni el gato en ninguna.
- [ ] El campo de título dice "Proyecto de ST-Playground" (o equivalente) y
      no "Scratch Project", en español y en inglés.
- [ ] La barra de menú no muestra Compartir, Ver página del proyecto,
      Tutoriales, Únete, Iniciar sesión, Mis cosas ni mochila.
- [ ] `node scripts/check-branding.mjs` pasa.
- [ ] Con la pestaña Network abierta durante dos minutos de uso, cero
      requests a `googletagmanager.com` ni `google-analytics.com`. Los
      requests a `cdn.assets.scratch.mit.edu` por las miniaturas de
      biblioteca todavía aparecen: eso es la fase 3.
- [ ] `npm run test:unit` sigue pasando (50 suites, 328 tests).
- [ ] `git diff v15.1.1 --stat -- packages/scratch-gui` muestra ediciones
      solo en los archivos listados arriba, y ningún JSX fuera de los tres
      de 2.7.

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

Crear `packages/scratch-gui/src/lib/st-playground-storage.js` con una
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
- `packages/scratch-gui/src/lib/st-playground-storage.js` (nuevo)
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
- Ruta B: shell Electron propio mínimo en `packages/st-playground-desktop`,
  copiando de `scratch-desktop` solo las piezas necesarias.

Procedimiento: clonar `scratch-desktop` en `/tmp`, apuntar su dependencia a
`file:../../packages/scratch-gui` y correr `npm run compile`. Si en medio día
no compila y corre, se elige la ruta B. La expectativa es que sea B, porque
entre 13.x y 15.x cambió cómo se inyecta la configuración (`AppStateHOC` +
`GUIConfig`) y `scratch-desktop` todavía usa `electron.remote`.

El resto de esta fase asume ruta B.

### Tareas

#### 4.1 Workspace nuevo

Agregar `packages/st-playground-desktop` al array `workspaces` de `package.json`
raíz (D-03). Estructura:

```
packages/st-playground-desktop/
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
npm run --workspace @st-playground/desktop start        # dev con hot reload
npm run --workspace @st-playground/desktop dist         # fetch + compile + instalador
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
- `packages/st-playground-desktop/**` (nuevo)
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

#### 5.1 Workspace `packages/st-playground-web`

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

Completar `st-playground-storage.js` (fase 3): `saveProject()` hace `PUT` al
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
- `packages/st-playground-web/**` (nuevo)
- `packages/scratch-gui/src/lib/st-playground-storage.js`
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
