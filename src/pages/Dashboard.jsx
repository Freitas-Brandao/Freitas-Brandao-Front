import { useState, useEffect } from "react";
import { fetchComAuth, getFriendlyErrorMessage } from "../utils/api";

export default function Dashboard() {
  const [totalAcolhidos, setTotalAcolhidos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDadosVitais() {
      try {
        const dados = await fetchComAuth("/pessoas?size=1");
        setTotalAcolhidos(dados.totalElements || 0);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        setErro(getFriendlyErrorMessage(error, "Nao foi possivel carregar os indicadores."));
      } finally {
        setCarregando(false);
      }
    }

    carregarDadosVitais();
  }, []);

  return (
    <section className="form-panel">
      <div className="section-title">
        <span>Visão Geral</span>
        <h2>Dashboard do Abrigo</h2>
      </div>

      {carregando ? (
        <p className="muted"><span className="spinner"></span> Atualizando indicadores...</p>
      ) : erro ? (
        <div className="toast error" style={{ position: "relative", top: 0, right: 0, width: "100%" }}>{erro}</div>
      ) : (
        <div className="review-grid" style={{ marginTop: "24px" }}>
          <article className="review-card" style={{ borderLeft: "4px solid var(--blue)" }}>
            <span>Total de Acolhidos no Sistema</span>
            <strong style={{ fontSize: "2rem", color: "var(--blue-dark)" }}>{totalAcolhidos}</strong>
          </article>

          <article className="review-card" style={{ borderLeft: "4px solid var(--gold)" }}>
            <span>Aguardando Revisão</span>
            <strong style={{ fontSize: "2rem", color: "var(--gold)" }}>0</strong>
          </article>
        </div>
      )}
    </section>
  );
}
