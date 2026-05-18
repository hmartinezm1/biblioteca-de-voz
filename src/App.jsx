import { useState, useEffect, useCallback } from "react";

// ─── Prompt ───────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Eres un experto en audiolibros en español. El usuario busca audiolibros gratuitos en español.

Devuelves ÚNICAMENTE un JSON válido, sin markdown, sin texto adicional:

{
  "results": [
    {
      "title": "Título del libro",
      "author": "Nombre del autor",
      "year": "año",
      "public_domain": true,
      "note": "Frase breve, máximo 12 palabras",
      "sources": [
        { "label": "Internet Archive", "url": "https://archive.org/search?query=TITULO+AUTOR&mediatype=audio" },
        { "label": "LibriVox", "url": "https://librivox.org/search?primary_key=TITULO&search_category=title&search_page=1" },
        { "label": "YouTube", "url": "https://www.youtube.com/results?search_query=audiolibro+TITULO+español+completo" }
      ]
    }
  ],
  "note_general": "Nota general si aplica"
}

Reglas:
- Máximo 6 resultados
- Notas de máximo 12 palabras
- URLs con título/autor codificado, no inventadas
- Si el autor es contemporáneo (post-1930): public_domain false, sources con iVoox y Spotify en lugar de LibriVox
- Siempre incluye YouTube como fuente`;

// ─── API call ─────────────────────────────────────────────────────────────────
async function askClaude(query) {
  const userMsg = query
    ? `Busco audiolibros en español de: "${query}"`
    : `Dame 6 audiolibros clásicos en español muy populares (García Márquez, Neruda, Cervantes, Borges, etc.)`;

  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Error desconocido" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  const clean = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/"results"\s*:\s*(\[[\s\S]*)/);
    if (match) {
      const lastClose = match[1].lastIndexOf("},");
      if (lastClose > 0) {
        try {
          return JSON.parse('{"results":' + match[1].slice(0, lastClose + 1) + "]}");
        } catch { /* fall through */ }
      }
    }
    throw new Error("Respuesta incompleta. Intenta de nuevo.");
  }
}

// ─── Directory ────────────────────────────────────────────────────────────────
const SOURCES = [
  { id: "albalearning", name: "AlbaLearning",   desc: "3,000+ audiolibros clásicos sin registro",  url: "https://albalearning.com/audiolibros/",                                           tag: "Clásicos"   },
  { id: "librototal",   name: "El Libro Total",  desc: "Literatura clásica de dominio público",     url: "https://www.ellibrototal.com/ltotal/?t=1&d=0,0,0,0,1",                          tag: "Clásicos"   },
  { id: "librivox",     name: "LibriVox",         desc: "900+ obras en español, dominio público",    url: "https://librivox.org/search?primary_key=&search_category=language&q=spanish",   tag: "Clásicos"   },
  { id: "ivoox",        name: "iVoox",            desc: "Canales y podcasts de audiolibros",         url: "https://www.ivoox.com/audiolibros_sb_f11811_1.html",                            tag: "Podcast"    },
  { id: "horacio",      name: "Horacio Lanci",    desc: "Audiolibros completos, voz humana real",    url: "https://www.youtube.com/@HoracioLanci",                                          tag: "YouTube"    },
  { id: "youtube",      name: "YouTube",          desc: "Buscar audiolibros completos en español",   url: "https://www.youtube.com/results?search_query=audiolibro+completo+espa%C3%B1ol", tag: "YouTube"    },
  { id: "spotify",      name: "Spotify",          desc: "Audiolibros gratis con cuenta básica",      url: "https://open.spotify.com/search/audiolibro%20completo%20en%20espa%C3%B1ol",     tag: "Streaming"  },
  { id: "libby",        name: "Libby",            desc: "Biblioteca pública digital, con carnet",    url: "https://libbyapp.com/",                                                          tag: "Biblioteca" },
  { id: "archive",      name: "Internet Archive", desc: "Miles de títulos descargables en MP3",      url: "https://archive.org/search?query=audiolibro&mediatype=audio",                   tag: "Archivo"    },
];

const SOURCE_COLORS = {
  "Internet Archive": "#7e8fa6",
  "LibriVox":         "#7a9e7e",
  "YouTube":          "#a67a7a",
  "iVoox":            "#8fa67a",
  "Spotify":          "#6a9e7a",
  "AlbaLearning":     "#9e8a6a",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%}
body{background:#0f0b05;margin:0;-webkit-font-smoothing:antialiased}
.bv{min-height:100vh;background:#0f0b05;color:#ddc898;font-family:Georgia,'Palatino Linotype',serif;display:flex;flex-direction:column}
.bv-head{padding:24px 20px 0;background:#130e06;border-bottom:1px solid #2a1c0c;position:sticky;top:0;z-index:10}
.bv-kicker{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#4a3318;font-family:system-ui,sans-serif;margin-bottom:6px}
.bv-title{font-size:24px;color:#c48a22;letter-spacing:.03em;margin-bottom:16px}
.bv-title em{color:#ddc898;font-style:italic}
.bv-search{display:flex;gap:8px;margin-bottom:18px}
.bv-inp{flex:1;background:#1a1208;border:1px solid #352310;border-radius:3px;color:#ddc898;padding:11px 14px;font-size:15px;font-family:Georgia,serif;outline:none;transition:border-color .2s;-webkit-appearance:none}
.bv-inp:focus{border-color:#c48a22}
.bv-inp::placeholder{color:#3a2510}
.bv-inp:disabled{opacity:.5}
.bv-btn{background:#c48a22;border:none;border-radius:3px;color:#0f0b05;padding:11px 20px;font-size:11px;font-family:system-ui,sans-serif;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:background .15s;-webkit-tap-highlight-color:transparent}
.bv-btn:hover{background:#d49a32}
.bv-btn:active{background:#b47a12}
.bv-btn:disabled{background:#4a3318;cursor:not-allowed}
.bv-tabs{display:flex;background:#130e06;border-bottom:1px solid #2a1c0c;padding:0 20px}
.bv-tab{background:none;border:none;border-bottom:2px solid transparent;color:#3a2510;cursor:pointer;font-size:10px;font-family:system-ui,sans-serif;font-weight:600;letter-spacing:.15em;margin-bottom:-1px;padding:12px 16px;text-transform:uppercase;transition:color .15s,border-color .15s;-webkit-tap-highlight-color:transparent}
.bv-tab.on{color:#c48a22;border-bottom-color:#c48a22}
.bv-body{flex:1;padding:20px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.bv-meta{font-size:11px;font-family:system-ui,sans-serif;color:#4a3318;margin-bottom:16px}
.bv-meta strong{color:#c48a22}
.bv-general-note{font-size:12px;font-family:system-ui,sans-serif;color:#6a5030;background:#1a1208;border:1px solid #2a1c0c;border-left:3px solid #c48a22;border-radius:3px;padding:10px 14px;margin-bottom:16px;line-height:1.5}
.bv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
.bv-card{background:#181008;border:1px solid #2a1c0c;border-radius:4px;padding:16px;display:flex;flex-direction:column;gap:6px}
.bv-card-title{font-size:14px;font-weight:600;color:#ddc898;line-height:1.35}
.bv-card-author{font-size:12px;color:#7a5a2a;font-family:system-ui,sans-serif}
.bv-card-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.bv-pd-badge{font-size:9px;font-family:system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:2px 6px;border-radius:2px}
.bv-pd-yes{color:#7a9e7e;border:1px solid #3a5e3a}
.bv-pd-no{color:#9e7a5a;border:1px solid #5e3a1a}
.bv-card-note{font-size:11px;color:#3a2510;font-family:system-ui,sans-serif;line-height:1.5;flex:1}
.bv-card-sources{margin-top:8px;padding-top:10px;border-top:1px solid #2a1c0c;display:flex;flex-wrap:wrap;gap:6px}
.bv-src-link{font-size:10px;font-family:system-ui,sans-serif;text-decoration:none;border-radius:2px;padding:4px 10px;border:1px solid;letter-spacing:.05em;-webkit-tap-highlight-color:transparent}
.bv-spin{text-align:center;padding:56px 20px;color:#4a3318;font-family:system-ui,sans-serif}
.bv-spin-dots{font-size:22px;color:#c48a22;letter-spacing:4px;margin-bottom:14px;animation:pulse 1.2s infinite}
@keyframes pulse{0%,100%{opacity:.2}50%{opacity:1}}
.bv-spin-title{font-size:14px;color:#6a5030;margin-bottom:6px}
.bv-spin-sub{font-size:11px;color:#3a2510}
.bv-err{font-size:12px;font-family:system-ui,sans-serif;color:#8a4a22;background:#1a1208;border:1px solid #4a2210;border-radius:3px;padding:12px 14px;line-height:1.5}
.bv-welcome{padding:40px 0 20px;text-align:center;font-family:system-ui,sans-serif}
.bv-welcome-title{font-size:13px;color:#6a5030;margin-bottom:10px}
.bv-welcome-examples{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.bv-example{font-size:11px;color:#4a3318;border:1px solid #2a1c0c;border-radius:3px;padding:5px 12px;cursor:pointer;background:none;font-family:system-ui,sans-serif;-webkit-tap-highlight-color:transparent;transition:border-color .15s,color .15s}
.bv-example:hover,.bv-example:active{color:#c48a22;border-color:#4a3318}
.bv-section-label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#3a2510;font-family:system-ui,sans-serif;margin-bottom:12px}
.bv-src-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
.bv-src-card{background:#181008;border:1px solid #2a1c0c;border-radius:4px;padding:14px;text-decoration:none;display:block;transition:border-color .2s;-webkit-tap-highlight-color:transparent}
.bv-src-card:active{border-color:#c48a22}
.bv-src-ico{width:30px;height:30px;background:#2a1c0c;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10px;font-family:system-ui,sans-serif;font-weight:700;color:#c48a22;margin-bottom:8px}
.bv-src-name{font-size:13px;color:#c48a22;margin-bottom:3px}
.bv-src-desc{font-size:11px;color:#4a3318;font-family:system-ui,sans-serif;line-height:1.4;margin-bottom:8px}
.bv-src-tag{font-size:9px;font-family:system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#2a1c0c;border:1px solid #2a1c0c;border-radius:2px;padding:2px 5px}
`;

