# Decisiones

Registro de decisiones de arquitectura del fork. Cada entrada tiene estado
`decidida`, `abierta` o `reemplazada`. Las abiertas bloquean la fase indicada
y hay que cerrarlas antes de empezarla.

## D-01. Base del producto: monorepo oficial, no TurboWarp

Estado: decidida.

Se forkea `scratchfoundation/scratch-editor` (v15.1.1, AGPL-3.0-only).
TurboWarp queda descartado como base: su árbol es anterior al monorepo, no
tiene `gui-config.ts`, está pineado a un `scratch-l10n` de 2024 y su licencia
GPL-3.0 convive mal con la AGPL de upstream. Si hace falta, el Packager de
TurboWarp (MPL-2.0) se usa como herramienta suelta para distribuir proyectos.

## D-02. Este repositorio es el definitivo y contiene el fork

Estado: decidida.

Este repo se convierte en el fork del monorepo trayendo la historia de
upstream con `git merge --allow-unrelated-histories v15.1.1`. Upstream queda
como remote `upstream`; las actualizaciones entran por merge de tags.

## D-03. Desktop y web viven como workspaces dentro del monorepo

Estado: decidida.

En lugar de repos separados que consuman un paquete npm publicado, la app de
escritorio y el host web se agregan como workspaces:

```
packages/st-playground-desktop
packages/st-playground-web        (fase 5)
```

Ventajas: no hay que publicar `@<scope>/scratch-gui` en ningún registry, la
GUI se resuelve por symlink de workspace, y un solo `npm ci` construye todo.
Costo: el `workspaces` del `package.json` raíz va a conflictuar en cada merge
de upstream; es un conflicto de dos líneas.

## D-04. Solo se modifica `scratch-gui`

Estado: decidida.

Los otros siete paquetes (`scratch-vm`, `scratch-render`, `scratch-paint`,
`scratch-storage`, `scratch-svg-renderer`, `task-herder`,
`scratch-media-lib-scripts`) no se tocan. Si alguna vez hace falta un cambio
en el VM (por ejemplo, una extensión propia), se abre una decisión nueva.

## D-05. Regla de mínima fricción con upstream

Estado: decidida.

Orden de preferencia para cualquier personalización:

1. Reemplazar un asset por otro con el mismo nombre de archivo.
2. Pasar props desde el punto de montaje (desktop, web, playground).
3. Agregar un archivo nuevo.
4. Editar JSX o JS existente (último recurso; requiere justificación en el
   commit).

## D-06. Modalidad prioritaria: offline

Estado: decidida.

El escenario mayoritario es escuela sin conectividad con computadoras
compartidas. La app de escritorio (fase 4) va antes que el host web con LTI
(fase 5). La fase 5 solo se ejecuta si, después de validar en aula, la
entrega por "Tarea de Moodle + archivo `.sb3`" resulta insuficiente.

## D-07. Sin telemetría ni analytics

Estado: decidida.

Se neutralizan `react-ga`, `GA_ID`/`GTM_ID` y el modal de telemetría. Ninguna
build hace requests a servicios de terceros. Motivo: usuarios menores de edad.

## D-08. Nombre del producto: ST-Playground

Estado: decidida.

Se usa en `productName`, `appId`, título de ventana, `alt` del logo, nombre
de los workspaces y textos de "Acerca de". No contiene "Scratch", que es
marca registrada de la Scratch Foundation (ver `TRADEMARK` en la raíz y en
`packages/scratch-gui/`).

Escritura canónica: `ST-Playground` en texto visible; `st-playground` en
nombres de archivo, paquetes y rutas.

## D-09. Scope npm: `@st-playground`

Estado: decidida (por defecto, reversible).

Los workspaces propios se llaman `@st-playground/desktop` y
`@st-playground/web`. Por D-03 no se publica nada en ningún registry, así
que el scope no está reservado y cambiarlo más adelante es un
buscar-y-reemplazar en dos `package.json`.

## D-10. El logo no es clickeable

Estado: decidida (por defecto, reversible).

