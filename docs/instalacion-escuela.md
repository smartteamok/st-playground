# Instalación en la escuela

ST-Playground se distribuye como aplicación de escritorio para Windows 10/11
x64. No necesita red después de instalada: el editor, la biblioteca de medios
y las seis extensiones offline viajan adentro del paquete.

Los artefactos salen de:

```bash
npm run dist:win --workspace @st-playground/desktop
```

Eso produce, en `packages/st-playground-desktop/release/`:

| Archivo | Tamaño medido | Para qué |
|---|---|---|
| `ST-Playground-<versión>-x64-Setup.exe` | hay que generarlo en Windows | Instalador NSIS, el que va en la imagen de disco |
| `ST-Playground-<versión>-win-x64.zip` | 261 MB | Copia portable: se descomprime en un pendrive y se ejecuta sin instalar |

Tamaños de referencia medidos al cerrar la fase 4: el ZIP portable pesa **261 MB**, el AppImage de verificación **235 MB**, y la carpeta desempaquetada **445 MB** (runtime de Electron + GUI + 57 MB de biblioteca). Cabe en un pendrive sin problema.

El instalador NSIS no se puede generar en Linux sin `wine`. En esta VM no está instalado (`spawn wine ENOENT`). El ZIP portable sí se genera acá y es el que se usa hasta tener una máquina Windows. En esa máquina, el mismo comando `dist:win` produce también el Setup.exe.

## Instalación silenciosa (técnico)

El instalador es por máquina (`perMachine`) y pide administrador. Para
meterlo en una imagen de disco o en un script de despliegue:

```text
ST-Playground-<versión>-x64-Setup.exe /S
```

Opciones útiles de NSIS:

- `/S` — silencioso, sin ventanas.
- `/allusers` — todos los usuarios de la máquina (es el valor por defecto).
- `/D=C:\Program Files\ST-Playground` — carpeta de instalación. Tiene que ir
  **al final** de la línea y sin comillas, aunque la ruta tenga espacios.

El acceso directo queda en el menú inicio como **ST-Playground**. Los
archivos `.sb3` quedan asociados a la app: un doble clic los abre. Si ya
había una ventana abierta, el archivo va a esa ventana en lugar de lanzar
una segunda copia.

No hay auto-update. Para pasar de versión se instala encima la nueva.

## ZIP portable

Cuando no se puede instalar software en la máquina, se copia el ZIP a un
pendrive, se descomprime y se ejecuta `ST-Playground.exe`. No pide
administrador. La asociación de `.sb3` no queda registrada en Windows: hay
que abrir los proyectos desde Archivo → Cargar desde la computadora, o
arrastrarlos al `.exe`. El protocolo `st-playground://actividad/5.1` no
queda registrado en el ZIP: para las consignas de los libros usar el menú
**Actividades**. El instalador NSIS sí registra ese protocolo.

## SmartScreen

El instalador **no está firmado** (D-12). Windows puede mostrar "Windows
protegió tu PC" la primera vez. Eso no aparece si el técnico lo instala
dentro de la imagen de disco, porque el ejecutable ya está en el sistema
cuando el alumno lo abre. Si un docente lo baja por su cuenta, hay que
elegir "Más información" → "Ejecutar de todas formas", o pedir un
certificado de firma más adelante.

## Dónde guardar los proyectos

Las computadoras son compartidas. Cada alumno debería guardar su `.sb3` en:

- su pendrive, o
- una carpeta con su nombre en el escritorio / documentos, que el técnico
  puede vaciar al final del día.

"Guardar en tu computadora" pregunta la ruta **cada vez**. No hay
"guardar encima del archivo anterior" todavía: es el mismo comportamiento
que la app oficial de Scratch.

## Playground en la web

El editor también se publica en Vercel. El dominio previsto es
`https://st-playground.smartteamdigital.com` (pasos en
[`despliegue-web.md`](./despliegue-web.md)). Esa vía necesita red en el
aula; no reemplaza al instalador Windows para las máquinas sin Internet.

## Red local, sin instalar nada

Si el aula tiene una red local aunque no tenga Internet, el mismo editor se
puede servir por HTTP desde una máquina:

```bash
npm start   # en la máquina del docente, puerto 8601
```

Las demás abren `http://<ip-del-docente>:8601/` en el navegador. Esa vía no
reemplaza al instalador: depende de que esa máquina esté prendida y no
guarda `.sb3` con el diálogo nativo, el alumno usa la descarga del
navegador. Útil como contingencia, no como despliegue principal.

## Linux (verificación)

En esta fase se genera un AppImage solo para poder correr la app en Linux
durante el desarrollo. No es un entregable para las escuelas.

```bash
npm run dist:linux --workspace @st-playground/desktop
```
