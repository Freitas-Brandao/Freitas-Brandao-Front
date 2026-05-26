import { useEffect, useMemo, useState } from "react";
import prefeituraLogo from "./assets/prefeitura-aracaju.png";
import assistenciaLogo from "./assets/assistencia-social.jfif";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const STORAGE_KEY = "freitas-brandao-hospedes";
const DRAFT_KEY = "freitas-brandao-rascunho";

const emptyGuest = {
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

function createEvolution() {
  return {
    id: crypto.randomUUID(),
    data: new Date().toISOString().slice(0, 10),
    texto: "",
    tecnico: ""
  };
}

function createReferral() {
  return {
    id: crypto.randomUUID(),
    mes: "",
    encaminhamento: ""
  };
}

function Field({ label, children, full = false, error }) {
  return (
    <label className={`field ${full ? "field-full" : ""}`}>
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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({ nome: "", cpf: "", protocolo: "", dataAcolhimento: "" });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchNome = filters.nome.trim().toLowerCase();
      const searchCpf = filters.cpf.replace(/\D/g, "");
      const searchProtocolo = filters.protocolo.trim().toLowerCase();
      const searchData = filters.dataAcolhimento;

      const matchesNome = !searchNome || String(record.nome || "").toLowerCase().includes(searchNome);
      const matchesCpf = !searchCpf || String(record.cpf || "").replace(/\D/g, "").includes(searchCpf);
      const matchesProtocolo = !searchProtocolo || String(record.protocolo || "").toLowerCase().includes(searchProtocolo);
      const matchesData = !searchData || String(record.dataAcolhimento || "").includes(searchData);

      return matchesNome && matchesCpf && matchesProtocolo && matchesData;
    });
  }, [filters, records]);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(guest));
  }, [guest]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const selectedIndex = sections.findIndex((section) => section.id === currentSection);
  const progress = Math.round(((selectedIndex + 1) / sections.length) * 100);

  const pendingDischarges = useMemo(
    () => guest.desligamentos.filter((item) => item.data || item.motivo).length,
    [guest.desligamentos]
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
  }

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function isValidCpf(value) {
    const digits = String(value).replace(/\D/g, "");
    if (!/^\d{11}$/.test(digits) || /^([0-9])\1{10}$/.test(digits)) {
      return false;
    }

    const numbers = digits.split("").map(Number);
    for (let checkIndex = 9; checkIndex <= 10; checkIndex += 1) {
      let sum = 0;
      for (let index = 0; index < checkIndex; index += 1) {
        sum += numbers[index] * (checkIndex + 1 - index);
      }
      const expected = ((sum * 10) % 11) % 10;
      if (numbers[checkIndex] !== expected) {
        return false;
      }
    }

    return true;
  }

  function validateGuest() {
    const validation = {};

    if (!guest.nome.trim()) {
      validation.nome = "O nome é obrigatório.";
    }

    if (!guest.dataAcolhimento) {
      validation.dataAcolhimento = "A data de acolhimento é obrigatória.";
    }

    if (!guest.motivoEntrada.trim()) {
      validation.motivoEntrada = "O motivo de entrada é obrigatório.";
    }

    if (!guest.cpf.trim()) {
      validation.cpf = "O CPF é obrigatório.";
    } else if (!isValidCpf(guest.cpf)) {
      validation.cpf = "Digite um CPF válido.";
    }

    return validation;
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

  function saveLocal() {
    const record = {
      ...guest,
      id: normalizeBackendId(guest.id),
      localId: guest.localId || crypto.randomUUID(),
      protocolo: guest.protocolo || `FB-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, "0")}`
    };

    persistRecord(record);
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
    const validation = validateGuest();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setApiStatus("Corrija os erros antes de enviar.");
      setStatus("Validação falhou");
      const sectionMap = {
        nome: "pessoais",
        cpf: "documentos",
        dataAcolhimento: "inicio",
        motivoEntrada: "inicio"
      };
      setCurrentSection(sectionMap[Object.keys(validation)[0]] || "inicio");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setStatus("Enviando...");
    setApiStatus("Enviando...");

    const hasBackendId = Number.isInteger(normalizeBackendId(guest.id));
    const payload = sanitizePayload(guest);

    try {
      const response = await fetch(`${API_URL}/hospedes`, {
        method: hasBackendId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const saved = normalizeGuest({ ...(await response.json()), localId: guest.localId });
      setApiStatus("Enviado para o back");
      persistRecord(saved);
    } catch (error) {
      setApiStatus("Back indisponível; salvo localmente");
      saveLocal();
    } finally {
      setIsSubmitting(false);
    }
  }

  function loadRecord(record) {
    setGuest(normalizeGuest(record));
    setSelectedId(getRecordKey(record));
    setStatus("Registro carregado");
    setCurrentSection("inicio");
  }

  function newRecord() {
    const blank = { ...emptyGuest, localId: crypto.randomUUID(), desligamentos: [createDischarge(1)] };
    setGuest(blank);
    setSelectedId("");
    setStatus("Novo rascunho");
    setCurrentSection("inicio");
  }

  function deleteRecord(id) {
    setRecords((current) => current.filter((item) => getRecordKey(item) !== id));
    if (selectedId === id) {
      newRecord();
    }
  }

  function getRecordKey(record) {
    return String(record.localId || record.id);
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

          <section className="side-panel search-panel">
            <div className="section-title compact">
              <span>Filtro</span>
              <strong>Buscar registros</strong>
            </div>
            <div className="search-grid">
              <Field label="Nome">
                <input name="nome" value={filters.nome} onChange={updateFilter} />
              </Field>
              <Field label="CPF">
                <input name="cpf" value={filters.cpf} onChange={updateFilter} />
              </Field>
              <Field label="Protocolo">
                <input name="protocolo" value={filters.protocolo} onChange={updateFilter} />
              </Field>
              <Field label="Data de acolhimento">
                <input type="date" name="dataAcolhimento" value={filters.dataAcolhimento} onChange={updateFilter} />
              </Field>
            </div>
          </section>

          <section className="side-panel records-panel">
            <div className="section-title compact">
              <span>Registros locais</span>
              <strong>{filteredRecords.length}/{records.length}</strong>
            </div>
            <div className="records-list">
              {filteredRecords.length === 0 && <p className="muted">Nenhum hóspede corresponde aos filtros.</p>}
              {filteredRecords.map((record) => (
                <article key={getRecordKey(record)} className={getRecordKey(record) === selectedId ? "record-card selected" : "record-card"}>
                  <button type="button" onClick={() => loadRecord(record)}>
                    <strong>{record.nome || "Sem nome"}</strong>
                    <span>{record.protocolo || "Sem protocolo"}</span>
                  </button>
                  <button className="danger-button" type="button" onClick={() => deleteRecord(getRecordKey(record))}>
                    Excluir
                  </button>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <section className="content-area">
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
                  {isSubmitting ? "Enviando..." : "Concluir cadastro"}
                </button>
              )}
            </div>
          </footer>
        </section>
      </main>
    </div>
  );

  function renderSection() {
    switch (currentSection) {
      case "inicio":
        return (
          <>
            <SectionHeader eyebrow="Ficha de acolhimento" title="Informações iniciais" />
            <div className="form-grid">
              <Field label="Data de acolhimento" error={errors.dataAcolhimento}>
                <input className={errors.dataAcolhimento ? "input-error" : ""} type="date" name="dataAcolhimento" value={guest.dataAcolhimento} onChange={updateField} />
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
              <Field label="Motivo da entrada" full error={errors.motivoEntrada}>
                <textarea className={errors.motivoEntrada ? "input-error" : ""} name="motivoEntrada" rows="4" value={guest.motivoEntrada} onChange={updateField} />
              </Field>
            </div>
          </>
        );
      case "pessoais":
        return (
          <>
            <SectionHeader eyebrow="Identificação" title="Dados pessoais" />
            <div className="form-grid">
              <Field label="Nome" full error={errors.nome}>
                <input className={errors.nome ? "input-error" : ""} name="nome" value={guest.nome} onChange={updateField} />
              </Field>
              <Field label="Data de nascimento">
                <input type="date" name="dataNascimento" value={guest.dataNascimento} onChange={updateField} />
              </Field>
              <Field label="Idade">
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
              <Field label="CPF" error={errors.cpf}>
                <input className={errors.cpf ? "input-error" : ""} name="cpf" value={guest.cpf} onChange={updateField} />
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
            <SectionHeader eyebrow="Desligamento" title="Termos de desligamento" compact />
            <div className="list-toolbar discharge-toolbar">
              <strong>{guest.desligamentos.length} termo(s) registrado(s)</strong>
              <button className="ghost-button" type="button" onClick={addDischarge}>
                Adicionar desligamento
              </button>
            </div>
            <div className="discharge-grid">
              {guest.desligamentos.map((item, index) => (
                <article className="discharge-card" key={item.id}>
                  <div className="card-heading">
                    <h3>Desligamento {item.numero}</h3>
                    <button
                      className="danger-button compact-button"
                      type="button"
                      onClick={() => removeDischarge(item.id)}
                      disabled={guest.desligamentos.length === 1}
                    >
                      Excluir
                    </button>
                  </div>
                  <div className="form-grid single">
                    <Field label="Data">
                      <input type="date" value={item.data} onChange={(event) => updateDischarge(index, "data", event.target.value)} />
                    </Field>
                    <Field label="Motivo" full>
                      <textarea rows="3" value={item.motivo} onChange={(event) => updateDischarge(index, "motivo", event.target.value)} />
                    </Field>
                    <label><input type="checkbox" checked={item.devolveuRoupas} onChange={(event) => updateDischarge(index, "devolveuRoupas", event.target.checked)} /> Devolveu roupas de cama</label>
                    <label><input type="checkbox" checked={item.levouDocumentos} onChange={(event) => updateDischarge(index, "levouDocumentos", event.target.checked)} /> Levou documentos</label>
                    <label><input type="checkbox" checked={item.temLesoes} onChange={(event) => updateDischarge(index, "temLesoes", event.target.checked)} /> Tem lesões corporais</label>
                    <Field label="Assinatura do usuário" full>
                      <input value={item.assinaturaUsuario} onChange={(event) => updateDischarge(index, "assinaturaUsuario", event.target.value)} />
                    </Field>
                    <Field label="Técnico">
                      <input value={item.tecnico} onChange={(event) => updateDischarge(index, "tecnico", event.target.value)} />
                    </Field>
                    <Field label="Data do técnico">
                      <input type="date" value={item.dataTecnico} onChange={(event) => updateDischarge(index, "dataTecnico", event.target.value)} />
                    </Field>
                  </div>
                </article>
              ))}
            </div>
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
              <ReviewItem label="Desligamentos preenchidos" value={`${pendingDischarges} de ${guest.desligamentos.length}`} />
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

export default App;
