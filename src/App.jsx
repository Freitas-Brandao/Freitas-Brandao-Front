import { useMemo, useState, useRef } from "react";
import prefeituraLogo from "./assets/prefeitura-aracaju.png";
import assistenciaLogo from "./assets/assistencia-social.jfif";
import { Field, RadioGroup, SectionHeader, ListToolbar, ReviewItem } from "./components/ui/FormElements";
import { useGuestData, getRecordKey, createEvolution, createReferral } from "./hooks/useGuestData";

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

function App() {
  const [currentSection, setCurrentSection] = useState("inicio");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const fileInputRef = useRef(null);

  function showToast(message, type = "info") {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }

  const {
    guest,
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
  } = useGuestData(showToast);

  const selectedIndex = sections.findIndex((section) => section.id === currentSection);
  const progress = Math.round(((selectedIndex + 1) / sections.length) * 100);

  const pendingDischarges = useMemo(
    () => guest.desligamentos.filter((item) => item.data || item.motivo).length,
    [guest.desligamentos]
  );

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) => {
      const nome = (r.nome || "").toLowerCase();
      const cpf = (r.cpf || "").replace(/\D/g, "");
      const cleanTerm = term.replace(/\D/g, "");
      return nome.includes(term) || (cleanTerm && cpf.includes(cleanTerm));
    });
  }, [records, searchTerm]);

  function validateSection() {
    const errors = {};
    
    if (currentSection === "inicio") {
      if (!guest.dataAcolhimento) errors.dataAcolhimento = true;
    } else if (currentSection === "pessoais") {
      if (!guest.nome || guest.nome.trim() === "") errors.nome = true;
    }
    
    setValidationErrors(errors);
    const hasErrors = Object.keys(errors).length > 0;
    
    if (hasErrors) {
      showToast("Preencha os campos obrigatórios marcados em vermelho.", "error");
    }
    
    return !hasErrors;
  }

  function nextSection() {
    if (validateSection()) {
      setCurrentSection(sections[Math.min(selectedIndex + 1, sections.length - 1)].id);
      setValidationErrors({});
    }
  }

  function previousSection() {
    setCurrentSection(sections[Math.max(selectedIndex - 1, 0)].id);
    setValidationErrors({});
  }

  function handleLoadRecord(record) {
    loadRecord(record);
    setCurrentSection("inicio");
    setValidationErrors({});
  }

  function handleNewRecord() {
    newRecord();
    setCurrentSection("inicio");
    setValidationErrors({});
  }

  function handleSubmit() {
    if (validateSection()) {
      submitToApi();
    }
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
            <button className="primary-button full-button" type="button" onClick={handleNewRecord}>
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
                  onClick={() => {
                    if (validateSection()) {
                      setCurrentSection(section.id);
                      setValidationErrors({});
                    }
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </button>
              ))}
            </nav>
          </section>

          <section className="side-panel records-panel">
            <div className="section-title compact">
              <span>Registros locais</span>
              <strong>{records.length}</strong>
            </div>
            
            <div className="utility-buttons">
              <button className="ghost-button compact-button full-button" type="button" onClick={syncPending} disabled={loading}>
                🔄 Sincronizar Todos
              </button>
              <div className="backup-actions">
                <button className="ghost-button compact-button" type="button" onClick={exportData}>
                  📥 Exportar
                </button>
                <button className="ghost-button compact-button" type="button" onClick={() => fileInputRef.current?.click()}>
                  📤 Importar
                </button>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={importData}
                />
              </div>
            </div>

            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="records-list">
              {filteredRecords.length === 0 && (
                <p className="muted">
                  {records.length === 0 ? "Nenhum hóspede salvo ainda." : "Nenhum hóspede encontrado."}
                </p>
              )}
              {filteredRecords.map((record) => (
                <article key={getRecordKey(record)} className={getRecordKey(record) === selectedId ? "record-card selected" : "record-card"}>
                  <button type="button" onClick={() => handleLoadRecord(record)}>
                    <strong>{record.nome || "Sem nome"}</strong>
                    <span>{record.protocolo || "Sem protocolo"}</span>
                  </button>
                  <button className="danger-button" type="button" onClick={() => setDeleteTargetId(getRecordKey(record))}>
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
              <button className="ghost-button" type="button" onClick={saveLocal}>
                Salvar rascunho
              </button>
              <button className="ghost-button" type="button" onClick={() => window.print()}>
                Imprimir ficha
              </button>
              {selectedIndex < sections.length - 1 ? (
                <button className="primary-button" type="button" onClick={nextSection}>
                  Avançar
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={handleSubmit} disabled={loading}>
                  {loading && <span className="spinner" />}
                  Concluir cadastro
                </button>
              )}
            </div>
          </footer>
        </section>
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {deleteTargetId !== null && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="modal-title">Confirmar Exclusão</h3>
            <p className="modal-body">
              Tem certeza que deseja excluir o registro de{" "}
              <strong>
                {records.find((r) => getRecordKey(r) === deleteTargetId)?.nome || "Hóspede sem nome"}
              </strong>? Esta ação não poderá ser desfeita.
            </p>
            <div className="modal-actions">
              <button className="ghost-button compact-button" type="button" onClick={() => setDeleteTargetId(null)}>
                Cancelar
              </button>
              <button
                className="danger-button compact-button"
                type="button"
                onClick={() => {
                  deleteRecord(deleteTargetId);
                  setDeleteTargetId(null);
                  showToast("Hóspede excluído localmente", "info");
                }}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipiente de Notificações (Toasts) */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span className="toast-content">{t.message}</span>
            <button className="toast-close" type="button" onClick={() => setToasts((current) => current.filter((x) => x.id !== t.id))}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  function renderSection() {
    switch (currentSection) {
      case "inicio":
        return (
          <>
            <SectionHeader eyebrow="Ficha de acolhimento" title="Informações iniciais" />
            <div className="form-grid">
              <Field label="Data de acolhimento *" hasError={validationErrors.dataAcolhimento}>
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
              <Field label="Nome *" full hasError={validationErrors.nome}>
                <input name="nome" value={guest.nome} onChange={updateField} />
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
              <Field label="CPF">
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

export default App;
