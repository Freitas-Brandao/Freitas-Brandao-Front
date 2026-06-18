export const API_URL = import.meta.env.VITE_API_URL || "https://freitas-brandao-back-1.onrender.com/api";

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getFriendlyErrorMessage(error, fallback = "Nao foi possivel concluir a operacao.") {
  if (error?.status === 0 || error?.name === "TypeError") {
    return "Servidor indisponivel. Verifique se o backend esta rodando.";
  }

  if (error?.status === 401 || error?.status === 403) {
    return "Falha de autenticacao. Faca login novamente.";
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
}

async function parseErrorResponse(response) {
  try {
    const data = await response.json();
    if (data?.erro) return { message: data.erro, details: data };

    const fieldMessages = Object.values(data || {}).filter(Boolean);
    if (fieldMessages.length > 0) {
      return { message: fieldMessages.join(" "), details: data };
    }

    return { message: `Erro HTTP ${response.status}`, details: data };
  } catch {
    return { message: `Erro HTTP ${response.status}`, details: null };
  }
}

export async function fetchComAuth(endpoint, options = {}) {
  const tokenBase64 = localStorage.getItem("authToken");
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(tokenBase64 ? { "Authorization": `Basic ${tokenBase64}` } : {}),
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers
  };

  const resposta = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!resposta.ok) {
    const errorInfo = await parseErrorResponse(resposta);
    throw new ApiError(errorInfo.message, resposta.status, errorInfo.details);
  }

  if (resposta.status === 204) {
    return null;
  }
  
  return await resposta.json();
}
