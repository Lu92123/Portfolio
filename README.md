# LU92123 // VT-100 Phosphor Terminal

Portafolio personal de **Lucas (LU92123)** construido como una terminal retro DEC VT-100 de fósforo ámbar. Sin frameworks, sin build step: HTML, CSS y JavaScript puro.

**Demo:** https://lu92123.github.io/Portfolio/

---

## Archivos

| Archivo | Rol |
| --- | --- |
| `index.html` | Estructura del monitor, barra de comandos, terminal y fallback sin JavaScript. |
| `styles.css` | Temas (ámbar / verde / mono), scanlines, curvatura, glow, flicker y responsive. |
| `script.js` | Motor de tipeo, parser de comandos, historial, autocompletado, matrix y arranque. |

No hay dependencias instalables. La única petición externa son las fuentes de Google Fonts (JetBrains Mono y VT323), con fallback a fuentes monoespaciadas del sistema.

---

## Comandos

Escribí `help` dentro de la terminal para ver la lista completa. Los comandos no distinguen mayúsculas de minúsculas.

| Comando | Alias | Qué hace |
| --- | --- | --- |
| `help` | `ayuda`, `?` | Lista de comandos y atajos. |
| `about` | `acerca`, `info` | Perfil del operador. |
| `projects` | `proj`, `proyectos` | Índice de los tres proyectos. |
| `projects 1` | — | FIRST · FTC / FRC. |
| `projects 2` | — | Probot School: fútbol, mini sumo, sigue-líneas. |
| `projects 3` | — | Speedcubing. |
| `cubing` | `cube`, `rubik` | Ficha de speedcubing. |
| `contact` | `contacto` | Contacto y enlaces. |
| `autor` | `nombre`, `author` | Tarjeta del operador. |
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

## Personalización

Todos los datos personales y enlaces están centralizados al inicio de `script.js`:

```js
const CONFIG = {
  name: 'Lucas',
  alias: 'LU92123',
  github: 'https://github.com/Lu92123',
  email: '',            // vacío => muestra [PENDIENTE]
  linkedin: '',         // vacío => muestra [PENDIENTE]
  cubingAverage: '~30 s',
  firstSeasons: '3+',
  media: {
    firstPhotos: '',    // URL de fotos/video de FIRST
    firstGithub: '',    // repo de FIRST
    probotPhotos: '',
    probotGithub: '',
    cubingWca: ''       // perfil WCA
  }
};
```

Cuando un campo de `media` queda vacío, el botón correspondiente muestra un aviso de **recurso pendiente** en lugar de un enlace roto. Al pegar una URL, el botón se convierte en un enlace real.

Para cambiar los colores de los temas, editá las variables CSS de `:root` y de `[data-theme="green"]` / `[data-theme="mono"]` en `styles.css`.

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

El repositorio es `https://github.com/Lu92123/Portfolio`.

```bash
git init
git add index.html styles.css script.js README.md
git commit -m "Portafolio VT-100"
git branch -M main
git remote add origin https://github.com/Lu92123/Portfolio.git
git push -u origin main
```

Después, en GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)` → Save**.

El sitio queda publicado en:

```
https://lu92123.github.io/Portfolio/
```

No hace falta Actions ni compilación: Pages sirve los archivos tal cual.

---

## Accesibilidad y rendimiento

- Botón `[ CRT: ON/OFF ]` accesible por teclado y con `aria-pressed`.
- Región de salida con `aria-live="polite"` y `aria-busy` durante la animación.
- Respeta `prefers-reduced-motion`: sin tipeo ni animaciones largas.
- Responsive hasta 390 px; en móvil la barra de comandos se envuelve y el teclado virtual no se abre solo.
- Sin cookies, sin analytics, sin tracking. Solo `localStorage` para preferencias visuales.

---

Hecho con fósforo, `setTimeout` y demasiadas horas de FIRST.
