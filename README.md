# Entre Líneas

## Desarrollo

Requiere Node.js 20.19 o posterior.

```sh
npm install
npm run dev
```

Abre la dirección local que muestra Vite. Servirla desde `localhost` permite usar la cámara en Safari.
El servidor usa `127.0.0.1:8765` para conservar los datos guardados previamente en ese origen.

## Producción

```sh
npm run build
npm run preview
```

La compilación genera `dist/`, que puedes publicar en un hosting estático con HTTPS. Es una PWA: se instala desde el navegador y no genera paquetes `.exe`, `.dmg` o `.apk` separados. Al abrir la dirección:

- **Windows:** en Chrome o Edge, pulsa **Instalar app** (o el icono de instalación de la barra).
- **macOS:** en Chrome o Edge, pulsa **Instalar app**; en Safari, usa **Archivo → Añadir al Dock**.
- **Android:** en Chrome, pulsa **Instalar app** o abre el menú y elige **Añadir a pantalla de inicio**.

La app conserva la biblioteca local y puede abrirse sin conexión después de la primera carga. Para buscar libros por ISBN y cargar portadas se necesita internet. La cámara y la instalación requieren HTTPS en el sitio publicado; `localhost` sirve para probarlo en el mismo equipo.
El ícono del libro se usa en la app instalada, el acceso de iOS y la pestaña del navegador.

El catálogo consulta Open Library, Wikidata y Google Books cuando hace falta. Los datos de la biblioteca siguen guardándose en el navegador.

Cada opción del menú abre una vista independiente: Inicio, Biblioteca, Progreso, Temporizador, Agregar libro y Configuración.

El apartado **Progreso** muestra el tiempo de lectura acumulado y las páginas leídas por libro. Puedes registrar páginas manualmente o elegir la página inicial en el temporizador y la final al guardar una sesión; puedes añadir el total de páginas para validar el avance.

En **Agregar libro** puedes buscar por título o autor en Google Books y Open Library, o registrar un libro manualmente sin ISBN. Al buscar, los nombres de autores en otros alfabetos se contrastan con sus formas en español y sus variantes latinas cuando están disponibles. Cada resultado también permite abrir la búsqueda correspondiente en Amazon para consultar allí las opciones de compra y su disponibilidad. Los resultados del catálogo se pueden añadir como pendientes o a **Deseados**. La biblioteca permite filtrar la lista de deseados; sus libros no aparecen como opciones para iniciar una sesión de lectura.

En **Configuración** puedes elegir entre las paletas Librería, Bosque y Océano. También puedes descargar un respaldo JSON con la biblioteca, la sesión del temporizador y la paleta, y restaurarlo en este u otro dispositivo; la importación reemplaza los datos actuales después de confirmarlo.
