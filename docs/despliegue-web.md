# Despliegue web (Vercel)

El playground de aula es un sitio estático: `index.html`, `gui.js`, la
biblioteca en `static/library-assets/` y los 20 `.sb3` en `actividades/`.
No hay servidor propio ni LTI (eso es la fase 6, todavía condicional).

El host de producción previsto es
`https://st-playground.smartteamdigital.com`. Hasta que el DNS apunte,
Vercel sirve el mismo build en `https://<proyecto>.vercel.app`.

## Qué construye

Desde la raíz del repo:

```bash
npm run build:web
```

Eso compila los seis paquetes del workspace que importa la GUI y después
el playground de `scratch-gui` con `ST_PLAYGROUND_WEB=1` (solo el editor,
sin las páginas de debug). La salida queda en
`packages/scratch-gui/build/`.

`vercel.json` le dice a Vercel que instale con `HUSKY=0 npm ci`, corra
ese script y publique esa carpeta. El `publicPath` del webpack es
relativo: el mismo build sirve en `*.vercel.app` y en el dominio propio.

No hay rewrite tipo SPA que mande todo a `index.html`. Los links de
Moodle son query strings (`/?actividad=5.1`); un catch-all rompería
`gui.js`, `static/` y `actividades/`.

## Conectar el repo

1. En [Vercel](https://vercel.com) → Add New Project → el GitHub
   `smartteamok/st-playground`.
2. Framework Preset: **Other** (ya está en `vercel.json`).
3. Root Directory: vacío (la raíz del monorepo).
4. Deploy. El primer build tarda varios minutos: `npm ci` baja firmware
   de micro:bit y webpack copia ~54 MB de biblioteca.

Node sale de `.nvmrc` (24.20.0). No hace falta variable de entorno para
el playground estático.

## Dominio `st-playground.smartteamdigital.com`

Cuando el sitio ya responde en `*.vercel.app`:

1. En el proyecto de Vercel → Settings → Domains → Add
   `st-playground.smartteamdigital.com`.
2. En el DNS de `smartteamdigital.com`, un CNAME de
   `st-playground` hacia `cname.vercel-dns.com` (Vercel muestra el valor
   exacto).
3. Esperar el certificado TLS. Los links de Moodle pasan a
   `https://st-playground.smartteamdigital.com/?actividad=5.1`.

El dominio no se configura en git.

## Verificar en local

```bash
npm run build:web
npx --yes serve packages/scratch-gui/build
```

Abrir `/` y `/?actividad=5.1`. El editor tiene que cargar el arranque
sin pedir nada a `assets.scratch.mit.edu`.
