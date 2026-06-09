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
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [pdfUploadQueue, setPdfUploadQueue] = useState([]);

  function cleanCPF(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function valueOrNull(value) {
    const cleanValue = String(value || "").trim();
    return cleanValue ? cleanValue : null;
  }

  function pessoaToEditForm(pessoa) {
    return {
      dataAcolhimento: pessoa.dataAcolhimento || "",
      dataRetorno1: pessoa.dataRetorno1 || "",
      dataRetorno2: pessoa.dataRetorno2 || "",
      dataRetorno3: pessoa.dataRetorno3 || "",
      demandaEspontanea: Boolean(pessoa.demandaEspontanea),
      instituicaoEncaminhamento: pessoa.instituicaoEncaminhamento || "",
      nome: pessoa.nome || "",
      nomeSocial: pessoa.nomeSocial || "",
      dataNascimento: pessoa.dataNascimento || "",
      escolaridade: pessoa.escolaridade || "",
      nacionalidade: pessoa.nacionalidade || "",
      naturalidade: pessoa.naturalidade || "",
      estadoCivil: pessoa.estadoCivil || "",
      filhos: pessoa.filhos || "",
      mae: pessoa.mae || "",
      pai: pessoa.pai || "",
      referenciasSociofamiliares: pessoa.referenciasSociofamiliares || "",
      genero: pessoa.genero || "OUTRO",
      telefone: pessoa.telefone || "",
      cpf: pessoa.cpf || "",
      rg: pessoa.rg || "",
      tituloEleitoral: pessoa.tituloEleitoral || "",
      carteiraTrabalho: pessoa.carteiraTrabalho || "",
      certidaoNascimento: pessoa.certidaoNascimento || "",
      boletimOcorrencia: pessoa.boletimOcorrencia || "",
      numeroNis: pessoa.numeroNis || "",
      cadUnico: Boolean(pessoa.cadUnico),
      cartaoSus: pessoa.cartaoSus || "",
      condicoesSaude: pessoa.condicoesSaude || "",
      medicamentosEmUso: pessoa.medicamentosEmUso || "",
      alergiasRestricoes: pessoa.alergiasRestricoes || "",
      outrasAlergias: pessoa.outrasAlergias || "",
      usaSubstanciasPsicoativas: Boolean(pessoa.usaSubstanciasPsicoativas),
      substanciasQuais: pessoa.substanciasQuais || "",
      atividadesRealizadas: pessoa.atividadesRealizadas || "",
      oficinasParticipadas: pessoa.oficinasParticipadas || "",
      observacoes: pessoa.observacoes || "",
      aceitouTermo: Boolean(pessoa.aceitouTermo),
      dataAssinaturaTermo: pessoa.dataAssinaturaTermo || "",
      ultimaDataEntrada: pessoa.ultimaDataEntrada || pessoa.dataAcolhimento || "",
      ultimaDataSaida: pessoa.ultimaDataSaida || ""
    };
  }

  function editFormToPayload(form) {
    return {
      dataAcolhimento: form.dataAcolhimento || null,
      horaAcolhimento: null,
      dataRetorno1: form.dataRetorno1 || null,
      dataRetorno2: form.dataRetorno2 || null,
      dataRetorno3: form.dataRetorno3 || null,
      instituicaoEncaminhamento: valueOrNull(form.instituicaoEncaminhamento),
      demandaEspontanea: Boolean(form.demandaEspontanea),
      nome: String(form.nome || "").trim(),
      nomeSocial: valueOrNull(form.nomeSocial),
      dataNascimento: form.dataNascimento || null,
      escolaridade: valueOrNull(form.escolaridade),
      nacionalidade: valueOrNull(form.nacionalidade),
      naturalidade: valueOrNull(form.naturalidade),
      estadoCivil: valueOrNull(form.estadoCivil),
      filhos: valueOrNull(form.filhos),
      mae: valueOrNull(form.mae),
      pai: valueOrNull(form.pai),
      referenciasSociofamiliares: valueOrNull(form.referenciasSociofamiliares),
      genero: form.genero || "OUTRO",
      telefone: valueOrNull(form.telefone),
      cpf: form.cpf ? cleanCPF(form.cpf) : null,
      rg: valueOrNull(form.rg),
      orgaoExpedidorRg: null,
      tituloEleitoral: valueOrNull(form.tituloEleitoral),
      carteiraTrabalho: valueOrNull(form.carteiraTrabalho),
      certidaoNascimento: valueOrNull(form.certidaoNascimento),
      boletimOcorrencia: valueOrNull(form.boletimOcorrencia),
      numeroNis: valueOrNull(form.numeroNis),
      cadUnico: Boolean(form.cadUnico),
      cartaoSus: valueOrNull(form.cartaoSus),
      condicoesSaude: valueOrNull(form.condicoesSaude),
      medicamentosEmUso: valueOrNull(form.medicamentosEmUso),
      alergiasRestricoes: valueOrNull(form.alergiasRestricoes),
      outrasAlergias: valueOrNull(form.outrasAlergias),
      usaSubstanciasPsicoativas: Boolean(form.usaSubstanciasPsicoativas),
      substanciasQuais: valueOrNull(form.substanciasQuais),
      atividadesRealizadas: valueOrNull(form.atividadesRealizadas),
      oficinasParticipadas: valueOrNull(form.oficinasParticipadas),
      observacoes: valueOrNull(form.observacoes),
      aceitouTermo: Boolean(form.aceitouTermo),
      dataAssinaturaTermo: form.dataAssinaturaTermo || null,
      ultimaDataEntrada: form.ultimaDataEntrada || null,
      ultimaDataSaida: form.ultimaDataSaida || null
    };
  }

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
    setShowEdit(false);
    setEditForm(null);
    setPdfUploadQueue([]);
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

  function abrirEdicao() {
    if (!details?.pessoa) return;
    setEditForm(pessoaToEditForm(details.pessoa));
    setPdfUploadQueue([]);
    setShowEdit(true);
  }

  function atualizarCampoEdicao(event) {
    const { name, value, type, checked } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function salvarEdicao(event) {
    event.preventDefault();
    if (!selectedRecord?.id || !editForm || isSavingEdit) return;

    if (!String(editForm.nome || "").trim()) {
      setNotification({ type: "error", message: "Nome completo e obrigatorio." });
      return;
    }

    setIsSavingEdit(true);
    try {
      const pessoaAtualizada = await fetchComAuth(`/pessoas/${selectedRecord.id}`, {
        method: "PUT",
        body: JSON.stringify(editFormToPayload(editForm))
      });
      if (pdfUploadQueue.length > 0) {
        await Promise.all(pdfUploadQueue.map((documento) => {
          const formData = new FormData();
          formData.append("arquivo", documento.file);
          formData.append("tipo", "PDF");

          return fetchComAuth(`/pessoas/${selectedRecord.id}/documentos`, {
            method: "POST",
            body: formData
          });
        }));
      }
      const documentos = await fetchComAuth(`/pessoas/${selectedRecord.id}/documentos`).catch(() => []);
      setDetails((current) => current ? { ...current, pessoa: pessoaAtualizada } : current);
      setDetails((current) => current ? { ...current, documentos } : current);
      setSelectedRecord((current) => current ? {
        ...current,
        nome: pessoaAtualizada.nome,
        cpf: pessoaAtualizada.cpf,
        dataAcolhimento: pessoaAtualizada.dataAcolhimento,
        ultimaDataSaida: pessoaAtualizada.ultimaDataSaida
      } : current);
      setShowEdit(false);
      setPdfUploadQueue([]);
      setNotification({ type: "success", message: "Acolhido atualizado com sucesso." });
      carregarHospedes();
    } catch (error) {
      console.error(error);
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel atualizar o acolhido.") });
    } finally {
      setIsSavingEdit(false);
    }
  }

  function formatFileSize(bytes) {
    if (!Number.isFinite(bytes)) return "";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function adicionarPdfEdicao(event) {
    const selectedFiles = Array.from(event.target.files || []);
    const acceptedDocuments = [];
    let hasRejectedFile = false;

    selectedFiles.forEach((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isWithinLimit = file.size <= 20 * 1024 * 1024;

      if (!isPdf || !isWithinLimit) {
        hasRejectedFile = true;
        return;
      }

      acceptedDocuments.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size
      });
    });

    if (acceptedDocuments.length > 0) {
      setPdfUploadQueue((current) => [...current, ...acceptedDocuments]);
    }

    if (hasRejectedFile) {
      setNotification({ type: "error", message: "Anexe apenas PDFs de ate 20 MB." });
    }

    event.target.value = "";
  }

  function removerPdfFila(documentId) {
    setPdfUploadQueue((current) => current.filter((documento) => documento.id !== documentId));
  }

  async function excluirDocumento(documento) {
    const confirmed = window.confirm(`Excluir o PDF "${documento.nomeOriginal}"?`);
    if (!confirmed) return;

    try {
      await fetchComAuth(`/pessoas/${selectedRecord.id}/documentos/${documento.id}`, {
        method: "DELETE"
      });
      setDetails((current) => current ? {
        ...current,
        documentos: current.documentos.filter((item) => item.id !== documento.id)
      } : current);
      setNotification({ type: "success", message: "PDF excluido com sucesso." });
    } catch (error) {
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Nao foi possivel excluir o PDF.") });
    }
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
                {!showEdit && <button type="button" className="ghost-button" onClick={abrirEdicao} disabled={!details?.pessoa}>Editar Acolhido</button>}
                <button type="button" className="ghost-button" onClick={imprimirFicha}>Imprimir ficha</button>
                <button type="button" className="ghost-button" onClick={() => setSelectedRecord(null)}>Fechar</button>
              </div>
            </div>
            {showEdit && editForm && (
              <form className="edit-panel no-print" onSubmit={salvarEdicao}>
                <div className="section-title compact">
                  <strong>Editar acolhido</strong>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Data de Acolhimento *</span>
                    <input type="date" name="dataAcolhimento" value={editForm.dataAcolhimento} onChange={atualizarCampoEdicao} required />
                  </label>
                  <label className="field">
                    <span>Demanda Espontanea</span>
                    <select name="demandaEspontanea" value={editForm.demandaEspontanea ? "sim" : "nao"} onChange={(event) => setEditForm((current) => ({ ...current, demandaEspontanea: event.target.value === "sim" }))}>
                      <option value="sim">Sim</option>
                      <option value="nao">Nao</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Data de Retorno 1</span>
                    <input type="date" name="dataRetorno1" value={editForm.dataRetorno1} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Data de Retorno 2</span>
                    <input type="date" name="dataRetorno2" value={editForm.dataRetorno2} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Data de Retorno 3</span>
                    <input type="date" name="dataRetorno3" value={editForm.dataRetorno3} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Instituicao de Encaminhamento</span>
                    <input name="instituicaoEncaminhamento" value={editForm.instituicaoEncaminhamento} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field field-full">
                    <span>Nome Completo *</span>
                    <input name="nome" value={editForm.nome} onChange={atualizarCampoEdicao} required />
                  </label>
                  <label className="field">
                    <span>Nome Social</span>
                    <input name="nomeSocial" value={editForm.nomeSocial} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Data de Nascimento</span>
                    <input type="date" name="dataNascimento" value={editForm.dataNascimento} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Escolaridade</span>
                    <input name="escolaridade" value={editForm.escolaridade} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Nacionalidade</span>
                    <input name="nacionalidade" value={editForm.nacionalidade} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Naturalidade</span>
                    <input name="naturalidade" value={editForm.naturalidade} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Estado Civil</span>
                    <input name="estadoCivil" value={editForm.estadoCivil} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Filhos</span>
                    <input name="filhos" value={editForm.filhos} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input name="telefone" value={editForm.telefone} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>CPF</span>
                    <input name="cpf" value={editForm.cpf} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>RG</span>
                    <input name="rg" value={editForm.rg} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Titulo Eleitoral</span>
                    <input name="tituloEleitoral" value={editForm.tituloEleitoral} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Carteira de Trabalho</span>
                    <input name="carteiraTrabalho" value={editForm.carteiraTrabalho} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Certidao de Nascimento</span>
                    <input name="certidaoNascimento" value={editForm.certidaoNascimento} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Boletim de Ocorrencia</span>
                    <input name="boletimOcorrencia" value={editForm.boletimOcorrencia} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>NIS</span>
                    <input name="numeroNis" value={editForm.numeroNis} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="acceptance">
                    <input type="checkbox" name="cadUnico" checked={editForm.cadUnico} onChange={atualizarCampoEdicao} />
                    CadUnico
                  </label>
                  <label className="field">
                    <span>Cartao SUS</span>
                    <input name="cartaoSus" value={editForm.cartaoSus} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Mae</span>
                    <input name="mae" value={editForm.mae} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Pai</span>
                    <input name="pai" value={editForm.pai} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field field-full">
                    <span>Referencias sociofamiliares</span>
                    <textarea name="referenciasSociofamiliares" rows="3" value={editForm.referenciasSociofamiliares} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field field-full">
                    <span>Condicoes de Saude</span>
                    <textarea name="condicoesSaude" rows="3" value={editForm.condicoesSaude} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Medicamentos em Uso</span>
                    <input name="medicamentosEmUso" value={editForm.medicamentosEmUso} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Alergias/Restricoes</span>
                    <input name="alergiasRestricoes" value={editForm.alergiasRestricoes} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field">
                    <span>Outras alergias</span>
                    <input name="outrasAlergias" value={editForm.outrasAlergias} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="acceptance">
                    <input type="checkbox" name="usaSubstanciasPsicoativas" checked={editForm.usaSubstanciasPsicoativas} onChange={atualizarCampoEdicao} />
                    Usa SPA
                  </label>
                  <label className="field field-full">
                    <span>Substancias quais</span>
                    <input name="substanciasQuais" value={editForm.substanciasQuais} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field field-full">
                    <span>Atividades realizadas</span>
                    <textarea name="atividadesRealizadas" rows="2" value={editForm.atividadesRealizadas} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="field field-full">
                    <span>Observacoes</span>
                    <textarea name="observacoes" rows="3" value={editForm.observacoes} onChange={atualizarCampoEdicao} />
                  </label>
                  <label className="acceptance field-full">
                    <input type="checkbox" name="aceitouTermo" checked={editForm.aceitouTermo} onChange={atualizarCampoEdicao} />
                    Usuario ciente do termo
                  </label>
                  <div className="field field-full">
                    <span>Documentos complementares em PDF</span>
                    <label className="pdf-upload-box">
                      <input type="file" accept="application/pdf,.pdf" multiple onChange={adicionarPdfEdicao} />
                      <strong>Adicionar PDFs</strong>
                      <small>Voce pode anexar novos documentos. Limite de 20 MB por arquivo.</small>
                    </label>
                    <div className="documents-panel">
                      <strong>PDFs ja anexados</strong>
                      {details.documentos.filter((documento) => documento.tipo === "PDF").length === 0 && (
                        <p>Nenhum PDF anexado.</p>
                      )}
                      {details.documentos.filter((documento) => documento.tipo === "PDF").map((documento) => (
                        <div className="document-row" key={documento.id}>
                          <span>{documento.nomeOriginal}</span>
                          <div className="document-actions">
                            <button type="button" className="ghost-button compact-button" onClick={() => baixarDocumento(documento)}>
                              Abrir
                            </button>
                            <button type="button" className="danger-button compact-button" onClick={() => excluirDocumento(documento)}>
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pdfUploadQueue.length > 0 && (
                      <div className="pdf-document-list">
                        <strong>PDFs para anexar ao salvar</strong>
                        {pdfUploadQueue.map((documento) => (
                          <article key={documento.id} className="pdf-document-item">
                            <div>
                              <strong>{documento.name}</strong>
                              <span>{formatFileSize(documento.size)}</span>
                            </div>
                            <button type="button" className="danger-button compact-button" onClick={() => removerPdfFila(documento.id)}>
                              Remover
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="ghost-button" onClick={() => setShowEdit(false)}>Cancelar</button>
                  <button type="submit" className="primary-button" disabled={isSavingEdit}>{isSavingEdit ? "Salvando..." : "Salvar alteracoes"}</button>
                </div>
              </form>
            )}
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
