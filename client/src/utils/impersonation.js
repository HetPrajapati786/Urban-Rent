/**
 * impersonation.js
 *
 * Module-level singleton for admin impersonation state.
 *
 * FRESHNESS TRACKING
 * ------------------
 * We distinguish two origins for an impersonation key:
 *
 *  1. FRESH  - tab was explicitly opened by admin with ?impersonate=<id> in the URL.
 *              This is the only legitimate source. We mark this in sessionStorage with
 *              the key `urbanrent_impersonate_fresh` so the flag survives page reloads
 *              (e.g. caused by UserSync detecting a different Clerk account).
 *
 *  2. STALE  - `urbanrent_impersonate` exists in sessionStorage but the fresh marker
 *              is absent. This happens when a real user's tab had leftover data from a
 *              previously impersonated session that was not properly exited.
 *
 * Only FRESH impersonation bypasses Clerk auth and shows the impersonation UI.
 * STALE keys are silently ignored and cleaned up by UserSync on the next Clerk load.
 */

// Initialize once at module load time
const _params  = new URLSearchParams(window.location.search);
const _fromUrl = _params.get('impersonate');

let _impersonatingId = null;
let _isFresh         = false;

if (_fromUrl) {
    // FRESH: admin opened this tab with ?impersonate=<id>
    _impersonatingId = _fromUrl;
    _isFresh         = true;

    // Persist both the ID and the freshness marker for page reload survival
    sessionStorage.setItem('urbanrent_impersonate', _fromUrl);
    sessionStorage.setItem('urbanrent_impersonate_fresh', '1');

    // Clean the URL param without triggering a page reload
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);

} else {
    // Try recovering from sessionStorage after a same-tab page reload
    const storedId    = sessionStorage.getItem('urbanrent_impersonate');
    const storedFresh = sessionStorage.getItem('urbanrent_impersonate_fresh');

    if (storedId && storedFresh === '1') {
        // Still a legit fresh impersonation session (survived reload)
        _impersonatingId = storedId;
        _isFresh         = true;
    }
    // else: stale key present without fresh marker -> ignore silently
}

// Public API

/** Returns true ONLY if this is a legitimate admin impersonation session. */
export const isImpersonating = () => _isFresh && !!_impersonatingId;

/** Returns the impersonated clerkId, or null if not genuinely impersonating. */
export const getImpersonatingId = () => (_isFresh ? _impersonatingId : null);

/** True if impersonation came from URL param (or survived reload from such a session). */
export const isFreshImpersonation = () => _isFresh;

/**
 * Call ONLY from Exit Impersonation buttons or UserSync cleanup.
 * Clears in-memory state and ALL related storage keys.
 */
export const clearImpersonation = () => {
    _impersonatingId = null;
    _isFresh         = false;

    sessionStorage.removeItem('urbanrent_impersonate');
    sessionStorage.removeItem('urbanrent_impersonate_fresh');
    sessionStorage.removeItem('urbanrent_impersonate_data');
    localStorage.removeItem('urbanrent_impersonate');
    localStorage.removeItem('urbanrent_impersonate_data');
};
