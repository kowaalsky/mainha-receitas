const crypto = require("crypto");

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  return body + "." + sig;
}

function isAuthed(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const [body, sig] = token.split(".");
  if (!body || !sig || !process.env.SESSION_SECRET) return false;
  const good = crypto.createHmac("sha256", process.env.SESSION_SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(body, "base64url").toString()).exp > Date.now(); }
  catch { return false; }
}

function passwordOk(input) {
  return crypto.timingSafeEqual(sha(input), sha(process.env.APP_PASSWORD || ""));
}

async function sb(path, opts = {}) {
  const key = process.env.SUPABASE_KEY;
  const headers = { apikey: key, "Content-Type": "application/json", Prefer: "return=representation", ...opts.headers };
  if (!key.startsWith("sb_")) headers.Authorization = "Bearer " + key; // chave antiga (JWT)
  const r = await fetch(process.env.SUPABASE_URL + "/rest/v1/" + path, { ...opts, headers });
  const text = await r.text();
  if (!r.ok) throw new Error("Banco de dados: " + text.slice(0, 200));
  return text ? JSON.parse(text) : null;
}

module.exports = { sign, isAuthed, passwordOk, sb };
