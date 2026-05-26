import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renderiza a aplicação corretamente", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Registro digital de hóspedes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Novo hóspede/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Avançar/i })).toBeInTheDocument();
  });

  it("adiciona e remove desligamentos na seção de termo", async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Termo/i }));
    const addDischargeButton = await screen.findByRole("button", { name: /Adicionar desligamento/i });

    expect(screen.getByText(/1 termo\(s\) registrado\(s\)/i)).toBeInTheDocument();

    await user.click(addDischargeButton);

    const discharge2Heading = await screen.findByRole("heading", { name: /Desligamento 2/i });
    expect(discharge2Heading).toBeInTheDocument();

    const discharge2Card = discharge2Heading.closest("article");
    const removeButton = within(discharge2Card).getByRole("button", { name: /Excluir/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Desligamento 2/i })).not.toBeInTheDocument();
    });
  });

  it("envia o cadastro para o backend e mostra o status de sucesso", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: 123, nome: "Maria Souza", localId: "local-123", protocolo: "FB-2024-001" })
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Data de acolhimento/i), "2024-08-01");
    await user.click(screen.getByRole("button", { name: /Dados pessoais/i }));
    await user.type(screen.getByLabelText(/Nome/i), "Maria Souza");

    await user.click(screen.getByRole("button", { name: /Revisão/i }));
    await user.click(screen.getByRole("button", { name: /Concluir cadastro/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enviado para o back/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.nome).toBe("Maria Souza");
    expect(requestBody.dataAcolhimento).toBe("2024-08-01");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
  });

  it("mapear corretamente os dados para o backend ao enviar", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: 456, localId: "local-456" })
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /Dados pessoais/i }));
    await user.type(screen.getByLabelText(/Nome/i), "Lucas Silva");
    await user.type(screen.getByLabelText(/^Idade$/i), "30");

    await user.click(screen.getByRole("button", { name: /Acompanhamento/i }));
    const addButtons = screen.getAllByRole("button", { name: /Adicionar/i });
    await user.click(addButtons[0]);
    await user.click(addButtons[1]);

    const evolutionDateInput = await screen.findByLabelText(/^Data$/i);
    fireEvent.change(evolutionDateInput, { target: { value: "2024-06-15" } });
    await user.type(screen.getByLabelText(/Registro da evolução/i), "Acompanhamento inicial");
    await user.type(screen.getByLabelText(/^Técnico$/i), "Técnico Teste");

    await user.type(screen.getByLabelText(/Mês/i), "2024-06");
    await user.type(screen.getByLabelText(/Encaminhamento/i), "Atendimento social");

    await user.click(screen.getByRole("button", { name: /Revisão/i }));
    await user.click(screen.getByRole("button", { name: /Concluir cadastro/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enviado para o back/i)).toBeInTheDocument();
    });

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.id).toBeUndefined();
    expect(payload.idade).toBe(30);
    expect(payload.evolucoes).toEqual([
      {
        data: "2024-06-15",
        descricao: "Acompanhamento inicial",
        responsavel: "Técnico Teste"
      }
    ]);
    expect(payload.encaminhamentos).toEqual([
      {
        data: "2024-06",
        destino: "Atendimento social",
        observacoes: ""
      }
    ]);
  });
});
