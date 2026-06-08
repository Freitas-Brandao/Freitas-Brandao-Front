export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

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
    throw new Error(`HTTP ${resposta.status}`);
  }

  if (resposta.status === 204) {
    return null;
  }
  
  return await resposta.json();
}
