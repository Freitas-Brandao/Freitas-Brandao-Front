import { useEffect, useMemo, useState } from "react";
import prefeituraLogo from "./assets/prefeitura-aracaju.png";
import assistenciaLogo from "./assets/assistencia-social.jfif";
import { emptyGuest, getRecordKey, createEvolution, createReferral } from "./hooks/useGuestData";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const STORAGE_KEY = "freitas-brandao-hospedes";
const DRAFT_KEY = "freitas-brandao-rascunho";

const sections = [
  { id: "inicio", label: "Iniciais" },
  { id: "pessoais", label: "Dados pessoais" },
  { id: "documentos", label: "Documentação" },
  { id: "beneficios", label: "Benefícios e saúde" },
  { id: "referencias", label: "Referências" },
  { id: "termo", label: "Termo" },
  { id: "acompanhamento", label: "Acompanhamento" },
  { id: "revisao", label: "Revisão" }
];

function createDischarge(number) {
  return {
    id: crypto.randomUUID(),
    numero: number,
    data: "",
    motivo: "",
    condicoesSaida: "",
    encaminhamentoRealizado: "",
    observacoesFinais: "",
    devolveuRoupas: false,
    levouDocumentos: false,
    temLesoes: false,
    assinaturaUsuario: "",
    tecnico: "",
    dataTecnico: ""
  };
}

function renumberDischarges(items) {
  return items.map((item, index) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    numero: index + 1
  }));
}

function cleanCPF(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidCPF(value) {
  const cpf = cleanCPF(value);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calculateDigit = (base, factor) => {
    const total = base
      .split("")
      .reduce((sum, digit) => sum + Number(digit) * factor--, 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calculateDigit(cpf.slice(0, 9), 10);
  const secondDigit = calculateDigit(cpf.slice(0, 10), 11);

  return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10]);
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toDateFilterValue(value) {
  if (!value) {
    return "";
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const brazilianDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brazilianDate) {
    return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function isServerUnavailableError(error) {
  return (
    error?.name === "AbortError" ||
    error instanceof TypeError ||
    Number(error?.status) >= 500
  );
}

function hasDischargeInfo(item) {
  return Boolean(
    item?.data ||
      item?.motivo ||
      item?.condicoesSaida ||
      item?.encaminhamentoRealizado ||
      item?.observacoesFinais ||
      item?.tecnico ||
      item?.assinaturaUsuario
  );
}

function getLatestDischarge(record) {
  return (record?.desligamentos || []).filter(hasDischargeInfo).at(-1) || null;
}

function getGuestStatus(record) {
  return getLatestDischarge(record) ? "Desligado" : "Acolhido";
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).split("-");
    return `${day}/${month}/${year}`;
  }

  return text;
}

function SearchIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Zm0-2a5.3 5.3 0 1 0 0-10.6 5.3 5.3 0 0 0 0 10.6Z" />
      <path d="m16.2 15.5 4.1 4.1-1.4 1.4-4.1-4.1 1.4-1.4Z" />
    </svg>
  );
}

