export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' }
  });
}

export function options(request: Request): Response | null {
  return request.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null;
}

export function credentials() {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY') || keyFrom('SUPABASE_PUBLISHABLE_KEYS');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || keyFrom('SUPABASE_SECRET_KEYS');
  if (!url || !anon || !service) throw new Error('Supabase function credentials are not configured.');
  return { url: url.replace(/\/$/, ''), anon, service };
}

function keyFrom(name: string) {
  try { return JSON.parse(Deno.env.get(name) || '{}').default || ''; } catch { return ''; }
}

export async function callerId(request: Request, url: string, anon: string): Promise<string> {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) throw new Error('A guest session is required.');
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, authorization: auth } });
  const user = await response.json().catch(() => null);
  if (!response.ok || !user?.id) throw new Error('The guest session is invalid or expired.');
  return user.id;
}

export async function adminRequest(url: string, service: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('apikey', service);
  headers.set('authorization', `Bearer ${service}`);
  headers.set('accept', 'application/json');
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  const response = await fetch(`${url}${path}`, { ...init, headers });
  const text = await response.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!response.ok) throw new Error(typeof data === 'string' ? data : data?.message || data?.msg || `Supabase returned ${response.status}.`);
  return data;
}

export async function adminRpc(url: string, service: string, name: string, args: unknown) {
  return adminRequest(url, service, `/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(args) });
}
