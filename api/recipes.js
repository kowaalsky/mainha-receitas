const { isAuthed, sb } = require("./_lib");

const UUID = /^[0-9a-f-]{36}$/i;
const toRecipe = (r) => ({ ...r.dados, id: r.id, nome: r.nome, categoria: r.categoria });

function toRow(b) {
  if (!b || typeof b.nome !== "string" || !b.nome.trim() || b.nome.length > 200) throw new Error("Nome inválido.");
  if (JSON.stringify(b).length > 100000) throw new Error("Receita grande demais.");
  const { id, nome, categoria, ...dados } = b;
  return { nome: nome.trim(), categoria: String(categoria || "Outros").slice(0, 60), dados, atualizado_em: new Date().toISOString() };
}

module.exports = async (req, res) => {
  if (!isAuthed(req)) return res.status(401).json({ erro: "Faça login." });
  const id = req.query.id;
  try {
    if (req.method === "GET") {
      const rows = await sb("recipes?select=*&order=nome.asc");
      return res.status(200).json(rows.map(toRecipe));
    }
    if (req.method === "POST") {
      const [row] = await sb("recipes", { method: "POST", body: JSON.stringify(toRow(req.body)) });
      return res.status(201).json(toRecipe(row));
    }
    if (!UUID.test(id || "")) return res.status(400).json({ erro: "ID inválido." });
    if (req.method === "PUT") {
      const [row] = await sb("recipes?id=eq." + id, { method: "PATCH", body: JSON.stringify(toRow(req.body)) });
      return res.status(200).json(toRecipe(row));
    }
    if (req.method === "DELETE") {
      if (String(req.query.confirm || "").trim().toLowerCase() !== "excluir receita") {
        return res.status(400).json({ erro: "Confirmação incorreta." });
      }
      await sb("recipes?id=eq." + id, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ erro: "Método não permitido" });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
};
