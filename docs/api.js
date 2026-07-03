/* =========================================================================
 * Ubhi Frontend API Client  —  assets/api.js
 * -------------------------------------------------------------------------
 * Plain browser global. No build step, no modules — just drop a
 *   <script src="assets/api.js"></script>
 * into a page and use `window.UbhiAPI` (and the `window.ubhiDb` adapter).
 *
 * Talks to the Ubhi Node/Express backend documented in the build contract:
 *   - Base URL comes from `window.UBHI_API_BASE` (default "" = same origin).
 *   - JWT is persisted in localStorage under the key "ubhi-api-token".
 *   - All requests use fetch() with an "Authorization: Bearer <jwt>" header
 *     once the user is logged in.
 *
 * Two layers are exposed:
 *   1) window.UbhiAPI  — explicit, typed-ish methods that mirror the REST API
 *                        (login, me, logout, changePassword + CRUD helpers
 *                        for every resource + createCheckoutSession).
 *   2) window.ubhiDb   — a drop-in async adapter with read(key)/write(key,val)
 *                        that maps the site's EXISTING localStorage keys onto
 *                        the API, and gracefully FALLS BACK to localStorage
 *                        when the API is unreachable or no base URL is set.
 *                        This lets the developer migrate the live site
 *                        incrementally without rewriting storage call sites.
 *
 * Pure ES5/ES6, IIFE-wrapped, no external dependencies.
 * ========================================================================= */

