/**
 * spotify-sync.js
 * Polls a Spotify playlist and pushes updates into WMP.
 *
 * Config is set via window.SPOTIFY_CONFIG (injected in winxp.html):
 *   SPOTIFY_PLAYLIST_ID  — the playlist ID to sync
 *   SPOTIFY_POLL_MS      — poll interval in ms (default 10000)
 *   SPOTIFY_TOKEN_URL    — URL of the token endpoint (Netlify function)
 */

(function () {
  'use strict';

  const CONFIG = window.SPOTIFY_CONFIG || {};
  const PLAYLIST_ID = CONFIG.playlistId || '';
  const POLL_MS     = CONFIG.pollMs     || 10000;
  const TOKEN_URL   = CONFIG.tokenUrl   || 'https://roaring-florentine-4582da.netlify.app/.netlify/functions/spotify-token';

  if (!PLAYLIST_ID) {
    console.warn('[SpotifySync] No playlistId configured — sync disabled.');
    return;
  }

  // ── State ───────────────────────────────────────────────────────
  let accessToken    = null;
  let tokenExpiresAt = 0;
  let lastSnapshotId = null;
  let pollTimer      = null;
  let syncEnabled    = false;

  // ── Token management ────────────────────────────────────────────
  async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiresAt - 30000) {
      return accessToken; // still valid (30s buffer)
    }
    try {
      const res  = await fetch(TOKEN_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          grant_type:    'refresh_token',
          refresh_token: window._spotifyRefreshToken || undefined,
        }),
      });
      const data = await res.json();
      if (!data.access_token) throw new Error(data.error || 'No access_token');
      accessToken    = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      // If Spotify rotated the refresh token, store it for future calls
      if (data.refresh_token) {
        window._spotifyRefreshToken = data.refresh_token;
      }
      return accessToken;
    } catch (e) {
      console.error('[SpotifySync] Token refresh failed:', e);
      return null;
    }
  }

  // ── Spotify API helpers ─────────────────────────────────────────
  async function spotifyGet(path) {
    const token = await getAccessToken();
    if (!token) return null;
    const res = await fetch('https://api.spotify.com/v1' + path, {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (res.status === 401) { accessToken = null; return spotifyGet(path); } // retry once
    if (!res.ok) return null;
    return res.json();
  }

  // ── Fetch all tracks (handles pagination) ───────────────────────
  async function fetchAllTracks() {
    const tracks = [];
    let url = '/playlists/' + PLAYLIST_ID + '/tracks?limit=50&fields=next,items(track(name,uri,artists,album(name,images),duration_ms,preview_url,external_urls))';
    while (url) {
      const data = await spotifyGet(url);
      if (!data) break;
      for (const item of (data.items || [])) {
        if (item.track && item.track.name) tracks.push(item.track);
      }
      // Handle full URL pagination vs relative path
      url = data.next ? data.next.replace('https://api.spotify.com/v1', '') : null;
    }
    return tracks;
  }

  // ── Convert Spotify tracks → WMP song objects ───────────────────
  function toWmpSongs(tracks) {
    return tracks.map(t => ({
      title:      t.name,
      artist:     (t.artists || []).map(a => a.name).join(', '),
      album:      t.album?.name || '',
      src:        t.preview_url || '',           // 30s preview URL (fallback)
      uri:        t.uri        || '',            // spotify:track:xxx (full playback via SDK)
      spotifyUrl: t.external_urls?.spotify || '',
      duration:   Math.round((t.duration_ms || 0) / 1000),
      albumArt:   (t.album?.images || [])[0]?.url || '',
    }));
  }

  // ── Push updated songs into WMP ─────────────────────────────────
  function pushToWmp(songs) {
    if (typeof window.wmpSetSpotifyPlaylist === 'function') {
      window.wmpSetSpotifyPlaylist(songs);
    } else {
      // Queue it — WMP might not be init'd yet
      window._spotifyPendingSongs = songs;
    }
    updateStatusBadge(songs.length);
  }

  // ── Poll loop ───────────────────────────────────────────────────
  async function poll() {
    try {
      const meta = await spotifyGet('/playlists/' + PLAYLIST_ID + '?fields=snapshot_id,name');
      if (!meta) return;

      // Update playlist name in WMP header if changed
      if (meta.name && window.wmpSetSpotifyName) {
        window.wmpSetSpotifyName(meta.name);
      }

      // Only re-fetch tracks if playlist actually changed
      if (meta.snapshot_id === lastSnapshotId) return;
      lastSnapshotId = meta.snapshot_id;

      console.log('[SpotifySync] Playlist changed — fetching tracks...');
      const tracks = await fetchAllTracks();
      const songs  = toWmpSongs(tracks);
      pushToWmp(songs);
      console.log('[SpotifySync] Updated:', songs.length, 'tracks');
    } catch (e) {
      console.warn('[SpotifySync] Poll error:', e);
    }
  }

  // ── Status badge in WMP UI ──────────────────────────────────────
  function updateStatusBadge(count) {
    const badge = document.getElementById('wmp-spotify-badge');
    if (badge) badge.textContent = '♫ Spotify (' + count + ')';
  }

  // ── Public: start / stop ────────────────────────────────────────
  window.spotifySyncStart = function () {
    if (syncEnabled) return;
    syncEnabled = true;
    poll(); // immediate first fetch
    pollTimer = setInterval(poll, POLL_MS);
    console.log('[SpotifySync] Started — polling every', POLL_MS / 1000, 's');
  };

  window.spotifySyncStop = function () {
    syncEnabled = false;
    clearInterval(pollTimer);
    console.log('[SpotifySync] Stopped.');
  };

  // Auto-start once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.spotifySyncStart);
  } else {
    window.spotifySyncStart();
  }
})();
