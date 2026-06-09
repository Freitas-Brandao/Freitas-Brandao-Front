import { useState, useEffect } from "react";
import { fetchComAuth, getFriendlyErrorMessage } from "../utils/api";
import { formatDateBR } from "../utils/formatters";

const DRAFT_KEY = "freitas-brandao-rascunho";

const sections = [
  { id: "inicio", label: "Iniciais" },
  { id: "pessoais", label: "Dados pessoais" },
  { id: "documentos", label: "Documentação" },
  { id: "beneficios", label: "Benefícios" },
  { id: "saude", label: "Saúde" },
  { id: "referencias", label: "Referências" },
  { id: "termo", label: "Termo" },
  { id: "acompanhamento", label: "Acompanhamento" },
  { id: "revisao", label: "Revisão" }
];

const emptyGuest = {
  dataAcolhimento: "",
  dataRetornos: [],
  demandaEspontanea: "sim",
  instituicaoEncaminhamento: "",
  motivoEntrada: "",
  nome: "",
  nomeSocial: "",
  dataNascimento: "",
  idade: "",
  escolaridade: "",
  nacionalidade: "",
  naturalidade: "",
  estadoCivil: "",
  filhos: "",
  referenciasFamiliares: "",
  mae: "",
  pai: "",
  rg: "",
  cpf: "",
  tituloEleitoral: "",
  carteiraTrabalho: "",
  certidaoNascimento: "",
  boletimOcorrencia: "",
  recebeBolsaFamilia: false,
  recebeBpc: false,
  recebeAposentadoria: false,
  recebeCadUnico: false,
  numeroNis: "",
  outrosBeneficios: "",
  problemaSaude: false,
  problemaSaudeQual: "",
  alergia: false,
  alergiaQual: "",
  medicamentoControlado: false,
  medicamentoQual: "",
  usaSpa: false,
  usaSpaQual: "",
  outraAlergia: false,
  outraAlergiaQual: "",
  cartaoSus: "",
  atividadeProfissional: "",
  enderecoReferencia: "",
  telefoneContato: "",
  observacoes: "",
  aceitouTermo: false,
  evolucoes: [{ data: "", descricao: "", responsavel: "" }],
  encaminhamentos: [{ data: "", destino: "", descricao: "" }],
  desligamentos: []
};

