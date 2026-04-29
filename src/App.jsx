import { useState } from "react";

const etapas = [
  { id: "pessoal", titulo: "Dados pessoais" },
  { id: "documentos", titulo: "Documentos" },
  { id: "contato", titulo: "Contato e endereco" },
  { id: "familia", titulo: "Familia e hospedagem" },
  { id: "finalizacao", titulo: "Revisao" }
];

const camposIniciais = {
  nomeCompleto: "",
  nomeSocial: "",
  dataNascimento: "",
  sexo: "",
  naturalidade: "",
  nacionalidade: "Brasileira",
  cpf: "",
  rg: "",
  orgaoEmissor: "",
  nis: "",
  telefone: "",
  telefoneRecado: "",
  email: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "Aracaju",
  uf: "SE",
  referencia: "",
  responsavelFamiliar: "",
  quantidadeDependentes: "",
  situacaoHospedagem: "",
  dataEntrada: "",
  previsaoSaida: "",
  unidadeDestino: "",
  observacoes: ""
};

const secoesResumo = [
  { titulo: "Identificacao", campos: ["nomeCompleto", "cpf", "rg"] },
  { titulo: "Contato", campos: ["telefone", "email"] },
  { titulo: "Endereco", campos: ["logradouro", "numero", "bairro", "cidade"] },
  {
    titulo: "Hospedagem",
    campos: ["situacaoHospedagem", "dataEntrada", "previsaoSaida", "unidadeDestino"]
  }
];

const rotulos = {
  nomeCompleto: "Nome completo",
  nomeSocial: "Nome social",
  dataNascimento: "Data de nascimento",
  sexo: "Sexo",
  naturalidade: "Naturalidade",
  nacionalidade: "Nacionalidade",
  cpf: "CPF",
  rg: "RG",
  orgaoEmissor: "Orgao emissor",
  nis: "NIS",
  telefone: "Telefone",
  telefoneRecado: "Telefone para recado",
  email: "E-mail",
  cep: "CEP",
  logradouro: "Logradouro",
  numero: "Numero",
  complemento: "Complemento",
  bairro: "Bairro",
  cidade: "Cidade",
  uf: "UF",
  referencia: "Ponto de referencia",
  responsavelFamiliar: "Responsavel familiar",
  quantidadeDependentes: "Quantidade de dependentes",
  situacaoHospedagem: "Situacao de hospedagem",
  dataEntrada: "Data de entrada",
  previsaoSaida: "Previsao de saida",
  unidadeDestino: "Unidade de hospedagem",
  observacoes: "Observacoes"
};

