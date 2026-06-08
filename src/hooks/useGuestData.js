import { useState, useEffect } from "react";
import { calculateAge, formatCPF, formatPhone, formatSUS, formatNIS } from "../utils/formatters";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const STORAGE_KEY = "freitas-brandao-hospedes";
const DRAFT_KEY = "freitas-brandao-rascunho";

export function createDischarge(number) {
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

export function renumberDischarges(items) {
  return items.map((item, index) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    numero: index + 1
  }));
}

export function createEvolution() {
  return {
    id: crypto.randomUUID(),
    data: new Date().toISOString().slice(0, 10),
    texto: "",
    observacoes: "",
    tecnico: ""
  };
}

export function createReferral() {
  return {
    id: crypto.randomUUID(),
    mes: "",
    encaminhamento: ""
  };
}

export const emptyGuest = {
  id: null,
  localId: "",
  protocolo: "",
  dataAcolhimento: "",
  dataRetorno: "",
  demandaEspontanea: "sim",
  motivoEntrada: "",
  instituicaoEncaminhamento: "",
  nome: "",
  dataNascimento: "",
  idade: "",
  escolaridade: "",
  nacionalidade: "Brasileira",
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
  desligamentos: [createDischarge(1)],
  evolucoes: [],
  encaminhamentos: []
};

function normalizeBackendId(id) {
  if (typeof id === "number") return id;
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return null;
}

function normalizeBoolean(value, fallback) {
  if (typeof value === "boolean") return value;
  if (value === "sim" || value === "true") return true;
  if (value === "nao" || value === "false") return false;
  return fallback;
}

function normalizeYesNo(value, fallback) {
  if (value === true || value === "true" || value === "sim") return "sim";
  if (value === false || value === "false" || value === "nao") return "nao";
  return fallback;
}

export function getRecordKey(record) {
  return String(record.localId || record.id);
}