function Field({ label, children, full = false, error = "" }) {
  return (
    <label className={`field ${full ? "field-full" : ""} ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

function RadioGroup({ label, name, value, onChange, trueValue = true, falseValue = false }) {
  return (
    <fieldset className="radio-group">
      <legend>{label}</legend>
      <label>
        <input type="radio" name={name} value={String(trueValue)} checked={value === trueValue} onChange={onChange} />
        Sim
      </label>
      <label>
        <input type="radio" name={name} value={String(falseValue)} checked={value === falseValue} onChange={onChange} />
        Não
      </label>
    </fieldset>
  );
}

function App() {
  const [currentSection, setCurrentSection] = useState("inicio");
  const [guest, setGuest] = useState(() => readDraft());
  const [records, setRecords] = useState(() => readRecords());
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Rascunho local");
  const [apiStatus, setApiStatus] = useState("Aguardando envio");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [filters, setFilters] = useState({
    nome: "",
    cpf: "",
    protocolo: "",
    dataAcolhimento: ""
  });
  const [detailRecordKey, setDetailRecordKey] = useState("");
  const [deleteTargetKey, setDeleteTargetKey] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [dischargeDraft, setDischargeDraft] = useState(null);
  const [dischargeErrors, setDischargeErrors] = useState({});
  const [showEvolutionPanel, setShowEvolutionPanel] = useState(false);
  const [evolutionDraft, setEvolutionDraft] = useState(() => createEvolution());
  const [evolutionErrors, setEvolutionErrors] = useState({});

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(guest));
  }, [guest]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = window.setTimeout(() => setNotification(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!detailRecordKey && !deleteTargetKey && !dischargeDraft) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key !== "Escape") {
        return;
      }

      if (deleteTargetKey) {
        closeDeleteModal();
      } else if (dischargeDraft) {
        closeDischargeModal();
      } else {
        closeDetailsModal();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [detailRecordKey, deleteTargetKey, dischargeDraft]);

  const selectedIndex = sections.findIndex((section) => section.id === currentSection);
  const progress = Math.round(((selectedIndex + 1) / sections.length) * 100);

  const filteredRecords = useMemo(() => {
    const nameFilter = normalizeSearch(filters.nome);
    const cpfFilter = cleanCPF(filters.cpf);
    const protocolFilter = normalizeSearch(filters.protocolo);
    const dateFilter = filters.dataAcolhimento;

    return records.filter((record) => {
      const matchesName = !nameFilter || normalizeSearch(record?.nome).includes(nameFilter);
      const matchesCPF = !cpfFilter || cleanCPF(record?.cpf).includes(cpfFilter);
      const matchesProtocol = !protocolFilter || normalizeSearch(record?.protocolo).includes(protocolFilter);
      const matchesDate = !dateFilter || toDateFilterValue(record?.dataAcolhimento) === dateFilter;

      return matchesName && matchesCPF && matchesProtocol && matchesDate;
    });
  }, [records, filters]);

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const detailRecord = useMemo(
    () => records.find((record) => getRecordKey(record) === detailRecordKey) || null,
    [records, detailRecordKey]
  );
  const deleteTarget = useMemo(
    () => records.find((record) => getRecordKey(record) === deleteTargetKey) || null,
    [records, deleteTargetKey]
  );

  function readDraft() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? normalizeGuest(JSON.parse(saved)) : { ...emptyGuest };
    } catch {
      return { ...emptyGuest };
    }
  }

  function readRecords() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).map(normalizeGuest) : [];
    } catch {
      return [];
    }
  }

  function normalizeGuest(value) {
    return {
      ...emptyGuest,
      ...value,
      id: normalizeBackendId(value?.id),
      localId: value?.localId || crypto.randomUUID(),
      demandaEspontanea: normalizeYesNo(value?.demandaEspontanea, "sim"),
      problemaSaude: normalizeBoolean(value?.problemaSaude, false),
      alergia: normalizeBoolean(value?.alergia, false),
      medicamentoControlado: normalizeBoolean(value?.medicamentoControlado, false),
      usaSpa: normalizeBoolean(value?.usaSpa, false),
      outraAlergia: normalizeBoolean(value?.outraAlergia, false),
      desligamentos: value?.desligamentos?.length ? renumberDischarges(value.desligamentos) : [createDischarge(1)],
      evolucoes: value?.evolucoes || [],
      encaminhamentos: value?.encaminhamentos || []
    };
  }

  function normalizeBackendId(id) {
    if (typeof id === "number") {
      return id;
    }

    if (typeof id === "string" && /^\d+$/.test(id)) {
      return Number(id);
    }

    return null;
  }

  function normalizeBoolean(value, fallback) {
    if (typeof value === "boolean") {
      return value;
    }

    if (value === "sim" || value === "true") {
      return true;
    }

    if (value === "nao" || value === "false") {
      return false;
    }

    return fallback;
  }

  function normalizeYesNo(value, fallback) {
    if (value === true || value === "true" || value === "sim") {
      return "sim";
    }

    if (value === false || value === "false" || value === "nao") {
      return "nao";
    }

    return fallback;
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setGuest((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value === "true" ? true : value === "false" ? false : value
    }));

    if (fieldErrors[name]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  function updateDischarge(index, field, value) {
    setGuest((current) => ({
      ...current,
      desligamentos: current.desligamentos.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  }

  function addDischarge() {
    setGuest((current) => ({
      ...current,
      desligamentos: [...current.desligamentos, createDischarge(current.desligamentos.length + 1)]
    }));
  }

  function removeDischarge(id) {
    setGuest((current) => ({
      ...current,
      desligamentos: renumberDischarges(current.desligamentos.filter((item) => item.id !== id))
    }));
  }

  function updateList(collection, id, field, value) {
    setGuest((current) => ({
      ...current,
      [collection]: current[collection].map((item) => (item.id === id ? { ...item, [field]: value } : item))
    }));
  }

  function addListItem(collection, factory) {
    setGuest((current) => ({
      ...current,
      [collection]: [...current[collection], factory()]
    }));
  }

  function removeListItem(collection, id) {
    setGuest((current) => ({
      ...current,
      [collection]: current[collection].filter((item) => item.id !== id)
    }));
  }

  function showNotification(type, message) {
    setNotification({ type, message });
  }

  function validateGuest() {
    const errors = {};

    if (!String(guest.nome || "").trim()) {
      errors.nome = "Nome completo é obrigatório.";
    }

    if (!String(guest.dataAcolhimento || "").trim()) {
      errors.dataAcolhimento = "Data de acolhimento é obrigatória.";
    }

    if (!String(guest.dataNascimento || "").trim() && !String(guest.idade || "").trim()) {
      errors.idade = "Informe a data de nascimento ou a idade aproximada.";
    }

    if (String(guest.cpf || "").trim() && !isValidCPF(guest.cpf)) {
      errors.cpf = "CPF inválido.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      showNotification("error", "Revise os campos obrigatórios antes de salvar.");
      if (errors.dataAcolhimento) {
        setCurrentSection("inicio");
      } else if (errors.nome || errors.idade) {
        setCurrentSection("pessoais");
      } else if (errors.cpf) {
        setCurrentSection("documentos");
      }
      return false;
    }

    return true;
  }

  function buildLocalRecord() {
    const record = {
      ...guest,
      id: normalizeBackendId(guest.id),
      localId: guest.localId || crypto.randomUUID(),
      protocolo: guest.protocolo || `FB-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`
    };

    return record;
  }

  function saveLocal() {
    const record = buildLocalRecord();
    persistRecord(record);
    showNotification("success", "Rascunho salvo no navegador.");
  }

  function persistRecord(record) {
    setGuest(record);
    setRecords((current) => {
      const recordKey = getRecordKey(record);
      const exists = current.some((item) => getRecordKey(item) === recordKey);
      return exists ? current.map((item) => (getRecordKey(item) === recordKey ? record : item)) : [record, ...current];
    });
    setSelectedId(getRecordKey(record));
    setStatus("Salvo no navegador");
  }

  async function submitToApi() {
    if (isSubmitting || !validateGuest()) {
      return;
    }

    const hasBackendId = Number.isInteger(normalizeBackendId(guest.id));
    const payload = sanitizePayload(guest);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    setIsSubmitting(true);
    setApiStatus("Enviando...");

    try {
      const response = await fetch(`${API_URL}/hospedes`, {
        method: hasBackendId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      const responseData = await readResponseJson(response);
      const saved = normalizeGuest({ ...guest, ...responseData, localId: guest.localId });
      setApiStatus("Enviado para o back");
      persistRecord(saved);
      showNotification("success", "Hóspede salvo com sucesso.");
    } catch (error) {
      const message = isServerUnavailableError(error)
        ? "Não foi possível conectar ao servidor. Verifique se o backend está em execução e tente novamente."
        : "Não foi possível salvar o hóspede. Verifique os dados e tente novamente.";

      setApiStatus("Back indisponível; salvo localmente");
      persistRecord(buildLocalRecord());
      showNotification("error", message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  }

  async function readResponseJson(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  function loadRecord(record) {
    setGuest(normalizeGuest(record));
    setFieldErrors({});
    setSelectedId(getRecordKey(record));
    setStatus("Registro carregado");
    setCurrentSection("inicio");
  }

  function openGuestDetails(record) {
    setDetailRecordKey(getRecordKey(record));
    setShowEvolutionPanel(false);
    setEvolutionDraft(createEvolution());
    setEvolutionErrors({});
  }

  function closeDetailsModal() {
    setDetailRecordKey("");
    setShowEvolutionPanel(false);
    setEvolutionDraft(createEvolution());
    setEvolutionErrors({});
  }

  function editRecord(record) {
    loadRecord(record);
    closeDetailsModal();
  }

  function newRecord() {
    const blank = { ...emptyGuest, localId: crypto.randomUUID(), desligamentos: [createDischarge(1)] };
    setGuest(blank);
    setFieldErrors({});
    setSelectedId("");
    setStatus("Novo rascunho");
    setCurrentSection("inicio");
  }

  function requestDeleteRecord(record) {
    setDeleteTargetKey(getRecordKey(record));
    setDeleteConfirmation("");
  }

  function closeDeleteModal() {
    setDeleteTargetKey("");
    setDeleteConfirmation("");
  }

  function confirmDeleteRecord() {
    if (!deleteTarget || deleteConfirmation !== "EXCLUIR") {
      return;
    }

    const id = getRecordKey(deleteTarget);
    setRecords((current) => current.filter((item) => getRecordKey(item) !== id));
    if (selectedId === id) {
      newRecord();
    }
    if (detailRecordKey === id) {
      closeDetailsModal();
    }
    closeDeleteModal();
    showNotification("success", "Hóspede excluído com segurança.");
  }

  function getRecordKey(record) {
    return String(record.localId || record.id);
  }

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  function clearFilters() {
    setFilters({
      nome: "",
      cpf: "",
      protocolo: "",
      dataAcolhimento: ""
    });
  }

  function submitFilters(event) {
    event.preventDefault();
    showNotification("success", "Busca aplicada.");
  }

  function openDischargeModal(record) {
    const latestDischarge = getLatestDischarge(record);
    const base = latestDischarge || createDischarge((record.desligamentos || []).length + 1);
    setDischargeDraft({
      ...createDischarge(base.numero || 1),
      ...base,
      recordKey: getRecordKey(record)
    });
    setDischargeErrors({});
  }

  function closeDischargeModal() {
    setDischargeDraft(null);
    setDischargeErrors({});
  }

  function updateDischargeDraft(event) {
    const { name, value, type, checked } = event.target;
    setDischargeDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));

    if (dischargeErrors[name]) {
      setDischargeErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  function saveDischarge(event) {
    event.preventDefault();

    const errors = {};
    if (!String(dischargeDraft?.data || "").trim()) {
      errors.data = "Data de saída é obrigatória.";
    }
    if (!String(dischargeDraft?.motivo || "").trim()) {
      errors.motivo = "Motivo do desligamento é obrigatório.";
    }
    if (!String(dischargeDraft?.condicoesSaida || "").trim()) {
      errors.condicoesSaida = "Informe as condições de saída.";
    }

    setDischargeErrors(errors);
    if (Object.keys(errors).length > 0) {
      showNotification("error", "Revise os campos do registro de saída.");
      return;
    }

    const record = records.find((item) => getRecordKey(item) === dischargeDraft.recordKey);
    if (!record) {
      showNotification("error", "Não foi possível localizar o hóspede para registrar a saída.");
      return;
    }

    const currentDischarges = record.desligamentos || [];
    const otherDischarges = currentDischarges.filter((item) => item.id !== dischargeDraft.id && hasDischargeInfo(item));
    const savedDischarge = {
      ...dischargeDraft,
      numero: otherDischarges.length + 1
    };
    delete savedDischarge.recordKey;

    const updatedRecord = normalizeGuest({
      ...record,
      desligamentos: renumberDischarges([...otherDischarges, savedDischarge])
    });

    persistRecord(updatedRecord);
    setDetailRecordKey(getRecordKey(updatedRecord));
    closeDischargeModal();
    showNotification("success", "Registro de saída salvo com sucesso.");
  }

  function openEvolutionPanel() {
    setShowEvolutionPanel(true);
    setEvolutionDraft(createEvolution());
    setEvolutionErrors({});
  }

  function updateEvolutionDraft(event) {
    const { name, value } = event.target;
    setEvolutionDraft((current) => ({
      ...current,
      [name]: value
    }));

    if (evolutionErrors[name]) {
      setEvolutionErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  }

  function saveEvolution(event) {
    event.preventDefault();

    const errors = {};
    if (!String(evolutionDraft.data || "").trim()) {
      errors.data = "Data do acompanhamento é obrigatória.";
    }
    if (!String(evolutionDraft.texto || "").trim()) {
      errors.texto = "Descrição da evolução é obrigatória.";
    }

    setEvolutionErrors(errors);
    if (Object.keys(errors).length > 0) {
      showNotification("error", "Revise os campos da evolução.");
      return;
    }

    const record = records.find((item) => getRecordKey(item) === detailRecordKey);
    if (!record) {
      showNotification("error", "Não foi possível localizar o hóspede para salvar a evolução.");
      return;
    }

    const updatedRecord = normalizeGuest({
      ...record,
      evolucoes: [...(record.evolucoes || []), { ...evolutionDraft, id: evolutionDraft.id || crypto.randomUUID() }]
    });

    persistRecord(updatedRecord);
    setDetailRecordKey(getRecordKey(updatedRecord));
    setEvolutionDraft(createEvolution());
    setEvolutionErrors({});
    setShowEvolutionPanel(true);
    showNotification("success", "Evolução registrada com sucesso.");
  }

  function sanitizePayload(value) {
    const payload = {
      ...value,
      id: normalizeBackendId(value.id),
      idade: value.idade === "" ? null : Number(value.idade),
      demandaEspontanea: normalizeYesNo(value.demandaEspontanea, "sim"),
      evolucoes: value.evolucoes.map((item) => ({
        data: item.data,
        descricao: item.texto,
        responsavel: item.tecnico
      })),
      encaminhamentos: value.encaminhamentos.map((item) => ({
        data: item.mes,
        destino: item.encaminhamento,
        observacoes: ""
      }))
    };

    delete payload.localId;

    if (!payload.id) {
      delete payload.id;
    }

    return payload;
  }

  function nextSection() {
    setCurrentSection(sections[Math.min(selectedIndex + 1, sections.length - 1)].id);
  }

  function previousSection() {
    setCurrentSection(sections[Math.max(selectedIndex - 1, 0)].id);
  }

  function renderDetailsModal() {
    if (!detailRecord) {
      return null;
    }

    const discharge = getLatestDischarge(detailRecord);
    const documents = [
      ["CPF", detailRecord.cpf],
      ["RG", detailRecord.rg],
      ["Título eleitoral", detailRecord.tituloEleitoral],
      ["Carteira de trabalho", detailRecord.carteiraTrabalho],
      ["Certidão de nascimento", detailRecord.certidaoNascimento],
      ["Boletim de ocorrência", detailRecord.boletimOcorrencia],
      ["Cartão SUS", detailRecord.cartaoSus]
    ];
    const benefits = [
      detailRecord.recebeBolsaFamilia && "Bolsa Família",
      detailRecord.recebeBpc && "BPC",
      detailRecord.recebeAposentadoria && "Aposentadoria",
      detailRecord.recebeCadUnico && "CadÚnico",
      detailRecord.outrosBeneficios
    ].filter(Boolean);
    const health = [
      detailRecord.problemaSaude && ["Problema de saúde", detailRecord.problemaSaudeQual || "Sim"],
      detailRecord.alergia && ["Alergia", detailRecord.alergiaQual || "Sim"],
      detailRecord.medicamentoControlado && ["Medicação controlada", detailRecord.medicamentoQual || "Sim"],
      detailRecord.usaSpa && ["Substância psicoativa", detailRecord.usaSpaQual || "Sim"],
      detailRecord.outraAlergia && ["Outro cuidado/alergia", detailRecord.outraAlergiaQual || "Sim"]
    ].filter(Boolean);

    return (
      <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDetailsModal()}>
        <section className="modal-panel details-modal" role="dialog" aria-modal="true" aria-labelledby="guest-details-title">
          <header className="modal-header">
            <div>
              <span className={`status-badge ${getGuestStatus(detailRecord) === "Desligado" ? "danger" : "success"}`}>
                {getGuestStatus(detailRecord)}
              </span>
              <h2 id="guest-details-title">{detailRecord.nome || "Hóspede sem nome"}</h2>
              <p>{detailRecord.protocolo || "Sem protocolo"}</p>
            </div>
            <div className="modal-header-actions">
              <button className="ghost-button compact-button" type="button" onClick={openEvolutionPanel}>
                Evolução / Acompanhamento
              </button>
              <button className="ghost-button compact-button" type="button" onClick={() => editRecord(detailRecord)}>
                Editar ficha
              </button>
              <button className="danger-button compact-button" type="button" onClick={() => requestDeleteRecord(detailRecord)}>
                Excluir hóspede
              </button>
              <button className="icon-button" type="button" onClick={closeDetailsModal} aria-label="Fechar detalhes">
                ×
              </button>
            </div>
          </header>

          <div className="details-content">
            <DetailSection
              title="Dados principais"
              items={[
                ["Nome", detailRecord.nome],
                ["Idade", detailRecord.idade],
                ["Data de nascimento", formatDate(detailRecord.dataNascimento)],
                ["Data de acolhimento", formatDate(detailRecord.dataAcolhimento)],
                ["Telefone", detailRecord.telefoneContato],
                ["Endereço de referência", detailRecord.enderecoReferencia],
                ["Observações", detailRecord.observacoes]
              ]}
            />
            <DetailSection title="Documentos" items={documents} emptyMessage="Nenhum documento informado." />
            <DetailSection
              title="Informações sociais"
              items={[
                ["Demanda espontânea", detailRecord.demandaEspontanea === "sim" ? "Sim" : "Não"],
                ["Instituição de encaminhamento", detailRecord.instituicaoEncaminhamento],
                ["Motivo da entrada", detailRecord.motivoEntrada],
                ["Referências sociofamiliares", detailRecord.referenciasFamiliares],
                ["Mãe", detailRecord.mae],
                ["Pai", detailRecord.pai],
                ["Benefícios", benefits.join(", ")]
              ]}
            />
            <DetailSection title="Saúde e cuidados" items={health} emptyMessage="Nenhuma condição de saúde informada." />
          </div>

          {showEvolutionPanel && (
            <section className="evolution-panel" aria-label="Evolução e acompanhamento do hóspede">
              <div className="section-title compact">
                <span>Evolução / Acompanhamento</span>
                <strong>Acompanhamento do acolhimento</strong>
              </div>
              <div className="evolution-list">
                {(detailRecord.evolucoes || []).length === 0 ? (
                  <p className="muted">Nenhuma evolução registrada para este hóspede.</p>
                ) : (
                  detailRecord.evolucoes.map((item) => (
                    <article className="evolution-card" key={item.id}>
                      <div>
                        <strong>{formatDate(item.data) || "Sem data"}</strong>
                        <span>{item.tecnico || "Responsável não informado"}</span>
                      </div>
                      <p>{item.texto || item.descricao}</p>
                      {item.observacoes && <small>{item.observacoes}</small>}
                    </article>
                  ))
                )}
              </div>
              <form className="evolution-form" onSubmit={saveEvolution}>
                <div className="form-grid">
                  <Field label="Data do acompanhamento" error={evolutionErrors.data}>
                    <input type="date" name="data" value={evolutionDraft.data} onChange={updateEvolutionDraft} />
                  </Field>
                  <Field label="Responsável">
                    <input name="tecnico" value={evolutionDraft.tecnico} onChange={updateEvolutionDraft} />
                  </Field>
                  <Field label="Descrição/evolução do acolhimento" full error={evolutionErrors.texto}>
                    <textarea name="texto" rows="4" value={evolutionDraft.texto} onChange={updateEvolutionDraft} />
                  </Field>
                  <Field label="Observações" full>
                    <textarea name="observacoes" rows="3" value={evolutionDraft.observacoes} onChange={updateEvolutionDraft} />
                  </Field>
                </div>
                <div className="modal-actions">
                  <button className="ghost-button" type="button" onClick={() => setShowEvolutionPanel(false)}>
                    Fechar acompanhamento
                  </button>
                  <button className="primary-button" type="submit">
                    Salvar evolução
                  </button>
                </div>
              </form>
            </section>
          )}

          <footer className="discharge-summary">
            <div>
              <span>Registro de saída</span>
              {discharge ? (
                <div className="summary-grid">
                  <DetailItem label="Data de saída" value={formatDate(discharge.data)} />
                  <DetailItem label="Motivo" value={discharge.motivo} />
                  <DetailItem label="Condições de saída" value={discharge.condicoesSaida} />
                  <DetailItem label="Encaminhamento" value={discharge.encaminhamentoRealizado} />
                  <DetailItem label="Observações finais" value={discharge.observacoesFinais} />
                  <DetailItem label="Responsável" value={discharge.tecnico} />
                </div>
              ) : (
                <p className="muted">Nenhuma saída registrada.</p>
              )}
            </div>
            <button className="primary-button" type="button" onClick={() => openDischargeModal(detailRecord)}>
              {discharge ? "Editar saída" : "Registrar saída"}
            </button>
          </footer>
        </section>
      </div>
    );
  }

  function renderDischargeModal() {
    if (!dischargeDraft) {
      return null;
    }

    return (
      <div className="modal-backdrop top-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDischargeModal()}>
        <form className="modal-panel compact-modal" role="dialog" aria-modal="true" aria-labelledby="discharge-title" onSubmit={saveDischarge}>
          <header className="modal-header">
            <div>
              <span>Condições de saída</span>
              <h2 id="discharge-title">{hasDischargeInfo(dischargeDraft) ? "Editar saída" : "Registrar saída"}</h2>
            </div>
            <button className="icon-button" type="button" onClick={closeDischargeModal} aria-label="Fechar registro de saída">
              ×
            </button>
          </header>

          <div className="form-grid single">
            <Field label="Data de saída" error={dischargeErrors.data}>
              <input type="date" name="data" value={dischargeDraft.data || ""} onChange={updateDischargeDraft} />
            </Field>
            <Field label="Motivo do desligamento" full error={dischargeErrors.motivo}>
              <textarea name="motivo" rows="3" value={dischargeDraft.motivo || ""} onChange={updateDischargeDraft} />
            </Field>
            <Field label="Condições de saída" full error={dischargeErrors.condicoesSaida}>
              <textarea name="condicoesSaida" rows="3" value={dischargeDraft.condicoesSaida || ""} onChange={updateDischargeDraft} />
            </Field>
            <Field label="Encaminhamento realizado" full>
              <input name="encaminhamentoRealizado" value={dischargeDraft.encaminhamentoRealizado || ""} onChange={updateDischargeDraft} />
            </Field>
            <Field label="Observações finais" full>
              <textarea name="observacoesFinais" rows="3" value={dischargeDraft.observacoesFinais || ""} onChange={updateDischargeDraft} />
            </Field>
            <div className="check-grid compact-checks">
              <label><input type="checkbox" name="devolveuRoupas" checked={Boolean(dischargeDraft.devolveuRoupas)} onChange={updateDischargeDraft} /> Devolveu roupas de cama</label>
              <label><input type="checkbox" name="levouDocumentos" checked={Boolean(dischargeDraft.levouDocumentos)} onChange={updateDischargeDraft} /> Levou documentos</label>
              <label><input type="checkbox" name="temLesoes" checked={Boolean(dischargeDraft.temLesoes)} onChange={updateDischargeDraft} /> Tem lesões corporais</label>
            </div>
            <Field label="Responsável pelo registro">
              <input name="tecnico" value={dischargeDraft.tecnico || ""} onChange={updateDischargeDraft} />
            </Field>
          </div>

          <footer className="modal-actions">
            <button className="ghost-button" type="button" onClick={closeDischargeModal}>
              Cancelar
            </button>
            <button className="primary-button" type="submit">
              Salvar saída
            </button>
          </footer>
        </form>
      </div>
    );
  }

  function renderDeleteModal() {
    if (!deleteTarget) {
      return null;
    }

    return (
      <div className="modal-backdrop top-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDeleteModal()}>
        <section className="modal-panel compact-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <header className="modal-header">
            <div>
              <span>Excluir hóspede</span>
              <h2 id="delete-title">Confirmar exclusão</h2>
            </div>
            <button className="icon-button" type="button" onClick={closeDeleteModal} aria-label="Fechar confirmação de exclusão">
              ×
            </button>
          </header>
          <p className="danger-copy">
            Tem certeza que deseja excluir este hóspede? Essa ação pode remover permanentemente a ficha e seus registros locais.
          </p>
          <Field label="Digite EXCLUIR para confirmar">
            <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoFocus />
          </Field>
          <footer className="modal-actions">
            <button className="ghost-button" type="button" onClick={closeDeleteModal}>
              Cancelar
            </button>
            <button className="danger-button" type="button" onClick={confirmDeleteRecord} disabled={deleteConfirmation !== "EXCLUIR"}>
              Confirmar exclusão
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <img src={prefeituraLogo} alt="Prefeitura de Aracaju" />
          <img src={assistenciaLogo} alt="Assistência Social de Aracaju" />
        </div>
        <div className="header-title">
          <span>Casa de Passagem Freitas Brandão</span>
          <h1>Registro digital de hóspedes</h1>
          <p>Ficha de acolhimento, saúde, desligamento, evolução e encaminhamentos em um único cadastro.</p>
        </div>
        <div className="status-panel">
          <strong>{status}</strong>
          <span>{apiStatus}</span>
          <small>{progress}% preenchido</small>
        </div>
      </header>

      {notification && (
        <div className={`toast ${notification.type}`} role="status" aria-live="polite">
          {notification.message}
        </div>
      )}

      <main className="workspace">
        <aside className="sidebar">
          <section className="side-panel">
            <button className="primary-button full-button" type="button" onClick={newRecord}>
              Novo hóspede
            </button>
            <div className="progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <nav className="steps" aria-label="Seções da ficha">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  className={`step-item ${section.id === currentSection ? "active" : ""}`}
                  type="button"
                  onClick={() => setCurrentSection(section.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </button>
              ))}
            </nav>
          </section>
        </aside>

        <section className="content-area">
          <section className="search-panel">
            <div className="section-title compact">
              <span>Buscar hóspedes</span>
              <strong>{hasActiveFilters ? `${filteredRecords.length}/${records.length} resultado(s)` : `${records.length} registro(s)`}</strong>
            </div>
            <form className="filters-panel" aria-label="Filtros de hóspedes salvos" onSubmit={submitFilters}>
              <label className="filter-field">
                <span>Nome</span>
                <input name="nome" value={filters.nome} onChange={updateFilter} placeholder="Buscar por nome" />
              </label>
              <label className="filter-field">
                <span>CPF</span>
                <input name="cpf" value={filters.cpf} onChange={updateFilter} placeholder="CPF com ou sem pontuação" />
              </label>
              <label className="filter-field">
                <span>Protocolo</span>
                <input name="protocolo" value={filters.protocolo} onChange={updateFilter} placeholder="Buscar protocolo" />
              </label>
              <label className="filter-field">
                <span>Data de acolhimento</span>
                <input type="date" name="dataAcolhimento" value={filters.dataAcolhimento} onChange={updateFilter} />
              </label>
              <button className="primary-button compact-button search-button" type="submit">
                <SearchIcon />
                Pesquisar
              </button>
              <button className="ghost-button compact-button" type="button" onClick={clearFilters} disabled={!hasActiveFilters}>
                Limpar filtros
              </button>
            </form>
            <div className="records-list">
              {records.length === 0 && <p className="muted">Nenhum hóspede salvo ainda.</p>}
              {records.length > 0 && filteredRecords.length === 0 && (
                <p className="muted">Nenhum hóspede encontrado com os filtros informados.</p>
              )}
              {filteredRecords.map((record) => (
                <article key={getRecordKey(record)} className={getRecordKey(record) === selectedId ? "record-card selected" : "record-card"}>
                  <button type="button" onClick={() => openGuestDetails(record)}>
                    <strong>{record.nome || "Sem nome"}</strong>
                    <span>{record.protocolo || "Sem protocolo"}</span>
                    <small>{getGuestStatus(record)} · Ver detalhes</small>
                  </button>
                  <button className="danger-button" type="button" onClick={() => requestDeleteRecord(record)}>
                    Excluir hóspede
                  </button>
                </article>
              ))}
            </div>
          </section>

          <form className="form-panel" onSubmit={(event) => event.preventDefault()}>
            {renderSection()}
          </form>

          <footer className="actions-bar">
            <button className="ghost-button" type="button" onClick={previousSection} disabled={selectedIndex === 0}>
              Voltar
            </button>
            <div className="actions-right">
              <button className="ghost-button" type="button" onClick={saveLocal} disabled={isSubmitting}>
                Salvar rascunho
              </button>
              <button className="ghost-button" type="button" onClick={() => window.print()} disabled={isSubmitting}>
                Imprimir ficha
              </button>
              {selectedIndex < sections.length - 1 ? (
                <button className="primary-button" type="button" onClick={nextSection} disabled={isSubmitting}>
                  Avançar
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={submitToApi} disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Concluir cadastro"}
                </button>
              )}
            </div>
          </footer>
        </section>
      </main>

      {renderDetailsModal()}
      {renderDischargeModal()}
      {renderDeleteModal()}
    </div>
  );

  function renderSection() {
    switch (currentSection) {
      case "inicio":
        return (
          <>
            <SectionHeader eyebrow="Ficha de acolhimento" title="Informações iniciais" />
            <div className="form-grid">
              <Field label="Data de acolhimento" error={fieldErrors.dataAcolhimento}>
                <input type="date" name="dataAcolhimento" value={guest.dataAcolhimento} onChange={updateField} />
              </Field>
              <Field label="Data de retorno">
                <input type="date" name="dataRetorno" value={guest.dataRetorno} onChange={updateField} />
              </Field>
              <Field label="Instituição de encaminhamento" full>
                <input name="instituicaoEncaminhamento" value={guest.instituicaoEncaminhamento} onChange={updateField} />
              </Field>
              <RadioGroup
                label="Demanda espontânea"
                name="demandaEspontanea"
                value={guest.demandaEspontanea}
                onChange={updateField}
                trueValue="sim"
                falseValue="nao"
              />
              <Field label="Motivo da entrada" full>
                <textarea name="motivoEntrada" rows="4" value={guest.motivoEntrada} onChange={updateField} />
              </Field>
            </div>
          </>
        );
      case "pessoais":
        return (
          <>
            <SectionHeader eyebrow="Identificação" title="Dados pessoais" />
            <div className="form-grid">
              <Field label="Nome completo" full error={fieldErrors.nome}>
                <input name="nome" value={guest.nome} onChange={updateField} />
              </Field>
              <Field label="Data de nascimento">
                <input type="date" name="dataNascimento" value={guest.dataNascimento} onChange={updateField} />
              </Field>
              <Field label="Idade aproximada" error={fieldErrors.idade}>
                <input name="idade" value={guest.idade} onChange={updateField} />
              </Field>
              <Field label="Escolaridade">
                <input name="escolaridade" value={guest.escolaridade} onChange={updateField} />
              </Field>
              <Field label="Nacionalidade">
                <input name="nacionalidade" value={guest.nacionalidade} onChange={updateField} />
              </Field>
              <Field label="Naturalidade">
                <input name="naturalidade" value={guest.naturalidade} onChange={updateField} />
              </Field>
              <Field label="Estado civil">
                <input name="estadoCivil" value={guest.estadoCivil} onChange={updateField} />
              </Field>
              <Field label="Filhos">
                <input name="filhos" value={guest.filhos} onChange={updateField} />
              </Field>
              <Field label="Principais referências sociofamiliares" full>
                <input name="referenciasFamiliares" value={guest.referenciasFamiliares} onChange={updateField} />
              </Field>
              <Field label="Mãe">
                <input name="mae" value={guest.mae} onChange={updateField} />
              </Field>
              <Field label="Pai">
                <input name="pai" value={guest.pai} onChange={updateField} />
              </Field>
            </div>
          </>
        );
      case "documentos":
        return (
          <>
            <SectionHeader eyebrow="Documentação" title="Documentos apresentados" />
            <div className="form-grid">
              <Field label="RG">
                <input name="rg" value={guest.rg} onChange={updateField} />
              </Field>
              <Field label="CPF" error={fieldErrors.cpf}>
                <input name="cpf" value={guest.cpf} onChange={updateField} />
              </Field>
              <Field label="Título eleitoral" full>
                <input name="tituloEleitoral" value={guest.tituloEleitoral} onChange={updateField} />
              </Field>
              <Field label="Carteira de trabalho" full>
                <input name="carteiraTrabalho" value={guest.carteiraTrabalho} onChange={updateField} />
              </Field>
              <Field label="Certidão de nascimento" full>
                <input name="certidaoNascimento" value={guest.certidaoNascimento} onChange={updateField} />
              </Field>
              <Field label="Boletim de ocorrência" full>
                <input name="boletimOcorrencia" value={guest.boletimOcorrencia} onChange={updateField} />
              </Field>
            </div>
          </>
        );
      case "beneficios":
        return (
          <>
            <SectionHeader eyebrow="Benefícios e saúde" title="Condições informadas" />
            <div className="check-grid">
              <label><input type="checkbox" name="recebeBolsaFamilia" checked={guest.recebeBolsaFamilia} onChange={updateField} /> Bolsa Família</label>
              <label><input type="checkbox" name="recebeBpc" checked={guest.recebeBpc} onChange={updateField} /> BPC</label>
              <label><input type="checkbox" name="recebeAposentadoria" checked={guest.recebeAposentadoria} onChange={updateField} /> Aposentadoria</label>
              <label><input type="checkbox" name="recebeCadUnico" checked={guest.recebeCadUnico} onChange={updateField} /> CadÚnico</label>
            </div>
            <div className="form-grid">
              <Field label="Número do NIS">
                <input name="numeroNis" value={guest.numeroNis} onChange={updateField} />
              </Field>
              <Field label="Outros benefícios">
                <input name="outrosBeneficios" value={guest.outrosBeneficios} onChange={updateField} />
              </Field>
              {renderHealthField("Algum problema de saúde?", "problemaSaude", "problemaSaudeQual")}
              {renderHealthField("Algum tipo de alergia?", "alergia", "alergiaQual")}
              {renderHealthField("Faz uso de medicação controlada?", "medicamentoControlado", "medicamentoQual")}
              {renderHealthField("Faz uso de substância psicoativa?", "usaSpa", "usaSpaQual")}
              {renderHealthField("Algum outro cuidado/alergia?", "outraAlergia", "outraAlergiaQual")}
              <Field label="Número do cartão do SUS" full>
                <input name="cartaoSus" value={guest.cartaoSus} onChange={updateField} />
              </Field>
            </div>
          </>
        );
      case "referencias":
        return (
          <>
            <SectionHeader eyebrow="Atividades e referências" title="Vínculos e contatos" />
            <div className="form-grid">
              <Field label="Atividade profissional" full>
                <input name="atividadeProfissional" value={guest.atividadeProfissional} onChange={updateField} />
              </Field>
              <Field label="Endereço de referência" full>
                <input name="enderecoReferencia" value={guest.enderecoReferencia} onChange={updateField} />
              </Field>
              <Field label="Telefone para contato" full>
                <input name="telefoneContato" value={guest.telefoneContato} onChange={updateField} />
              </Field>
              <Field label="Observações" full>
                <textarea name="observacoes" rows="7" value={guest.observacoes} onChange={updateField} />
              </Field>
            </div>
          </>
        );
      case "termo":
        return (
          <>
            <SectionHeader eyebrow="Termo de orientação" title="Ciência das regras do acolhimento" />
            <div className="guidance-box">
              <p>
                O acolhimento inicia com entrega de kit de higiene, orientação sobre pertences, horários,
                convivência, revista de retorno, preservação dos espaços, respeito ao silêncio após 22h e
                encaminhamentos em caso de advertência ou desligamento.
              </p>
              <p>
                A equipe deve registrar quando houver acompanhamento de menores, grau de parentesco e
                encaminhamento de documentação.
              </p>
            </div>
            <label className="acceptance">
              <input type="checkbox" name="aceitouTermo" checked={guest.aceitouTermo} onChange={updateField} />
              Usuário(a) ciente das informações acima.
            </label>
          </>
        );
      case "acompanhamento":
        return (
          <>
            <SectionHeader eyebrow="Evolução" title="Acompanhamento do acolhimento" />
            <ListToolbar label="Evoluções" onAdd={() => addListItem("evolucoes", createEvolution)} />
            <div className="dynamic-list">
              {guest.evolucoes.map((item) => (
                <article className="list-card" key={item.id}>
                  <Field label="Data">
                    <input type="date" value={item.data} onChange={(event) => updateList("evolucoes", item.id, "data", event.target.value)} />
                  </Field>
                  <Field label="Técnico">
                    <input value={item.tecnico} onChange={(event) => updateList("evolucoes", item.id, "tecnico", event.target.value)} />
                  </Field>
                  <Field label="Registro da evolução" full>
                    <textarea rows="4" value={item.texto} onChange={(event) => updateList("evolucoes", item.id, "texto", event.target.value)} />
                  </Field>
                  <button className="danger-button" type="button" onClick={() => removeListItem("evolucoes", item.id)}>Remover</button>
                </article>
              ))}
            </div>
            <ListToolbar label="Encaminhamentos realizados" onAdd={() => addListItem("encaminhamentos", createReferral)} />
            <div className="dynamic-list">
              {guest.encaminhamentos.map((item) => (
                <article className="list-card referral" key={item.id}>
                  <Field label="Mês">
                    <input value={item.mes} onChange={(event) => updateList("encaminhamentos", item.id, "mes", event.target.value)} />
                  </Field>
                  <Field label="Encaminhamento" full>
                    <textarea rows="3" value={item.encaminhamento} onChange={(event) => updateList("encaminhamentos", item.id, "encaminhamento", event.target.value)} />
                  </Field>
                  <button className="danger-button" type="button" onClick={() => removeListItem("encaminhamentos", item.id)}>Remover</button>
                </article>
              ))}
            </div>
          </>
        );
      default:
        return (
          <>
            <SectionHeader eyebrow="Revisão" title="Resumo do cadastro" />
            <div className="review-grid">
              <ReviewItem label="Nome" value={guest.nome} />
              <ReviewItem label="CPF" value={guest.cpf} />
              <ReviewItem label="Data de acolhimento" value={guest.dataAcolhimento} />
              <ReviewItem label="Demanda espontânea" value={guest.demandaEspontanea === "sim" ? "Sim" : "Não"} />
              <ReviewItem label="Benefícios marcados" value={[guest.recebeBolsaFamilia && "Bolsa Família", guest.recebeBpc && "BPC", guest.recebeAposentadoria && "Aposentadoria", guest.recebeCadUnico && "CadÚnico"].filter(Boolean).join(", ")} />
              <ReviewItem label="Cartão SUS" value={guest.cartaoSus} />
              <ReviewItem label="Evoluções" value={`${guest.evolucoes.length} registro(s)`} />
              <ReviewItem label="Encaminhamentos" value={`${guest.encaminhamentos.length} registro(s)`} />
              <ReviewItem label="Status" value={getGuestStatus(guest)} />
              <ReviewItem label="Termo de orientação" value={guest.aceitouTermo ? "Ciente" : "Pendente"} />
            </div>
          </>
        );
    }
  }

  function renderHealthField(label, field, detailField) {
    return (
      <div className="health-row field-full">
        <RadioGroup label={label} name={field} value={guest[field]} onChange={updateField} />
        <Field label="Qual?">
          <input name={detailField} value={guest[detailField]} onChange={updateField} />
        </Field>
      </div>
    );
  }
}

function SectionHeader({ eyebrow, title, compact = false }) {
  return (
    <div className={`section-title ${compact ? "compact" : ""}`}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function ListToolbar({ label, onAdd }) {
  return (
    <div className="list-toolbar">
      <strong>{label}</strong>
      <button className="ghost-button" type="button" onClick={onAdd}>
        Adicionar
      </button>
    </div>
  );
}

function ReviewItem({ label, value }) {
  return (
    <article className="review-card">
      <span>{label}</span>
      <strong>{value || "Não informado"}</strong>
    </article>
  );
}

function DetailSection({ title, items, emptyMessage = "Nenhuma informação preenchida." }) {
  const visibleItems = items.filter(([, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== null && value !== undefined && String(value).trim() !== "";
  });

  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {visibleItems.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <div className="detail-list">
          {visibleItems.map(([label, value]) => (
            <DetailItem key={label} label={label} value={value} />
          ))}
        </div>
      )}
    </section>
  );
}

function DetailItem({ label, value }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <article className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default App;
