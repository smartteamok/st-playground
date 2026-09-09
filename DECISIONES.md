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

## D-11. Targets de instalador

Estado: abierta. Bloquea: fase 4.

Confirmar sistema operativo y versión del parque de las escuelas. Supuesto de
trabajo: Windows 10/11 x64, instalador NSIS con soporte de instalación
silenciosa (`/S`). Linux AppImage solo si hay escuelas con Linux.

## D-12. Firma de código

Estado: abierta. Bloquea: nada (fase 4 sale sin firma).

Sin certificado, Windows muestra la advertencia de SmartScreen en la primera
ejecución. Aceptable para instalación por el administrador en una imagen de
disco. Si el instalador lo van a bajar docentes por su cuenta, hay que
comprar un certificado EV o usar Azure Trusted Signing.
