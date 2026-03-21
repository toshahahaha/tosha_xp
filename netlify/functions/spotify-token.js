/**
 * Netlify Function: spotify-token
 *
 * Handles two grant types:
 *   authorization_code  — one-time: exchange PKCE code for tokens (used by spotify-auth.html)
 *   refresh_token       — called by the site to get a fresh access token
 *
 * Required environment variables (set in Netlify dashboard):
 *   SPOTIFY_CLIENT_ID      = 7cd580ba84714012a9dc4a26a656814c
 *   SPOTIFY_CLIENT_SECRET  = <your secret>
 *   SPOTIFY_REFRESH_TOKEN  = <set after running spotify-auth.html once>
 */

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET env vars' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }

  const { grant_type } = body;

  // ── 0. Return the current refresh token status (for debugging) ──
  if (grant_type === 'check_token') {
    const rt = process.env.SPOTIFY_REFRESH_TOKEN;
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ has_token: !!rt, prefix: rt ? rt.substring(0, 8) : null }),
    };
  }

  // ── 1. authorization_code: one-time PKCE exchange (spotify-auth.html) ──
  if (grant_type === 'authorization_code') {
    const { code, verifier, redirect_uri } = body;
    if (!code || !verifier || !redirect_uri) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing code, verifier, or redirect_uri' }) };
    }

    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri,
      client_id:     CLIENT_ID,
      code_verifier: verifier,
    });

    const res  = await fetch('https://accounts.spotify.com/api/token', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
      },
      body: params,
    });
    const data = await res.json();

    return {
      statusCode: res.ok ? 200 : 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  }

  // ── 2. refresh_token: get a fresh access token (called by the site) ──
  if (grant_type === 'refresh_token') {
    const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;
    if (!refresh_token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing SPOTIFY_REFRESH_TOKEN env var' }),
      };
    }

    // PKCE-based refresh: send client_id + client_secret in body, no Basic auth header
    const params = new URLSearchParams({
      grant_type:     'refresh_token',
      refresh_token,
      client_id:      CLIENT_ID,
      client_secret:  CLIENT_SECRET,
    });

    const res  = await fetch('https://accounts.spotify.com/api/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await res.json();

    if (!res.ok || !data.access_token) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: data.error || 'token_refresh_failed', error_description: data.error_description || JSON.stringify(data) }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
    };
  }

  return { statusCode: 400, body: JSON.stringify({ error: 'Unknown grant_type' }) };
};
