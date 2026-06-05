import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    const tokenBase64 = btoa(`${usuario}:${senha}`);

    try {
      const resposta = await fetch("http://localhost:8080/api/auth/me", {
        headers: {
          "Authorization": `Basic ${tokenBase64}`
        }
      });

      if (resposta.ok) {
        localStorage.setItem("authToken", tokenBase64);
        navigate("/");
      } else {
        setErro("Usuário ou senha incorretos.");
      }
    } catch (error) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="modal-backdrop" style={{ position: "relative", minHeight: "100vh" }}>
      <form className="modal-container" onSubmit={handleLogin}>
        <h2 className="modal-title">Acesso Restrito</h2>
        <p className="modal-body">Casa de Passagem Freitas Brandão</p>

        {erro && <div className="toast error" style={{ position: "relative", top: 0, right: 0, width: "100%", marginBottom: "16px" }}>{erro}</div>}

        <div className="form-grid single" style={{ marginBottom: "24px" }}>
          <label className="field">
            <span>Usuário</span>
            <input value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          </label>
          <label className="field">
            <span>Senha</span>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
          </label>
        </div>

        <div className="modal-actions">
          <button type="submit" className="primary-button full-button" disabled={carregando}>
            {carregando ? "Autenticando..." : "Entrar no Sistema"}
          </button>
        </div>
      </form>
    </div>
  );
}