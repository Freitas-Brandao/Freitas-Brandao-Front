import { useState, useEffect } from "react";
import { fetchComAuth } from "../utils/api";
import { formatDateBR } from "../utils/formatters";

export default function ListaHospedes() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ nome: "", cpf: "" });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDischarge, setShowDischarge] = useState(false);
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeReason, setDischargeReason] = useState("");
  const [notification, setNotification] = useState(null);

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
          data: dischargeDate,
          motivo: dischargeReason
        })
      });
      setShowDischarge(false);
      setSelectedRecord(null);
      setDischargeDate("");
      setDischargeReason("");
      setNotification({ type: "success", message: "Saida registrada com sucesso." });
      carregarHospedes();
    } catch (error) {
      console.error(error);
      setNotification({ type: "error", message: "Nao foi possivel registrar a saida." });
    }
  }

  return (
    <div className="search-panel" style={{ marginTop: 0 }}>
      {notification && <div className={`toast ${notification.type}`}>{notification.message}</div>}
      <form className="filters-panel hospedes-filters" onSubmit={executarBusca}>
        <label className="filter-field">
          <span>Nome</span>
          <input value={filters.nome} onChange={(e) => setFilters({ ...filters, nome: e.target.value })} placeholder="Buscar por nome" />
        </label>
        <label className="filter-field">
          <span>CPF</span>
          <input value={filters.cpf} onChange={(e) => setFilters({ ...filters, cpf: e.target.value })} placeholder="Buscar por CPF" />
        </label>
        <button type="submit" className="primary-button search-submit">Pesquisar</button>
      </form>

      <div className="records-list hospedes-list">
        {records.map((r) => (
          <article key={r.id} className="record-card">
            <div className="record-card-info">
              <strong>{r.nome || "Nome nao informado"}</strong>
              <span>CPF: {r.cpf || "Sem CPF informado"}</span>
              {r.dataAcolhimento && <small>Acolhimento: {formatDateBR(r.dataAcolhimento)}</small>}
              {r.ultimaDataSaida && <small className="status-badge danger">Desligado em {formatDateBR(r.ultimaDataSaida)}</small>}
            </div>
            <div className="record-card-actions">
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
              <p><strong>Data de Acolhimento:</strong> {formatDateBR(selectedRecord.dataAcolhimento)}</p>
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
            <h2 className="modal-title">Desligamento de Acolhido</h2>
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
