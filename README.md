# Fork de Scratch para escuelas

Editor de programación por bloques basado en
[`scratchfoundation/scratch-editor`](https://github.com/scratchfoundation/scratch-editor)
(AGPL-3.0-only), con marca propia, biblioteca de medios autoalojada y una
aplicación de escritorio que funciona sin conexión. Pensado para escuelas con
computadoras compartidas y conectividad intermitente, con Moodle como sistema
de gestión de aulas.

Este repositorio va a contener el fork completo del monorepo una vez que se
complete la fase 1 del plan. Hoy contiene solo la planificación.

## Documentos

- [`PLAN_IMPLEMENTACION.md`](./PLAN_IMPLEMENTACION.md): fases, tareas,
  archivos a tocar, comandos y criterios de aceptación.
- [`DECISIONES.md`](./DECISIONES.md): decisiones de arquitectura, con las que
  todavía están abiertas y qué fase bloquean.

## Estado

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Decisiones y toolchain | en curso |
| 1 | Traer upstream y build verde | pendiente |
| 2 | Rebranding y limpieza | pendiente |
| 3 | Assets propios y self-hosting | pendiente |
| 4 | Desktop offline | pendiente |
| 5 | Web + LTI 1.3 | condicional a la validación de la fase 4 |

## Requisitos

- Node 24.20.0 (`nvm use`)
- npm 10.9.x

## Cómo correr

Disponible a partir de la fase 1. Los comandos van a ser los del monorepo de
upstream:

```bash
npm ci
npm start          # editor en http://localhost:8601
```

## Licencia

AGPL-3.0-only, igual que upstream. "Scratch" y el Scratch Cat son marcas de
la Scratch Foundation y no forman parte de este producto.

---

## Upstream: scratch-editor

El contenido que sigue es el README original del monorepo `scratchfoundation/scratch-editor` (v15.1.1), conservado como referencia. En cada merge de upstream se toma la versión nueva de esta sección y se mantiene la sección del fork de arriba.


If you'd like to use Scratch, please visit the [Scratch website](https://scratch.mit.edu/). You can build your own
Scratch project by pressing "Create" on that website or by visiting <https://scratch.mit.edu/projects/editor/>.

This is a source code repository for the packages that make up the Scratch editor and a few additional support
packages. Use this if you'd like to learn about how the Scratch editor works or to contribute to its development.

### What's in this repository?

The `packages` directory in this repository contains:

- `scratch-gui` provides the buttons, menus, and other elements that you interact with when creating and editing a
  project. It's also the "glue" that brings most of the other modules together at runtime.
- `scratch-media-lib-scripts` builds (or rebuilds) media libraries for the editor.
- `scratch-paint` provides a way to draw vector (SVG) or bitmap (PNG) images for costumes and backdrops.
- `scratch-render` draws backdrops, sprites, and clones on the stage.
- `scratch-storage` helps load project assets like images and sounds. It also provides `ScratchFetch`, a customized
  wrapper around `fetch`.
- `scratch-svg-renderer` processes SVG (vector) images for use with Scratch projects.
- `scratch-vm` is the virtual machine that runs Scratch projects.
- `task-herder` manages queues of tasks with throttling and concurrency limits.

_Please add to this list as more packages are migrated to the monorepo._

Each package has its own `README.md` file with more information about that package.

### Monorepo migration

#### What's going on?

We're migrating the Scratch editor packages into this monorepo. This will allow us to manage all the packages that
make up the Scratch editor in one place, making  it easier to manage dependencies and make changes that affect
multiple packages.

#### Why are there only a few packages in this repo?

We're migrating packages in stages. The current plan, which is subject to change, has us migrating repositories in
four batches. We plan to complete the migration within 2025.

#### What will happen to the existing repositories?

The existing repositories will be archived and made read-only. Those repositories contain valuable work and
information, including but not limited to issues and pull requests. We plan to keep that information available for
reference, and to selectively migrate it to this new repository.

### Thank you

Scratch would not be what it is today without help from the global community of Scratchers and open-source
contributors. Thank you for your contributions and support. _[Scratch on!](https://scratch.mit.edu/projects/65347738/fullscreen/)_

### Donate

We provide [Scratch](https://scratch.mit.edu) free of charge, and want to keep it that way! Please consider making a
[donation](https://www.scratchfoundation.org/donate) to support our continued engineering, design, community, and
resource development efforts. Donations of any size are appreciated. Thank you!