function cleanCPF(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCPF(value) {
  const cpf = cleanCPF(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calculateDigit = (base, factor) => {
    const total = base.split("").reduce((sum, digit) => sum + Number(digit) * factor--, 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const firstDigit = calculateDigit(cpf.slice(0, 9), 10);
  const secondDigit = calculateDigit(cpf.slice(0, 10), 11);
  return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10]);
}

function sanitizePayload(value) {
  const returnDates = Array.isArray(value.dataRetornos)
    ? value.dataRetornos
    : [value.dataRetorno1, value.dataRetorno2, value.dataRetorno3].filter(Boolean);

  return {
    dataAcolhimento: value.dataAcolhimento || null,
    horaAcolhimento: null,
    dataRetorno1: returnDates[0] || null,
    dataRetorno2: returnDates[1] || null,
    dataRetorno3: returnDates[2] || null,
    instituicaoEncaminhamento: value.instituicaoEncaminhamento ? String(value.instituicaoEncaminhamento).trim() : null,
    demandaEspontanea: value.demandaEspontanea === "sim" || value.demandaEspontanea === true,
    nome: String(value.nome || "").trim(),
    nomeSocial: value.nomeSocial ? String(value.nomeSocial).trim() : null,
    dataNascimento: value.dataNascimento || null,
    escolaridade: value.escolaridade ? String(value.escolaridade).trim() : null,
    nacionalidade: value.nacionalidade ? String(value.nacionalidade).trim() : null,
    naturalidade: value.naturalidade ? String(value.naturalidade).trim() : null,
    estadoCivil: value.estadoCivil ? String(value.estadoCivil).trim() : null,
    filhos: value.filhos ? String(value.filhos).trim() : null,
    mae: value.mae ? String(value.mae).trim() : null,
    pai: value.pai ? String(value.pai).trim() : null,
    referenciasSociofamiliares: value.referenciasFamiliares ? String(value.referenciasFamiliares).trim() : null,
    genero: "OUTRO",
    telefone: value.telefoneContato ? String(value.telefoneContato).trim() : null,
    cpf: value.cpf ? cleanCPF(value.cpf) : null,
    rg: value.rg ? String(value.rg).trim() : null,
    orgaoExpedidorRg: null,
    tituloEleitoral: value.tituloEleitoral ? String(value.tituloEleitoral).trim() : null,
    carteiraTrabalho: value.carteiraTrabalho ? String(value.carteiraTrabalho).trim() : null,
    certidaoNascimento: value.certidaoNascimento ? String(value.certidaoNascimento).trim() : null,
    boletimOcorrencia: value.boletimOcorrencia ? String(value.boletimOcorrencia).trim() : null,
    numeroNis: value.numeroNis ? String(value.numeroNis).trim() : null,
    cadUnico: Boolean(value.recebeCadUnico),
    cartaoSus: value.cartaoSus ? String(value.cartaoSus).trim() : null,
    condicoesSaude: [
      value.problemaSaude ? `Problema de saúde: ${value.problemaSaudeQual || "sim"}` : "",
      value.medicamentoControlado ? `Medicação controlada: ${value.medicamentoQual || "sim"}` : ""
    ].filter(Boolean).join("\n") || null,
    medicamentosEmUso: value.medicamentoQual ? String(value.medicamentoQual).trim() : null,
    alergiasRestricoes: value.alergiaQual ? String(value.alergiaQual).trim() : null,
    outrasAlergias: value.outraAlergiaQual ? String(value.outraAlergiaQual).trim() : null,
    usaSubstanciasPsicoativas: value.usaSpa === "sim" || value.usaSpa === true,
    substanciasQuais: value.usaSpaQual ? String(value.usaSpaQual).trim() : null,
    atividadesRealizadas: value.atividadeProfissional ? String(value.atividadeProfissional).trim() : null,
    oficinasParticipadas: null,
    observacoes: value.observacoes ? String(value.observacoes).trim() : null,
    aceitouTermo: Boolean(value.aceitouTermo),
    dataAssinaturaTermo: value.aceitouTermo ? new Date().toISOString().slice(0, 10) : null,
    ultimaDataEntrada: value.dataAcolhimento || null,
    ultimaDataSaida: null
  };
}

const hasText = (value) => String(value || "").trim().length > 0;

function filledItems(items, requiredFields) {
  return (items || []).filter((item) => requiredFields.some((field) => hasText(item[field])));
}

function emptyDischarge() {
  return {
    data: "",
    motivo: "",
    devolveuRoupas: false,
    levouDocumentos: false,
    temLesoes: false,
    tecnicoResponsavel: "",
    observacoes: ""
  };
}

function termoOrientacaoTexto() {
  return [
    "O acolhimento se inicia com a entrega do kit higiene e orientações iniciais.",
    "O(A) usuário(a) que se negar a tomar banho não será acolhido(a) no abrigo.",
    "Após o banho, o(a) usuário(a) deverá realizar seu cadastro e será encaminhado(a) ao quarto pela equipe.",
    "Não será permitido acolhimento sob uso ou porte de álcool, outras drogas, armas ou objetos cortantes.",
    "O usuário terá direito a saídas semanais conforme organização da equipe técnica.",
    "O não cumprimento das orientações poderá acarretar desligamento do(a) usuário(a).",
    "Os pertences e documentos são de responsabilidade de cada usuário(a).",
    "A higienização dos espaços privativos é essencial e de responsabilidade do usuário(a).",
    "Situações adversas serão avaliadas pela equipe, priorizando cuidado e integridade dos usuários."
  ];
}

function normalizeGuestDraft(savedGuest) {
  const draft = savedGuest && typeof savedGuest === "object" ? savedGuest : {};

  return {
    ...emptyGuest,
    ...draft,
    dataRetornos: Array.isArray(draft.dataRetornos)
      ? draft.dataRetornos
      : [draft.dataRetorno1, draft.dataRetorno2, draft.dataRetorno3].filter(Boolean),
    evolucoes: Array.isArray(draft.evolucoes) && draft.evolucoes.length > 0
      ? draft.evolucoes
      : emptyGuest.evolucoes,
    encaminhamentos: Array.isArray(draft.encaminhamentos) && draft.encaminhamentos.length > 0
      ? draft.encaminhamentos
      : emptyGuest.encaminhamentos,
    desligamentos: Array.isArray(draft.desligamentos)
      ? draft.desligamentos
      : emptyGuest.desligamentos
  };
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CadastroHospede() {
  const [currentSection, setCurrentSection] = useState("inicio");
  const [guest, setGuest] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? normalizeGuestDraft(JSON.parse(saved)) : normalizeGuestDraft();
    } catch {
      return normalizeGuestDraft();
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [pdfDocuments, setPdfDocuments] = useState([]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(guest));
  }, [guest]);

  const selectedIndex = sections.findIndex((s) => s.id === currentSection);
  const progress = Math.round(((selectedIndex + 1) / sections.length) * 100);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setGuest((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  function validateGuest() {
    const errors = {};
    if (!String(guest.nome || "").trim()) errors.nome = "Nome completo é obrigatório.";
    if (!String(guest.dataAcolhimento || "").trim()) errors.dataAcolhimento = "Data de acolhimento é obrigatória.";
    if (String(guest.cpf || "").trim() && !isValidCPF(guest.cpf)) errors.cpf = "CPF inválido.";
    
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotification({ type: "error", message: "Revise os campos obrigatórios." });
      return false;
    }
    return true;
  }

  function updateListItem(listName, index, field, value) {
    setGuest((current) => ({
      ...current,
      [listName]: current[listName].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }));
  }

  function updateReturnDate(index, value) {
    setGuest((current) => {
      const currentDates = Array.isArray(current.dataRetornos)
        ? current.dataRetornos
        : [current.dataRetorno1, current.dataRetorno2, current.dataRetorno3].filter(Boolean);

      return {
        ...current,
        dataRetornos: currentDates.map((date, dateIndex) => (dateIndex === index ? value : date))
      };
    });
  }

  function addReturnDate() {
    setGuest((current) => {
      const currentDates = Array.isArray(current.dataRetornos)
        ? current.dataRetornos
        : [current.dataRetorno1, current.dataRetorno2, current.dataRetorno3].filter(Boolean);

      if (currentDates.length >= 3) return current;

      return {
        ...current,
        dataRetornos: [...currentDates, ""]
      };
    });
  }

  function removeReturnDate(index) {
    setGuest((current) => {
      const currentDates = Array.isArray(current.dataRetornos)
        ? current.dataRetornos
        : [current.dataRetorno1, current.dataRetorno2, current.dataRetorno3].filter(Boolean);

      return {
        ...current,
        dataRetornos: currentDates.filter((_, dateIndex) => dateIndex !== index)
      };
    });
  }

  function addListItem(listName, item) {
    setGuest((current) => ({
      ...current,
      [listName]: [...current[listName], item]
    }));
  }

  function removeListItem(listName, index) {
    setGuest((current) => ({
      ...current,
      [listName]: current[listName].filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function handlePdfDocumentsChange(event) {
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
      setPdfDocuments((current) => [...current, ...acceptedDocuments]);
    }

    if (hasRejectedFile) {
      setNotification({ type: "error", message: "Anexe apenas PDFs de ate 20 MB." });
    }

    event.target.value = "";
  }

  function removePdfDocument(documentId) {
    setPdfDocuments((current) => current.filter((document) => document.id !== documentId));
  }

  async function uploadPdfDocuments(pessoaId) {
    await Promise.all(pdfDocuments.map((document) => {
      const formData = new FormData();
      formData.append("arquivo", document.file);
      formData.append("tipo", "PDF");

      return fetchComAuth(`/pessoas/${pessoaId}/documentos`, {
        method: "POST",
        body: formData
      });
    }));
  }

  async function submitRelatedRecords(pessoaId) {
    await fetchComAuth(`/pessoas/${pessoaId}/beneficios`, {
      method: "POST",
      body: JSON.stringify({
        bolsaFamilia: Boolean(guest.recebeBolsaFamilia),
        bpc: Boolean(guest.recebeBpc),
        auxilioBrasil: Boolean(guest.recebeAposentadoria || guest.recebeCadUnico),
        seguroDesemprego: false,
        outrosBeneficios: [
          guest.numeroNis ? `NIS: ${guest.numeroNis}` : "",
          guest.recebeCadUnico ? "CadÚnico: sim" : "",
          guest.outrosBeneficios || ""
        ].filter(Boolean).join("\n") || null
      })
    });

    if (hasText(guest.referenciasFamiliares) || hasText(guest.telefoneContato)) {
      await fetchComAuth(`/pessoas/${pessoaId}/referencias`, {
        method: "POST",
        body: JSON.stringify({
          nome: guest.referenciasFamiliares || "Referência não informada",
          telefone: guest.telefoneContato || null,
          parentesco: "Referência sociofamiliar"
        })
      });
    }

    const requests = [];

    filledItems(guest.desligamentos, ["data", "motivo", "tecnicoResponsavel", "observacoes"]).forEach((item) => {
      if (!item.data) return;
      requests.push(fetchComAuth(`/pessoas/${pessoaId}/desligamentos`, {
        method: "POST",
        body: JSON.stringify(item)
      }));
    });

    filledItems(guest.evolucoes, ["data", "descricao", "responsavel"]).forEach((item) => {
      if (!item.data || !hasText(item.descricao)) return;
      requests.push(fetchComAuth(`/pessoas/${pessoaId}/evolucoes`, {
        method: "POST",
        body: JSON.stringify(item)
      }));
    });

    filledItems(guest.encaminhamentos, ["data", "destino", "descricao"]).forEach((item) => {
      if (!item.data || !hasText(item.destino)) return;
      requests.push(fetchComAuth(`/pessoas/${pessoaId}/encaminhamentos`, {
        method: "POST",
        body: JSON.stringify(item)
      }));
    });

    await Promise.all(requests);
  }

  async function submitToApi() {
    if (isSubmitting || !validateGuest()) return;
    setIsSubmitting(true);
    try {
      const payload = sanitizePayload(guest);
      const pessoaSalva = await fetchComAuth("/pessoas", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (pessoaSalva?.id) {
        await submitRelatedRecords(pessoaSalva.id);
      }
      if (pdfDocuments.length > 0 && pessoaSalva?.id) {
        try {
          await uploadPdfDocuments(pessoaSalva.id);
        } catch (error) {
          setNotification({ type: "error", message: `Cadastro salvo, mas houve erro ao anexar PDF: ${getFriendlyErrorMessage(error)}` });
          return;
        }
      }
      setNotification({ type: "success", message: "Cadastro concluído com sucesso!" });
      setGuest({ ...emptyGuest });
      setPdfDocuments([]);
      setCurrentSection("inicio");
    } catch (error) {
      setNotification({ type: "error", message: getFriendlyErrorMessage(error, "Erro ao salvar no servidor corporativo.") });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="workspace" style={{ marginTop: 0, gridTemplateColumns: "1fr" }}>
      {notification && <div className={`toast ${notification.type}`}>{notification.message}</div>}
      
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {sections.map((s, i) => (
          <button 
            key={s.id} 
            type="button" 
            className={`step-item ${s.id === currentSection ? "active" : ""}`} 
            style={{ width: "auto", whiteSpace: "nowrap", paddingRight: "18px" }} 
            onClick={() => setCurrentSection(s.id)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {s.label}
          </button>
        ))}
      </div>

      <div className="form-panel" style={{ padding: "24px" }}>
        {currentSection === "inicio" && (
          <div className="form-grid">
            <label className="field">
              <span>Data de Acolhimento *</span>
              <input type="date" name="dataAcolhimento" value={guest.dataAcolhimento} onChange={updateField} />
              {fieldErrors.dataAcolhimento && <small className="field-error">{fieldErrors.dataAcolhimento}</small>}
            </label>
            <fieldset className="radio-group">
              <legend>Demanda Espontânea</legend>
              <label><input type="radio" name="demandaEspontanea" value="sim" checked={guest.demandaEspontanea === "sim"} onChange={updateField} /> Sim</label>
              <label><input type="radio" name="demandaEspontanea" value="nao" checked={guest.demandaEspontanea === "nao"} onChange={updateField} /> Não</label>
            </fieldset>
            <div className="field field-full">
              <span>Datas de Retorno</span>
              <div className="dynamic-list compact-dates">
                {(guest.dataRetornos || []).map((date, index) => (
                  <div className="return-date-row" key={`retorno-${index}`}>
                    <label className="field">
                      <span>Data de Retorno {index + 1}</span>
                      <input type="date" value={date} onChange={(event) => updateReturnDate(index, event.target.value)} />
                    </label>
                    <button type="button" className="danger-button compact-button" onClick={() => removeReturnDate(index)}>
                      Remover
                    </button>
                  </div>
                ))}
                {(guest.dataRetornos || []).length < 3 && (
                  <button type="button" className="ghost-button compact-button inline-action" onClick={addReturnDate}>
                    Adicionar data de retorno
                  </button>
                )}
              </div>
            </div>
            <label className="field">
              <span>Instituição de Encaminhamento</span>
              <input name="instituicaoEncaminhamento" value={guest.instituicaoEncaminhamento} onChange={updateField} />
            </label>
            <label className="field field-full">
              <span>Motivo da Entrada</span>
              <textarea name="motivoEntrada" rows="3" value={guest.motivoEntrada} onChange={updateField} />
            </label>
          </div>
        )}

        {currentSection === "pessoais" && (
          <div className="form-grid">
            <label className="field field-full">
              <span>Nome Completo *</span>
              <input name="nome" value={guest.nome} onChange={updateField} />
              {fieldErrors.nome && <small className="field-error">{fieldErrors.nome}</small>}
            </label>
            <label className="field">
              <span>Nome Social</span>
              <input name="nomeSocial" value={guest.nomeSocial} onChange={updateField} />
            </label>
            <label className="field">
              <span>Data de Nascimento</span>
              <input type="date" name="dataNascimento" value={guest.dataNascimento} onChange={updateField} />
            </label>
            <label className="field">
              <span>Escolaridade</span>
              <input name="escolaridade" value={guest.escolaridade} onChange={updateField} />
            </label>
            <label className="field">
              <span>Nacionalidade</span>
              <input name="nacionalidade" value={guest.nacionalidade} onChange={updateField} />
            </label>
            <label className="field">
              <span>Naturalidade</span>
              <input name="naturalidade" value={guest.naturalidade} onChange={updateField} />
            </label>
            <label className="field">
              <span>Estado Civil</span>
              <input name="estadoCivil" value={guest.estadoCivil} onChange={updateField} />
            </label>
            <label className="field">
              <span>Filhos</span>
              <input name="filhos" value={guest.filhos} onChange={updateField} />
            </label>
            <label className="field">
              <span>Mãe</span>
              <input name="mae" value={guest.mae} onChange={updateField} />
            </label>
            <label className="field">
              <span>Pai</span>
              <input name="pai" value={guest.pai} onChange={updateField} />
            </label>
            <label className="field field-full">
              <span>Principais referências sociofamiliares</span>
              <textarea name="referenciasFamiliares" rows="3" value={guest.referenciasFamiliares} onChange={updateField} />
            </label>
          </div>
        )}

        {currentSection === "documentos" && (
          <div className="form-grid">
            <label className="field">
              <span>CPF</span>
              <input name="cpf" value={guest.cpf} onChange={updateField} />
              {fieldErrors.cpf && <small className="field-error">{fieldErrors.cpf}</small>}
            </label>
            <label className="field">
              <span>RG</span>
              <input name="rg" value={guest.rg} onChange={updateField} />
            </label>
            <label className="field">
              <span>Título Eleitoral</span>
              <input name="tituloEleitoral" value={guest.tituloEleitoral} onChange={updateField} />
            </label>
            <label className="field">
              <span>Carteira de Trabalho</span>
              <input name="carteiraTrabalho" value={guest.carteiraTrabalho} onChange={updateField} />
            </label>
            <label className="field">
              <span>Certidão de Nascimento</span>
              <input name="certidaoNascimento" value={guest.certidaoNascimento} onChange={updateField} />
            </label>
            <label className="field">
              <span>Boletim de Ocorrência</span>
              <input name="boletimOcorrencia" value={guest.boletimOcorrencia} onChange={updateField} />
            </label>
            <div className="field field-full">
              <span>Documentos complementares em PDF</span>
              <label className="pdf-upload-box">
                <input type="file" accept="application/pdf,.pdf" multiple onChange={handlePdfDocumentsChange} />
                <strong>Adicionar documentos em PDF</strong>
                <small>Voce pode anexar varios documentos complementares. Limite de 20 MB por arquivo.</small>
              </label>
              {pdfDocuments.length > 0 && (
                <div className="pdf-document-list">
                  {pdfDocuments.map((document) => (
                    <article key={document.id} className="pdf-document-item">
                      <div>
                        <strong>{document.name}</strong>
                        <span>{formatFileSize(document.size)}</span>
                      </div>
                      <button type="button" className="danger-button compact-button" onClick={() => removePdfDocument(document.id)}>
                        Excluir
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentSection === "beneficios" && (
          <div>
            <div className="check-grid">
              <label><input type="checkbox" name="recebeBolsaFamilia" checked={guest.recebeBolsaFamilia} onChange={updateField} /> Bolsa Família</label>
              <label><input type="checkbox" name="recebeBpc" checked={guest.recebeBpc} onChange={updateField} /> BPC</label>
              <label><input type="checkbox" name="recebeAposentadoria" checked={guest.recebeAposentadoria} onChange={updateField} /> Aposentadoria</label>
              <label><input type="checkbox" name="recebeCadUnico" checked={guest.recebeCadUnico} onChange={updateField} /> CadÚnico</label>
            </div>
            <div className="form-grid" style={{ marginTop: "15px" }}>
              <label className="field">
                <span>Número do NIS</span>
                <input name="numeroNis" value={guest.numeroNis} onChange={updateField} />
              </label>
              <label className="field">
                <span>Outros benefícios</span>
                <input name="outrosBeneficios" value={guest.outrosBeneficios} onChange={updateField} />
              </label>
            </div>
          </div>
        )}

        {currentSection === "saude" && (
          <div className="form-grid">
            <label className="acceptance"><input type="checkbox" name="problemaSaude" checked={guest.problemaSaude} onChange={updateField} /> Algum problema de saúde?</label>
            <label className="field">
              <span>Qual?</span>
              <input name="problemaSaudeQual" value={guest.problemaSaudeQual} onChange={updateField} />
            </label>
            <label className="acceptance"><input type="checkbox" name="alergia" checked={guest.alergia} onChange={updateField} /> Algum tipo de alergia?</label>
            <label className="field">
              <span>Qual?</span>
              <input name="alergiaQual" value={guest.alergiaQual} onChange={updateField} />
            </label>
            <label className="acceptance"><input type="checkbox" name="medicamentoControlado" checked={guest.medicamentoControlado} onChange={updateField} /> Faz uso de medicação controlada?</label>
            <label className="field">
              <span>Qual?</span>
              <input name="medicamentoQual" value={guest.medicamentoQual} onChange={updateField} />
            </label>
            <label className="acceptance"><input type="checkbox" name="usaSpa" checked={guest.usaSpa} onChange={updateField} /> Faz uso de SPA?</label>
            <label className="field">
              <span>Qual?</span>
              <input name="usaSpaQual" value={guest.usaSpaQual} onChange={updateField} />
            </label>
            <label className="acceptance"><input type="checkbox" name="outraAlergia" checked={guest.outraAlergia} onChange={updateField} /> Outra alergia/restrição?</label>
            <label className="field">
              <span>Qual?</span>
              <input name="outraAlergiaQual" value={guest.outraAlergiaQual} onChange={updateField} />
            </label>
            <label className="field field-full">
              <span>Número do Cartão do SUS</span>
              <input name="cartaoSus" value={guest.cartaoSus} onChange={updateField} />
            </label>
          </div>
        )}

        {currentSection === "referencias" && (
          <div className="form-grid">
            <label className="field field-full">
              <span>Atividade Profissional</span>
              <input name="atividadeProfissional" value={guest.atividadeProfissional} onChange={updateField} />
            </label>
            <label className="field field-full">
              <span>Endereço de Referência</span>
              <input name="enderecoReferencia" value={guest.enderecoReferencia} onChange={updateField} />
            </label>
            <label className="field field-full">
              <span>Telefone de Contato</span>
              <input name="telefoneContato" value={guest.telefoneContato} onChange={updateField} />
            </label>
            <label className="field field-full">
              <span>Observações Gerais</span>
              <textarea name="observacoes" rows="4" value={guest.observacoes} onChange={updateField} />
            </label>
          </div>
        )}

        {currentSection === "termo" && (
          <div className="guidance-box">
            {termoOrientacaoTexto().map((item) => <p key={item}>• {item}</p>)}
            <label className="acceptance">
              <input type="checkbox" name="aceitouTermo" checked={guest.aceitouTermo} onChange={updateField} />
              Usuário ciente das normas e regulamentos do abrigo.
            </label>
          </div>
        )}

        {currentSection === "acompanhamento" && (
          <div className="dynamic-list">
            <div className="list-toolbar discharge-toolbar">
              <strong>Evolução</strong>
              <button type="button" className="ghost-button compact-button" onClick={() => addListItem("evolucoes", { data: "", descricao: "", responsavel: "" })}>Adicionar linha</button>
            </div>
            {guest.evolucoes.map((item, index) => (
              <div className="list-card" key={`evolucao-${index}`}>
                <label className="field"><span>Data</span><input type="date" value={item.data} onChange={(e) => updateListItem("evolucoes", index, "data", e.target.value)} /></label>
                <label className="field"><span>Responsável</span><input value={item.responsavel} onChange={(e) => updateListItem("evolucoes", index, "responsavel", e.target.value)} /></label>
                <label className="field field-full"><span>Descrição</span><textarea rows="2" value={item.descricao} onChange={(e) => updateListItem("evolucoes", index, "descricao", e.target.value)} /></label>
                {guest.evolucoes.length > 1 && <button type="button" className="danger-button compact-button" onClick={() => removeListItem("evolucoes", index)}>Excluir linha</button>}
              </div>
            ))}

            <div className="list-toolbar">
              <strong>Encaminhamentos realizados durante acolhimento</strong>
              <button type="button" className="ghost-button compact-button" onClick={() => addListItem("encaminhamentos", { data: "", destino: "", descricao: "" })}>Adicionar linha</button>
            </div>
            {guest.encaminhamentos.map((item, index) => (
              <div className="list-card referral" key={`encaminhamento-${index}`}>
                <label className="field"><span>Mês/Data</span><input type="date" value={item.data} onChange={(e) => updateListItem("encaminhamentos", index, "data", e.target.value)} /></label>
                <label className="field"><span>Encaminhamento</span><input value={item.destino} onChange={(e) => updateListItem("encaminhamentos", index, "destino", e.target.value)} /></label>
                <label className="field field-full"><span>Descrição</span><textarea rows="2" value={item.descricao} onChange={(e) => updateListItem("encaminhamentos", index, "descricao", e.target.value)} /></label>
                {guest.encaminhamentos.length > 1 && <button type="button" className="danger-button compact-button" onClick={() => removeListItem("encaminhamentos", index)}>Excluir linha</button>}
              </div>
            ))}

            <div className="list-toolbar">
              <strong>Termos de desligamento</strong>
              {guest.desligamentos.length < 4 && (
                <button type="button" className="ghost-button compact-button" onClick={() => addListItem("desligamentos", emptyDischarge())}>
                  Adicionar desligamento
                </button>
              )}
            </div>
            {guest.desligamentos.length === 0 && <p className="muted">Nenhum desligamento adicionado.</p>}
            {guest.desligamentos.length > 0 && (
              <div className="discharge-grid">
                {guest.desligamentos.map((item, index) => (
                  <div className="discharge-card" key={`desligamento-${index}`}>
                    <div className="card-heading">
                      <h3>Desligamento {index + 1}</h3>
                      <button type="button" className="danger-button compact-button" onClick={() => removeListItem("desligamentos", index)}>
                        Excluir
                      </button>
                    </div>
                    <label className="field"><span>Data</span><input type="date" value={item.data} onChange={(e) => updateListItem("desligamentos", index, "data", e.target.value)} /></label>
                    <label className="field"><span>Motivo</span><textarea rows="2" value={item.motivo} onChange={(e) => updateListItem("desligamentos", index, "motivo", e.target.value)} /></label>
                    <label><input type="checkbox" checked={item.devolveuRoupas} onChange={(e) => updateListItem("desligamentos", index, "devolveuRoupas", e.target.checked)} /> Devolveu as roupas de cama?</label>
                    <label><input type="checkbox" checked={item.levouDocumentos} onChange={(e) => updateListItem("desligamentos", index, "levouDocumentos", e.target.checked)} /> Levou documentos?</label>
                    <label><input type="checkbox" checked={item.temLesoes} onChange={(e) => updateListItem("desligamentos", index, "temLesoes", e.target.checked)} /> Tem lesões corporais?</label>
                    <label className="field"><span>Técnico responsável</span><input value={item.tecnicoResponsavel} onChange={(e) => updateListItem("desligamentos", index, "tecnicoResponsavel", e.target.value)} /></label>
                    <label className="field"><span>Observações</span><textarea rows="2" value={item.observacoes} onChange={(e) => updateListItem("desligamentos", index, "observacoes", e.target.value)} /></label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentSection === "revisao" && (
          <div className="review-grid">
            <div className="review-card"><span>Nome</span><strong>{guest.nome}</strong></div>
            <div className="review-card"><span>Acolhimento</span><strong>{formatDateBR(guest.dataAcolhimento)}</strong></div>
            <div className="review-card"><span>CPF</span><strong>{guest.cpf}</strong></div>
            <div className="review-card"><span>Documentos PDF</span><strong>{pdfDocuments.length}</strong></div>
            <div className="review-card"><span>Evoluções</span><strong>{filledItems(guest.evolucoes, ["data", "descricao"]).length}</strong></div>
            <div className="review-card"><span>Encaminhamentos</span><strong>{filledItems(guest.encaminhamentos, ["data", "destino"]).length}</strong></div>
          </div>
        )}
      </div>

      <footer className="actions-bar" style={{ marginTop: "20px" }}>
        <button type="button" className="ghost-button" disabled={selectedIndex === 0} onClick={() => setCurrentSection(sections[selectedIndex - 1].id)}>Voltar</button>
        {selectedIndex < sections.length - 1 ? (
          <button type="button" className="primary-button" onClick={() => setCurrentSection(sections[selectedIndex + 1].id)}>Avançar</button>
        ) : (
          <button type="button" className="primary-button" disabled={isSubmitting} onClick={submitToApi}>{isSubmitting ? "Salvando..." : "Concluir Cadastro"}</button>
        )}
      </footer>
    </div>
  );
}
