# Créditos y licencias

ST-Playground es un fork de
[`scratchfoundation/scratch-editor`](https://github.com/scratchfoundation/scratch-editor).
Nada de lo que sigue implica que la Scratch Foundation avale este producto.

## Código

Todo el código heredado de upstream y las modificaciones de este fork están
bajo **AGPL-3.0-only**, la misma licencia de upstream. El texto completo está
en [`LICENSE`](./LICENSE).

Las dependencias de terceros conservan sus propias licencias; se listan en
`package-lock.json` y en los `package.json` de cada paquete.

## Biblioteca de medios

Los 1316 archivos de [`assets/library/`](./assets/library) son la biblioteca
de sprites, disfraces, fondos y sonidos de Scratch, publicada por la Scratch
Foundation bajo
[**Creative Commons Attribution-ShareAlike 2.0**](https://creativecommons.org/licenses/by-sa/2.0/)
(CC BY-SA 2.0).

- Autoría: Scratch Foundation y colaboradores de la comunidad de Scratch.
- Origen: `https://cdn.assets.scratch.mit.edu`, descargados con
  [`scripts/fetch-library-assets.mjs`](./scripts/fetch-library-assets.mjs).
- Los archivos se distribuyen sin modificaciones. Los catálogos que los
  indexan (`packages/scratch-gui/src/lib/libraries/*.json`) sí están
  modificados: se les quitaron las entradas de los personajes de marca.

Al redistribuir ST-Playground hay que conservar esta atribución y mantener la
biblioteca bajo CC BY-SA 2.0.

## Marcas de la Scratch Foundation

"Scratch", el logo de Scratch, el Scratch Cat, Gobo, Pico, Nano, Tera y Giga
son marcas de la Scratch Foundation (ver [`TRADEMARK`](./TRADEMARK)) y **no
forman parte de este producto**. Los sprites y disfraces de esos personajes
se quitaron de la biblioteca (D-18 en [`DECISIONES.md`](./DECISIONES.md)).

Las menciones a "Scratch Link" que quedan en la interfaz se refieren al
producto real de la Scratch Foundation que hay que instalar para usar
extensiones de hardware como micro:bit. Es una referencia nominativa, no una
apropiación de marca.

## Assets propios

Los archivos de [`brand/`](./brand) (logo, isotipo, favicon, sprite por
defecto y su sonido) son originales de ST-Playground y se publican bajo
**CC BY-SA 4.0**, para que quien forkee este repositorio pueda reemplazarlos
o reutilizarlos sin fricción.

## Fuentes tipográficas

Las fuentes de los bloques y el escenario vienen del paquete
`scratch-render-fonts` de upstream, con las licencias que ese paquete declara
(SIL Open Font License en su mayoría).