(function (global) {
  'use strict';

  /* ----------------------------------------------------------------------
   * Constants
   * -------------------------------------------------------------------- */

  /** localStorage key under which the JWT is stored. */
  var TOKEN_KEY = 'ubhi-api-token';

  /**
   * Map of the existing front-end localStorage keys to the API resource
   * they correspond to. Used by the `ubhiDb` drop-in adapter so legacy
   * call sites keep working while pointing at the backend.
   * @type {Object.<string,string>}
   */
  var LEGACY_KEY_MAP = {
    'ubhi-shop-orders': 'orders',
    'ubhi-workshop-reservations': 'bookings',
    'ubhi-snail-members': 'subscribers',
    'ubhi-email-updates': 'updates',
    'ubhi-members': 'customers'
  };

  /* ----------------------------------------------------------------------
   * Small internal helpers
   * -------------------------------------------------------------------- */

  /**
   * Resolve the configured API base URL at call time (so a page can set
   * `window.UBHI_API_BASE` after this script loads). Trailing slash is
   * stripped so we can safely concatenate paths beginning with "/".
   * @returns {string} The base URL, possibly "" for same-origin.
   */
  function getBase() {
    var base = global.UBHI_API_BASE;
    if (typeof base !== 'string') return '';
    return base.replace(/\/+$/, '');
  }

  /**
   * Read the stored JWT from localStorage.
   * @returns {string|null} The token, or null if none / storage unavailable.
   */
  function getToken() {
    try {
      return global.localStorage.getItem(TOKEN_KEY);
    } catch (err) {
      return null;
    }
  }

  /**
   * Persist (or clear) the JWT in localStorage.
   * @param {string|null} token A JWT, or null/empty to remove it.
   * @returns {void}
   */
  function setToken(token) {
    try {
      if (token) {
        global.localStorage.setItem(TOKEN_KEY, token);
      } else {
        global.localStorage.removeItem(TOKEN_KEY);
      }
    } catch (err) {
      /* storage may be disabled (private mode) — ignore silently */
    }
  }

  /**
   * Error thrown by `request()` for non-2xx HTTP responses. Carries the
   * HTTP status and the parsed response body so callers can branch on it.
   * @constructor
   * @param {string} message Human-readable error message.
   * @param {number} status  HTTP status code.
   * @param {*} body         Parsed response body (object/string/null).
   */
  function ApiError(message, status, body) {
    this.name = 'ApiError';
    this.message = message || 'Request failed';
    this.status = status || 0;
    this.body = body;
  }
  ApiError.prototype = Object.create(Error.prototype);
  ApiError.prototype.constructor = ApiError;

  /**
   * Core fetch wrapper. Adds JSON + auth headers, parses the response, and
   * throws an {@link ApiError} for non-2xx statuses.
   *
   * @param {string} path  API path beginning with "/" (e.g. "/api/health").
   * @param {Object} [opts] Options.
   * @param {string} [opts.method="GET"] HTTP method.
   * @param {*} [opts.body] JSON-serialisable request body (omitted for GET).
   * @param {boolean} [opts.auth=true] Whether to attach the Bearer token.
   * @param {Object} [opts.headers] Extra headers to merge in.
   * @returns {Promise<*>} Resolves with the parsed response body.
   * @throws {ApiError} On network failure or a non-2xx response.
   */
  function request(path, opts) {
    opts = opts || {};
    var method = (opts.method || 'GET').toUpperCase();
    var headers = { Accept: 'application/json' };

    // Merge caller-supplied headers (lets advanced callers override).
    if (opts.headers) {
      for (var h in opts.headers) {
        if (Object.prototype.hasOwnProperty.call(opts.headers, h)) {
          headers[h] = opts.headers[h];
        }
      }
    }

    // Attach the JWT unless explicitly disabled.
    if (opts.auth !== false) {
      var token = getToken();
      if (token) headers.Authorization = 'Bearer ' + token;
    }

    var init = { method: method, headers: headers };

    // Only send a body for non-GET/HEAD requests.
    if (opts.body !== undefined && method !== 'GET' && method !== 'HEAD') {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }

    return global
      .fetch(getBase() + path, init)
      .then(function (res) {
        var ct = res.headers && res.headers.get && res.headers.get('content-type');
        var isJson = ct && ct.indexOf('application/json') !== -1;
        var parse = isJson ? res.json() : res.text();

        return parse.then(
          function (data) {
            if (res.ok) return data;
            var msg =
              (data && typeof data === 'object' && data.error) ||
              (typeof data === 'string' && data) ||
              ('HTTP ' + res.status);
            throw new ApiError(msg, res.status, data);
          },
          function () {
            // Body could not be parsed.
            if (res.ok) return null;
            throw new ApiError('HTTP ' + res.status, res.status, null);
          }
        );
      });
  }

  /* Convenience verbs ---------------------------------------------------- */

  /**
   * GET helper.
   * @param {string} path API path.
   * @param {Object} [opts] Extra request options.
   * @returns {Promise<*>}
   */
  function get(path, opts) {
    return request(path, mergeOpts({ method: 'GET' }, opts));
  }

  /**
   * POST helper.
   * @param {string} path API path.
   * @param {*} body JSON body.
   * @param {Object} [opts] Extra request options.
   * @returns {Promise<*>}
   */
  function post(path, body, opts) {
    return request(path, mergeOpts({ method: 'POST', body: body }, opts));
  }

  /**
   * PATCH helper.
   * @param {string} path API path.
   * @param {*} body JSON body.
   * @param {Object} [opts] Extra request options.
   * @returns {Promise<*>}
   */
  function patch(path, body, opts) {
    return request(path, mergeOpts({ method: 'PATCH', body: body }, opts));
  }

  /**
   * PUT helper.
   * @param {string} path API path.
   * @param {*} body JSON body.
   * @param {Object} [opts] Extra request options.
   * @returns {Promise<*>}
   */
  function put(path, body, opts) {
    return request(path, mergeOpts({ method: 'PUT', body: body }, opts));
  }

  /**
   * DELETE helper.
   * @param {string} path API path.
   * @param {Object} [opts] Extra request options.
   * @returns {Promise<*>}
   */
  function del(path, opts) {
    return request(path, mergeOpts({ method: 'DELETE' }, opts));
  }

  /**
   * Shallow-merge two option objects (second wins).
   * @param {Object} a Base options.
   * @param {Object} [b] Override options.
   * @returns {Object} Merged options.
   */
  function mergeOpts(a, b) {
    if (!b) return a;
    for (var k in b) {
      if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k];
    }
    return a;
  }

  /**
   * Build a CRUD helper bundle for a REST resource mounted at /api/<path>.
   * The generated object has list/get/create/update/remove methods, all of
   * which return Promises and attach auth automatically.
   *
   * @param {string} resourcePath The URL segment (e.g. "orders", "shop").
   * @returns {{
   *   list: function(Object=): Promise<Array>,
   *   get: function(string): Promise<Object>,
   *   create: function(Object, Object=): Promise<Object>,
   *   update: function(string, Object): Promise<Object>,
   *   remove: function(string): Promise<Object>
   * }}
   */
  function makeCrud(resourcePath) {
    var root = '/api/' + resourcePath;
    return {
      /**
       * List resources. Optionally pass a query-param object.
       * @param {Object} [query] Key/value pairs serialised to a query string.
       * @returns {Promise<Array>}
       */
      list: function (query) {
        return get(root + buildQuery(query));
      },
      /**
       * Fetch a single resource by id.
       * @param {string} id Resource id.
       * @returns {Promise<Object>}
       */
      get: function (id) {
        return get(root + '/' + encodeURIComponent(id));
      },
      /**
       * Create a resource.
       * @param {Object} data Resource fields.
       * @param {Object} [opts] Extra request options (e.g. {auth:false} for
       *                        public create endpoints like checkout).
       * @returns {Promise<Object>}
       */
      create: function (data, opts) {
        return post(root, data, opts);
      },
      /**
       * Update (PATCH) a resource by id.
       * @param {string} id Resource id.
       * @param {Object} patchData Fields to change.
       * @returns {Promise<Object>}
       */
      update: function (id, patchData) {
        return patch(root + '/' + encodeURIComponent(id), patchData);
      },
      /**
       * Delete a resource by id.
       * @param {string} id Resource id.
       * @returns {Promise<Object>}
       */
      remove: function (id) {
        return del(root + '/' + encodeURIComponent(id));
      }
    };
  }

  /**
   * Serialise a flat object into a "?a=1&b=2" query string. Returns "" when
   * the object is empty/undefined.
   * @param {Object} [query] Key/value pairs.
   * @returns {string} Query string (with leading "?") or "".
   */
  function buildQuery(query) {
    if (!query) return '';
    var parts = [];
    for (var k in query) {
      if (
        Object.prototype.hasOwnProperty.call(query, k) &&
        query[k] !== undefined &&
        query[k] !== null
      ) {
        parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(query[k]));
      }
    }
    return parts.length ? '?' + parts.join('&') : '';
  }

  /* ----------------------------------------------------------------------
   * Public API surface — window.UbhiAPI
   * -------------------------------------------------------------------- */

  var UbhiAPI = {
    /** Surface the error class so callers can `instanceof` it. */
    ApiError: ApiError,

    /** localStorage key used for the JWT (exposed for reference). */
    TOKEN_KEY: TOKEN_KEY,

    /* ---- low-level escape hatches ------------------------------------ */

    /** @type {function(string, Object=): Promise<*>} Raw request wrapper. */
    request: request,
    get: get,
    post: post,
    patch: patch,
    put: put,
    del: del,

    /* ---- token helpers ----------------------------------------------- */

    /**
     * @returns {string|null} The currently stored JWT, if any.
     */
    getToken: getToken,

    /**
     * Overwrite the stored JWT (rarely needed directly; login() does this).
     * @param {string|null} token JWT or null to clear.
     * @returns {void}
     */
    setToken: setToken,

    /**
     * @returns {boolean} True if a token is currently stored.
     */
    isLoggedIn: function () {
      return !!getToken();
    },

    /* ---- health ------------------------------------------------------ */

    /**
     * Probe the backend health endpoint.
     * @returns {Promise<{ok:boolean, store:string}>}
     */
    health: function () {
      return get('/api/health', { auth: false });
    },

    /* ---- auth -------------------------------------------------------- */

    /**
     * Log in with email + password. On success the returned JWT is stored
     * in localStorage and attached to all subsequent requests.
     * @param {string} email Admin/staff email.
     * @param {string} password Plaintext password (sent over HTTPS).
     * @returns {Promise<{token:string, user:Object}>}
     */
    login: function (email, password) {
      return post('/api/auth/login', { email: email, password: password }, { auth: false }).then(
        function (res) {
          if (res && res.token) setToken(res.token);
          return res;
        }
      );
    },

    /**
     * Fetch the currently authenticated user.
     * @returns {Promise<{user:Object}>}
     */
    me: function () {
      return get('/api/auth/me');
    },

    /**
     * Clear the stored JWT (client-side logout; tokens are stateless).
     * @returns {void}
     */
    logout: function () {
      setToken(null);
    },

    /**
     * Change the logged-in user's password.
     * @param {string} current Current password.
     * @param {string} next New password.
     * @returns {Promise<{ok:boolean}>}
     */
    changePassword: function (current, next) {
      return post('/api/auth/change-password', { current: current, next: next });
    },

    /* ---- admin users (owner only) ------------------------------------ */

    /**
     * Admin-user management. CRUD plus a password-reset helper.
     * Mirrors /api/users (owner-only on the backend).
     */
    users: (function () {
      var crud = makeCrud('users');
      /**
       * Reset another user's password (owner only).
       * @param {string} id User id.
       * @param {string} password New password.
       * @returns {Promise<{ok:boolean}>}
       */
      crud.setPassword = function (id, password) {
        return post('/api/users/' + encodeURIComponent(id) + '/password', {
          password: password
        });
      };
      return crud;
    })(),

    /* ---- resource CRUD bundles --------------------------------------- */

    /** Orders. POST is public (checkout); list/get/update/remove are admin. */
    orders: makeCrud('orders'),

    /** Workshop bookings. POST public (reserve); rest admin. */
    bookings: makeCrud('bookings'),

    /** Snail-mail subscribers. POST public (join); rest admin. */
    subscribers: makeCrud('subscribers'),

    /** Newsletter signups. POST public; list/remove admin. */
    updates: makeCrud('updates'),

    /** Storefront customer accounts. POST public (register); rest admin. */
    customers: makeCrud('customers'),

    /** Workshops. GET public (published only); full CRUD admin. */
    workshops: makeCrud('workshops'),

    /** Shop products. GET public (published only); full CRUD admin. */
    shop: makeCrud('shop'),

    /** Gallery items. GET public (published only); full CRUD admin. */
    gallery: makeCrud('gallery'),

    /** Journal posts. GET public (published only); full CRUD admin. */
    journal: makeCrud('journal'),

    /* ---- settings (key/value) ---------------------------------------- */

    /**
     * Settings store keyed by string. GET may be public for safe keys;
     * PUT is owner-only on the backend.
     */
    settings: {
      /**
       * Read a settings value by key.
       * @param {string} key Setting key.
       * @returns {Promise<*>} The stored value (shape is key-dependent).
       */
      get: function (key) {
        return get('/api/settings/' + encodeURIComponent(key));
      },
      /**
       * Write a settings value by key (owner only).
       * @param {string} key Setting key.
       * @param {*} value JSON-serialisable value.
       * @returns {Promise<Object>}
       */
      set: function (key, value) {
        return put('/api/settings/' + encodeURIComponent(key), { value: value });
      }
    },

    /* ---- checkout ----------------------------------------------------- */

    /**
     * Create a Stripe Checkout session for the given cart. Public endpoint:
     * if the server has no Stripe key configured it returns
     * { configured:false } (caller should fall back to manual ordering).
     * @param {Array<Object>} cart Cart line items (server defines exact shape;
     *                              typically [{id, name, price, qty}, ...]).
     * @returns {Promise<{configured:boolean, url?:string, id?:string}>}
     */
    createCheckoutSession: function (cart) {
      return post('/api/checkout/session', { cart: cart }, { auth: false });
    }
  };

  /* ----------------------------------------------------------------------
   * Drop-in legacy adapter — window.ubhiDb
   * -------------------------------------------------------------------- *
   * The live site reads/writes arrays in localStorage under keys like
   * "ubhi-shop-orders". This adapter exposes the same notion (read a list,
   * write a list) but backed by the API, with a transparent localStorage
   * fallback so nothing breaks when the backend is absent/unreachable.
   * -------------------------------------------------------------------- */

  /**
   * Read a raw array from localStorage for the given key.
   * @param {string} key localStorage key.
   * @returns {Array} Parsed array, or [] if missing/invalid.
   */
  function lsRead(key) {
    try {
      var raw = global.localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Write an array to localStorage for the given key.
   * @param {string} key localStorage key.
   * @param {Array} val Value to store.
   * @returns {void}
   */
  function lsWrite(key, val) {
    try {
      global.localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      /* quota / private-mode — ignore */
    }
  }

  /**
   * Whether the API is usable: requires a configured base URL OR an existing
   * token. With neither, we treat the API as "not present" and stay 100%
   * on localStorage (so the static site keeps working as-is).
   * @returns {boolean}
   */
  function apiAvailable() {
    return !!getBase() || !!getToken();
  }

  /**
   * Resolve the API resource path for a legacy localStorage key.
   * @param {string} key Legacy localStorage key.
   * @returns {string|null} Resource path, or null if the key isn't mapped.
   */
  function resourceForKey(key) {
    return Object.prototype.hasOwnProperty.call(LEGACY_KEY_MAP, key)
      ? LEGACY_KEY_MAP[key]
      : null;
  }

  var ubhiDb = {
    /** Expose the key->resource map for debugging/inspection. */
    keyMap: LEGACY_KEY_MAP,

    /**
     * Read the list behind a legacy key. Tries the API first (listing the
     * mapped resource); on any failure — unmapped key, no base URL, network
     * error, auth error — it falls back to the localStorage copy so callers
     * always get a usable array.
     *
     * @param {string} key One of the keys in {@link LEGACY_KEY_MAP}.
     * @returns {Promise<Array>} Resolves with the list (never rejects).
     */
    read: function (key) {
      var resource = resourceForKey(key);

      // Unmapped key, or no API configured -> pure localStorage.
      if (!resource || !apiAvailable()) {
        return Promise.resolve(lsRead(key));
      }

      return get('/api/' + resource).then(
        function (rows) {
          var list = Array.isArray(rows) ? rows : [];
          // Mirror into localStorage so offline reads stay warm.
          lsWrite(key, list);
          return list;
        },
        function () {
          // API unreachable / unauthorised -> fall back to local copy.
          return lsRead(key);
        }
      );
    },

    /**
     * Write the list behind a legacy key. Always updates localStorage (the
     * source of truth for the static fallback). When the API is available
     * and the key maps to a resource, it ALSO POSTs newly-added items to the
     * backend (best-effort — failures are swallowed so the UI never breaks).
     *
     * Note: this is an additive sync — it creates rows that look new (no id),
     * matching how the legacy site appends entries to its arrays. It does not
     * attempt deletes/diffing; admin tooling should use UbhiAPI directly for
     * full CRUD.
     *
     * @param {string} key One of the keys in {@link LEGACY_KEY_MAP}.
     * @param {Array} val The full list to persist.
     * @returns {Promise<Array>} Resolves with `val` (never rejects).
     */
    write: function (key, val) {
      var list = Array.isArray(val) ? val : [];

      // localStorage is always written first (guaranteed fallback).
      var previous = lsRead(key);
      lsWrite(key, list);

      var resource = resourceForKey(key);
      if (!resource || !apiAvailable()) {
        return Promise.resolve(list);
      }

      // Best-effort: push any item that has no server id yet.
      var newItems = list.filter(function (item) {
        return item && typeof item === 'object' && !item.id;
      });

      if (!newItems.length) {
        return Promise.resolve(list);
      }

      var creates = newItems.map(function (item) {
        // Public create endpoints (orders/bookings/subscribers/updates/
        // customers) do not require auth, so send without it to mirror the
        // storefront flow.
        return post('/api/' + resource, item, { auth: false }).catch(function () {
          return null;
        });
      });

      return Promise.all(creates).then(
        function () {
          return list;
        },
        function () {
          return list;
        }
      );
      // `previous` retained for clarity/debugging; intentionally unused.
      void previous;
    }
  };

  /* ----------------------------------------------------------------------
   * Expose globals
   * -------------------------------------------------------------------- */

  global.UbhiAPI = UbhiAPI;
  global.ubhiDb = ubhiDb;

  // Also support CommonJS in case the file is require()'d in a tool/test.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UbhiAPI: UbhiAPI, ubhiDb: ubhiDb };
  }
})(typeof window !== 'undefined' ? window : this);
