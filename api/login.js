const { sign, passwordOk } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });
  const senha = (req.body && req.body.senha) || "";
  if (!process.env.APP_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(500).json({ erro: "Servidor sem senha configurada (veja o README)." });
  }
  if (!passwordOk(senha)) {
    await new Promise((r) => setTimeout(r, 800)); // dificulta tentativas em sequência
    return res.status(401).json({ erro: "Senha incorreta." });
  }
  res.status(200).json({ token: sign({ exp: Date.now() + 8 * 3600 * 1000 }) });
};
