// api/search.js
// Vercel Serverless Function

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key no configurada en Vercel" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Request body inválido" });
  }

  let response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[search] fetch error:", err);
    return res.status(502).json({ error: `No se pudo contactar la API: ${err.message}` });
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error("[search] JSON parse error, status:", response.status);
    return res.status(502).json({ error: `Respuesta inválida de la API (HTTP ${response.status})` });
  }

  if (!response.ok) {
    console.error("[search] API error:", response.status, JSON.stringify(data));
    return res.status(response.status).json(data);
  }

  return res.status(200).json(data);
}
