import { useState, useEffect } from "react";
import { fetchComAuth } from "../utils/api";

export default function ListaHospedes() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ nome: "", cpf: "" });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDischarge, setShowDischarge] = useState(false);
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeReason, setDischargeReason] = useState("");

  async function carregarHospedes() {
    try {
      const url = `/pessoas?nome=${filters.nome}&cpf=${filters.cpf}&size=50`;
      const dados = await fetchComAuth(url);
      setRecords(dados.content || dados);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    carregarHospedes();
  }, []);

  function executarBusca(e) {
    e.preventDefault();
    carregarHospedes();
  }

  async function registrarSaida(e) {
    e.preventDefault();
    try {
      await fetchComAuth(`/pessoas/${selectedRecord.id}/desligamentos`, {
        method: "POST",
        body: JSON.stringify({
          dataDesligamento: dischargeDate,
          motivo: dischargeReason
        })
      });
      setShowDischarge(false);
      setSelectedRecord(null);
      carregarHospedes();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="search-panel" style={{ marginTop: 0 }}>
      <form className="filters-panel" style={{ gridTemplateColumns: "1fr 1fr auto" }} onSubmit={executarBusca}>
        <label className="filter-field">
          <span>Nome</span>
          <input value={filters.nome} onChange={(e) => setFilters({ ...filters, nome: e.target.value })} placeholder="Buscar por nome" />
        </label>
        <label className="filter-field">
          <span>CPF</span>
          <input value={filters.cpf} onChange={(e) => setFilters({ ...filters, cpf: e.target.value })} placeholder="Buscar por CPF" />
        </label>
        <button type="submit" className="primary-button" style={{ height: "40px" }}>Pesquisar</button>
      </form>

      <div className="records-list" style={{ maxHeight: "none", gridTemplateColumns: "1fr" }}>
        {records.map((r) => (
          <article key={r.id} className="record-card">
            <div>
              <strong>{r.nome}</strong>
              <span>{r.cpf || "Sem CPF informado"}</span>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className="ghost-button compact-button" onClick={() => setSelectedRecord(r)}>Detalhes</button>
              <button type="button" className="primary-button compact-button" onClick={() => { setSelectedRecord(r); setShowDischarge(true); }}>Registrar Saída</button>
            </div>
          </article>
        ))}
      </div>

      {selectedRecord && !showDischarge && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <h2 className="modal-title">{selectedRecord.nome}</h2>
            <div className="detail-list">
              <p><strong>CPF:</strong> {selectedRecord.cpf}</p>
              <p><strong>Data de Acolhimento:</strong> {selectedRecord.dataAcolhimento}</p>
              <p><strong>Condições de Saúde:</strong> {selectedRecord.condicoesSaude || "Nenhuma"}</p>
            </div>
            <div className="modal-actions" style={{ marginTop: "20px" }}>
              <button type="button" className="ghost-button" onClick={() => setSelectedRecord(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {showDischarge && (
        <div className="modal-backdrop">
          <form className="modal-container" onSubmit={registrarSaida}>
            <h2 className="modal-title">Desligamento de Hóspede</h2>
            <div className="form-grid single" style={{ marginBottom: "15px" }}>
              <label className="field">
                <span>Data de Saída</span>
                <input type="date" value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)} required />
              </label>
              <label className="field">
                <span>Motivo</span>
                <textarea value={dischargeReason} onChange={(e) => setDischargeReason(e.target.value)} required />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="ghost-button" onClick={() => setShowDischarge(false)}>Cancelar</button>
              <button type="submit" className="primary-button">Confirmar Saída</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}