Hoy `render-gui.jsx` navega a `https://scratch.mit.edu`. Se elimina el
handler `onClickLogo`: sin handler, `menu-bar.jsx` no aplica la clase
`clickable` y el logo queda inerte. Es lo que hace la app de escritorio de
upstream y evita sacar al chico del editor con un clic accidental.

Si más adelante hay un sitio institucional, se pasa `onClickLogo` desde el
punto de montaje sin tocar la GUI.

## D-13. Los tutoriales se quitan

Estado: decidida (por defecto, reversible).

`packages/scratch-gui/src/lib/libraries/decks/` son 1497 archivos: 30 mazos,
29 miniaturas y 1452 capturas y GIFs del editor de Scratch, casi todos con
el gato visible. Rehacerlos con capturas propias es un proyecto en sí mismo.

En la fase 2 se vacía el catálogo de mazos, se borran los archivos de imagen
y se oculta el botón "Tutoriales" de la barra de menú. Beneficio lateral:
menos peso en el instalador de la fase 4.

Rehacer tutoriales propios queda como trabajo futuro, fuera del plan actual.

## D-14. Los textos con "Scratch" se pisan por alias de webpack

Estado: decidida.

Editar los `defaultMessage` en el código solo arregla el inglés: las
traducciones vienen de `scratch-l10n`, que dice "Scratch" en todos los
idiomas. `packages/scratch-gui/src/reducers/locales.js` importa
`scratch-l10n/locales/editor-msgs` y de ahí sale `state.locales.messages`.

Se agrega un `resolve.alias` en `webpack.config.js` que apunta ese módulo a
un archivo propio, el cual importa el original y le fusiona las claves de
marca. Así se cubren todos los idiomas, sobrevive al cambio de idioma en
tiempo de ejecución y no requiere editar JSX ni mantener un fork de
`scratch-l10n`.

## D-15. Los workflows de GitHub de upstream se neutralizan

Estado: abierta. Bloquea: nada (solo aplica si el repo se mueve a GitHub).

Upstream trae `.github/workflows/` con semantic-release y publicación a npm
bajo el scope `@scratch`. En el forge actual no se ejecutan. Si el repo se
migra a GitHub hay que deshabilitarlos antes del primer push, o van a
intentar publicar paquetes con la marca de Scratch.

## D-16. Los medios de la biblioteca se versionan en el repo

Estado: decidida.

Los 1316 assets de la biblioteca (después de sacar los personajes de marca)
pesan 57 MB. Se descargan una vez con `scripts/fetch-library-assets.mjs` y
se commitean en `assets/library/`.

La alternativa era ignorarlos y bajarlos en cada build, pero eso obliga a
tener red en la máquina que arma el instalador y ata el fork a que el CDN de
Scratch siga en pie. El costo es despreciable: el `.git` ya pesa 5.3 GB por
la historia de upstream.

El script tiene modo `--check`, que compara la carpeta contra los JSON de la
biblioteca sin descargar nada. Es parte de la rutina de merge de upstream.

## D-17. La storage propia se enchufa en `legacy-config.ts`

Estado: decidida.

`packages/scratch-gui/src/lib/st-playground-storage.ts` implementa
`GUIStorage` con un único `WebStore` que apunta a `static/library-assets/`.
No hereda de `LegacyStorage` para no arrastrar sus stores remotos, y no
define `backpackStorage` ni `cloudVariables`, con lo cual la mochila y las
variables en la nube quedan apagadas sin pasar props.

Se inyecta reemplazando la instancia en `src/legacy-config.ts` en vez de
pasar un `configFactory` a `AppStateHOC`, aunque eso último sea el mecanismo
previsto por upstream. El motivo es concreto:
`components/scratch-image/scratch-image.jsx:40` no usa la storage configurada
sino el singleton `legacyConfig.storage.scratchStorage`, y es el camino por el
que el escritorio carga todas las miniaturas. Con `configFactory` habría dos
instancias de `ScratchStorage` y las miniaturas se romperían en la app de
escritorio, que es el entregable principal.

Costo: se edita un archivo de upstream de 5 líneas. Si upstream algún día
arregla `ScratchImage`, se puede volver a `configFactory`.

