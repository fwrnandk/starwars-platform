type LoginResponse = {
  access_token: string;
};

const TOKEN_KEY = "sw_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<string> {
  const resp = await fetch(`/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const text = await resp.text();

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} - ${text}`);
  }

  const data = JSON.parse(text) as LoginResponse;

  if (!data.access_token) {
    throw new Error(`Resposta sem access_token: ${text}`);
  }

  setToken(data.access_token);
  return data.access_token;
}
