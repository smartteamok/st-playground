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