function Campo({ label, children, full }) {
  return (
    <label className={`field ${full ? "field-full" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function App() {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [formulario, setFormulario] = useState(camposIniciais);

  function atualizarCampo(evento) {
    const { name, value } = evento.target;
    setFormulario((atual) => ({
      ...atual,
      [name]: value
    }));
  }

  function proximaEtapa() {
    setEtapaAtual((atual) => Math.min(atual + 1, etapas.length - 1));
  }

  function etapaAnterior() {
    setEtapaAtual((atual) => Math.max(atual - 1, 0));
  }

  function renderizarEtapa() {
    switch (etapaAtual) {
      case 0:
        return (
          <section className="form-panel">
            <div className="panel-heading">
              <span className="eyebrow">Cadastro principal</span>
              <h2>Dados pessoais do solicitante</h2>
              <p>Preencha as informacoes basicas para identificacao do atendimento.</p>
            </div>

            <div className="form-grid">
              <Campo label="Nome completo" full>
                <input name="nomeCompleto" value={formulario.nomeCompleto} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Nome social" full>
                <input name="nomeSocial" value={formulario.nomeSocial} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Data de nascimento">
                <input type="date" name="dataNascimento" value={formulario.dataNascimento} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Sexo">
                <select name="sexo" value={formulario.sexo} onChange={atualizarCampo}>
                  <option value="">Selecione</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </Campo>
              <Campo label="Naturalidade">
                <input name="naturalidade" value={formulario.naturalidade} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Nacionalidade">
                <input name="nacionalidade" value={formulario.nacionalidade} onChange={atualizarCampo} />
              </Campo>
            </div>
          </section>
        );
      case 1:
        return (
          <section className="form-panel">
            <div className="panel-heading">
              <span className="eyebrow">Documentacao</span>
              <h2>Registros de documentos</h2>
              <p>Centralize os dados utilizados para validacao do cadastro.</p>
            </div>

            <div className="form-grid">
              <Campo label="CPF">
                <input name="cpf" value={formulario.cpf} onChange={atualizarCampo} />
              </Campo>
              <Campo label="RG">
                <input name="rg" value={formulario.rg} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Orgao emissor">
                <input name="orgaoEmissor" value={formulario.orgaoEmissor} onChange={atualizarCampo} />
              </Campo>
              <Campo label="NIS">
                <input name="nis" value={formulario.nis} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Arquivo de identificacao" full>
                <input type="file" />
              </Campo>
              <Campo label="Comprovante complementar" full>
                <input type="file" />
              </Campo>
            </div>
          </section>
        );
      case 2:
        return (
          <section className="form-panel">
            <div className="panel-heading">
              <span className="eyebrow">Contato</span>
              <h2>Endereco e meios de comunicacao</h2>
              <p>Organize os dados para localizacao e acompanhamento do atendimento.</p>
            </div>

            <div className="form-grid">
              <Campo label="Telefone">
                <input name="telefone" value={formulario.telefone} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Telefone para recado">
                <input name="telefoneRecado" value={formulario.telefoneRecado} onChange={atualizarCampo} />
              </Campo>
              <Campo label="E-mail" full>
                <input type="email" name="email" value={formulario.email} onChange={atualizarCampo} />
              </Campo>
              <Campo label="CEP">
                <input name="cep" value={formulario.cep} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Logradouro" full>
                <input name="logradouro" value={formulario.logradouro} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Numero">
                <input name="numero" value={formulario.numero} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Complemento">
                <input name="complemento" value={formulario.complemento} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Bairro">
                <input name="bairro" value={formulario.bairro} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Cidade">
                <input name="cidade" value={formulario.cidade} onChange={atualizarCampo} />
              </Campo>
              <Campo label="UF">
                <input name="uf" value={formulario.uf} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Ponto de referencia" full>
                <input name="referencia" value={formulario.referencia} onChange={atualizarCampo} />
              </Campo>
            </div>
          </section>
        );
      case 3:
        return (
          <section className="form-panel">
            <div className="panel-heading">
              <span className="eyebrow">Atendimento social</span>
              <h2>Informacoes familiares e dados da hospedagem</h2>
              <p>Registre as condicoes do acolhimento e da situacao informada.</p>
            </div>

            <div className="form-grid">
              <Campo label="Responsavel familiar" full>
                <input
                  name="responsavelFamiliar"
                  value={formulario.responsavelFamiliar}
                  onChange={atualizarCampo}
                />
              </Campo>
              <Campo label="Quantidade de dependentes">
                <input
                  type="number"
                  min="0"
                  name="quantidadeDependentes"
                  value={formulario.quantidadeDependentes}
                  onChange={atualizarCampo}
                />
              </Campo>
              <Campo label="Situacao de hospedagem">
                <select
                  name="situacaoHospedagem"
                  value={formulario.situacaoHospedagem}
                  onChange={atualizarCampo}
                >
                  <option value="">Selecione</option>
                  <option value="Solicitada">Solicitada</option>
                  <option value="Em analise">Em analise</option>
                  <option value="Autorizada">Autorizada</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              </Campo>
              <Campo label="Data de entrada">
                <input type="date" name="dataEntrada" value={formulario.dataEntrada} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Previsao de saida">
                <input
                  type="date"
                  name="previsaoSaida"
                  value={formulario.previsaoSaida}
                  onChange={atualizarCampo}
                />
              </Campo>
              <Campo label="Unidade de hospedagem" full>
                <input name="unidadeDestino" value={formulario.unidadeDestino} onChange={atualizarCampo} />
              </Campo>
              <Campo label="Observacoes" full>
                <textarea
                  rows="5"
                  name="observacoes"
                  value={formulario.observacoes}
                  onChange={atualizarCampo}
                />
              </Campo>
            </div>
          </section>
        );
      default:
        return (
          <section className="form-panel">
            <div className="panel-heading">
              <span className="eyebrow">Revisao final</span>
              <h2>Conferencia do cadastro</h2>
              <p>Revise os dados antes de encaminhar ou salvar o atendimento.</p>
            </div>

            <div className="review-grid">
              {Object.entries(rotulos).map(([chave, rotulo]) => (
                <article className="review-card" key={chave}>
                  <span>{rotulo}</span>
                  <strong>{formulario[chave] || "Nao informado"}</strong>
                </article>
              ))}
            </div>
          </section>
        );
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-line">Prefeitura de Aracaju • SEMFAS</p>
          <h1>Cadastro Digital de Hospedagem</h1>
          <span className="status-badge">Atendimento em andamento</span>
        </div>

        <div className="header-meta">
          <div>
            <span className="meta-label">Protocolo</span>
            <strong>HDG-2026-001</strong>
          </div>
          <div>
            <span className="meta-label">Responsavel</span>
            <strong>Recepcao social</strong>
          </div>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <section className="sidebar-card">
            <span className="eyebrow">Etapas do cadastro</span>
            <div className="steps">
              {etapas.map((etapa, index) => (
                <button
                  key={etapa.id}
                  type="button"
                  className={`step-item ${index === etapaAtual ? "active" : ""}`}
                  onClick={() => setEtapaAtual(index)}
                >
                  <span className="step-index">0{index + 1}</span>
                  <span>{etapa.titulo}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="sidebar-card">
            <span className="eyebrow">Resumo do registro</span>
            <div className="summary-blocks">
              {secoesResumo.map((secao) => (
                <article className="summary-card" key={secao.titulo}>
                  <h3>{secao.titulo}</h3>
                  {secao.campos.map((campo) => (
                    <div className="summary-row" key={campo}>
                      <span>{rotulos[campo]}</span>
                      <strong>{formulario[campo] || "-"}</strong>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>
        </aside>

        <section className="content-area">
          {renderizarEtapa()}

          <div className="actions-bar">
            <button type="button" className="ghost-button" onClick={etapaAnterior} disabled={etapaAtual === 0}>
              Voltar
            </button>

            <div className="actions-right">
              <button type="button" className="ghost-button">
                Salvar rascunho
              </button>
              {etapaAtual < etapas.length - 1 ? (
                <button type="button" className="primary-button" onClick={proximaEtapa}>
                  Avancar etapa
                </button>
              ) : (
                <button type="button" className="primary-button">
                  Concluir cadastro
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
