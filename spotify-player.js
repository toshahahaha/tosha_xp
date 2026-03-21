/**
 * spotify-player.js
 * Wraps the Spotify Web Playback SDK for full song playback.
 *
 * Requires:
 *   - window.SPOTIFY_CONFIG.tokenUrl   (Netlify function endpoint)
 *   - window.SPOTIFY_CONFIG.playlistId (playlist to play from)
 *   - Spotify Web Playback SDK loaded via <script src="https://sdk.scdn.co/spotify-player.js">
 *
 * Exposes:
 *   window.spotifyPlayer        — the Spotify.Player instance
 *   window.spotifyPlayerReady   — true once the device is ready
 *   window.spotifyDeviceId      — the device ID for Web API calls
 *   window.spotifyPlayTrack(uri, positionMs)  — play a specific track URI
 *   window.spotifyPlayContext(contextUri, offset) — play playlist/album with offset
 *   window.spotifyTogglePlay()  — play/pause toggle
 *   window.spotifySeekTo(ms)    — seek to position in ms
 *   window.spotifySetVolume(pct) — 0–100
 *   window.spotifyNextTrack()
 *   window.spotifyPrevTrack()
 *   window.onSpotifyPlayerReady — override this to be notified when device is ready
 *   window.onSpotifyPlayerState — override this to receive player state updates
 */

(function () {
  'use strict';

  const CONFIG    = window.SPOTIFY_CONFIG || {};
  const TOKEN_URL = CONFIG.tokenUrl || '';

  if (!TOKEN_URL) {
    console.warn('[SpotifyPlayer] No tokenUrl — SDK disabled.');
    return;
  }

  // ── Token helper ──────────────────────────────────────────────
  let _accessToken    = null;
  let _tokenExpiresAt = 0;

  async function getToken() {
    // Return cached token if still valid (30s buffer)
    if (_accessToken && Date.now() < _tokenExpiresAt - 30000) {
      return _accessToken;
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
      _accessToken    = data.access_token;
      _tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      // Store rotated refresh token if Spotify returned one
      if (data.refresh_token) {
        window._spotifyRefreshToken = data.refresh_token;
      }
      return _accessToken;
    } catch (e) {
      console.error('[SpotifyPlayer] Token refresh failed:', e);
      return null;
    }
  }

  // ── Spotify Web API helper ────────────────────────────────────
  async function spotifyApi(method, path, body) {
    const token = await getToken();
    if (!token) return null;
    const opts = {
      method,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('https://api.spotify.com/v1' + path, opts);
    if (res.status === 204) return {};          // No Content (success)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[SpotifyPlayer] API error', res.status, err);
      return null;
    }
    return res.json();
  }

  // ── SDK init (called by window.onSpotifyWebPlaybackSDKReady) ──
  window.onSpotifyWebPlaybackSDKReady = function () {
    console.log('[SpotifyPlayer] SDK ready — initialising player…');

    const player = new window.Spotify.Player({
      name: 'Tosha XP Media Player',
      getOAuthToken: async (cb) => {
        const token = await getToken();
        cb(token);
      },
      volume: 0.8,
    });

    window.spotifyPlayer = player;

    // ── Event: Device ready ──────────────────────────────────────
    player.addListener('ready', ({ device_id }) => {
      console.log('[SpotifyPlayer] Device ready — id:', device_id);
      window.spotifyDeviceId  = device_id;
      window.spotifyPlayerReady = true;
      if (typeof window.onSpotifyPlayerReady === 'function') {
        window.onSpotifyPlayerReady(device_id);
      }
    });

    // ── Event: Device went offline ───────────────────────────────
    player.addListener('not_ready', ({ device_id }) => {
      console.warn('[SpotifyPlayer] Device went offline:', device_id);
      window.spotifyPlayerReady = false;
    });

    // ── Event: Player state changed ──────────────────────────────
    player.addListener('player_state_changed', (state) => {
      if (!state) return;
      if (typeof window.onSpotifyPlayerState === 'function') {
        window.onSpotifyPlayerState(state);
      }
    });

    // ── Event: Errors ────────────────────────────────────────────
    player.addListener('initialization_error', ({ message }) => {
      console.error('[SpotifyPlayer] Init error:', message);
    });
    player.addListener('authentication_error', ({ message }) => {
      console.error('[SpotifyPlayer] Auth error:', message);
    });
    player.addListener('account_error', ({ message }) => {
      console.error('[SpotifyPlayer] Account error (Premium required):', message);
    });
    player.addListener('playback_error', ({ message }) => {
      console.error('[SpotifyPlayer] Playback error:', message);
    });

    player.connect().then(ok => {
      console.log('[SpotifyPlayer] connect():', ok ? 'success' : 'failed');
    });
  };

  // ── Public: play a single track URI ──────────────────────────
  window.spotifyPlayTrack = async function (uri, positionMs) {
    if (!window.spotifyDeviceId) {
      console.warn('[SpotifyPlayer] Not ready yet');
      return;
    }
    await spotifyApi('PUT',
      '/me/player/play?device_id=' + window.spotifyDeviceId,
      {
        uris:      [uri],
        position_ms: positionMs || 0,
      }
    );
  };

  // ── Public: play a context (playlist/album) at an offset ─────
  // offset can be { position: n } (0-based index) or { uri: trackUri }
  window.spotifyPlayContext = async function (contextUri, offset, positionMs) {
    if (!window.spotifyDeviceId) {
      console.warn('[SpotifyPlayer] Not ready yet');
      return;
    }
    const body = {
      context_uri: contextUri,
      position_ms: positionMs || 0,
    };
    if (offset !== undefined) body.offset = offset;
    await spotifyApi('PUT',
      '/me/player/play?device_id=' + window.spotifyDeviceId,
      body
    );
  };

  // ── Public: toggle play/pause ─────────────────────────────────
  window.spotifyTogglePlay = async function () {
    if (window.spotifyPlayer) {
      await window.spotifyPlayer.togglePlay();
    }
  };

  // ── Public: seek ──────────────────────────────────────────────
  window.spotifySeekTo = async function (ms) {
    if (window.spotifyPlayer) {
      await window.spotifyPlayer.seek(ms);
    }
  };

  // ── Public: volume (0–100) ────────────────────────────────────
  window.spotifySetVolume = async function (pct) {
    if (window.spotifyPlayer) {
      await window.spotifyPlayer.setVolume(Math.max(0, Math.min(1, pct / 100)));
    }
  };

  // ── Public: next / prev ───────────────────────────────────────
  window.spotifyNextTrack = async function () {
    if (window.spotifyPlayer) {
      await window.spotifyPlayer.nextTrack();
    }
  };

  window.spotifyPrevTrack = async function () {
    if (window.spotifyPlayer) {
      await window.spotifyPlayer.previousTrack();
    }
  };

  // ── Transfer playback to this device (useful if user is playing elsewhere) ─
  window.spotifyTransferPlayback = async function () {
    if (!window.spotifyDeviceId) return;
    await spotifyApi('PUT', '/me/player', {
      device_ids: [window.spotifyDeviceId],
      play: false,
    });
  };

})();
