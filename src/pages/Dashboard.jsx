import { useState, useEffect } from "react";

export default function Dashboard() {
  const [totalHospedes, setTotalHospedes] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDadosVitais() {
      try {
        const token = localStorage.getItem("authToken");
        const resposta = await fetch("http://localhost:8080/api/pessoas?size=1", {
          headers: { "Authorization": `Basic ${token}` }
        });
        
        if (resposta.ok) {
          const dados = await resposta.json();
          setTotalHospedes(dados.totalElements || 0); 
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
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
      ) : (
        <div className="review-grid" style={{ marginTop: "24px" }}>
          <article className="review-card" style={{ borderLeft: "4px solid var(--blue)" }}>
            <span>Total de Cadastros no Sistema</span>
            <strong style={{ fontSize: "2rem", color: "var(--blue-dark)" }}>{totalHospedes}</strong>
          </article>
          
          <article className="review-card" style={{ borderLeft: "4px solid var(--green)" }}>
            <span>Hóspedes Ativos (Acolhidos)</span>
            {/* Como ainda não temos o filtro específico no back, coloquei um texto placeholder didático */}
            <strong style={{ fontSize: "2rem", color: "var(--green)" }}>--</strong>
            <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>*Requer filtro no backend</p>
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