const EXAMPLES = ["El Principito", "García Márquez", "Pablo Neruda", "Don Quijote", "Borges", "Vargas Llosa"];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,     setTab]     = useState("catalog");
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [note,    setNote]    = useState("");
  const [status,  setStatus]  = useState("idle"); // idle | loading | done | error
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setStatus("loading");
    setError(null);
    setNote("");
    try {
      const json = await askClaude(q.trim());
      setResults(json.results || []);
      setNote(json.note_general || "");
      setStatus("done");
    } catch (e) {
      setError(e.message);
      setResults([]);
      setStatus("error");
    }
  }, []);

  const handleKey   = (e) => { if (e.key === "Enter") doSearch(query); };
  const handleExample = (ex) => { setQuery(ex); doSearch(ex); };

  const loading = status === "loading";

  return (
    <div className="bv">
      {/* Header */}
      <div className="bv-head">
        <p className="bv-kicker">Centro de Audiolibros en Español</p>
        <h1 className="bv-title">Biblioteca <em>de Voz</em></h1>
        <div className="bv-search">
          <input
            className="bv-inp"
            placeholder="Título, autor o tema..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button className="bv-btn" disabled={loading} onClick={() => doSearch(query)}>
            {loading ? "..." : "Buscar"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bv-tabs">
        <button className={`bv-tab ${tab === "catalog" ? "on" : ""}`} onClick={() => setTab("catalog")}>Catálogo</button>
        <button className={`bv-tab ${tab === "sources" ? "on" : ""}`} onClick={() => setTab("sources")}>Directorio</button>
      </div>

      {/* Body */}
      <div className="bv-body">

        {/* Catálogo */}
        {tab === "catalog" && (
          <>
            {status === "idle" && (
              <div className="bv-welcome">
                <p className="bv-welcome-title">¿Qué quieres escuchar hoy?</p>
                <div className="bv-welcome-examples">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} className="bv-example" onClick={() => handleExample(ex)}>
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="bv-spin">
                <div className="bv-spin-dots">· · ·</div>
                <p className="bv-spin-title">Buscando audiolibros...</p>
                <p className="bv-spin-sub">"{query}"</p>
              </div>
            )}

            {status === "error" && (
              <div className="bv-err">Error: {error}</div>
            )}

            {status === "done" && results.length === 0 && (
              <p className="bv-meta">Sin resultados para "{query}". Intenta con otro término.</p>
            )}

            {status === "done" && results.length > 0 && (
              <>
                <p className="bv-meta">
                  <strong>{results.length}</strong> resultado{results.length !== 1 ? "s" : ""} para "{query}"
                </p>
                {note && <div className="bv-general-note">{note}</div>}
                <div className="bv-grid">
                  {results.map((r, i) => (
                    <div className="bv-card" key={i}>
                      <p className="bv-card-title">{r.title}</p>
                      <div className="bv-card-meta">
                        <span className="bv-card-author">{r.author}{r.year ? ` · ${r.year}` : ""}</span>
                        <span className={`bv-pd-badge ${r.public_domain ? "bv-pd-yes" : "bv-pd-no"}`}>
                          {r.public_domain ? "Dominio público" : "Contemporáneo"}
                        </span>
                      </div>
                      {r.note && <p className="bv-card-note">{r.note}</p>}
                      {r.sources?.length > 0 && (
                        <div className="bv-card-sources">
                          {r.sources.map((s, j) => {
                            const color = SOURCE_COLORS[s.label] || "#7a7a7a";
                            return (
                              <a
                                key={j}
                                className="bv-src-link"
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color, borderColor: color + "55" }}
                              >
                                {s.label} →
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Directorio */}
        {tab === "sources" && (
          <>
            <p className="bv-section-label" style={{ marginBottom: "14px" }}>
              {SOURCES.length} fuentes gratuitas · acceso directo
            </p>
            <div className="bv-src-grid">
              {SOURCES.map((s) => (
                <a key={s.id} className="bv-src-card" href={s.url} target="_blank" rel="noopener noreferrer">
                  <div className="bv-src-ico">{s.name.slice(0, 2).toUpperCase()}</div>
                  <p className="bv-src-name">{s.name}</p>
                  <p className="bv-src-desc">{s.desc}</p>
                  <span className="bv-src-tag">{s.tag}</span>
                </a>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