export function normalizeGuest(value) {
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

export function sanitizePayload(value) {
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
  if (!payload.id) delete payload.id;
  return payload;
}

export function useGuestData(showToast) {
  const [guest, setGuest] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? normalizeGuest(JSON.parse(saved)) : { ...emptyGuest };
    } catch {
      return { ...emptyGuest };
    }
  });

  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved).map(normalizeGuest) : [];
    } catch {
      return [];
    }
  });

  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("Rascunho local");
  const [apiStatus, setApiStatus] = useState("Aguardando envio");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(guest));
  }, [guest]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    let finalValue = type === "checkbox" ? checked : value === "true" ? true : value === "false" ? false : value;

    if (name === "cpf") finalValue = formatCPF(finalValue);
    if (name === "telefoneContato") finalValue = formatPhone(finalValue);
    if (name === "cartaoSus") finalValue = formatSUS(finalValue);
    if (name === "numeroNis") finalValue = formatNIS(finalValue);

    setGuest((current) => {
      const next = { ...current, [name]: finalValue };
      if (name === "dataNascimento") {
        next.idade = calculateAge(finalValue);
      }
      return next;
    });
  }

  function updateDischarge(index, field, value) {
    setGuest((current) => ({
      ...current,
      desligamentos: current.desligamentos.map((item, i) => (i === index ? { ...item, [field]: value } : item))
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

  function persistRecord(record, suppressToast = false) {
    setGuest(record);
    setRecords((current) => {
      const recordKey = getRecordKey(record);
      const exists = current.some((item) => getRecordKey(item) === recordKey);
      return exists ? current.map((item) => (getRecordKey(item) === recordKey ? record : item)) : [record, ...current];
    });
    setSelectedId(getRecordKey(record));
    setStatus("Salvo no navegador");
    if (!suppressToast) showToast("Registro salvo com sucesso", "success");
  }

  function saveLocal() {
    const record = {
      ...guest,
      id: normalizeBackendId(guest.id),
      localId: guest.localId || crypto.randomUUID(),
      protocolo: guest.protocolo || `FB-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`
    };
    persistRecord(record);
  }

  async function submitToApi() {
    const hasBackendId = Number.isInteger(normalizeBackendId(guest.id));
    const payload = sanitizePayload(guest);
    setApiStatus("Enviando...");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/hospedes`, {
        method: hasBackendId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const saved = normalizeGuest({ ...(await response.json()), localId: guest.localId });
      setApiStatus("Enviado para o back");
      persistRecord(saved);
      showToast("Cadastro enviado com sucesso!", "success");
    } catch (error) {
      setApiStatus("Back indisponível; salvo localmente");
      saveLocal();
      showToast("Erro ao conectar à API. Salvo localmente.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function syncPending() {
    if (records.length === 0) {
      showToast("Nenhum acolhido para sincronizar.", "info");
      return;
    }
    
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    const updatedRecords = [...records];
    
    for (let i = 0; i < updatedRecords.length; i++) {
      const record = updatedRecords[i];
      const hasBackendId = Number.isInteger(normalizeBackendId(record.id));
      const payload = sanitizePayload(record);
      
      try {
        const response = await fetch(`${API_URL}/hospedes`, {
          method: hasBackendId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const apiSaved = await response.json();
          updatedRecords[i] = normalizeGuest({ ...apiSaved, localId: record.localId });
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }
    
    setRecords(updatedRecords);
    
    // Se o registro atualmente visualizado foi atualizado no sync, atualize o guest state
    const currentKey = getRecordKey(guest);
    const updatedGuest = updatedRecords.find(r => getRecordKey(r) === currentKey);
    if (updatedGuest) {
      setGuest(updatedGuest);
    }

    setLoading(false);
    if (errorCount === 0) {
      showToast(`Sincronização concluída! ${successCount} registro(s) sincronizados.`, "success");
      setApiStatus("Enviado para o back");
    } else {
      showToast(`Sincronização com falhas: ${errorCount} erros, ${successCount} sucessos.`, "error");
    }
  }

  function exportData() {
    if (records.length === 0) {
      showToast("Nenhum registro para exportar.", "info");
      return;
    }
    const dataStr = JSON.stringify(records, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `backup-freitas-brandao-${new Date().toISOString().slice(0,10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast("Backup exportado com sucesso!", "success");
  }

  function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          const normalizedImport = importedData.map(normalizeGuest);
          // Fundir sem duplicar IDs locais
          setRecords((current) => {
            const newRecords = [...current];
            normalizedImport.forEach(importedRecord => {
              const key = getRecordKey(importedRecord);
              if (!newRecords.some(r => getRecordKey(r) === key)) {
                newRecords.push(importedRecord);
              }
            });
            return newRecords;
          });
          showToast(`${normalizedImport.length} registros importados com sucesso!`, "success");
        } else {
          showToast("Formato de arquivo inválido.", "error");
        }
      } catch (err) {
        showToast("Erro ao processar o arquivo de importação.", "error");
      }
    };
    reader.readAsText(file);
    // Limpar o input de arquivo para permitir importar o mesmo arquivo novamente
    event.target.value = null;
  }

  function loadRecord(record) {
    setGuest(normalizeGuest(record));
    setSelectedId(getRecordKey(record));
    setStatus("Registro carregado");
  }

  function newRecord() {
    const blank = { ...emptyGuest, localId: crypto.randomUUID(), desligamentos: [createDischarge(1)] };
    setGuest(blank);
    setSelectedId("");
    setStatus("Novo rascunho");
  }

  function deleteRecord(id) {
    setRecords((current) => current.filter((item) => getRecordKey(item) !== id));
    if (selectedId === id) {
      newRecord();
    }
  }

  return {
    guest,
    setGuest,
    records,
    status,
    apiStatus,
    loading,
    selectedId,
    updateField,
    updateDischarge,
    addDischarge,
    removeDischarge,
    updateList,
    addListItem,
    removeListItem,
    saveLocal,
    submitToApi,
    syncPending,
    exportData,
    importData,
    loadRecord,
    newRecord,
    deleteRecord
  };
}
