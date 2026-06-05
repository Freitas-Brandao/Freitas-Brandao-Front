const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const AUTH_USER = "admin";
const AUTH_PASS = "admin123";

export async function fetchComAuth(endpoint, options = {}) {
  const tokenBase64 = btoa(`${AUTH_USER}:${AUTH_PASS}`);
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Basic ${tokenBase64}`,
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