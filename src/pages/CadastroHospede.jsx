import { useState, useEffect } from "react";
import { fetchComAuth } from "../utils/api";
import { formatDateBR } from "../utils/formatters";

const DRAFT_KEY = "freitas-brandao-rascunho";

const sections = [
  { id: "inicio", label: "Iniciais" },
  { id: "pessoais", label: "Dados pessoais" },
  { id: "documentos", label: "Documentação" },
  { id: "beneficios", label: "Benefícios e saúde" },
  { id: "referencias", label: "Referências" },
  { id: "termo", label: "Termo" },
  { id: "revisao", label: "Revisão" }
];

const emptyGuest = {
  dataAcolhimento: "",
  demandaEspontanea: "sim",
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
  aceitouTermo: false
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
  return {
    dataAcolhimento: value.dataAcolhimento || null,
    horaAcolhimento: null,
    demandaEspontanea: value.demandaEspontanea === "sim" || value.demandaEspontanea === true,
    nome: String(value.nome || "").trim(),
    nomeSocial: value.nomeSocial ? String(value.nomeSocial).trim() : null,
    dataNascimento: value.dataNascimento || null,
    naturalidade: value.naturalidade ? String(value.naturalidade).trim() : null,
    genero: "NAO_INFORMADO",
    telefone: value.telefoneContato ? String(value.telefoneContato).trim() : null,
    cpf: value.cpf ? cleanCPF(value.cpf) : null,
    rg: value.rg ? String(value.rg).trim() : null,
    orgaoExpedidorRg: null,
    tituloEleitoral: value.tituloEleitoral ? String(value.tituloEleitoral).trim() : null,
    carteiraTrabalho: value.carteiraTrabalho ? String(value.carteiraTrabalho).trim() : null,
    certidaoNascimento: value.certidaoNascimento ? String(value.certidaoNascimento).trim() : null,
    condicoesSaude: value.problemaSaudeQual ? String(value.problemaSaudeQual).trim() : null,
    medicamentosEmUso: value.medicamentoQual ? String(value.medicamentoQual).trim() : null,
    alergiasRestricoes: value.alergiaQual ? String(value.alergiaQual).trim() : null,
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
      return saved ? JSON.parse(saved) : { ...emptyGuest };
    } catch {
      return { ...emptyGuest };
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

  async function submitToApi() {
    if (isSubmitting || !validateGuest()) return;
    setIsSubmitting(true);
    try {
      const payload = sanitizePayload(guest);
      const pessoaSalva = await fetchComAuth("/pessoas", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (pdfDocuments.length > 0 && pessoaSalva?.id) {
        await uploadPdfDocuments(pessoaSalva.id);
      }
      setNotification({ type: "success", message: "Cadastro concluído com sucesso!" });
      setGuest({ ...emptyGuest });
      setPdfDocuments([]);
      setCurrentSection("inicio");
    } catch (error) {
      setNotification({ type: "error", message: "Erro ao salvar no servidor corporativo." });
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
              <span>Data de Nascimento</span>
              <input type="date" name="dataNascimento" value={guest.dataNascimento} onChange={updateField} />
            </label>
            <label className="field">
              <span>Naturalidade</span>
              <input name="naturalidade" value={guest.naturalidade} onChange={updateField} />
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
            </div>
            <div className="form-grid" style={{ marginTop: "15px" }}>
              <label className="field field-full">
                <span>Condições de Saúde / Alergias</span>
                <input name="problemaSaudeQual" value={guest.problemaSaudeQual} onChange={updateField} />
              </label>
            </div>
          </div>
        )}

        {currentSection === "referencias" && (
          <div className="form-grid">
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
            <label className="acceptance">
              <input type="checkbox" name="aceitouTermo" checked={guest.aceitouTermo} onChange={updateField} />
              Usuário ciente das normas e regulamentos do abrigo.
            </label>
          </div>
        )}

        {currentSection === "revisao" && (
          <div className="review-grid">
            <div className="review-card"><span>Nome</span><strong>{guest.nome}</strong></div>
            <div className="review-card"><span>Acolhimento</span><strong>{formatDateBR(guest.dataAcolhimento)}</strong></div>
            <div className="review-card"><span>CPF</span><strong>{guest.cpf}</strong></div>
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