Las URLs que devuelve son absolutas, resueltas contra `document.baseURI`.
`scratch-storage` descarga desde un web worker cuando puede, y ahí una URL
relativa se resuelve contra el script del worker: con rutas relativas todas
las miniaturas de escritorio fallaban con 404, que `WebHelper` trata como
"asset no encontrado" en vez de error.

## D-18. Los personajes de marca salen de la biblioteca

Estado: decidida.

`TRADEMARK` nombra explícitamente al Scratch Cat, Gobo, Pico, Nano, Tera y
Giga como marcas de la Scratch Foundation. Se quitan de `sprites.json` los 10
sprites correspondientes y de `costumes.json` sus 31 disfraces exclusivos, y
se renombra el sonido "Scratch Beatbox" a "Beatbox".

Quedan 333 sprites y 884 disfraces, todos CC BY-SA 2.0, atribuidos en
`CREDITS.md`. No se crean personajes propios de reemplazo por ahora.

## D-19. La biblioteca de extensiones se filtra por plataforma

Estado: decidida.

En escritorio se muestran solo las extensiones que funcionan con la red
cortada: Música, Lápiz, Sensor de vídeo, Detección de caras, Makey Makey y
micro:bit. Quedan fuera Texto a voz y Traducir, que llaman a servidores de
Scratch en cada bloque, y Go Direct, EV3, BOOST y WeDo 2.0, que piden
hardware que las escuelas no tienen.

micro:bit entra porque se usa en las escuelas y funciona por Bluetooth con
Scratch Link sin necesidad de internet; el firmware ya se sirve desde
`static/microbit/`.

En web se muestran las 12. El filtro es en tiempo de ejecución, sobre
`state.scratchGui.platform`, y no una constante de compilación, porque el
`dist/` de la GUI es uno solo y lo consumen las dos aplicaciones.

## D-11. Targets de instalador

Estado: decidida.

Windows 10/11 x64. Entregables: instalador NSIS con `/S` (per-machine, para
que el técnico lo meta en la imagen de disco) y ZIP portable (pendrive, sin
administrador). Linux AppImage se genera como target de verificación, porque
es lo único ejecutable en las VMs de desarrollo; no se reparte a las
escuelas.

Detalle en `packages/st-playground-desktop/electron-builder.yml` y
[`docs/instalacion-escuela.md`](./docs/instalacion-escuela.md).

## D-12. Firma de código

Estado: decidida.

Sin firma. El instalador lo despliega el técnico, no lo baja un docente, así
que la advertencia de SmartScreen no es el camino habitual. Si más adelante
el instalador se publica para descarga directa, hay que comprar un
certificado EV o usar Azure Trusted Signing. Hasta entonces
`signExecutable: false`.

## D-20. El escritorio sirve la GUI por `app://`, no por `file://`

Estado: decidida.

Chromium bloquea `fetch()` a URLs `file://`. `STPlaygroundStorage` resuelve
los medios con `fetch`, y `scratch-storage` lo hace desde un web worker:
cargar `index.html` con `file://` deja la biblioteca entera con miniaturas
vacías y cero errores en consola, el mismo cuadro de la fase 3.

El proceso main registra un esquema privilegiado `app://` (`standard`,
`secure`, `supportFetchAPI`, `stream`) y sirve `dist/renderer` más
`extraResources/library-assets`. `document.baseURI` pasa a ser
`app://editor/index.html`, las URLs de la biblioteca quedan en
`app://editor/static/library-assets/…` y `fetch` funciona. El renderer es
idéntico al de la web: no hay helper de `fs`, no se toca
`st-playground-storage.ts`.

Guardar un `.sb3` no usa IPC. El VM marca el zip como
`application/x.scratch.sb3` y la GUI lo descarga con un `<a download>` sobre
un `blob:`. El main intercepta `session.will-download`, muestra el diálogo
nativo y mueve el archivo. Eso permite `sandbox: true`,
`contextIsolation: true` y `nodeIntegration: false`, que `scratch-desktop`
de upstream no tiene.
