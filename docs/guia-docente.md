# Guía para el docente

ST-Playground es el editor de bloques que usan los alumnos en las
computadoras de la escuela. Trabajan **sin cuenta y sin Internet**. El
proyecto vive en un archivo `.sb3` que cada alumno guarda y entrega.

## En la clase

1. Abrir **ST-Playground** desde el menú inicio (o el `.exe` del pendrive).
2. Armar el proyecto. La biblioteca de sprites, disfraces, fondos y sonidos
   está adentro de la app; no hace falta red.
3. Archivo → **Guardar en tu computadora**. Elegir el pendrive o la carpeta
   del alumno. El archivo queda con extensión `.sb3`.
4. Para seguir otro día: doble clic en el `.sb3`, o Archivo → Cargar desde
   la computadora.

Si cierran la ventana con cambios sin guardar, la app pregunta antes de
salir.

Las extensiones de hardware que necesitan Internet (traducir, texto a voz)
no aparecen en esta app a propósito. Sí están: música, lápiz, video,
detección de caras, Makey Makey y micro:bit. micro:bit usa Scratch Link en
la misma computadora; si Scratch Link no está instalado, esa extensión no
va a conectar.

## Entrega por Moodle

Hasta que exista la integración LTI, la entrega es una **Tarea con archivo**.

### Crear la actividad

1. En el aula de Moodle, Activar edición → Añadir una actividad → **Tarea**.
2. Nombre: el de la consigna ("Videojuego de 30 segundos", etc.).
3. En **Tipos de entrega**, marcar solo **Archivos enviados**.
4. Tipo de archivo aceptado: `.sb3`. Si el selector no ofrece esa extensión,
   dejar "todos los tipos" y aclarar en la consigna que tiene que ser `.sb3`.
5. Entregas: una por alumno. Límite de tamaño: 10–20 MB alcanza; un
   proyecto típico pesa mucho menos.
6. Guardar.

### Proyecto de arranque (opcional)

Si querés que todos partan del mismo escenario o de los mismos sprites:

1. Armalo vos en ST-Playground y guardalo como `inicio.sb3`.
2. En el mismo tema de Moodle, Añadir un recurso → **Archivo**, y subí
   `inicio.sb3`.
3. En la consigna de la Tarea, pediles que bajen ese archivo, lo abran con
   doble clic y trabajen encima.

No hace falta una cuenta en ST-Playground. El archivo es el proyecto.

### Corregir

1. En la Tarea, Ver todas las entregas.
2. Bajá el `.sb3` del alumno.
3. Abrilo con doble clic (o arrastralo a ST-Playground).
4. El proyecto tiene que verse igual que en la computadora del alumno:
   sprites, scripts y sonidos viajan adentro del archivo.

Si el archivo no abre, suele ser un `.sb3` a medias (se cortó la copia al
pendrive) o un archivo que no es un proyecto. Pedile al alumno que lo
vuelva a guardar y a subir.

## Si la app no arranca

- En computadoras muy viejas o virtuales el escenario puede tardar un poco
  en aparecer. Si sale un aviso de WebGL, cerrarlo y reintentar: la app
  puede dibujar por software.
- La primera vez que un docente ejecuta el instalador, Windows puede
  mostrar SmartScreen. Ver [instalacion-escuela.md](./instalacion-escuela.md).
