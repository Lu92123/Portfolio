# LU92123 · Terminal + portafolio visual

Portafolio personal de **Lucas (LU92123)**: una terminal retro DEC VT-100 a pantalla completa que abre paso a un portafolio visual moderno. Sin frameworks, sin build step: HTML, CSS y JavaScript puro.

**Sitio:** https://lucastrad.me/

---

## Arquitectura

El sitio tiene dos capas bien separadas:

1. **Hero terminal (`#terminal-hero`)** — ocupa `100svh`, con fósforo ámbar, scanlines, curvatura, glow y flicker. Toda la decoración CRT está aislada acá: no afecta la legibilidad de la capa visual.
2. **Portafolio visual (`.portfolio`)** — navegación fija y secciones `#about`, `#projects`, `#gallery`, `#cubing` y `#contact`. Usa superficies oscuras, tipografía monoespaciada para títulos y acentos que siguen el tema activo (`amber`, `green` o `mono`).

La terminal puede llevar al portafolio con `gui` o `explore` (y sus alias), a la galería con `gallery` o `fotos`, o con el indicador `[ Scroll o escribe explore... ]` del hero. Las tarjetas del comando `projects` también hacen scroll a la ficha correspondiente.

---

## Archivos

| Archivo | Rol |
| --- | --- |
| `index.html` | Hero terminal, capa visual, galería, lightbox, metadatos y fallback sin JavaScript. |
| `styles.css` | Temas, efectos CRT, deck HUD de la terminal, capa visual, galería responsive y lightbox. |
| `script.js` | Motor de tipeo, comandos, historial, autocompletado, scroll, enlaces, reveal, filtros y lightbox. |
| `assets/img/` | Fotos optimizadas de las tarjetas y de speedcubing. |
| `assets/img/gallery/` | Versiones web de la galería: 33 fotos full + thumbnails, y 3 videos con sus posters y miniaturas. |
| `CNAME` | Dominio personalizado para GitHub Pages (`lucastrad.me`). |

No hay dependencias instalables. La única petición externa son las fuentes de Google Fonts (JetBrains Mono y VT323), con fallback a fuentes monoespaciadas del sistema.

---

## Comandos de la terminal

Escribí `help` para ver la lista completa. Los comandos no distinguen mayúsculas de minúsculas.

| Comando | Alias | Qué hace |
| --- | --- | --- |
| `help` | `ayuda`, `?` | Lista de comandos y atajos. |
| `about` | `acerca`, `info` | Perfil del operador. |
| `projects` | `proj`, `proyectos` | Deck HUD con los tres proyectos. |
| `projects 1` | — | Abre FIRST · FTC / FRC en la capa visual. |
| `projects 2` | — | Abre Probot School en la capa visual. |
| `projects 3` | — | Abre Speedcubing en la capa visual. |
| `gui` | `explore`, `portfolio`, `visual`, `web` | Scroll suave al portafolio visual. |
| `gallery` | `galeria`, `fotos`, `media` | Abre la galería completa de fotos y video. |
| `cubing` | `cube`, `rubik` | Ficha de speedcubing. |
| `contact` | `contacto` | Canales de contacto. |
| `autor` | `nombre`, `author` | Tarjeta ASCII del operador. |
| `theme` | `fosforo` | `theme amber`, `theme green`, `theme mono`; sin argumento rota. |
| `crt` | `scanlines` | `crt on` / `crt off`; sin argumento alterna. |
| `matrix` | `neo` | Lluvia digital (se cierra con cualquier tecla o clic). |
| `clear` | `cls`, `limpiar` | Limpia la pantalla. |
| `neofetch` | `fetch`, `sysinfo` | Ficha técnica del sistema. |
| `date` | `fecha` | Fecha y hora local. |
| `whoami` | `who` | Identidad del invitado. |
| `history` | `hist` | Historial de la sesión. |
| `ls` | `dir` | Lista archivos ficticios. |
| `cat` | `type` | Lee un archivo ficticio (`cat .secrets` incluido). |
| `echo` | `print` | Repite texto. |
| `banner` | `logo` | Banner ASCII. |
| `sudo` | `root` | Easter egg. |
| `exit` | `logout`, `quit` | Cierre simulado. |

**Atajos:** `↑` / `↓` historial · `Tab` autocompleta comandos y argumentos · `Enter` ejecuta o salta la animación de tipeo · `Ctrl+L` limpia · `Ctrl+C` cancela la línea.

---

## Galería multimedia

La sección `#gallery` reúne **33 fotos y 3 videos** de FIRST, Probot School, la Copa Andes Robotics y speedcubing. Incluye:

- Filtros por categoría: **Todo**, **FIRST**, **Probot**, **Copa**, **Cubing** y **Video**.
- Grid masonry con CSS Grid que conserva la proporción natural de cada foto (sin recortes) y pasa de 5 columnas en desktop a 2 en móvil.
- Lightbox con `<dialog>` nativo, botón `×`, flechas anterior/siguiente, contador, caption, navegación con `←` / `→`, cierre con `Esc` y swipe en pantallas táctiles.
- Videos H.264/AAC con controles y poster, más un enlace para abrir el archivo original.
- Fallback sin JavaScript: cada miniatura es un enlace real al JPG o MP4 completo.

Los archivos publicados están en `assets/img/gallery/`. Cada foto tiene una versión full para el lightbox (máximo 1920 px de lado) y un thumbnail para el grid (máximo 720 px), ambas con el mismo nombre y el sufijo `-thumb.jpg`. Cada video suma el MP4, un poster `.jpg` y su thumbnail:

