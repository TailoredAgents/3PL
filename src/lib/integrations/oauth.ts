type TokenCache = {
  token: string;
  expiresAt: number;
};

const tokenCaches = new Map<string, TokenCache>();

export async function fetchClientCredentialsToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const cacheKey = `${tokenUrl}::${clientId}`;
  const cached = tokenCaches.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`OAuth token request failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
  };

  const expiresIn = data.expires_in ?? 3600;

  tokenCaches.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  });

  return data.access_token;
}
