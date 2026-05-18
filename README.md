# Biblioteca de Voz

Centro de audiolibros en español. Busca títulos y autores — la app te entrega links directos a las fuentes gratuitas donde encontrarlos.

## Stack

- React 18 + Vite
- Vercel Serverless Functions (proxy de Anthropic API)
- Sin base de datos, sin backend propio

---

## Cómo desplegarlo (primera vez)

### Paso 1 — Subir a GitHub

1. Ve a [github.com](https://github.com) e inicia sesión (o crea cuenta gratis)
2. Clic en **New repository**
3. Nombre: `biblioteca-de-voz`
4. Déjalo en **Public** o **Private** — a tu gusto
5. **No** marques "Add a README" (ya lo tiene)
6. Clic en **Create repository**
7. GitHub te muestra comandos. En tu computadora, dentro de la carpeta del proyecto:

```bash
git init
git add .
git commit -m "primera versión"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/biblioteca-de-voz.git
git push -u origin main
```

---

### Paso 2 — Obtener tu API Key de Anthropic

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea cuenta gratis (te dan crédito inicial para pruebas)
3. Ve a **API Keys** > **Create Key**
4. Copia la key — empieza con `sk-ant-...`
5. Guárdala en un lugar seguro. No la compartas ni la subas a GitHub.

---

### Paso 3 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Clic en **Add New > Project**
3. Selecciona el repositorio `biblioteca-de-voz`
4. Vercel detecta Vite automáticamente — no cambies nada
5. Antes de hacer clic en Deploy, ve a **Environment Variables** y agrega:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** tu key de Anthropic
6. Clic en **Deploy**

En 2-3 minutos tienes una URL pública, por ejemplo:
`https://biblioteca-de-voz.vercel.app`

---

### Paso 4 — Agregar a tu Android como app

1. Abre la URL en **Chrome para Android**
2. Toca los tres puntos (menú) arriba a la derecha
3. Selecciona **"Añadir a pantalla de inicio"**
4. Dale el nombre que quieras
5. Se instala como app — ícono en tu pantalla, abre sin barra de navegador

---

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Edita .env.local y pon tu ANTHROPIC_API_KEY real
npm run dev
```

Abre `http://localhost:5173`

---

## Estructura del proyecto

```
biblioteca-de-voz/
├── api/
│   └── search.js          # Serverless function — maneja la API key de forma segura
├── src/
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Entry point
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
└── .gitignore
```

---

## Próximas apps

Este repositorio puede crecer. Para agregar una app nueva:

1. Crea una carpeta nueva en el mismo nivel o crea un repositorio nuevo en GitHub
2. Comparte el link del repo con Claude
3. Claude puede leer el código, editarlo y generar versiones nuevas directamente

---

## Notas

- La API key **nunca** está en el código del frontend. Vive en Vercel como variable de entorno.
- Cada búsqueda consume tokens de tu cuenta Anthropic. El costo es muy bajo (fracciones de centavo por búsqueda).
- Si quieres ver tu consumo: [console.anthropic.com/usage](https://console.anthropic.com/usage)
