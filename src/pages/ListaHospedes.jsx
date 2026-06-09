import { useState, useEffect } from "react";
import { API_URL, fetchComAuth, getFriendlyErrorMessage } from "../utils/api";
import { formatDateBR } from "../utils/formatters";

export default function ListaHospedes() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ nome: "", cpf: "" });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDischarge, setShowDischarge] = useState(false);
  const [dischargeDate, setDischargeDate] = useState("");
  const [dischargeReason, setDischargeReason] = useState("");
  const [notification, setNotification] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function carregarHospedes() {
    try {
      const url = `/pessoas?nome=${filters.nome}&cpf=${filters.cpf}&size=50`;
      const dados = await fetchComAuth(url);
      setRecords(dados.content || dados);
    } catch (error) {
      console.error(error);
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel carregar os acolhidos.") });
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
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel registrar a saida.") });
    }
  }

  async function excluirAcolhido(record) {
    const confirmed = window.confirm(`Excluir o acolhido "${record.nome}"? Esta acao tambem remove documentos, desligamentos e demais registros vinculados.`);
    if (!confirmed) return;

    try {
      await fetchComAuth(`/pessoas/${record.id}`, {
        method: "DELETE"
      });
      setNotification({ type: "success", message: "Acolhido excluido com sucesso." });
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
        setShowDischarge(false);
      }
      carregarHospedes();
    } catch (error) {
      console.error(error);
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel excluir o acolhido.") });
    }
  }

  async function abrirDetalhes(record) {
    setSelectedRecord(record);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const [pessoa, beneficios, referencias, desligamentos, evolucoes, encaminhamentos, documentos] = await Promise.all([
        fetchComAuth(`/pessoas/${record.id}`),
        fetchComAuth(`/pessoas/${record.id}/beneficios`).catch(() => null),
        fetchComAuth(`/pessoas/${record.id}/referencias`).catch(() => []),
        fetchComAuth(`/pessoas/${record.id}/desligamentos`).catch(() => []),
        fetchComAuth(`/pessoas/${record.id}/evolucoes`).catch(() => []),
        fetchComAuth(`/pessoas/${record.id}/encaminhamentos`).catch(() => []),
        fetchComAuth(`/pessoas/${record.id}/documentos`).catch(() => [])
      ]);
      setDetails({ pessoa, beneficios, referencias, desligamentos, evolucoes, encaminhamentos, documentos });
    } catch (error) {
      console.error(error);
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel carregar os detalhes.") });
    } finally {
      setDetailsLoading(false);
    }
  }

  function imprimirFicha() {
    document.body.classList.add("printing-ficha");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-ficha"), 500);
  }

  async function baixarDocumento(documento) {
    try {
      const tokenBase64 = localStorage.getItem("authToken");
      const resposta = await fetch(`${API_URL}/pessoas/${selectedRecord.id}/documentos/${documento.id}/download`, {
        headers: tokenBase64 ? { Authorization: `Basic ${tokenBase64}` } : {}
      });

      if (!resposta.ok) throw new Error("Nao foi possivel abrir o documento.");

      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel abrir o documento.") });
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
              <button type="button" className="ghost-button compact-button" onClick={() => abrirDetalhes(r)}>Detalhes</button>
              <button type="button" className="danger-button compact-button" onClick={() => excluirAcolhido(r)}>Excluir Acolhido</button>
              {!r.ultimaDataSaida && (
                <button type="button" className="primary-button compact-button" onClick={() => { setSelectedRecord(r); setShowDischarge(true); }}>Registrar Saída</button>
              )}
            </div>
          </article>
        ))}
      </div>

      {selectedRecord && !showDischarge && (
        <div className="modal-backdrop">
          <div className="modal-panel ficha-modal">
            <div className="modal-header no-print">
              <div>
                <span>Ficha de acolhimento</span>
                <h2>{selectedRecord.nome}</h2>
                <p>CPF: {selectedRecord.cpf || "Sem CPF informado"}</p>
              </div>
              <div className="modal-header-actions">
                <button type="button" className="ghost-button" onClick={imprimirFicha}>Imprimir ficha</button>
                <button type="button" className="ghost-button" onClick={() => setSelectedRecord(null)}>Fechar</button>
              </div>
            </div>
            <div className="print-sheet">
              {detailsLoading && <p className="muted no-print">Carregando ficha...</p>}
              {!detailsLoading && details && (
                <>
                  <header className="print-header">
                    <strong>PREFEITURA MUNICIPAL DE ARACAJU</strong>
                    <strong>SECRETARIA MUNICIPAL DA FAMÍLIA E DA ASSISTÊNCIA SOCIAL</strong>
                    <strong>CASA DE PASSAGEM MUNICIPAL FREITAS BRANDÃO</strong>
                    <h2>FICHA DE ACOLHIMENTO - ADULTO</h2>
                  </header>
                  <section className="print-section">
                    <h3>1. INFORMAÇÕES INICIAIS</h3>
                    <div className="print-grid">
                      <p><strong>Data de Acolhimento:</strong> {formatDateBR(details.pessoa.dataAcolhimento)}</p>
                      <p><strong>Retorno 1:</strong> {formatDateBR(details.pessoa.dataRetorno1)}</p>
                      <p><strong>Retorno 2:</strong> {formatDateBR(details.pessoa.dataRetorno2)}</p>
                      <p><strong>Retorno 3:</strong> {formatDateBR(details.pessoa.dataRetorno3)}</p>
                    </div>
                    <p><strong>Instituição de Encaminhamento:</strong> {details.pessoa.instituicaoEncaminhamento || ""}</p>
                    <p><strong>Demanda Espontânea:</strong> {details.pessoa.demandaEspontanea ? "Sim" : "Não"}</p>
                  </section>
                  <section className="print-section">
                    <h3>2. DADOS PESSOAIS</h3>
                    <div className="print-grid">
                      <p><strong>Nome:</strong> {details.pessoa.nome}</p>
                      <p><strong>Data de Nascimento:</strong> {formatDateBR(details.pessoa.dataNascimento)}</p>
                      <p><strong>Idade:</strong> {details.pessoa.idade || ""}</p>
                      <p><strong>Escolaridade:</strong> {details.pessoa.escolaridade || ""}</p>
                      <p><strong>Nacionalidade:</strong> {details.pessoa.nacionalidade || ""}</p>
                      <p><strong>Naturalidade:</strong> {details.pessoa.naturalidade || ""}</p>
                      <p><strong>Estado Civil:</strong> {details.pessoa.estadoCivil || ""}</p>
                      <p><strong>Filhos:</strong> {details.pessoa.filhos || ""}</p>
                      <p><strong>Mãe:</strong> {details.pessoa.mae || ""}</p>
                      <p><strong>Pai:</strong> {details.pessoa.pai || ""}</p>
                    </div>
                    <p><strong>Referências sociofamiliares:</strong> {details.pessoa.referenciasSociofamiliares || ""}</p>
                  </section>
                  <section className="print-section">
                    <h3>3. DOCUMENTAÇÃO</h3>
                    <div className="print-grid">
                      <p><strong>RG:</strong> {details.pessoa.rg || ""}</p>
                      <p><strong>CPF:</strong> {details.pessoa.cpf || ""}</p>
                      <p><strong>Título Eleitoral:</strong> {details.pessoa.tituloEleitoral || ""}</p>
                      <p><strong>Carteira de Trabalho:</strong> {details.pessoa.carteiraTrabalho || ""}</p>
                      <p><strong>Certidão de Nascimento:</strong> {details.pessoa.certidaoNascimento || ""}</p>
                      <p><strong>Boletim de Ocorrência:</strong> {details.pessoa.boletimOcorrencia || ""}</p>
                    </div>
                    <div className="documents-panel">
                      <strong>Documentos complementares em PDF</strong>
                      {details.documentos.filter((documento) => documento.tipo === "PDF").length === 0 && (
                        <p>Nenhum PDF anexado.</p>
                      )}
                      {details.documentos.filter((documento) => documento.tipo === "PDF").map((documento) => (
                        <div className="document-row" key={documento.id}>
                          <span>{documento.nomeOriginal}</span>
                          <button type="button" className="ghost-button compact-button no-print" onClick={() => baixarDocumento(documento)}>
                            Abrir PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="print-section">
                    <h3>4. BENEFÍCIOS E SAÚDE</h3>
                    <p><strong>Bolsa Família:</strong> {details.beneficios?.bolsaFamilia ? "Sim" : "Não"} | <strong>BPC:</strong> {details.beneficios?.bpc ? "Sim" : "Não"} | <strong>CadÚnico:</strong> {details.pessoa.cadUnico ? "Sim" : "Não"}</p>
                    <p><strong>NIS:</strong> {details.pessoa.numeroNis || ""}</p>
                    <p><strong>Condições de Saúde:</strong> {details.pessoa.condicoesSaude || ""}</p>
                    <p><strong>Alergias:</strong> {details.pessoa.alergiasRestricoes || ""}</p>
                    <p><strong>Outras alergias/restrições:</strong> {details.pessoa.outrasAlergias || ""}</p>
                    <p><strong>Medicação:</strong> {details.pessoa.medicamentosEmUso || ""}</p>
                    <p><strong>Cartão SUS:</strong> {details.pessoa.cartaoSus || ""}</p>
                  </section>
                  <section className="print-section">
                    <h3>5. EVOLUÇÃO</h3>
                    <table><tbody>{details.evolucoes.map((item) => <tr key={item.id}><td>{formatDateBR(item.data)}</td><td>{item.descricao}</td><td>{item.responsavel}</td></tr>)}</tbody></table>
                  </section>
                  <section className="print-section">
                    <h3>6. ENCAMINHAMENTOS REALIZADOS DURANTE ACOLHIMENTO</h3>
                    <table><tbody>{details.encaminhamentos.map((item) => <tr key={item.id}><td>{formatDateBR(item.data)}</td><td>{item.destino}</td><td>{item.descricao}</td></tr>)}</tbody></table>
                  </section>
                  <section className="print-section">
                    <h3>7. TERMO DE DESLIGAMENTO</h3>
                    <table><tbody>{details.desligamentos.map((item) => <tr key={item.id}><td>{formatDateBR(item.data)}</td><td>{item.motivo}</td><td>{item.tecnicoResponsavel}</td></tr>)}</tbody></table>
                  </section>
                  <section className="print-section">
                    <h3>8. TERMO DE ORIENTAÇÃO</h3>
                    <p>{details.pessoa.aceitouTermo ? "Usuário(a) ciente das normas e regulamentos do abrigo." : "Termo ainda não aceito."}</p>
                  </section>
                </>
              )}
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