| Grupo | Elementos | Archivos |
| --- | --- | --- |
| FIRST · competencia | 4 | `first-competencia-01..04.jpg` |
| FIRST · arena | 1 | `first-arena-01.jpg` |
| FIRST · equipo | 5 | `first-grupal-01..04.jpg` · `first-team-01.jpg` |
| FIRST · premio | 1 | `first-premio-01.jpg` |
| FIRST · robot | 4 | `first-robot-01..04.jpg` |
| Probot · equipo | 4 | `probot-grupal-01..03.jpg` · `probot-team-01.jpg` |
| Probot · pista | 1 | `probot-pista-01.jpg` |
| Probot · premio | 3 | `probot-premio-01..03.jpg` |
| Probot · fútbol | 1 | `probot-futbol-01.jpg` |
| Probot · robots | 3 | `probot-robot-01.jpg` · `probot-minisumo-01.jpg` · `probot-siguelineas-01.jpg` |
| Probot · desarrollo | 2 | `probot-desarrollo-01.jpg` · `probot-desarrollo-02.jpg` |
| Copa · competencia | 1 | `copa-competencia-01.jpg` |
| Copa · equipo | 1 | `copa-equipo-01.jpg` |
| Copa · robot | 1 | `copa-robot-01.jpg` |
| Cubing | 1 | `cubing-best-time.jpg` |
| Videos Probot | 3 | `probot-video-futbol` · `probot-video-minisumo` · `probot-video-siguelineas` (`.mp4`, `.jpg` poster y `-thumb.jpg`) |

Para reemplazar una foto, sobrescribí su `.jpg` y su `-thumb.jpg` manteniendo el nombre. Para agregar una nueva, duplicá un `<figure class="gallery-item">` en `index.html`, actualizá `data-category`, `data-title`, `data-caption`, los `width`/`height` del thumbnail y los contadores de los filtros.

Las imágenes principales de las tarjetas siguen en `assets/img/` (`first-robot.jpg`, `probot-robot.jpg`, `cubing.jpg`). Los originales de cámara (`assets/img/First/`, `assets/img/Probot-Fútbol/`, `assets/img/copa-robotica/`, `assets/img/cubing/`) están ignorados por Git: no se publican y pueden incluir HEIC o video. Solo se versionan los archivos optimizados.

Las rutas de las tres imágenes principales también están centralizadas en `CONFIG.images`, así que podés apuntarlas a otro archivo sin tocar el HTML.

---

## Personalización

Los datos personales y enlaces están al inicio de `script.js`:

```js
const CONFIG = {
  name: 'Lucas',
  alias: 'LU92123',
  github: 'https://github.com/Lu92123',
  email: 'rodrigueztradlucas@gmail.com',
  linkedin: '',            // vacío => aviso de enlace pendiente
  cubingAverage: '~30 s',
  firstSeasons: '3+',
  images: {
    first: 'assets/img/first-robot.jpg',
    probot: 'assets/img/probot-robot.jpg',
    cubing: 'assets/img/cubing.jpg'
  },
  media: {
    firstPhotos: '',       // URL de fotos/video de FIRST
    firstGithub: '',       // repo de FIRST
    probotPhotos: '',
    probotGithub: 'https://github.com/Lu92123/Robot-Futbol-Liga',
    cubingWca: ''          // perfil WCA
  }
};
```

Cuando un enlace queda vacío, el botón correspondiente muestra un aviso de **enlace pendiente** en lugar de navegar a un `#` roto. Al pegar una URL, se convierte en un enlace real. El email se arma como `mailto:` automáticamente.

Para cambiar los colores, editá las variables CSS de `:root` y de `[data-theme="green"]` / `[data-theme="mono"]` en `styles.css`. La capa visual usa `var(--fg)` como acento, así que también cambia con el tema.

El tema y el estado del CRT se guardan en `localStorage` (`vt-theme` y `vt-crt`). Un script mínimo en el `<head>` los aplica antes del primer pintado para evitar el flash de tema.

---

## Ver en local

Abrí `index.html` directamente en el navegador. Si preferís un servidor local:

```bash
python -m http.server 8000
```

Y visitá `http://localhost:8000`.

---

## Publicar en GitHub Pages

El repositorio es `https://github.com/Lu92123/Portfolio` y la rama de publicación es `main` (raíz del proyecto).

```bash
git add .
git commit -m "Portafolio híbrido: terminal + capa visual"
git push origin main
```

En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)` → Save**.

### Dominio personalizado

`CNAME` contiene `lucastrad.me`. Para que el dominio apex apunte a Pages, configurá en el DNS:

- Registros **A** para `lucastrad.me` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
- Registro **CNAME** para `www` → `lu92123.github.io`.

Después, en **Settings → Pages → Custom domain**, verificá `lucastrad.me` y activá **Enforce HTTPS** cuando el certificado esté listo. La primera publicación puede tardar unos minutos.

No hace falta Actions ni compilación: Pages sirve los archivos tal cual.

---

## Accesibilidad y rendimiento

- Botón `[ CRT: ON/OFF ]` accesible por teclado, con `aria-pressed` y alcance global.
- Región de salida con `aria-live="polite"` y `aria-busy` durante la animación.
- Skip link al portafolio visual y navegación fija con foco visible.
- Galería operable por teclado: `←` / `→` cambian de elemento, `Esc` cierra el lightbox y el foco vuelve a la miniatura de origen.
- Respeta `prefers-reduced-motion`: sin tipeo, sin parallax y sin animaciones de aparición.
- Responsive desde 320 px; el hero usa `100svh` y la capa visual pasa a una columna.
- Imágenes con `width`/`height`, `loading="lazy"` y `decoding="async"` fuera del hero; el lightbox carga la versión full solo al abrir.
- Sin cookies, sin analytics, sin tracking. Solo `localStorage` para preferencias visuales.

---

Hecho con fósforo, `setTimeout` y demasiadas horas de FIRST.
