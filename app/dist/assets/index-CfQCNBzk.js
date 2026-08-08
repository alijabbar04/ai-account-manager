(function () {
  const o = document.createElement("link").relList;
  if (o && o.supports && o.supports("modulepreload")) return;
  for (const x of document.querySelectorAll('link[rel="modulepreload"]')) d(x);
  new MutationObserver((x) => {
    for (const E of x)
      if (E.type === "childList")
        for (const D of E.addedNodes)
          D.tagName === "LINK" && D.rel === "modulepreload" && d(D);
  }).observe(document, { childList: !0, subtree: !0 });
  function v(x) {
    const E = {};
    return (
      x.integrity && (E.integrity = x.integrity),
      x.referrerPolicy && (E.referrerPolicy = x.referrerPolicy),
      x.crossOrigin === "use-credentials"
        ? (E.credentials = "include")
        : x.crossOrigin === "anonymous"
          ? (E.credentials = "omit")
          : (E.credentials = "same-origin"),
      E
    );
  }
  function d(x) {
    if (x.ep) return;
    x.ep = !0;
    const E = v(x);
    fetch(x.href, E);
  }
})();
function jv(f) {
  return f && f.__esModule && Object.prototype.hasOwnProperty.call(f, "default")
    ? f.default
    : f;
}
var ms = { exports: {} },
  Nn = {};
var Mo;
function Nv() {
  if (Mo) return Nn;
  Mo = 1;
  var f = Symbol.for("react.transitional.element"),
    o = Symbol.for("react.fragment");
  function v(d, x, E) {
    var D = null;
    if (
      (E !== void 0 && (D = "" + E),
      x.key !== void 0 && (D = "" + x.key),
      "key" in x)
    ) {
      E = {};
      for (var w in x) w !== "key" && (E[w] = x[w]);
    } else E = x;
    return (
      (x = E.ref),
      { $$typeof: f, type: d, key: D, ref: x !== void 0 ? x : null, props: E }
    );
  }
  return ((Nn.Fragment = o), (Nn.jsx = v), (Nn.jsxs = v), Nn);
}
var Do;
function Av() {
  return (Do || ((Do = 1), (ms.exports = Nv())), ms.exports);
}
var i = Av(),
  vs = { exports: {} },
  I = {};
var Co;
function Ev() {
  if (Co) return I;
  Co = 1;
  var f = Symbol.for("react.transitional.element"),
    o = Symbol.for("react.portal"),
    v = Symbol.for("react.fragment"),
    d = Symbol.for("react.strict_mode"),
    x = Symbol.for("react.profiler"),
    E = Symbol.for("react.consumer"),
    D = Symbol.for("react.context"),
    w = Symbol.for("react.forward_ref"),
    C = Symbol.for("react.suspense"),
    g = Symbol.for("react.memo"),
    B = Symbol.for("react.lazy"),
    R = Symbol.for("react.activity"),
    _ = Symbol.iterator;
  function Y(m) {
    return m === null || typeof m != "object"
      ? null
      : ((m = (_ && m[_]) || m["@@iterator"]),
        typeof m == "function" ? m : null);
  }
  var U = {
      isMounted: function () {
        return !1;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {},
    },
    H = Object.assign,
    N = {};
  function K(m, O, G) {
    ((this.props = m),
      (this.context = O),
      (this.refs = N),
      (this.updater = G || U));
  }
  ((K.prototype.isReactComponent = {}),
    (K.prototype.setState = function (m, O) {
      if (typeof m != "object" && typeof m != "function" && m != null)
        throw Error(
          "takes an object of state variables to update or a function which returns an object of state variables.",
        );
      this.updater.enqueueSetState(this, m, O, "setState");
    }),
    (K.prototype.forceUpdate = function (m) {
      this.updater.enqueueForceUpdate(this, m, "forceUpdate");
    }));
  function nl() {}
  nl.prototype = K.prototype;
  function ol(m, O, G) {
    ((this.props = m),
      (this.context = O),
      (this.refs = N),
      (this.updater = G || U));
  }
  var sl = (ol.prototype = new nl());
  ((sl.constructor = ol), H(sl, K.prototype), (sl.isPureReactComponent = !0));
  var k = Array.isArray;
  function al() {}
  var W = { H: null, A: null, T: null, S: null },
    P = Object.prototype.hasOwnProperty;
  function Xl(m, O, G) {
    var Q = G.ref;
    return {
      $$typeof: f,
      type: m,
      key: O,
      ref: Q !== void 0 ? Q : null,
      props: G,
    };
  }
  function F(m, O) {
    return Xl(m.type, O, m.props);
  }
  function Ml(m) {
    return typeof m == "object" && m !== null && m.$$typeof === f;
  }
  function Fl(m) {
    var O = { "=": "=0", ":": "=2" };
    return (
      "$" +
      m.replace(/[=:]/g, function (G) {
        return O[G];
      })
    );
  }
  var At = /\/+/g;
  function Re(m, O) {
    return typeof m == "object" && m !== null && m.key != null
      ? Fl("" + m.key)
      : O.toString(36);
  }
  function Te(m) {
    switch (m.status) {
      case "fulfilled":
        return m.value;
      case "rejected":
        throw m.reason;
      default:
        switch (
          (typeof m.status == "string"
            ? m.then(al, al)
            : ((m.status = "pending"),
              m.then(
                function (O) {
                  m.status === "pending" &&
                    ((m.status = "fulfilled"), (m.value = O));
                },
                function (O) {
                  m.status === "pending" &&
                    ((m.status = "rejected"), (m.reason = O));
                },
              )),
          m.status)
        ) {
          case "fulfilled":
            return m.value;
          case "rejected":
            throw m.reason;
        }
    }
    throw m;
  }
  function T(m, O, G, Q, ll) {
    var ul = typeof m;
    (ul === "undefined" || ul === "boolean") && (m = null);
    var yl = !1;
    if (m === null) yl = !0;
    else
      switch (ul) {
        case "bigint":
        case "string":
        case "number":
          yl = !0;
          break;
        case "object":
          switch (m.$$typeof) {
            case f:
            case o:
              yl = !0;
              break;
            case B:
              return ((yl = m._init), T(yl(m._payload), O, G, Q, ll));
          }
      }
    if (yl)
      return (
        (ll = ll(m)),
        (yl = Q === "" ? "." + Re(m, 0) : Q),
        k(ll)
          ? ((G = ""),
            yl != null && (G = yl.replace(At, "$&/") + "/"),
            T(ll, O, G, "", function (Da) {
              return Da;
            }))
          : ll != null &&
            (Ml(ll) &&
              (ll = F(
                ll,
                G +
                  (ll.key == null || (m && m.key === ll.key)
                    ? ""
                    : ("" + ll.key).replace(At, "$&/") + "/") +
                  yl,
              )),
            O.push(ll)),
        1
      );
    yl = 0;
    var $l = Q === "" ? "." : Q + ":";
    if (k(m))
      for (var _l = 0; _l < m.length; _l++)
        ((Q = m[_l]), (ul = $l + Re(Q, _l)), (yl += T(Q, O, G, ul, ll)));
    else if (((_l = Y(m)), typeof _l == "function"))
      for (m = _l.call(m), _l = 0; !(Q = m.next()).done;)
        ((Q = Q.value), (ul = $l + Re(Q, _l++)), (yl += T(Q, O, G, ul, ll)));
    else if (ul === "object") {
      if (typeof m.then == "function") return T(Te(m), O, G, Q, ll);
      throw (
        (O = String(m)),
        Error(
          "Objects are not valid as a React child (found: " +
            (O === "[object Object]"
              ? "object with keys {" + Object.keys(m).join(", ") + "}"
              : O) +
            "). If you meant to render a collection of children, use an array instead.",
        )
      );
    }
    return yl;
  }
  function L(m, O, G) {
    if (m == null) return m;
    var Q = [],
      ll = 0;
    return (
      T(m, Q, "", "", function (ul) {
        return O.call(G, ul, ll++);
      }),
      Q
    );
  }
  function $(m) {
    if (m._status === -1) {
      var O = m._result;
      ((O = O()),
        O.then(
          function (G) {
            (m._status === 0 || m._status === -1) &&
              ((m._status = 1), (m._result = G));
          },
          function (G) {
            (m._status === 0 || m._status === -1) &&
              ((m._status = 2), (m._result = G));
          },
        ),
        m._status === -1 && ((m._status = 0), (m._result = O)));
    }
    if (m._status === 1) return m._result.default;
    throw m._result;
  }
  var bl =
      typeof reportError == "function"
        ? reportError
        : function (m) {
            if (
              typeof window == "object" &&
              typeof window.ErrorEvent == "function"
            ) {
              var O = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message:
                  typeof m == "object" &&
                  m !== null &&
                  typeof m.message == "string"
                    ? String(m.message)
                    : String(m),
                error: m,
              });
              if (!window.dispatchEvent(O)) return;
            } else if (
              typeof process == "object" &&
              typeof process.emit == "function"
            ) {
              process.emit("uncaughtException", m);
              return;
            }
            console.error(m);
          },
    Nl = {
      map: L,
      forEach: function (m, O, G) {
        L(
          m,
          function () {
            O.apply(this, arguments);
          },
          G,
        );
      },
      count: function (m) {
        var O = 0;
        return (
          L(m, function () {
            O++;
          }),
          O
        );
      },
      toArray: function (m) {
        return (
          L(m, function (O) {
            return O;
          }) || []
        );
      },
      only: function (m) {
        if (!Ml(m))
          throw Error(
            "React.Children.only expected to receive a single React element child.",
          );
        return m;
      },
    };
  return (
    (I.Activity = R),
    (I.Children = Nl),
    (I.Component = K),
    (I.Fragment = v),
    (I.Profiler = x),
    (I.PureComponent = ol),
    (I.StrictMode = d),
    (I.Suspense = C),
    (I.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = W),
    (I.__COMPILER_RUNTIME = {
      __proto__: null,
      c: function (m) {
        return W.H.useMemoCache(m);
      },
    }),
    (I.cache = function (m) {
      return function () {
        return m.apply(null, arguments);
      };
    }),
    (I.cacheSignal = function () {
      return null;
    }),
    (I.cloneElement = function (m, O, G) {
      if (m == null)
        throw Error(
          "The argument must be a React element, but you passed " + m + ".",
        );
      var Q = H({}, m.props),
        ll = m.key;
      if (O != null)
        for (ul in (O.key !== void 0 && (ll = "" + O.key), O))
          !P.call(O, ul) ||
            ul === "key" ||
            ul === "__self" ||
            ul === "__source" ||
            (ul === "ref" && O.ref === void 0) ||
            (Q[ul] = O[ul]);
      var ul = arguments.length - 2;
      if (ul === 1) Q.children = G;
      else if (1 < ul) {
        for (var yl = Array(ul), $l = 0; $l < ul; $l++)
          yl[$l] = arguments[$l + 2];
        Q.children = yl;
      }
      return Xl(m.type, ll, Q);
    }),
    (I.createContext = function (m) {
      return (
        (m = {
          $$typeof: D,
          _currentValue: m,
          _currentValue2: m,
          _threadCount: 0,
          Provider: null,
          Consumer: null,
        }),
        (m.Provider = m),
        (m.Consumer = { $$typeof: E, _context: m }),
        m
      );
    }),
    (I.createElement = function (m, O, G) {
      var Q,
        ll = {},
        ul = null;
      if (O != null)
        for (Q in (O.key !== void 0 && (ul = "" + O.key), O))
          P.call(O, Q) &&
            Q !== "key" &&
            Q !== "__self" &&
            Q !== "__source" &&
            (ll[Q] = O[Q]);
      var yl = arguments.length - 2;
      if (yl === 1) ll.children = G;
      else if (1 < yl) {
        for (var $l = Array(yl), _l = 0; _l < yl; _l++)
          $l[_l] = arguments[_l + 2];
        ll.children = $l;
      }
      if (m && m.defaultProps)
        for (Q in ((yl = m.defaultProps), yl))
          ll[Q] === void 0 && (ll[Q] = yl[Q]);
      return Xl(m, ul, ll);
    }),
    (I.createRef = function () {
      return { current: null };
    }),
    (I.forwardRef = function (m) {
      return { $$typeof: w, render: m };
    }),
    (I.isValidElement = Ml),
    (I.lazy = function (m) {
      return { $$typeof: B, _payload: { _status: -1, _result: m }, _init: $ };
    }),
    (I.memo = function (m, O) {
      return { $$typeof: g, type: m, compare: O === void 0 ? null : O };
    }),
    (I.startTransition = function (m) {
      var O = W.T,
        G = {};
      W.T = G;
      try {
        var Q = m(),
          ll = W.S;
        (ll !== null && ll(G, Q),
          typeof Q == "object" &&
            Q !== null &&
            typeof Q.then == "function" &&
            Q.then(al, bl));
      } catch (ul) {
        bl(ul);
      } finally {
        (O !== null && G.types !== null && (O.types = G.types), (W.T = O));
      }
    }),
    (I.unstable_useCacheRefresh = function () {
      return W.H.useCacheRefresh();
    }),
    (I.use = function (m) {
      return W.H.use(m);
    }),
    (I.useActionState = function (m, O, G) {
      return W.H.useActionState(m, O, G);
    }),
    (I.useCallback = function (m, O) {
      return W.H.useCallback(m, O);
    }),
    (I.useContext = function (m) {
      return W.H.useContext(m);
    }),
    (I.useDebugValue = function () {}),
    (I.useDeferredValue = function (m, O) {
      return W.H.useDeferredValue(m, O);
    }),
    (I.useEffect = function (m, O) {
      return W.H.useEffect(m, O);
    }),
    (I.useEffectEvent = function (m) {
      return W.H.useEffectEvent(m);
    }),
    (I.useId = function () {
      return W.H.useId();
    }),
    (I.useImperativeHandle = function (m, O, G) {
      return W.H.useImperativeHandle(m, O, G);
    }),
    (I.useInsertionEffect = function (m, O) {
      return W.H.useInsertionEffect(m, O);
    }),
    (I.useLayoutEffect = function (m, O) {
      return W.H.useLayoutEffect(m, O);
    }),
    (I.useMemo = function (m, O) {
      return W.H.useMemo(m, O);
    }),
    (I.useOptimistic = function (m, O) {
      return W.H.useOptimistic(m, O);
    }),
    (I.useReducer = function (m, O, G) {
      return W.H.useReducer(m, O, G);
    }),
    (I.useRef = function (m) {
      return W.H.useRef(m);
    }),
    (I.useState = function (m) {
      return W.H.useState(m);
    }),
    (I.useSyncExternalStore = function (m, O, G) {
      return W.H.useSyncExternalStore(m, O, G);
    }),
    (I.useTransition = function () {
      return W.H.useTransition();
    }),
    (I.version = "19.2.7"),
    I
  );
}
var _o;
function js() {
  return (_o || ((_o = 1), (vs.exports = Ev())), vs.exports);
}
var q = js();
const Tv = jv(q);
var ys = { exports: {} },
  An = {},
  gs = { exports: {} },
  ps = {};
var Oo;
function zv() {
  return (
    Oo ||
      ((Oo = 1),
      (function (f) {
        function o(T, L) {
          var $ = T.length;
          T.push(L);
          l: for (; 0 < $;) {
            var bl = ($ - 1) >>> 1,
              Nl = T[bl];
            if (0 < x(Nl, L)) ((T[bl] = L), (T[$] = Nl), ($ = bl));
            else break l;
          }
        }
        function v(T) {
          return T.length === 0 ? null : T[0];
        }
        function d(T) {
          if (T.length === 0) return null;
          var L = T[0],
            $ = T.pop();
          if ($ !== L) {
            T[0] = $;
            l: for (var bl = 0, Nl = T.length, m = Nl >>> 1; bl < m;) {
              var O = 2 * (bl + 1) - 1,
                G = T[O],
                Q = O + 1,
                ll = T[Q];
              if (0 > x(G, $))
                Q < Nl && 0 > x(ll, G)
                  ? ((T[bl] = ll), (T[Q] = $), (bl = Q))
                  : ((T[bl] = G), (T[O] = $), (bl = O));
              else if (Q < Nl && 0 > x(ll, $))
                ((T[bl] = ll), (T[Q] = $), (bl = Q));
              else break l;
            }
          }
          return L;
        }
        function x(T, L) {
          var $ = T.sortIndex - L.sortIndex;
          return $ !== 0 ? $ : T.id - L.id;
        }
        if (
          ((f.unstable_now = void 0),
          typeof performance == "object" &&
            typeof performance.now == "function")
        ) {
          var E = performance;
          f.unstable_now = function () {
            return E.now();
          };
        } else {
          var D = Date,
            w = D.now();
          f.unstable_now = function () {
            return D.now() - w;
          };
        }
        var C = [],
          g = [],
          B = 1,
          R = null,
          _ = 3,
          Y = !1,
          U = !1,
          H = !1,
          N = !1,
          K = typeof setTimeout == "function" ? setTimeout : null,
          nl = typeof clearTimeout == "function" ? clearTimeout : null,
          ol = typeof setImmediate < "u" ? setImmediate : null;
        function sl(T) {
          for (var L = v(g); L !== null;) {
            if (L.callback === null) d(g);
            else if (L.startTime <= T)
              (d(g), (L.sortIndex = L.expirationTime), o(C, L));
            else break;
            L = v(g);
          }
        }
        function k(T) {
          if (((H = !1), sl(T), !U))
            if (v(C) !== null) ((U = !0), al || ((al = !0), Fl()));
            else {
              var L = v(g);
              L !== null && Te(k, L.startTime - T);
            }
        }
        var al = !1,
          W = -1,
          P = 5,
          Xl = -1;
        function F() {
          return N ? !0 : !(f.unstable_now() - Xl < P);
        }
        function Ml() {
          if (((N = !1), al)) {
            var T = f.unstable_now();
            Xl = T;
            var L = !0;
            try {
              l: {
                ((U = !1), H && ((H = !1), nl(W), (W = -1)), (Y = !0));
                var $ = _;
                try {
                  e: {
                    for (
                      sl(T), R = v(C);
                      R !== null && !(R.expirationTime > T && F());
                    ) {
                      var bl = R.callback;
                      if (typeof bl == "function") {
                        ((R.callback = null), (_ = R.priorityLevel));
                        var Nl = bl(R.expirationTime <= T);
                        if (((T = f.unstable_now()), typeof Nl == "function")) {
                          ((R.callback = Nl), sl(T), (L = !0));
                          break e;
                        }
                        (R === v(C) && d(C), sl(T));
                      } else d(C);
                      R = v(C);
                    }
                    if (R !== null) L = !0;
                    else {
                      var m = v(g);
                      (m !== null && Te(k, m.startTime - T), (L = !1));
                    }
                  }
                  break l;
                } finally {
                  ((R = null), (_ = $), (Y = !1));
                }
                L = void 0;
              }
            } finally {
              L ? Fl() : (al = !1);
            }
          }
        }
        var Fl;
        if (typeof ol == "function")
          Fl = function () {
            ol(Ml);
          };
        else if (typeof MessageChannel < "u") {
          var At = new MessageChannel(),
            Re = At.port2;
          ((At.port1.onmessage = Ml),
            (Fl = function () {
              Re.postMessage(null);
            }));
        } else
          Fl = function () {
            K(Ml, 0);
          };
        function Te(T, L) {
          W = K(function () {
            T(f.unstable_now());
          }, L);
        }
        ((f.unstable_IdlePriority = 5),
          (f.unstable_ImmediatePriority = 1),
          (f.unstable_LowPriority = 4),
          (f.unstable_NormalPriority = 3),
          (f.unstable_Profiling = null),
          (f.unstable_UserBlockingPriority = 2),
          (f.unstable_cancelCallback = function (T) {
            T.callback = null;
          }),
          (f.unstable_forceFrameRate = function (T) {
            0 > T || 125 < T
              ? console.error(
                  "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported",
                )
              : (P = 0 < T ? Math.floor(1e3 / T) : 5);
          }),
          (f.unstable_getCurrentPriorityLevel = function () {
            return _;
          }),
          (f.unstable_next = function (T) {
            switch (_) {
              case 1:
              case 2:
              case 3:
                var L = 3;
                break;
              default:
                L = _;
            }
            var $ = _;
            _ = L;
            try {
              return T();
            } finally {
              _ = $;
            }
          }),
          (f.unstable_requestPaint = function () {
            N = !0;
          }),
          (f.unstable_runWithPriority = function (T, L) {
            switch (T) {
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
                break;
              default:
                T = 3;
            }
            var $ = _;
            _ = T;
            try {
              return L();
            } finally {
              _ = $;
            }
          }),
          (f.unstable_scheduleCallback = function (T, L, $) {
            var bl = f.unstable_now();
            switch (
              (typeof $ == "object" && $ !== null
                ? (($ = $.delay),
                  ($ = typeof $ == "number" && 0 < $ ? bl + $ : bl))
                : ($ = bl),
              T)
            ) {
              case 1:
                var Nl = -1;
                break;
              case 2:
                Nl = 250;
                break;
              case 5:
                Nl = 1073741823;
                break;
              case 4:
                Nl = 1e4;
                break;
              default:
                Nl = 5e3;
            }
            return (
              (Nl = $ + Nl),
              (T = {
                id: B++,
                callback: L,
                priorityLevel: T,
                startTime: $,
                expirationTime: Nl,
                sortIndex: -1,
              }),
              $ > bl
                ? ((T.sortIndex = $),
                  o(g, T),
                  v(C) === null &&
                    T === v(g) &&
                    (H ? (nl(W), (W = -1)) : (H = !0), Te(k, $ - bl)))
                : ((T.sortIndex = Nl),
                  o(C, T),
                  U || Y || ((U = !0), al || ((al = !0), Fl()))),
              T
            );
          }),
          (f.unstable_shouldYield = F),
          (f.unstable_wrapCallback = function (T) {
            var L = _;
            return function () {
              var $ = _;
              _ = L;
              try {
                return T.apply(this, arguments);
              } finally {
                _ = $;
              }
            };
          }));
      })(ps)),
    ps
  );
}
var Uo;
function Mv() {
  return (Uo || ((Uo = 1), (gs.exports = zv())), gs.exports);
}
var bs = { exports: {} },
  Jl = {};
var Ro;
function Dv() {
  if (Ro) return Jl;
  Ro = 1;
  var f = js();
  function o(C) {
    var g = "https://react.dev/errors/" + C;
    if (1 < arguments.length) {
      g += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var B = 2; B < arguments.length; B++)
        g += "&args[]=" + encodeURIComponent(arguments[B]);
    }
    return (
      "Minified React error #" +
      C +
      "; visit " +
      g +
      " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
  }
  function v() {}
  var d = {
      d: {
        f: v,
        r: function () {
          throw Error(o(522));
        },
        D: v,
        C: v,
        L: v,
        m: v,
        X: v,
        S: v,
        M: v,
      },
      p: 0,
      findDOMNode: null,
    },
    x = Symbol.for("react.portal");
  function E(C, g, B) {
    var R =
      3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: x,
      key: R == null ? null : "" + R,
      children: C,
      containerInfo: g,
      implementation: B,
    };
  }
  var D = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function w(C, g) {
    if (C === "font") return "";
    if (typeof g == "string") return g === "use-credentials" ? g : "";
  }
  return (
    (Jl.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = d),
    (Jl.createPortal = function (C, g) {
      var B =
        2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!g || (g.nodeType !== 1 && g.nodeType !== 9 && g.nodeType !== 11))
        throw Error(o(299));
      return E(C, g, null, B);
    }),
    (Jl.flushSync = function (C) {
      var g = D.T,
        B = d.p;
      try {
        if (((D.T = null), (d.p = 2), C)) return C();
      } finally {
        ((D.T = g), (d.p = B), d.d.f());
      }
    }),
    (Jl.preconnect = function (C, g) {
      typeof C == "string" &&
        (g
          ? ((g = g.crossOrigin),
            (g =
              typeof g == "string"
                ? g === "use-credentials"
                  ? g
                  : ""
                : void 0))
          : (g = null),
        d.d.C(C, g));
    }),
    (Jl.prefetchDNS = function (C) {
      typeof C == "string" && d.d.D(C);
    }),
    (Jl.preinit = function (C, g) {
      if (typeof C == "string" && g && typeof g.as == "string") {
        var B = g.as,
          R = w(B, g.crossOrigin),
          _ = typeof g.integrity == "string" ? g.integrity : void 0,
          Y = typeof g.fetchPriority == "string" ? g.fetchPriority : void 0;
        B === "style"
          ? d.d.S(C, typeof g.precedence == "string" ? g.precedence : void 0, {
              crossOrigin: R,
              integrity: _,
              fetchPriority: Y,
            })
          : B === "script" &&
            d.d.X(C, {
              crossOrigin: R,
              integrity: _,
              fetchPriority: Y,
              nonce: typeof g.nonce == "string" ? g.nonce : void 0,
            });
      }
    }),
    (Jl.preinitModule = function (C, g) {
      if (typeof C == "string")
        if (typeof g == "object" && g !== null) {
          if (g.as == null || g.as === "script") {
            var B = w(g.as, g.crossOrigin);
            d.d.M(C, {
              crossOrigin: B,
              integrity: typeof g.integrity == "string" ? g.integrity : void 0,
              nonce: typeof g.nonce == "string" ? g.nonce : void 0,
            });
          }
        } else g == null && d.d.M(C);
    }),
    (Jl.preload = function (C, g) {
      if (
        typeof C == "string" &&
        typeof g == "object" &&
        g !== null &&
        typeof g.as == "string"
      ) {
        var B = g.as,
          R = w(B, g.crossOrigin);
        d.d.L(C, B, {
          crossOrigin: R,
          integrity: typeof g.integrity == "string" ? g.integrity : void 0,
          nonce: typeof g.nonce == "string" ? g.nonce : void 0,
          type: typeof g.type == "string" ? g.type : void 0,
          fetchPriority:
            typeof g.fetchPriority == "string" ? g.fetchPriority : void 0,
          referrerPolicy:
            typeof g.referrerPolicy == "string" ? g.referrerPolicy : void 0,
          imageSrcSet:
            typeof g.imageSrcSet == "string" ? g.imageSrcSet : void 0,
          imageSizes: typeof g.imageSizes == "string" ? g.imageSizes : void 0,
          media: typeof g.media == "string" ? g.media : void 0,
        });
      }
    }),
    (Jl.preloadModule = function (C, g) {
      if (typeof C == "string")
        if (g) {
          var B = w(g.as, g.crossOrigin);
          d.d.m(C, {
            as: typeof g.as == "string" && g.as !== "script" ? g.as : void 0,
            crossOrigin: B,
            integrity: typeof g.integrity == "string" ? g.integrity : void 0,
          });
        } else d.d.m(C);
    }),
    (Jl.requestFormReset = function (C) {
      d.d.r(C);
    }),
    (Jl.unstable_batchedUpdates = function (C, g) {
      return C(g);
    }),
    (Jl.useFormState = function (C, g, B) {
      return D.H.useFormState(C, g, B);
    }),
    (Jl.useFormStatus = function () {
      return D.H.useHostTransitionStatus();
    }),
    (Jl.version = "19.2.7"),
    Jl
  );
}
var Ho;
function Cv() {
  if (Ho) return bs.exports;
  Ho = 1;
  function f() {
    if (!(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    ))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(f);
      } catch (o) {
        console.error(o);
      }
  }
  return (f(), (bs.exports = Dv()), bs.exports);
}
var Bo;
function _v() {
  if (Bo) return An;
  Bo = 1;
  var f = Mv(),
    o = js(),
    v = Cv();
  function d(l) {
    var e = "https://react.dev/errors/" + l;
    if (1 < arguments.length) {
      e += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var t = 2; t < arguments.length; t++)
        e += "&args[]=" + encodeURIComponent(arguments[t]);
    }
    return (
      "Minified React error #" +
      l +
      "; visit " +
      e +
      " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
  }
  function x(l) {
    return !(!l || (l.nodeType !== 1 && l.nodeType !== 9 && l.nodeType !== 11));
  }
  function E(l) {
    var e = l,
      t = l;
    if (l.alternate) for (; e.return;) e = e.return;
    else {
      l = e;
      do ((e = l), (e.flags & 4098) !== 0 && (t = e.return), (l = e.return));
      while (l);
    }
    return e.tag === 3 ? t : null;
  }
  function D(l) {
    if (l.tag === 13) {
      var e = l.memoizedState;
      if (
        (e === null && ((l = l.alternate), l !== null && (e = l.memoizedState)),
        e !== null)
      )
        return e.dehydrated;
    }
    return null;
  }
  function w(l) {
    if (l.tag === 31) {
      var e = l.memoizedState;
      if (
        (e === null && ((l = l.alternate), l !== null && (e = l.memoizedState)),
        e !== null)
      )
        return e.dehydrated;
    }
    return null;
  }
  function C(l) {
    if (E(l) !== l) throw Error(d(188));
  }
  function g(l) {
    var e = l.alternate;
    if (!e) {
      if (((e = E(l)), e === null)) throw Error(d(188));
      return e !== l ? null : l;
    }
    for (var t = l, a = e; ;) {
      var n = t.return;
      if (n === null) break;
      var u = n.alternate;
      if (u === null) {
        if (((a = n.return), a !== null)) {
          t = a;
          continue;
        }
        break;
      }
      if (n.child === u.child) {
        for (u = n.child; u;) {
          if (u === t) return (C(n), l);
          if (u === a) return (C(n), e);
          u = u.sibling;
        }
        throw Error(d(188));
      }
      if (t.return !== a.return) ((t = n), (a = u));
      else {
        for (var c = !1, s = n.child; s;) {
          if (s === t) {
            ((c = !0), (t = n), (a = u));
            break;
          }
          if (s === a) {
            ((c = !0), (a = n), (t = u));
            break;
          }
          s = s.sibling;
        }
        if (!c) {
          for (s = u.child; s;) {
            if (s === t) {
              ((c = !0), (t = u), (a = n));
              break;
            }
            if (s === a) {
              ((c = !0), (a = u), (t = n));
              break;
            }
            s = s.sibling;
          }
          if (!c) throw Error(d(189));
        }
      }
      if (t.alternate !== a) throw Error(d(190));
    }
    if (t.tag !== 3) throw Error(d(188));
    return t.stateNode.current === t ? l : e;
  }
  function B(l) {
    var e = l.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return l;
    for (l = l.child; l !== null;) {
      if (((e = B(l)), e !== null)) return e;
      l = l.sibling;
    }
    return null;
  }
  var R = Object.assign,
    _ = Symbol.for("react.element"),
    Y = Symbol.for("react.transitional.element"),
    U = Symbol.for("react.portal"),
    H = Symbol.for("react.fragment"),
    N = Symbol.for("react.strict_mode"),
    K = Symbol.for("react.profiler"),
    nl = Symbol.for("react.consumer"),
    ol = Symbol.for("react.context"),
    sl = Symbol.for("react.forward_ref"),
    k = Symbol.for("react.suspense"),
    al = Symbol.for("react.suspense_list"),
    W = Symbol.for("react.memo"),
    P = Symbol.for("react.lazy"),
    Xl = Symbol.for("react.activity"),
    F = Symbol.for("react.memo_cache_sentinel"),
    Ml = Symbol.iterator;
  function Fl(l) {
    return l === null || typeof l != "object"
      ? null
      : ((l = (Ml && l[Ml]) || l["@@iterator"]),
        typeof l == "function" ? l : null);
  }
  var At = Symbol.for("react.client.reference");
  function Re(l) {
    if (l == null) return null;
    if (typeof l == "function")
      return l.$$typeof === At ? null : l.displayName || l.name || null;
    if (typeof l == "string") return l;
    switch (l) {
      case H:
        return "Fragment";
      case K:
        return "Profiler";
      case N:
        return "StrictMode";
      case k:
        return "Suspense";
      case al:
        return "SuspenseList";
      case Xl:
        return "Activity";
    }
    if (typeof l == "object")
      switch (l.$$typeof) {
        case U:
          return "Portal";
        case ol:
          return l.displayName || "Context";
        case nl:
          return (l._context.displayName || "Context") + ".Consumer";
        case sl:
          var e = l.render;
          return (
            (l = l.displayName),
            l ||
              ((l = e.displayName || e.name || ""),
              (l = l !== "" ? "ForwardRef(" + l + ")" : "ForwardRef")),
            l
          );
        case W:
          return (
            (e = l.displayName || null),
            e !== null ? e : Re(l.type) || "Memo"
          );
        case P:
          ((e = l._payload), (l = l._init));
          try {
            return Re(l(e));
          } catch {}
      }
    return null;
  }
  var Te = Array.isArray,
    T = o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    L = v.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    $ = { pending: !1, data: null, method: null, action: null },
    bl = [],
    Nl = -1;
  function m(l) {
    return { current: l };
  }
  function O(l) {
    0 > Nl || ((l.current = bl[Nl]), (bl[Nl] = null), Nl--);
  }
  function G(l, e) {
    (Nl++, (bl[Nl] = l.current), (l.current = e));
  }
  var Q = m(null),
    ll = m(null),
    ul = m(null),
    yl = m(null);
  function $l(l, e) {
    switch ((G(ul, e), G(ll, l), G(Q, null), e.nodeType)) {
      case 9:
      case 11:
        l = (l = e.documentElement) && (l = l.namespaceURI) ? Wr(l) : 0;
        break;
      default:
        if (((l = e.tagName), (e = e.namespaceURI)))
          ((e = Wr(e)), (l = Fr(e, l)));
        else
          switch (l) {
            case "svg":
              l = 1;
              break;
            case "math":
              l = 2;
              break;
            default:
              l = 0;
          }
    }
    (O(Q), G(Q, l));
  }
  function _l() {
    (O(Q), O(ll), O(ul));
  }
  function Da(l) {
    l.memoizedState !== null && G(yl, l);
    var e = Q.current,
      t = Fr(e, l.type);
    e !== t && (G(ll, l), G(Q, t));
  }
  function zn(l) {
    (ll.current === l && (O(Q), O(ll)),
      yl.current === l && (O(yl), (bn._currentValue = $)));
  }
  var Wu, Es;
  function Et(l) {
    if (Wu === void 0)
      try {
        throw Error();
      } catch (t) {
        var e = t.stack.trim().match(/\n( *(at )?)/);
        ((Wu = (e && e[1]) || ""),
          (Es =
            -1 <
            t.stack.indexOf(`
    at`)
              ? " (<anonymous>)"
              : -1 < t.stack.indexOf("@")
                ? "@unknown:0:0"
                : ""));
      }
    return (
      `
` +
      Wu +
      l +
      Es
    );
  }
  var Fu = !1;
  function Iu(l, e) {
    if (!l || Fu) return "";
    Fu = !0;
    var t = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function () {
          try {
            if (e) {
              var M = function () {
                throw Error();
              };
              if (
                (Object.defineProperty(M.prototype, "props", {
                  set: function () {
                    throw Error();
                  },
                }),
                typeof Reflect == "object" && Reflect.construct)
              ) {
                try {
                  Reflect.construct(M, []);
                } catch (j) {
                  var S = j;
                }
                Reflect.construct(l, [], M);
              } else {
                try {
                  M.call();
                } catch (j) {
                  S = j;
                }
                l.call(M.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (j) {
                S = j;
              }
              (M = l()) &&
                typeof M.catch == "function" &&
                M.catch(function () {});
            }
          } catch (j) {
            if (j && S && typeof j.stack == "string") return [j.stack, S.stack];
          }
          return [null, null];
        },
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name",
      );
      n &&
        n.configurable &&
        Object.defineProperty(a.DetermineComponentFrameRoot, "name", {
          value: "DetermineComponentFrameRoot",
        });
      var u = a.DetermineComponentFrameRoot(),
        c = u[0],
        s = u[1];
      if (c && s) {
        var r = c.split(`
`),
          b = s.split(`
`);
        for (
          n = a = 0;
          a < r.length && !r[a].includes("DetermineComponentFrameRoot");
        )
          a++;
        for (; n < b.length && !b[n].includes("DetermineComponentFrameRoot");)
          n++;
        if (a === r.length || n === b.length)
          for (
            a = r.length - 1, n = b.length - 1;
            1 <= a && 0 <= n && r[a] !== b[n];
          )
            n--;
        for (; 1 <= a && 0 <= n; a--, n--)
          if (r[a] !== b[n]) {
            if (a !== 1 || n !== 1)
              do
                if ((a--, n--, 0 > n || r[a] !== b[n])) {
                  var A =
                    `
` + r[a].replace(" at new ", " at ");
                  return (
                    l.displayName &&
                      A.includes("<anonymous>") &&
                      (A = A.replace("<anonymous>", l.displayName)),
                    A
                  );
                }
              while (1 <= a && 0 <= n);
            break;
          }
      }
    } finally {
      ((Fu = !1), (Error.prepareStackTrace = t));
    }
    return (t = l ? l.displayName || l.name : "") ? Et(t) : "";
  }
  function Po(l, e) {
    switch (l.tag) {
      case 26:
      case 27:
      case 5:
        return Et(l.type);
      case 16:
        return Et("Lazy");
      case 13:
        return l.child !== e && e !== null
          ? Et("Suspense Fallback")
          : Et("Suspense");
      case 19:
        return Et("SuspenseList");
      case 0:
      case 15:
        return Iu(l.type, !1);
      case 11:
        return Iu(l.type.render, !1);
      case 1:
        return Iu(l.type, !0);
      case 31:
        return Et("Activity");
      default:
        return "";
    }
  }
  function Ts(l) {
    try {
      var e = "",
        t = null;
      do ((e += Po(l, t)), (t = l), (l = l.return));
      while (l);
      return e;
    } catch (a) {
      return (
        `
Error generating stack: ` +
        a.message +
        `
` +
        a.stack
      );
    }
  }
  var Pu = Object.prototype.hasOwnProperty,
    li = f.unstable_scheduleCallback,
    ei = f.unstable_cancelCallback,
    lh = f.unstable_shouldYield,
    eh = f.unstable_requestPaint,
    ie = f.unstable_now,
    th = f.unstable_getCurrentPriorityLevel,
    zs = f.unstable_ImmediatePriority,
    Ms = f.unstable_UserBlockingPriority,
    Mn = f.unstable_NormalPriority,
    ah = f.unstable_LowPriority,
    Ds = f.unstable_IdlePriority,
    nh = f.log,
    uh = f.unstable_setDisableYieldValue,
    Ca = null,
    ce = null;
  function Pe(l) {
    if (
      (typeof nh == "function" && uh(l),
      ce && typeof ce.setStrictMode == "function")
    )
      try {
        ce.setStrictMode(Ca, l);
      } catch {}
  }
  var se = Math.clz32 ? Math.clz32 : sh,
    ih = Math.log,
    ch = Math.LN2;
  function sh(l) {
    return ((l >>>= 0), l === 0 ? 32 : (31 - ((ih(l) / ch) | 0)) | 0);
  }
  var Dn = 256,
    Cn = 262144,
    _n = 4194304;
  function Tt(l) {
    var e = l & 42;
    if (e !== 0) return e;
    switch (l & -l) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return l & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return l & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return l & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return l;
    }
  }
  function On(l, e, t) {
    var a = l.pendingLanes;
    if (a === 0) return 0;
    var n = 0,
      u = l.suspendedLanes,
      c = l.pingedLanes;
    l = l.warmLanes;
    var s = a & 134217727;
    return (
      s !== 0
        ? ((a = s & ~u),
          a !== 0
            ? (n = Tt(a))
            : ((c &= s),
              c !== 0
                ? (n = Tt(c))
                : t || ((t = s & ~l), t !== 0 && (n = Tt(t)))))
        : ((s = a & ~u),
          s !== 0
            ? (n = Tt(s))
            : c !== 0
              ? (n = Tt(c))
              : t || ((t = a & ~l), t !== 0 && (n = Tt(t)))),
      n === 0
        ? 0
        : e !== 0 &&
            e !== n &&
            (e & u) === 0 &&
            ((u = n & -n),
            (t = e & -e),
            u >= t || (u === 32 && (t & 4194048) !== 0))
          ? e
          : n
    );
  }
  function _a(l, e) {
    return (l.pendingLanes & ~(l.suspendedLanes & ~l.pingedLanes) & e) === 0;
  }
  function fh(l, e) {
    switch (l) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return e + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function Cs() {
    var l = _n;
    return ((_n <<= 1), (_n & 62914560) === 0 && (_n = 4194304), l);
  }
  function ti(l) {
    for (var e = [], t = 0; 31 > t; t++) e.push(l);
    return e;
  }
  function Oa(l, e) {
    ((l.pendingLanes |= e),
      e !== 268435456 &&
        ((l.suspendedLanes = 0), (l.pingedLanes = 0), (l.warmLanes = 0)));
  }
  function dh(l, e, t, a, n, u) {
    var c = l.pendingLanes;
    ((l.pendingLanes = t),
      (l.suspendedLanes = 0),
      (l.pingedLanes = 0),
      (l.warmLanes = 0),
      (l.expiredLanes &= t),
      (l.entangledLanes &= t),
      (l.errorRecoveryDisabledLanes &= t),
      (l.shellSuspendCounter = 0));
    var s = l.entanglements,
      r = l.expirationTimes,
      b = l.hiddenUpdates;
    for (t = c & ~t; 0 < t;) {
      var A = 31 - se(t),
        M = 1 << A;
      ((s[A] = 0), (r[A] = -1));
      var S = b[A];
      if (S !== null)
        for (b[A] = null, A = 0; A < S.length; A++) {
          var j = S[A];
          j !== null && (j.lane &= -536870913);
        }
      t &= ~M;
    }
    (a !== 0 && _s(l, a, 0),
      u !== 0 && n === 0 && l.tag !== 0 && (l.suspendedLanes |= u & ~(c & ~e)));
  }
  function _s(l, e, t) {
    ((l.pendingLanes |= e), (l.suspendedLanes &= ~e));
    var a = 31 - se(e);
    ((l.entangledLanes |= e),
      (l.entanglements[a] = l.entanglements[a] | 1073741824 | (t & 261930)));
  }
  function Os(l, e) {
    var t = (l.entangledLanes |= e);
    for (l = l.entanglements; t;) {
      var a = 31 - se(t),
        n = 1 << a;
      ((n & e) | (l[a] & e) && (l[a] |= e), (t &= ~n));
    }
  }
  function Us(l, e) {
    var t = e & -e;
    return (
      (t = (t & 42) !== 0 ? 1 : ai(t)),
      (t & (l.suspendedLanes | e)) !== 0 ? 0 : t
    );
  }
  function ai(l) {
    switch (l) {
      case 2:
        l = 1;
        break;
      case 8:
        l = 4;
        break;
      case 32:
        l = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        l = 128;
        break;
      case 268435456:
        l = 134217728;
        break;
      default:
        l = 0;
    }
    return l;
  }
  function ni(l) {
    return (
      (l &= -l),
      2 < l ? (8 < l ? ((l & 134217727) !== 0 ? 32 : 268435456) : 8) : 2
    );
  }
  function Rs() {
    var l = L.p;
    return l !== 0 ? l : ((l = window.event), l === void 0 ? 32 : xo(l.type));
  }
  function Hs(l, e) {
    var t = L.p;
    try {
      return ((L.p = l), e());
    } finally {
      L.p = t;
    }
  }
  var lt = Math.random().toString(36).slice(2),
    Ql = "__reactFiber$" + lt,
    Il = "__reactProps$" + lt,
    Kt = "__reactContainer$" + lt,
    ui = "__reactEvents$" + lt,
    rh = "__reactListeners$" + lt,
    oh = "__reactHandles$" + lt,
    Bs = "__reactResources$" + lt,
    Ua = "__reactMarker$" + lt;
  function ii(l) {
    (delete l[Ql], delete l[Il], delete l[ui], delete l[rh], delete l[oh]);
  }
  function Vt(l) {
    var e = l[Ql];
    if (e) return e;
    for (var t = l.parentNode; t;) {
      if ((e = t[Kt] || t[Ql])) {
        if (
          ((t = e.alternate),
          e.child !== null || (t !== null && t.child !== null))
        )
          for (l = no(l); l !== null;) {
            if ((t = l[Ql])) return t;
            l = no(l);
          }
        return e;
      }
      ((l = t), (t = l.parentNode));
    }
    return null;
  }
  function kt(l) {
    if ((l = l[Ql] || l[Kt])) {
      var e = l.tag;
      if (
        e === 5 ||
        e === 6 ||
        e === 13 ||
        e === 31 ||
        e === 26 ||
        e === 27 ||
        e === 3
      )
        return l;
    }
    return null;
  }
  function Ra(l) {
    var e = l.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return l.stateNode;
    throw Error(d(33));
  }
  function Jt(l) {
    var e = l[Bs];
    return (
      e ||
        (e = l[Bs] =
          { hoistableStyles: new Map(), hoistableScripts: new Map() }),
      e
    );
  }
  function Ll(l) {
    l[Ua] = !0;
  }
  var qs = new Set(),
    Ys = {};
  function zt(l, e) {
    ($t(l, e), $t(l + "Capture", e));
  }
  function $t(l, e) {
    for (Ys[l] = e, l = 0; l < e.length; l++) qs.add(e[l]);
  }
  var hh = RegExp(
      "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$",
    ),
    ws = {},
    Ls = {};
  function mh(l) {
    return Pu.call(Ls, l)
      ? !0
      : Pu.call(ws, l)
        ? !1
        : hh.test(l)
          ? (Ls[l] = !0)
          : ((ws[l] = !0), !1);
  }
  function Un(l, e, t) {
    if (mh(e))
      if (t === null) l.removeAttribute(e);
      else {
        switch (typeof t) {
          case "undefined":
          case "function":
          case "symbol":
            l.removeAttribute(e);
            return;
          case "boolean":
            var a = e.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              l.removeAttribute(e);
              return;
            }
        }
        l.setAttribute(e, "" + t);
      }
  }
  function Rn(l, e, t) {
    if (t === null) l.removeAttribute(e);
    else {
      switch (typeof t) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          l.removeAttribute(e);
          return;
      }
      l.setAttribute(e, "" + t);
    }
  }
  function He(l, e, t, a) {
    if (a === null) l.removeAttribute(t);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          l.removeAttribute(t);
          return;
      }
      l.setAttributeNS(e, t, "" + a);
    }
  }
  function ye(l) {
    switch (typeof l) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return l;
      case "object":
        return l;
      default:
        return "";
    }
  }
  function Gs(l) {
    var e = l.type;
    return (
      (l = l.nodeName) &&
      l.toLowerCase() === "input" &&
      (e === "checkbox" || e === "radio")
    );
  }
  function vh(l, e, t) {
    var a = Object.getOwnPropertyDescriptor(l.constructor.prototype, e);
    if (
      !l.hasOwnProperty(e) &&
      typeof a < "u" &&
      typeof a.get == "function" &&
      typeof a.set == "function"
    ) {
      var n = a.get,
        u = a.set;
      return (
        Object.defineProperty(l, e, {
          configurable: !0,
          get: function () {
            return n.call(this);
          },
          set: function (c) {
            ((t = "" + c), u.call(this, c));
          },
        }),
        Object.defineProperty(l, e, { enumerable: a.enumerable }),
        {
          getValue: function () {
            return t;
          },
          setValue: function (c) {
            t = "" + c;
          },
          stopTracking: function () {
            ((l._valueTracker = null), delete l[e]);
          },
        }
      );
    }
  }
  function ci(l) {
    if (!l._valueTracker) {
      var e = Gs(l) ? "checked" : "value";
      l._valueTracker = vh(l, e, "" + l[e]);
    }
  }
  function Xs(l) {
    if (!l) return !1;
    var e = l._valueTracker;
    if (!e) return !0;
    var t = e.getValue(),
      a = "";
    return (
      l && (a = Gs(l) ? (l.checked ? "true" : "false") : l.value),
      (l = a),
      l !== t ? (e.setValue(l), !0) : !1
    );
  }
  function Hn(l) {
    if (
      ((l = l || (typeof document < "u" ? document : void 0)), typeof l > "u")
    )
      return null;
    try {
      return l.activeElement || l.body;
    } catch {
      return l.body;
    }
  }
  var yh = /[\n"\\]/g;
  function ge(l) {
    return l.replace(yh, function (e) {
      return "\\" + e.charCodeAt(0).toString(16) + " ";
    });
  }
  function si(l, e, t, a, n, u, c, s) {
    ((l.name = ""),
      c != null &&
      typeof c != "function" &&
      typeof c != "symbol" &&
      typeof c != "boolean"
        ? (l.type = c)
        : l.removeAttribute("type"),
      e != null
        ? c === "number"
          ? ((e === 0 && l.value === "") || l.value != e) &&
            (l.value = "" + ye(e))
          : l.value !== "" + ye(e) && (l.value = "" + ye(e))
        : (c !== "submit" && c !== "reset") || l.removeAttribute("value"),
      e != null
        ? fi(l, c, ye(e))
        : t != null
          ? fi(l, c, ye(t))
          : a != null && l.removeAttribute("value"),
      n == null && u != null && (l.defaultChecked = !!u),
      n != null &&
        (l.checked = n && typeof n != "function" && typeof n != "symbol"),
      s != null &&
      typeof s != "function" &&
      typeof s != "symbol" &&
      typeof s != "boolean"
        ? (l.name = "" + ye(s))
        : l.removeAttribute("name"));
  }
  function Qs(l, e, t, a, n, u, c, s) {
    if (
      (u != null &&
        typeof u != "function" &&
        typeof u != "symbol" &&
        typeof u != "boolean" &&
        (l.type = u),
      e != null || t != null)
    ) {
      if (!((u !== "submit" && u !== "reset") || e != null)) {
        ci(l);
        return;
      }
      ((t = t != null ? "" + ye(t) : ""),
        (e = e != null ? "" + ye(e) : t),
        s || e === l.value || (l.value = e),
        (l.defaultValue = e));
    }
    ((a = a ?? n),
      (a = typeof a != "function" && typeof a != "symbol" && !!a),
      (l.checked = s ? l.checked : !!a),
      (l.defaultChecked = !!a),
      c != null &&
        typeof c != "function" &&
        typeof c != "symbol" &&
        typeof c != "boolean" &&
        (l.name = c),
      ci(l));
  }
  function fi(l, e, t) {
    (e === "number" && Hn(l.ownerDocument) === l) ||
      l.defaultValue === "" + t ||
      (l.defaultValue = "" + t);
  }
  function Wt(l, e, t, a) {
    if (((l = l.options), e)) {
      e = {};
      for (var n = 0; n < t.length; n++) e["$" + t[n]] = !0;
      for (t = 0; t < l.length; t++)
        ((n = e.hasOwnProperty("$" + l[t].value)),
          l[t].selected !== n && (l[t].selected = n),
          n && a && (l[t].defaultSelected = !0));
    } else {
      for (t = "" + ye(t), e = null, n = 0; n < l.length; n++) {
        if (l[n].value === t) {
          ((l[n].selected = !0), a && (l[n].defaultSelected = !0));
          return;
        }
        e !== null || l[n].disabled || (e = l[n]);
      }
      e !== null && (e.selected = !0);
    }
  }
  function Zs(l, e, t) {
    if (
      e != null &&
      ((e = "" + ye(e)), e !== l.value && (l.value = e), t == null)
    ) {
      l.defaultValue !== e && (l.defaultValue = e);
      return;
    }
    l.defaultValue = t != null ? "" + ye(t) : "";
  }
  function Ks(l, e, t, a) {
    if (e == null) {
      if (a != null) {
        if (t != null) throw Error(d(92));
        if (Te(a)) {
          if (1 < a.length) throw Error(d(93));
          a = a[0];
        }
        t = a;
      }
      (t == null && (t = ""), (e = t));
    }
    ((t = ye(e)),
      (l.defaultValue = t),
      (a = l.textContent),
      a === t && a !== "" && a !== null && (l.value = a),
      ci(l));
  }
  function Ft(l, e) {
    if (e) {
      var t = l.firstChild;
      if (t && t === l.lastChild && t.nodeType === 3) {
        t.nodeValue = e;
        return;
      }
    }
    l.textContent = e;
  }
  var gh = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " ",
    ),
  );
  function Vs(l, e, t) {
    var a = e.indexOf("--") === 0;
    t == null || typeof t == "boolean" || t === ""
      ? a
        ? l.setProperty(e, "")
        : e === "float"
          ? (l.cssFloat = "")
          : (l[e] = "")
      : a
        ? l.setProperty(e, t)
        : typeof t != "number" || t === 0 || gh.has(e)
          ? e === "float"
            ? (l.cssFloat = t)
            : (l[e] = ("" + t).trim())
          : (l[e] = t + "px");
  }
  function ks(l, e, t) {
    if (e != null && typeof e != "object") throw Error(d(62));
    if (((l = l.style), t != null)) {
      for (var a in t)
        !t.hasOwnProperty(a) ||
          (e != null && e.hasOwnProperty(a)) ||
          (a.indexOf("--") === 0
            ? l.setProperty(a, "")
            : a === "float"
              ? (l.cssFloat = "")
              : (l[a] = ""));
      for (var n in e)
        ((a = e[n]), e.hasOwnProperty(n) && t[n] !== a && Vs(l, n, a));
    } else for (var u in e) e.hasOwnProperty(u) && Vs(l, u, e[u]);
  }
  function di(l) {
    if (l.indexOf("-") === -1) return !1;
    switch (l) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var ph = new Map([
      ["acceptCharset", "accept-charset"],
      ["htmlFor", "for"],
      ["httpEquiv", "http-equiv"],
      ["crossOrigin", "crossorigin"],
      ["accentHeight", "accent-height"],
      ["alignmentBaseline", "alignment-baseline"],
      ["arabicForm", "arabic-form"],
      ["baselineShift", "baseline-shift"],
      ["capHeight", "cap-height"],
      ["clipPath", "clip-path"],
      ["clipRule", "clip-rule"],
      ["colorInterpolation", "color-interpolation"],
      ["colorInterpolationFilters", "color-interpolation-filters"],
      ["colorProfile", "color-profile"],
      ["colorRendering", "color-rendering"],
      ["dominantBaseline", "dominant-baseline"],
      ["enableBackground", "enable-background"],
      ["fillOpacity", "fill-opacity"],
      ["fillRule", "fill-rule"],
      ["floodColor", "flood-color"],
      ["floodOpacity", "flood-opacity"],
      ["fontFamily", "font-family"],
      ["fontSize", "font-size"],
      ["fontSizeAdjust", "font-size-adjust"],
      ["fontStretch", "font-stretch"],
      ["fontStyle", "font-style"],
      ["fontVariant", "font-variant"],
      ["fontWeight", "font-weight"],
      ["glyphName", "glyph-name"],
      ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
      ["glyphOrientationVertical", "glyph-orientation-vertical"],
      ["horizAdvX", "horiz-adv-x"],
      ["horizOriginX", "horiz-origin-x"],
      ["imageRendering", "image-rendering"],
      ["letterSpacing", "letter-spacing"],
      ["lightingColor", "lighting-color"],
      ["markerEnd", "marker-end"],
      ["markerMid", "marker-mid"],
      ["markerStart", "marker-start"],
      ["overlinePosition", "overline-position"],
      ["overlineThickness", "overline-thickness"],
      ["paintOrder", "paint-order"],
      ["panose-1", "panose-1"],
      ["pointerEvents", "pointer-events"],
      ["renderingIntent", "rendering-intent"],
      ["shapeRendering", "shape-rendering"],
      ["stopColor", "stop-color"],
      ["stopOpacity", "stop-opacity"],
      ["strikethroughPosition", "strikethrough-position"],
      ["strikethroughThickness", "strikethrough-thickness"],
      ["strokeDasharray", "stroke-dasharray"],
      ["strokeDashoffset", "stroke-dashoffset"],
      ["strokeLinecap", "stroke-linecap"],
      ["strokeLinejoin", "stroke-linejoin"],
      ["strokeMiterlimit", "stroke-miterlimit"],
      ["strokeOpacity", "stroke-opacity"],
      ["strokeWidth", "stroke-width"],
      ["textAnchor", "text-anchor"],
      ["textDecoration", "text-decoration"],
      ["textRendering", "text-rendering"],
      ["transformOrigin", "transform-origin"],
      ["underlinePosition", "underline-position"],
      ["underlineThickness", "underline-thickness"],
      ["unicodeBidi", "unicode-bidi"],
      ["unicodeRange", "unicode-range"],
      ["unitsPerEm", "units-per-em"],
      ["vAlphabetic", "v-alphabetic"],
      ["vHanging", "v-hanging"],
      ["vIdeographic", "v-ideographic"],
      ["vMathematical", "v-mathematical"],
      ["vectorEffect", "vector-effect"],
      ["vertAdvY", "vert-adv-y"],
      ["vertOriginX", "vert-origin-x"],
      ["vertOriginY", "vert-origin-y"],
      ["wordSpacing", "word-spacing"],
      ["writingMode", "writing-mode"],
      ["xmlnsXlink", "xmlns:xlink"],
      ["xHeight", "x-height"],
    ]),
    bh =
      /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function Bn(l) {
    return bh.test("" + l)
      ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
      : l;
  }
  function Be() {}
  var ri = null;
  function oi(l) {
    return (
      (l = l.target || l.srcElement || window),
      l.correspondingUseElement && (l = l.correspondingUseElement),
      l.nodeType === 3 ? l.parentNode : l
    );
  }
  var It = null,
    Pt = null;
  function Js(l) {
    var e = kt(l);
    if (e && (l = e.stateNode)) {
      var t = l[Il] || null;
      l: switch (((l = e.stateNode), e.type)) {
        case "input":
          if (
            (si(
              l,
              t.value,
              t.defaultValue,
              t.defaultValue,
              t.checked,
              t.defaultChecked,
              t.type,
              t.name,
            ),
            (e = t.name),
            t.type === "radio" && e != null)
          ) {
            for (t = l; t.parentNode;) t = t.parentNode;
            for (
              t = t.querySelectorAll(
                'input[name="' + ge("" + e) + '"][type="radio"]',
              ),
                e = 0;
              e < t.length;
              e++
            ) {
              var a = t[e];
              if (a !== l && a.form === l.form) {
                var n = a[Il] || null;
                if (!n) throw Error(d(90));
                si(
                  a,
                  n.value,
                  n.defaultValue,
                  n.defaultValue,
                  n.checked,
                  n.defaultChecked,
                  n.type,
                  n.name,
                );
              }
            }
            for (e = 0; e < t.length; e++)
              ((a = t[e]), a.form === l.form && Xs(a));
          }
          break l;
        case "textarea":
          Zs(l, t.value, t.defaultValue);
          break l;
        case "select":
          ((e = t.value), e != null && Wt(l, !!t.multiple, e, !1));
      }
    }
  }
  var hi = !1;
  function $s(l, e, t) {
    if (hi) return l(e, t);
    hi = !0;
    try {
      var a = l(e);
      return a;
    } finally {
      if (
        ((hi = !1),
        (It !== null || Pt !== null) &&
          (Nu(), It && ((e = It), (l = Pt), (Pt = It = null), Js(e), l)))
      )
        for (e = 0; e < l.length; e++) Js(l[e]);
    }
  }
  function Ha(l, e) {
    var t = l.stateNode;
    if (t === null) return null;
    var a = t[Il] || null;
    if (a === null) return null;
    t = a[e];
    l: switch (e) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        ((a = !a.disabled) ||
          ((l = l.type),
          (a = !(
            l === "button" ||
            l === "input" ||
            l === "select" ||
            l === "textarea"
          ))),
          (l = !a));
        break l;
      default:
        l = !1;
    }
    if (l) return null;
    if (t && typeof t != "function") throw Error(d(231, e, typeof t));
    return t;
  }
  var qe = !(
      typeof window > "u" ||
      typeof window.document > "u" ||
      typeof window.document.createElement > "u"
    ),
    mi = !1;
  if (qe)
    try {
      var Ba = {};
      (Object.defineProperty(Ba, "passive", {
        get: function () {
          mi = !0;
        },
      }),
        window.addEventListener("test", Ba, Ba),
        window.removeEventListener("test", Ba, Ba));
    } catch {
      mi = !1;
    }
  var et = null,
    vi = null,
    qn = null;
  function Ws() {
    if (qn) return qn;
    var l,
      e = vi,
      t = e.length,
      a,
      n = "value" in et ? et.value : et.textContent,
      u = n.length;
    for (l = 0; l < t && e[l] === n[l]; l++);
    var c = t - l;
    for (a = 1; a <= c && e[t - a] === n[u - a]; a++);
    return (qn = n.slice(l, 1 < a ? 1 - a : void 0));
  }
  function Yn(l) {
    var e = l.keyCode;
    return (
      "charCode" in l
        ? ((l = l.charCode), l === 0 && e === 13 && (l = 13))
        : (l = e),
      l === 10 && (l = 13),
      32 <= l || l === 13 ? l : 0
    );
  }
  function wn() {
    return !0;
  }
  function Fs() {
    return !1;
  }
  function Pl(l) {
    function e(t, a, n, u, c) {
      ((this._reactName = t),
        (this._targetInst = n),
        (this.type = a),
        (this.nativeEvent = u),
        (this.target = c),
        (this.currentTarget = null));
      for (var s in l)
        l.hasOwnProperty(s) && ((t = l[s]), (this[s] = t ? t(u) : u[s]));
      return (
        (this.isDefaultPrevented = (
          u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1
        )
          ? wn
          : Fs),
        (this.isPropagationStopped = Fs),
        this
      );
    }
    return (
      R(e.prototype, {
        preventDefault: function () {
          this.defaultPrevented = !0;
          var t = this.nativeEvent;
          t &&
            (t.preventDefault
              ? t.preventDefault()
              : typeof t.returnValue != "unknown" && (t.returnValue = !1),
            (this.isDefaultPrevented = wn));
        },
        stopPropagation: function () {
          var t = this.nativeEvent;
          t &&
            (t.stopPropagation
              ? t.stopPropagation()
              : typeof t.cancelBubble != "unknown" && (t.cancelBubble = !0),
            (this.isPropagationStopped = wn));
        },
        persist: function () {},
        isPersistent: wn,
      }),
      e
    );
  }
  var Mt = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (l) {
        return l.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0,
    },
    Ln = Pl(Mt),
    qa = R({}, Mt, { view: 0, detail: 0 }),
    Sh = Pl(qa),
    yi,
    gi,
    Ya,
    Gn = R({}, qa, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: bi,
      button: 0,
      buttons: 0,
      relatedTarget: function (l) {
        return l.relatedTarget === void 0
          ? l.fromElement === l.srcElement
            ? l.toElement
            : l.fromElement
          : l.relatedTarget;
      },
      movementX: function (l) {
        return "movementX" in l
          ? l.movementX
          : (l !== Ya &&
              (Ya && l.type === "mousemove"
                ? ((yi = l.screenX - Ya.screenX), (gi = l.screenY - Ya.screenY))
                : (gi = yi = 0),
              (Ya = l)),
            yi);
      },
      movementY: function (l) {
        return "movementY" in l ? l.movementY : gi;
      },
    }),
    Is = Pl(Gn),
    xh = R({}, Gn, { dataTransfer: 0 }),
    jh = Pl(xh),
    Nh = R({}, qa, { relatedTarget: 0 }),
    pi = Pl(Nh),
    Ah = R({}, Mt, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Eh = Pl(Ah),
    Th = R({}, Mt, {
      clipboardData: function (l) {
        return "clipboardData" in l ? l.clipboardData : window.clipboardData;
      },
    }),
    zh = Pl(Th),
    Mh = R({}, Mt, { data: 0 }),
    Ps = Pl(Mh),
    Dh = {
      Esc: "Escape",
      Spacebar: " ",
      Left: "ArrowLeft",
      Up: "ArrowUp",
      Right: "ArrowRight",
      Down: "ArrowDown",
      Del: "Delete",
      Win: "OS",
      Menu: "ContextMenu",
      Apps: "ContextMenu",
      Scroll: "ScrollLock",
      MozPrintableKey: "Unidentified",
    },
    Ch = {
      8: "Backspace",
      9: "Tab",
      12: "Clear",
      13: "Enter",
      16: "Shift",
      17: "Control",
      18: "Alt",
      19: "Pause",
      20: "CapsLock",
      27: "Escape",
      32: " ",
      33: "PageUp",
      34: "PageDown",
      35: "End",
      36: "Home",
      37: "ArrowLeft",
      38: "ArrowUp",
      39: "ArrowRight",
      40: "ArrowDown",
      45: "Insert",
      46: "Delete",
      112: "F1",
      113: "F2",
      114: "F3",
      115: "F4",
      116: "F5",
      117: "F6",
      118: "F7",
      119: "F8",
      120: "F9",
      121: "F10",
      122: "F11",
      123: "F12",
      144: "NumLock",
      145: "ScrollLock",
      224: "Meta",
    },
    _h = {
      Alt: "altKey",
      Control: "ctrlKey",
      Meta: "metaKey",
      Shift: "shiftKey",
    };
  function Oh(l) {
    var e = this.nativeEvent;
    return e.getModifierState
      ? e.getModifierState(l)
      : (l = _h[l])
        ? !!e[l]
        : !1;
  }
  function bi() {
    return Oh;
  }
  var Uh = R({}, qa, {
      key: function (l) {
        if (l.key) {
          var e = Dh[l.key] || l.key;
          if (e !== "Unidentified") return e;
        }
        return l.type === "keypress"
          ? ((l = Yn(l)), l === 13 ? "Enter" : String.fromCharCode(l))
          : l.type === "keydown" || l.type === "keyup"
            ? Ch[l.keyCode] || "Unidentified"
            : "";
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: bi,
      charCode: function (l) {
        return l.type === "keypress" ? Yn(l) : 0;
      },
      keyCode: function (l) {
        return l.type === "keydown" || l.type === "keyup" ? l.keyCode : 0;
      },
      which: function (l) {
        return l.type === "keypress"
          ? Yn(l)
          : l.type === "keydown" || l.type === "keyup"
            ? l.keyCode
            : 0;
      },
    }),
    Rh = Pl(Uh),
    Hh = R({}, Gn, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
    lf = Pl(Hh),
    Bh = R({}, qa, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: bi,
    }),
    qh = Pl(Bh),
    Yh = R({}, Mt, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    wh = Pl(Yh),
    Lh = R({}, Gn, {
      deltaX: function (l) {
        return "deltaX" in l
          ? l.deltaX
          : "wheelDeltaX" in l
            ? -l.wheelDeltaX
            : 0;
      },
      deltaY: function (l) {
        return "deltaY" in l
          ? l.deltaY
          : "wheelDeltaY" in l
            ? -l.wheelDeltaY
            : "wheelDelta" in l
              ? -l.wheelDelta
              : 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
    Gh = Pl(Lh),
    Xh = R({}, Mt, { newState: 0, oldState: 0 }),
    Qh = Pl(Xh),
    Zh = [9, 13, 27, 32],
    Si = qe && "CompositionEvent" in window,
    wa = null;
  qe && "documentMode" in document && (wa = document.documentMode);
  var Kh = qe && "TextEvent" in window && !wa,
    ef = qe && (!Si || (wa && 8 < wa && 11 >= wa)),
    tf = " ",
    af = !1;
  function nf(l, e) {
    switch (l) {
      case "keyup":
        return Zh.indexOf(e.keyCode) !== -1;
      case "keydown":
        return e.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function uf(l) {
    return (
      (l = l.detail),
      typeof l == "object" && "data" in l ? l.data : null
    );
  }
  var la = !1;
  function Vh(l, e) {
    switch (l) {
      case "compositionend":
        return uf(e);
      case "keypress":
        return e.which !== 32 ? null : ((af = !0), tf);
      case "textInput":
        return ((l = e.data), l === tf && af ? null : l);
      default:
        return null;
    }
  }
  function kh(l, e) {
    if (la)
      return l === "compositionend" || (!Si && nf(l, e))
        ? ((l = Ws()), (qn = vi = et = null), (la = !1), l)
        : null;
    switch (l) {
      case "paste":
        return null;
      case "keypress":
        if (!(e.ctrlKey || e.altKey || e.metaKey) || (e.ctrlKey && e.altKey)) {
          if (e.char && 1 < e.char.length) return e.char;
          if (e.which) return String.fromCharCode(e.which);
        }
        return null;
      case "compositionend":
        return ef && e.locale !== "ko" ? null : e.data;
      default:
        return null;
    }
  }
  var Jh = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
  };
  function cf(l) {
    var e = l && l.nodeName && l.nodeName.toLowerCase();
    return e === "input" ? !!Jh[l.type] : e === "textarea";
  }
  function sf(l, e, t, a) {
    (It ? (Pt ? Pt.push(a) : (Pt = [a])) : (It = a),
      (e = Cu(e, "onChange")),
      0 < e.length &&
        ((t = new Ln("onChange", "change", null, t, a)),
        l.push({ event: t, listeners: e })));
  }
  var La = null,
    Ga = null;
  function $h(l) {
    Zr(l, 0);
  }
  function Xn(l) {
    var e = Ra(l);
    if (Xs(e)) return l;
  }
  function ff(l, e) {
    if (l === "change") return e;
  }
  var df = !1;
  if (qe) {
    var xi;
    if (qe) {
      var ji = "oninput" in document;
      if (!ji) {
        var rf = document.createElement("div");
        (rf.setAttribute("oninput", "return;"),
          (ji = typeof rf.oninput == "function"));
      }
      xi = ji;
    } else xi = !1;
    df = xi && (!document.documentMode || 9 < document.documentMode);
  }
  function of() {
    La && (La.detachEvent("onpropertychange", hf), (Ga = La = null));
  }
  function hf(l) {
    if (l.propertyName === "value" && Xn(Ga)) {
      var e = [];
      (sf(e, Ga, l, oi(l)), $s($h, e));
    }
  }
  function Wh(l, e, t) {
    l === "focusin"
      ? (of(), (La = e), (Ga = t), La.attachEvent("onpropertychange", hf))
      : l === "focusout" && of();
  }
  function Fh(l) {
    if (l === "selectionchange" || l === "keyup" || l === "keydown")
      return Xn(Ga);
  }
  function Ih(l, e) {
    if (l === "click") return Xn(e);
  }
  function Ph(l, e) {
    if (l === "input" || l === "change") return Xn(e);
  }
  function lm(l, e) {
    return (l === e && (l !== 0 || 1 / l === 1 / e)) || (l !== l && e !== e);
  }
  var fe = typeof Object.is == "function" ? Object.is : lm;
  function Xa(l, e) {
    if (fe(l, e)) return !0;
    if (
      typeof l != "object" ||
      l === null ||
      typeof e != "object" ||
      e === null
    )
      return !1;
    var t = Object.keys(l),
      a = Object.keys(e);
    if (t.length !== a.length) return !1;
    for (a = 0; a < t.length; a++) {
      var n = t[a];
      if (!Pu.call(e, n) || !fe(l[n], e[n])) return !1;
    }
    return !0;
  }
  function mf(l) {
    for (; l && l.firstChild;) l = l.firstChild;
    return l;
  }
  function vf(l, e) {
    var t = mf(l);
    l = 0;
    for (var a; t;) {
      if (t.nodeType === 3) {
        if (((a = l + t.textContent.length), l <= e && a >= e))
          return { node: t, offset: e - l };
        l = a;
      }
      l: {
        for (; t;) {
          if (t.nextSibling) {
            t = t.nextSibling;
            break l;
          }
          t = t.parentNode;
        }
        t = void 0;
      }
      t = mf(t);
    }
  }
  function yf(l, e) {
    return l && e
      ? l === e
        ? !0
        : l && l.nodeType === 3
          ? !1
          : e && e.nodeType === 3
            ? yf(l, e.parentNode)
            : "contains" in l
              ? l.contains(e)
              : l.compareDocumentPosition
                ? !!(l.compareDocumentPosition(e) & 16)
                : !1
      : !1;
  }
  function gf(l) {
    l =
      l != null &&
      l.ownerDocument != null &&
      l.ownerDocument.defaultView != null
        ? l.ownerDocument.defaultView
        : window;
    for (var e = Hn(l.document); e instanceof l.HTMLIFrameElement;) {
      try {
        var t = typeof e.contentWindow.location.href == "string";
      } catch {
        t = !1;
      }
      if (t) l = e.contentWindow;
      else break;
      e = Hn(l.document);
    }
    return e;
  }
  function Ni(l) {
    var e = l && l.nodeName && l.nodeName.toLowerCase();
    return (
      e &&
      ((e === "input" &&
        (l.type === "text" ||
          l.type === "search" ||
          l.type === "tel" ||
          l.type === "url" ||
          l.type === "password")) ||
        e === "textarea" ||
        l.contentEditable === "true")
    );
  }
  var em = qe && "documentMode" in document && 11 >= document.documentMode,
    ea = null,
    Ai = null,
    Qa = null,
    Ei = !1;
  function pf(l, e, t) {
    var a =
      t.window === t ? t.document : t.nodeType === 9 ? t : t.ownerDocument;
    Ei ||
      ea == null ||
      ea !== Hn(a) ||
      ((a = ea),
      "selectionStart" in a && Ni(a)
        ? (a = { start: a.selectionStart, end: a.selectionEnd })
        : ((a = (
            (a.ownerDocument && a.ownerDocument.defaultView) ||
            window
          ).getSelection()),
          (a = {
            anchorNode: a.anchorNode,
            anchorOffset: a.anchorOffset,
            focusNode: a.focusNode,
            focusOffset: a.focusOffset,
          })),
      (Qa && Xa(Qa, a)) ||
        ((Qa = a),
        (a = Cu(Ai, "onSelect")),
        0 < a.length &&
          ((e = new Ln("onSelect", "select", null, e, t)),
          l.push({ event: e, listeners: a }),
          (e.target = ea))));
  }
  function Dt(l, e) {
    var t = {};
    return (
      (t[l.toLowerCase()] = e.toLowerCase()),
      (t["Webkit" + l] = "webkit" + e),
      (t["Moz" + l] = "moz" + e),
      t
    );
  }
  var ta = {
      animationend: Dt("Animation", "AnimationEnd"),
      animationiteration: Dt("Animation", "AnimationIteration"),
      animationstart: Dt("Animation", "AnimationStart"),
      transitionrun: Dt("Transition", "TransitionRun"),
      transitionstart: Dt("Transition", "TransitionStart"),
      transitioncancel: Dt("Transition", "TransitionCancel"),
      transitionend: Dt("Transition", "TransitionEnd"),
    },
    Ti = {},
    bf = {};
  qe &&
    ((bf = document.createElement("div").style),
    "AnimationEvent" in window ||
      (delete ta.animationend.animation,
      delete ta.animationiteration.animation,
      delete ta.animationstart.animation),
    "TransitionEvent" in window || delete ta.transitionend.transition);
  function Ct(l) {
    if (Ti[l]) return Ti[l];
    if (!ta[l]) return l;
    var e = ta[l],
      t;
    for (t in e) if (e.hasOwnProperty(t) && t in bf) return (Ti[l] = e[t]);
    return l;
  }
  var Sf = Ct("animationend"),
    xf = Ct("animationiteration"),
    jf = Ct("animationstart"),
    tm = Ct("transitionrun"),
    am = Ct("transitionstart"),
    nm = Ct("transitioncancel"),
    Nf = Ct("transitionend"),
    Af = new Map(),
    zi =
      "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " ",
      );
  zi.push("scrollEnd");
  function ze(l, e) {
    (Af.set(l, e), zt(e, [l]));
  }
  var Qn =
      typeof reportError == "function"
        ? reportError
        : function (l) {
            if (
              typeof window == "object" &&
              typeof window.ErrorEvent == "function"
            ) {
              var e = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message:
                  typeof l == "object" &&
                  l !== null &&
                  typeof l.message == "string"
                    ? String(l.message)
                    : String(l),
                error: l,
              });
              if (!window.dispatchEvent(e)) return;
            } else if (
              typeof process == "object" &&
              typeof process.emit == "function"
            ) {
              process.emit("uncaughtException", l);
              return;
            }
            console.error(l);
          },
    pe = [],
    aa = 0,
    Mi = 0;
  function Zn() {
    for (var l = aa, e = (Mi = aa = 0); e < l;) {
      var t = pe[e];
      pe[e++] = null;
      var a = pe[e];
      pe[e++] = null;
      var n = pe[e];
      pe[e++] = null;
      var u = pe[e];
      if (((pe[e++] = null), a !== null && n !== null)) {
        var c = a.pending;
        (c === null ? (n.next = n) : ((n.next = c.next), (c.next = n)),
          (a.pending = n));
      }
      u !== 0 && Ef(t, n, u);
    }
  }
  function Kn(l, e, t, a) {
    ((pe[aa++] = l),
      (pe[aa++] = e),
      (pe[aa++] = t),
      (pe[aa++] = a),
      (Mi |= a),
      (l.lanes |= a),
      (l = l.alternate),
      l !== null && (l.lanes |= a));
  }
  function Di(l, e, t, a) {
    return (Kn(l, e, t, a), Vn(l));
  }
  function _t(l, e) {
    return (Kn(l, null, null, e), Vn(l));
  }
  function Ef(l, e, t) {
    l.lanes |= t;
    var a = l.alternate;
    a !== null && (a.lanes |= t);
    for (var n = !1, u = l.return; u !== null;)
      ((u.childLanes |= t),
        (a = u.alternate),
        a !== null && (a.childLanes |= t),
        u.tag === 22 &&
          ((l = u.stateNode), l === null || l._visibility & 1 || (n = !0)),
        (l = u),
        (u = u.return));
    return l.tag === 3
      ? ((u = l.stateNode),
        n &&
          e !== null &&
          ((n = 31 - se(t)),
          (l = u.hiddenUpdates),
          (a = l[n]),
          a === null ? (l[n] = [e]) : a.push(e),
          (e.lane = t | 536870912)),
        u)
      : null;
  }
  function Vn(l) {
    if (50 < on) throw ((on = 0), (Yc = null), Error(d(185)));
    for (var e = l.return; e !== null;) ((l = e), (e = l.return));
    return l.tag === 3 ? l.stateNode : null;
  }
  var na = {};
  function um(l, e, t, a) {
    ((this.tag = l),
      (this.key = t),
      (this.sibling =
        this.child =
        this.return =
        this.stateNode =
        this.type =
        this.elementType =
          null),
      (this.index = 0),
      (this.refCleanup = this.ref = null),
      (this.pendingProps = e),
      (this.dependencies =
        this.memoizedState =
        this.updateQueue =
        this.memoizedProps =
          null),
      (this.mode = a),
      (this.subtreeFlags = this.flags = 0),
      (this.deletions = null),
      (this.childLanes = this.lanes = 0),
      (this.alternate = null));
  }
  function de(l, e, t, a) {
    return new um(l, e, t, a);
  }
  function Ci(l) {
    return ((l = l.prototype), !(!l || !l.isReactComponent));
  }
  function Ye(l, e) {
    var t = l.alternate;
    return (
      t === null
        ? ((t = de(l.tag, e, l.key, l.mode)),
          (t.elementType = l.elementType),
          (t.type = l.type),
          (t.stateNode = l.stateNode),
          (t.alternate = l),
          (l.alternate = t))
        : ((t.pendingProps = e),
          (t.type = l.type),
          (t.flags = 0),
          (t.subtreeFlags = 0),
          (t.deletions = null)),
      (t.flags = l.flags & 65011712),
      (t.childLanes = l.childLanes),
      (t.lanes = l.lanes),
      (t.child = l.child),
      (t.memoizedProps = l.memoizedProps),
      (t.memoizedState = l.memoizedState),
      (t.updateQueue = l.updateQueue),
      (e = l.dependencies),
      (t.dependencies =
        e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }),
      (t.sibling = l.sibling),
      (t.index = l.index),
      (t.ref = l.ref),
      (t.refCleanup = l.refCleanup),
      t
    );
  }
  function Tf(l, e) {
    l.flags &= 65011714;
    var t = l.alternate;
    return (
      t === null
        ? ((l.childLanes = 0),
          (l.lanes = e),
          (l.child = null),
          (l.subtreeFlags = 0),
          (l.memoizedProps = null),
          (l.memoizedState = null),
          (l.updateQueue = null),
          (l.dependencies = null),
          (l.stateNode = null))
        : ((l.childLanes = t.childLanes),
          (l.lanes = t.lanes),
          (l.child = t.child),
          (l.subtreeFlags = 0),
          (l.deletions = null),
          (l.memoizedProps = t.memoizedProps),
          (l.memoizedState = t.memoizedState),
          (l.updateQueue = t.updateQueue),
          (l.type = t.type),
          (e = t.dependencies),
          (l.dependencies =
            e === null
              ? null
              : { lanes: e.lanes, firstContext: e.firstContext })),
      l
    );
  }
  function kn(l, e, t, a, n, u) {
    var c = 0;
    if (((a = l), typeof l == "function")) Ci(l) && (c = 1);
    else if (typeof l == "string")
      c = dv(l, t, Q.current)
        ? 26
        : l === "html" || l === "head" || l === "body"
          ? 27
          : 5;
    else
      l: switch (l) {
        case Xl:
          return (
            (l = de(31, t, e, n)),
            (l.elementType = Xl),
            (l.lanes = u),
            l
          );
        case H:
          return Ot(t.children, n, u, e);
        case N:
          ((c = 8), (n |= 24));
          break;
        case K:
          return (
            (l = de(12, t, e, n | 2)),
            (l.elementType = K),
            (l.lanes = u),
            l
          );
        case k:
          return ((l = de(13, t, e, n)), (l.elementType = k), (l.lanes = u), l);
        case al:
          return (
            (l = de(19, t, e, n)),
            (l.elementType = al),
            (l.lanes = u),
            l
          );
        default:
          if (typeof l == "object" && l !== null)
            switch (l.$$typeof) {
              case ol:
                c = 10;
                break l;
              case nl:
                c = 9;
                break l;
              case sl:
                c = 11;
                break l;
              case W:
                c = 14;
                break l;
              case P:
                ((c = 16), (a = null));
                break l;
            }
          ((c = 29),
            (t = Error(d(130, l === null ? "null" : typeof l, ""))),
            (a = null));
      }
    return (
      (e = de(c, t, e, n)),
      (e.elementType = l),
      (e.type = a),
      (e.lanes = u),
      e
    );
  }
  function Ot(l, e, t, a) {
    return ((l = de(7, l, a, e)), (l.lanes = t), l);
  }
  function _i(l, e, t) {
    return ((l = de(6, l, null, e)), (l.lanes = t), l);
  }
  function zf(l) {
    var e = de(18, null, null, 0);
    return ((e.stateNode = l), e);
  }
  function Oi(l, e, t) {
    return (
      (e = de(4, l.children !== null ? l.children : [], l.key, e)),
      (e.lanes = t),
      (e.stateNode = {
        containerInfo: l.containerInfo,
        pendingChildren: null,
        implementation: l.implementation,
      }),
      e
    );
  }
  var Mf = new WeakMap();
  function be(l, e) {
    if (typeof l == "object" && l !== null) {
      var t = Mf.get(l);
      return t !== void 0
        ? t
        : ((e = { value: l, source: e, stack: Ts(e) }), Mf.set(l, e), e);
    }
    return { value: l, source: e, stack: Ts(e) };
  }
  var ua = [],
    ia = 0,
    Jn = null,
    Za = 0,
    Se = [],
    xe = 0,
    tt = null,
    Ce = 1,
    _e = "";
  function we(l, e) {
    ((ua[ia++] = Za), (ua[ia++] = Jn), (Jn = l), (Za = e));
  }
  function Df(l, e, t) {
    ((Se[xe++] = Ce), (Se[xe++] = _e), (Se[xe++] = tt), (tt = l));
    var a = Ce;
    l = _e;
    var n = 32 - se(a) - 1;
    ((a &= ~(1 << n)), (t += 1));
    var u = 32 - se(e) + n;
    if (30 < u) {
      var c = n - (n % 5);
      ((u = (a & ((1 << c) - 1)).toString(32)),
        (a >>= c),
        (n -= c),
        (Ce = (1 << (32 - se(e) + n)) | (t << n) | a),
        (_e = u + l));
    } else ((Ce = (1 << u) | (t << n) | a), (_e = l));
  }
  function Ui(l) {
    l.return !== null && (we(l, 1), Df(l, 1, 0));
  }
  function Ri(l) {
    for (; l === Jn;)
      ((Jn = ua[--ia]), (ua[ia] = null), (Za = ua[--ia]), (ua[ia] = null));
    for (; l === tt;)
      ((tt = Se[--xe]),
        (Se[xe] = null),
        (_e = Se[--xe]),
        (Se[xe] = null),
        (Ce = Se[--xe]),
        (Se[xe] = null));
  }
  function Cf(l, e) {
    ((Se[xe++] = Ce),
      (Se[xe++] = _e),
      (Se[xe++] = tt),
      (Ce = e.id),
      (_e = e.overflow),
      (tt = l));
  }
  var Zl = null,
    El = null,
    rl = !1,
    at = null,
    je = !1,
    Hi = Error(d(519));
  function nt(l) {
    var e = Error(
      d(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1]
          ? "text"
          : "HTML",
        "",
      ),
    );
    throw (Ka(be(e, l)), Hi);
  }
  function _f(l) {
    var e = l.stateNode,
      t = l.type,
      a = l.memoizedProps;
    switch (((e[Ql] = l), (e[Il] = a), t)) {
      case "dialog":
        (cl("cancel", e), cl("close", e));
        break;
      case "iframe":
      case "object":
      case "embed":
        cl("load", e);
        break;
      case "video":
      case "audio":
        for (t = 0; t < mn.length; t++) cl(mn[t], e);
        break;
      case "source":
        cl("error", e);
        break;
      case "img":
      case "image":
      case "link":
        (cl("error", e), cl("load", e));
        break;
      case "details":
        cl("toggle", e);
        break;
      case "input":
        (cl("invalid", e),
          Qs(
            e,
            a.value,
            a.defaultValue,
            a.checked,
            a.defaultChecked,
            a.type,
            a.name,
            !0,
          ));
        break;
      case "select":
        cl("invalid", e);
        break;
      case "textarea":
        (cl("invalid", e), Ks(e, a.value, a.defaultValue, a.children));
    }
    ((t = a.children),
      (typeof t != "string" && typeof t != "number" && typeof t != "bigint") ||
      e.textContent === "" + t ||
      a.suppressHydrationWarning === !0 ||
      Jr(e.textContent, t)
        ? (a.popover != null && (cl("beforetoggle", e), cl("toggle", e)),
          a.onScroll != null && cl("scroll", e),
          a.onScrollEnd != null && cl("scrollend", e),
          a.onClick != null && (e.onclick = Be),
          (e = !0))
        : (e = !1),
      e || nt(l, !0));
  }
  function Of(l) {
    for (Zl = l.return; Zl;)
      switch (Zl.tag) {
        case 5:
        case 31:
        case 13:
          je = !1;
          return;
        case 27:
        case 3:
          je = !0;
          return;
        default:
          Zl = Zl.return;
      }
  }
  function ca(l) {
    if (l !== Zl) return !1;
    if (!rl) return (Of(l), (rl = !0), !1);
    var e = l.tag,
      t;
    if (
      ((t = e !== 3 && e !== 27) &&
        ((t = e === 5) &&
          ((t = l.type),
          (t =
            !(t !== "form" && t !== "button") || Pc(l.type, l.memoizedProps))),
        (t = !t)),
      t && El && nt(l),
      Of(l),
      e === 13)
    ) {
      if (((l = l.memoizedState), (l = l !== null ? l.dehydrated : null), !l))
        throw Error(d(317));
      El = ao(l);
    } else if (e === 31) {
      if (((l = l.memoizedState), (l = l !== null ? l.dehydrated : null), !l))
        throw Error(d(317));
      El = ao(l);
    } else
      e === 27
        ? ((e = El), pt(l.type) ? ((l = ns), (ns = null), (El = l)) : (El = e))
        : (El = Zl ? Ae(l.stateNode.nextSibling) : null);
    return !0;
  }
  function Ut() {
    ((El = Zl = null), (rl = !1));
  }
  function Bi() {
    var l = at;
    return (
      l !== null &&
        (ae === null ? (ae = l) : ae.push.apply(ae, l), (at = null)),
      l
    );
  }
  function Ka(l) {
    at === null ? (at = [l]) : at.push(l);
  }
  var qi = m(null),
    Rt = null,
    Le = null;
  function ut(l, e, t) {
    (G(qi, e._currentValue), (e._currentValue = t));
  }
  function Ge(l) {
    ((l._currentValue = qi.current), O(qi));
  }
  function Yi(l, e, t) {
    for (; l !== null;) {
      var a = l.alternate;
      if (
        ((l.childLanes & e) !== e
          ? ((l.childLanes |= e), a !== null && (a.childLanes |= e))
          : a !== null && (a.childLanes & e) !== e && (a.childLanes |= e),
        l === t)
      )
        break;
      l = l.return;
    }
  }
  function wi(l, e, t, a) {
    var n = l.child;
    for (n !== null && (n.return = l); n !== null;) {
      var u = n.dependencies;
      if (u !== null) {
        var c = n.child;
        u = u.firstContext;
        l: for (; u !== null;) {
          var s = u;
          u = n;
          for (var r = 0; r < e.length; r++)
            if (s.context === e[r]) {
              ((u.lanes |= t),
                (s = u.alternate),
                s !== null && (s.lanes |= t),
                Yi(u.return, t, l),
                a || (c = null));
              break l;
            }
          u = s.next;
        }
      } else if (n.tag === 18) {
        if (((c = n.return), c === null)) throw Error(d(341));
        ((c.lanes |= t),
          (u = c.alternate),
          u !== null && (u.lanes |= t),
          Yi(c, t, l),
          (c = null));
      } else c = n.child;
      if (c !== null) c.return = n;
      else
        for (c = n; c !== null;) {
          if (c === l) {
            c = null;
            break;
          }
          if (((n = c.sibling), n !== null)) {
            ((n.return = c.return), (c = n));
            break;
          }
          c = c.return;
        }
      n = c;
    }
  }
  function sa(l, e, t, a) {
    l = null;
    for (var n = e, u = !1; n !== null;) {
      if (!u) {
        if ((n.flags & 524288) !== 0) u = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var c = n.alternate;
        if (c === null) throw Error(d(387));
        if (((c = c.memoizedProps), c !== null)) {
          var s = n.type;
          fe(n.pendingProps.value, c.value) ||
            (l !== null ? l.push(s) : (l = [s]));
        }
      } else if (n === yl.current) {
        if (((c = n.alternate), c === null)) throw Error(d(387));
        c.memoizedState.memoizedState !== n.memoizedState.memoizedState &&
          (l !== null ? l.push(bn) : (l = [bn]));
      }
      n = n.return;
    }
    (l !== null && wi(e, l, t, a), (e.flags |= 262144));
  }
  function $n(l) {
    for (l = l.firstContext; l !== null;) {
      if (!fe(l.context._currentValue, l.memoizedValue)) return !0;
      l = l.next;
    }
    return !1;
  }
  function Ht(l) {
    ((Rt = l),
      (Le = null),
      (l = l.dependencies),
      l !== null && (l.firstContext = null));
  }
  function Kl(l) {
    return Uf(Rt, l);
  }
  function Wn(l, e) {
    return (Rt === null && Ht(l), Uf(l, e));
  }
  function Uf(l, e) {
    var t = e._currentValue;
    if (((e = { context: e, memoizedValue: t, next: null }), Le === null)) {
      if (l === null) throw Error(d(308));
      ((Le = e),
        (l.dependencies = { lanes: 0, firstContext: e }),
        (l.flags |= 524288));
    } else Le = Le.next = e;
    return t;
  }
  var im =
      typeof AbortController < "u"
        ? AbortController
        : function () {
            var l = [],
              e = (this.signal = {
                aborted: !1,
                addEventListener: function (t, a) {
                  l.push(a);
                },
              });
            this.abort = function () {
              ((e.aborted = !0),
                l.forEach(function (t) {
                  return t();
                }));
            };
          },
    cm = f.unstable_scheduleCallback,
    sm = f.unstable_NormalPriority,
    Rl = {
      $$typeof: ol,
      Consumer: null,
      Provider: null,
      _currentValue: null,
      _currentValue2: null,
      _threadCount: 0,
    };
  function Li() {
    return { controller: new im(), data: new Map(), refCount: 0 };
  }
  function Va(l) {
    (l.refCount--,
      l.refCount === 0 &&
        cm(sm, function () {
          l.controller.abort();
        }));
  }
  var ka = null,
    Gi = 0,
    fa = 0,
    da = null;
  function fm(l, e) {
    if (ka === null) {
      var t = (ka = []);
      ((Gi = 0),
        (fa = Zc()),
        (da = {
          status: "pending",
          value: void 0,
          then: function (a) {
            t.push(a);
          },
        }));
    }
    return (Gi++, e.then(Rf, Rf), e);
  }
  function Rf() {
    if (--Gi === 0 && ka !== null) {
      da !== null && (da.status = "fulfilled");
      var l = ka;
      ((ka = null), (fa = 0), (da = null));
      for (var e = 0; e < l.length; e++) (0, l[e])();
    }
  }
  function dm(l, e) {
    var t = [],
      a = {
        status: "pending",
        value: null,
        reason: null,
        then: function (n) {
          t.push(n);
        },
      };
    return (
      l.then(
        function () {
          ((a.status = "fulfilled"), (a.value = e));
          for (var n = 0; n < t.length; n++) (0, t[n])(e);
        },
        function (n) {
          for (a.status = "rejected", a.reason = n, n = 0; n < t.length; n++)
            (0, t[n])(void 0);
        },
      ),
      a
    );
  }
  var Hf = T.S;
  T.S = function (l, e) {
    ((pr = ie()),
      typeof e == "object" &&
        e !== null &&
        typeof e.then == "function" &&
        fm(l, e),
      Hf !== null && Hf(l, e));
  };
  var Bt = m(null);
  function Xi() {
    var l = Bt.current;
    return l !== null ? l : Al.pooledCache;
  }
  function Fn(l, e) {
    e === null ? G(Bt, Bt.current) : G(Bt, e.pool);
  }
  function Bf() {
    var l = Xi();
    return l === null ? null : { parent: Rl._currentValue, pool: l };
  }
  var ra = Error(d(460)),
    Qi = Error(d(474)),
    In = Error(d(542)),
    Pn = { then: function () {} };
  function qf(l) {
    return ((l = l.status), l === "fulfilled" || l === "rejected");
  }
  function Yf(l, e, t) {
    switch (
      ((t = l[t]),
      t === void 0 ? l.push(e) : t !== e && (e.then(Be, Be), (e = t)),
      e.status)
    ) {
      case "fulfilled":
        return e.value;
      case "rejected":
        throw ((l = e.reason), Lf(l), l);
      default:
        if (typeof e.status == "string") e.then(Be, Be);
        else {
          if (((l = Al), l !== null && 100 < l.shellSuspendCounter))
            throw Error(d(482));
          ((l = e),
            (l.status = "pending"),
            l.then(
              function (a) {
                if (e.status === "pending") {
                  var n = e;
                  ((n.status = "fulfilled"), (n.value = a));
                }
              },
              function (a) {
                if (e.status === "pending") {
                  var n = e;
                  ((n.status = "rejected"), (n.reason = a));
                }
              },
            ));
        }
        switch (e.status) {
          case "fulfilled":
            return e.value;
          case "rejected":
            throw ((l = e.reason), Lf(l), l);
        }
        throw ((Yt = e), ra);
    }
  }
  function qt(l) {
    try {
      var e = l._init;
      return e(l._payload);
    } catch (t) {
      throw t !== null && typeof t == "object" && typeof t.then == "function"
        ? ((Yt = t), ra)
        : t;
    }
  }
  var Yt = null;
  function wf() {
    if (Yt === null) throw Error(d(459));
    var l = Yt;
    return ((Yt = null), l);
  }
  function Lf(l) {
    if (l === ra || l === In) throw Error(d(483));
  }
  var oa = null,
    Ja = 0;
  function lu(l) {
    var e = Ja;
    return ((Ja += 1), oa === null && (oa = []), Yf(oa, l, e));
  }
  function $a(l, e) {
    ((e = e.props.ref), (l.ref = e !== void 0 ? e : null));
  }
  function eu(l, e) {
    throw e.$$typeof === _
      ? Error(d(525))
      : ((l = Object.prototype.toString.call(e)),
        Error(
          d(
            31,
            l === "[object Object]"
              ? "object with keys {" + Object.keys(e).join(", ") + "}"
              : l,
          ),
        ));
  }
  function Gf(l) {
    function e(y, h) {
      if (l) {
        var p = y.deletions;
        p === null ? ((y.deletions = [h]), (y.flags |= 16)) : p.push(h);
      }
    }
    function t(y, h) {
      if (!l) return null;
      for (; h !== null;) (e(y, h), (h = h.sibling));
      return null;
    }
    function a(y) {
      for (var h = new Map(); y !== null;)
        (y.key !== null ? h.set(y.key, y) : h.set(y.index, y), (y = y.sibling));
      return h;
    }
    function n(y, h) {
      return ((y = Ye(y, h)), (y.index = 0), (y.sibling = null), y);
    }
    function u(y, h, p) {
      return (
        (y.index = p),
        l
          ? ((p = y.alternate),
            p !== null
              ? ((p = p.index), p < h ? ((y.flags |= 67108866), h) : p)
              : ((y.flags |= 67108866), h))
          : ((y.flags |= 1048576), h)
      );
    }
    function c(y) {
      return (l && y.alternate === null && (y.flags |= 67108866), y);
    }
    function s(y, h, p, z) {
      return h === null || h.tag !== 6
        ? ((h = _i(p, y.mode, z)), (h.return = y), h)
        : ((h = n(h, p)), (h.return = y), h);
    }
    function r(y, h, p, z) {
      var V = p.type;
      return V === H
        ? A(y, h, p.props.children, z, p.key)
        : h !== null &&
            (h.elementType === V ||
              (typeof V == "object" &&
                V !== null &&
                V.$$typeof === P &&
                qt(V) === h.type))
          ? ((h = n(h, p.props)), $a(h, p), (h.return = y), h)
          : ((h = kn(p.type, p.key, p.props, null, y.mode, z)),
            $a(h, p),
            (h.return = y),
            h);
    }
    function b(y, h, p, z) {
      return h === null ||
        h.tag !== 4 ||
        h.stateNode.containerInfo !== p.containerInfo ||
        h.stateNode.implementation !== p.implementation
        ? ((h = Oi(p, y.mode, z)), (h.return = y), h)
        : ((h = n(h, p.children || [])), (h.return = y), h);
    }
    function A(y, h, p, z, V) {
      return h === null || h.tag !== 7
        ? ((h = Ot(p, y.mode, z, V)), (h.return = y), h)
        : ((h = n(h, p)), (h.return = y), h);
    }
    function M(y, h, p) {
      if (
        (typeof h == "string" && h !== "") ||
        typeof h == "number" ||
        typeof h == "bigint"
      )
        return ((h = _i("" + h, y.mode, p)), (h.return = y), h);
      if (typeof h == "object" && h !== null) {
        switch (h.$$typeof) {
          case Y:
            return (
              (p = kn(h.type, h.key, h.props, null, y.mode, p)),
              $a(p, h),
              (p.return = y),
              p
            );
          case U:
            return ((h = Oi(h, y.mode, p)), (h.return = y), h);
          case P:
            return ((h = qt(h)), M(y, h, p));
        }
        if (Te(h) || Fl(h))
          return ((h = Ot(h, y.mode, p, null)), (h.return = y), h);
        if (typeof h.then == "function") return M(y, lu(h), p);
        if (h.$$typeof === ol) return M(y, Wn(y, h), p);
        eu(y, h);
      }
      return null;
    }
    function S(y, h, p, z) {
      var V = h !== null ? h.key : null;
      if (
        (typeof p == "string" && p !== "") ||
        typeof p == "number" ||
        typeof p == "bigint"
      )
        return V !== null ? null : s(y, h, "" + p, z);
      if (typeof p == "object" && p !== null) {
        switch (p.$$typeof) {
          case Y:
            return p.key === V ? r(y, h, p, z) : null;
          case U:
            return p.key === V ? b(y, h, p, z) : null;
          case P:
            return ((p = qt(p)), S(y, h, p, z));
        }
        if (Te(p) || Fl(p)) return V !== null ? null : A(y, h, p, z, null);
        if (typeof p.then == "function") return S(y, h, lu(p), z);
        if (p.$$typeof === ol) return S(y, h, Wn(y, p), z);
        eu(y, p);
      }
      return null;
    }
    function j(y, h, p, z, V) {
      if (
        (typeof z == "string" && z !== "") ||
        typeof z == "number" ||
        typeof z == "bigint"
      )
        return ((y = y.get(p) || null), s(h, y, "" + z, V));
      if (typeof z == "object" && z !== null) {
        switch (z.$$typeof) {
          case Y:
            return (
              (y = y.get(z.key === null ? p : z.key) || null),
              r(h, y, z, V)
            );
          case U:
            return (
              (y = y.get(z.key === null ? p : z.key) || null),
              b(h, y, z, V)
            );
          case P:
            return ((z = qt(z)), j(y, h, p, z, V));
        }
        if (Te(z) || Fl(z))
          return ((y = y.get(p) || null), A(h, y, z, V, null));
        if (typeof z.then == "function") return j(y, h, p, lu(z), V);
        if (z.$$typeof === ol) return j(y, h, p, Wn(h, z), V);
        eu(h, z);
      }
      return null;
    }
    function X(y, h, p, z) {
      for (
        var V = null, hl = null, Z = h, tl = (h = 0), dl = null;
        Z !== null && tl < p.length;
        tl++
      ) {
        Z.index > tl ? ((dl = Z), (Z = null)) : (dl = Z.sibling);
        var ml = S(y, Z, p[tl], z);
        if (ml === null) {
          Z === null && (Z = dl);
          break;
        }
        (l && Z && ml.alternate === null && e(y, Z),
          (h = u(ml, h, tl)),
          hl === null ? (V = ml) : (hl.sibling = ml),
          (hl = ml),
          (Z = dl));
      }
      if (tl === p.length) return (t(y, Z), rl && we(y, tl), V);
      if (Z === null) {
        for (; tl < p.length; tl++)
          ((Z = M(y, p[tl], z)),
            Z !== null &&
              ((h = u(Z, h, tl)),
              hl === null ? (V = Z) : (hl.sibling = Z),
              (hl = Z)));
        return (rl && we(y, tl), V);
      }
      for (Z = a(Z); tl < p.length; tl++)
        ((dl = j(Z, y, tl, p[tl], z)),
          dl !== null &&
            (l &&
              dl.alternate !== null &&
              Z.delete(dl.key === null ? tl : dl.key),
            (h = u(dl, h, tl)),
            hl === null ? (V = dl) : (hl.sibling = dl),
            (hl = dl)));
      return (
        l &&
          Z.forEach(function (Nt) {
            return e(y, Nt);
          }),
        rl && we(y, tl),
        V
      );
    }
    function J(y, h, p, z) {
      if (p == null) throw Error(d(151));
      for (
        var V = null, hl = null, Z = h, tl = (h = 0), dl = null, ml = p.next();
        Z !== null && !ml.done;
        tl++, ml = p.next()
      ) {
        Z.index > tl ? ((dl = Z), (Z = null)) : (dl = Z.sibling);
        var Nt = S(y, Z, ml.value, z);
        if (Nt === null) {
          Z === null && (Z = dl);
          break;
        }
        (l && Z && Nt.alternate === null && e(y, Z),
          (h = u(Nt, h, tl)),
          hl === null ? (V = Nt) : (hl.sibling = Nt),
          (hl = Nt),
          (Z = dl));
      }
      if (ml.done) return (t(y, Z), rl && we(y, tl), V);
      if (Z === null) {
        for (; !ml.done; tl++, ml = p.next())
          ((ml = M(y, ml.value, z)),
            ml !== null &&
              ((h = u(ml, h, tl)),
              hl === null ? (V = ml) : (hl.sibling = ml),
              (hl = ml)));
        return (rl && we(y, tl), V);
      }
      for (Z = a(Z); !ml.done; tl++, ml = p.next())
        ((ml = j(Z, y, tl, ml.value, z)),
          ml !== null &&
            (l &&
              ml.alternate !== null &&
              Z.delete(ml.key === null ? tl : ml.key),
            (h = u(ml, h, tl)),
            hl === null ? (V = ml) : (hl.sibling = ml),
            (hl = ml)));
      return (
        l &&
          Z.forEach(function (xv) {
            return e(y, xv);
          }),
        rl && we(y, tl),
        V
      );
    }
    function jl(y, h, p, z) {
      if (
        (typeof p == "object" &&
          p !== null &&
          p.type === H &&
          p.key === null &&
          (p = p.props.children),
        typeof p == "object" && p !== null)
      ) {
        switch (p.$$typeof) {
          case Y:
            l: {
              for (var V = p.key; h !== null;) {
                if (h.key === V) {
                  if (((V = p.type), V === H)) {
                    if (h.tag === 7) {
                      (t(y, h.sibling),
                        (z = n(h, p.props.children)),
                        (z.return = y),
                        (y = z));
                      break l;
                    }
                  } else if (
                    h.elementType === V ||
                    (typeof V == "object" &&
                      V !== null &&
                      V.$$typeof === P &&
                      qt(V) === h.type)
                  ) {
                    (t(y, h.sibling),
                      (z = n(h, p.props)),
                      $a(z, p),
                      (z.return = y),
                      (y = z));
                    break l;
                  }
                  t(y, h);
                  break;
                } else e(y, h);
                h = h.sibling;
              }
              p.type === H
                ? ((z = Ot(p.props.children, y.mode, z, p.key)),
                  (z.return = y),
                  (y = z))
                : ((z = kn(p.type, p.key, p.props, null, y.mode, z)),
                  $a(z, p),
                  (z.return = y),
                  (y = z));
            }
            return c(y);
          case U:
            l: {
              for (V = p.key; h !== null;) {
                if (h.key === V)
                  if (
                    h.tag === 4 &&
                    h.stateNode.containerInfo === p.containerInfo &&
                    h.stateNode.implementation === p.implementation
                  ) {
                    (t(y, h.sibling),
                      (z = n(h, p.children || [])),
                      (z.return = y),
                      (y = z));
                    break l;
                  } else {
                    t(y, h);
                    break;
                  }
                else e(y, h);
                h = h.sibling;
              }
              ((z = Oi(p, y.mode, z)), (z.return = y), (y = z));
            }
            return c(y);
          case P:
            return ((p = qt(p)), jl(y, h, p, z));
        }
        if (Te(p)) return X(y, h, p, z);
        if (Fl(p)) {
          if (((V = Fl(p)), typeof V != "function")) throw Error(d(150));
          return ((p = V.call(p)), J(y, h, p, z));
        }
        if (typeof p.then == "function") return jl(y, h, lu(p), z);
        if (p.$$typeof === ol) return jl(y, h, Wn(y, p), z);
        eu(y, p);
      }
      return (typeof p == "string" && p !== "") ||
        typeof p == "number" ||
        typeof p == "bigint"
        ? ((p = "" + p),
          h !== null && h.tag === 6
            ? (t(y, h.sibling), (z = n(h, p)), (z.return = y), (y = z))
            : (t(y, h), (z = _i(p, y.mode, z)), (z.return = y), (y = z)),
          c(y))
        : t(y, h);
    }
    return function (y, h, p, z) {
      try {
        Ja = 0;
        var V = jl(y, h, p, z);
        return ((oa = null), V);
      } catch (Z) {
        if (Z === ra || Z === In) throw Z;
        var hl = de(29, Z, null, y.mode);
        return ((hl.lanes = z), (hl.return = y), hl);
      }
    };
  }
  var wt = Gf(!0),
    Xf = Gf(!1),
    it = !1;
  function Zi(l) {
    l.updateQueue = {
      baseState: l.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null,
    };
  }
  function Ki(l, e) {
    ((l = l.updateQueue),
      e.updateQueue === l &&
        (e.updateQueue = {
          baseState: l.baseState,
          firstBaseUpdate: l.firstBaseUpdate,
          lastBaseUpdate: l.lastBaseUpdate,
          shared: l.shared,
          callbacks: null,
        }));
  }
  function ct(l) {
    return { lane: l, tag: 0, payload: null, callback: null, next: null };
  }
  function st(l, e, t) {
    var a = l.updateQueue;
    if (a === null) return null;
    if (((a = a.shared), (vl & 2) !== 0)) {
      var n = a.pending;
      return (
        n === null ? (e.next = e) : ((e.next = n.next), (n.next = e)),
        (a.pending = e),
        (e = Vn(l)),
        Ef(l, null, t),
        e
      );
    }
    return (Kn(l, a, e, t), Vn(l));
  }
  function Wa(l, e, t) {
    if (
      ((e = e.updateQueue), e !== null && ((e = e.shared), (t & 4194048) !== 0))
    ) {
      var a = e.lanes;
      ((a &= l.pendingLanes), (t |= a), (e.lanes = t), Os(l, t));
    }
  }
  function Vi(l, e) {
    var t = l.updateQueue,
      a = l.alternate;
    if (a !== null && ((a = a.updateQueue), t === a)) {
      var n = null,
        u = null;
      if (((t = t.firstBaseUpdate), t !== null)) {
        do {
          var c = {
            lane: t.lane,
            tag: t.tag,
            payload: t.payload,
            callback: null,
            next: null,
          };
          (u === null ? (n = u = c) : (u = u.next = c), (t = t.next));
        } while (t !== null);
        u === null ? (n = u = e) : (u = u.next = e);
      } else n = u = e;
      ((t = {
        baseState: a.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: u,
        shared: a.shared,
        callbacks: a.callbacks,
      }),
        (l.updateQueue = t));
      return;
    }
    ((l = t.lastBaseUpdate),
      l === null ? (t.firstBaseUpdate = e) : (l.next = e),
      (t.lastBaseUpdate = e));
  }
  var ki = !1;
  function Fa() {
    if (ki) {
      var l = da;
      if (l !== null) throw l;
    }
  }
  function Ia(l, e, t, a) {
    ki = !1;
    var n = l.updateQueue;
    it = !1;
    var u = n.firstBaseUpdate,
      c = n.lastBaseUpdate,
      s = n.shared.pending;
    if (s !== null) {
      n.shared.pending = null;
      var r = s,
        b = r.next;
      ((r.next = null), c === null ? (u = b) : (c.next = b), (c = r));
      var A = l.alternate;
      A !== null &&
        ((A = A.updateQueue),
        (s = A.lastBaseUpdate),
        s !== c &&
          (s === null ? (A.firstBaseUpdate = b) : (s.next = b),
          (A.lastBaseUpdate = r)));
    }
    if (u !== null) {
      var M = n.baseState;
      ((c = 0), (A = b = r = null), (s = u));
      do {
        var S = s.lane & -536870913,
          j = S !== s.lane;
        if (j ? (fl & S) === S : (a & S) === S) {
          (S !== 0 && S === fa && (ki = !0),
            A !== null &&
              (A = A.next =
                {
                  lane: 0,
                  tag: s.tag,
                  payload: s.payload,
                  callback: null,
                  next: null,
                }));
          l: {
            var X = l,
              J = s;
            S = e;
            var jl = t;
            switch (J.tag) {
              case 1:
                if (((X = J.payload), typeof X == "function")) {
                  M = X.call(jl, M, S);
                  break l;
                }
                M = X;
                break l;
              case 3:
                X.flags = (X.flags & -65537) | 128;
              case 0:
                if (
                  ((X = J.payload),
                  (S = typeof X == "function" ? X.call(jl, M, S) : X),
                  S == null)
                )
                  break l;
                M = R({}, M, S);
                break l;
              case 2:
                it = !0;
            }
          }
          ((S = s.callback),
            S !== null &&
              ((l.flags |= 64),
              j && (l.flags |= 8192),
              (j = n.callbacks),
              j === null ? (n.callbacks = [S]) : j.push(S)));
        } else
          ((j = {
            lane: S,
            tag: s.tag,
            payload: s.payload,
            callback: s.callback,
            next: null,
          }),
            A === null ? ((b = A = j), (r = M)) : (A = A.next = j),
            (c |= S));
        if (((s = s.next), s === null)) {
          if (((s = n.shared.pending), s === null)) break;
          ((j = s),
            (s = j.next),
            (j.next = null),
            (n.lastBaseUpdate = j),
            (n.shared.pending = null));
        }
      } while (!0);
      (A === null && (r = M),
        (n.baseState = r),
        (n.firstBaseUpdate = b),
        (n.lastBaseUpdate = A),
        u === null && (n.shared.lanes = 0),
        (ht |= c),
        (l.lanes = c),
        (l.memoizedState = M));
    }
  }
  function Qf(l, e) {
    if (typeof l != "function") throw Error(d(191, l));
    l.call(e);
  }
  function Zf(l, e) {
    var t = l.callbacks;
    if (t !== null)
      for (l.callbacks = null, l = 0; l < t.length; l++) Qf(t[l], e);
  }
  var ha = m(null),
    tu = m(0);
  function Kf(l, e) {
    ((l = We), G(tu, l), G(ha, e), (We = l | e.baseLanes));
  }
  function Ji() {
    (G(tu, We), G(ha, ha.current));
  }
  function $i() {
    ((We = tu.current), O(ha), O(tu));
  }
  var re = m(null),
    Ne = null;
  function ft(l) {
    var e = l.alternate;
    (G(Ol, Ol.current & 1),
      G(re, l),
      Ne === null &&
        (e === null || ha.current !== null || e.memoizedState !== null) &&
        (Ne = l));
  }
  function Wi(l) {
    (G(Ol, Ol.current), G(re, l), Ne === null && (Ne = l));
  }
  function Vf(l) {
    l.tag === 22
      ? (G(Ol, Ol.current), G(re, l), Ne === null && (Ne = l))
      : dt();
  }
  function dt() {
    (G(Ol, Ol.current), G(re, re.current));
  }
  function oe(l) {
    (O(re), Ne === l && (Ne = null), O(Ol));
  }
  var Ol = m(0);
  function au(l) {
    for (var e = l; e !== null;) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if (t !== null && ((t = t.dehydrated), t === null || ts(t) || as(t)))
          return e;
      } else if (
        e.tag === 19 &&
        (e.memoizedProps.revealOrder === "forwards" ||
          e.memoizedProps.revealOrder === "backwards" ||
          e.memoizedProps.revealOrder === "unstable_legacy-backwards" ||
          e.memoizedProps.revealOrder === "together")
      ) {
        if ((e.flags & 128) !== 0) return e;
      } else if (e.child !== null) {
        ((e.child.return = e), (e = e.child));
        continue;
      }
      if (e === l) break;
      for (; e.sibling === null;) {
        if (e.return === null || e.return === l) return null;
        e = e.return;
      }
      ((e.sibling.return = e.return), (e = e.sibling));
    }
    return null;
  }
  var Xe = 0,
    el = null,
    Sl = null,
    Hl = null,
    nu = !1,
    ma = !1,
    Lt = !1,
    uu = 0,
    Pa = 0,
    va = null,
    rm = 0;
  function Dl() {
    throw Error(d(321));
  }
  function Fi(l, e) {
    if (e === null) return !1;
    for (var t = 0; t < e.length && t < l.length; t++)
      if (!fe(l[t], e[t])) return !1;
    return !0;
  }
  function Ii(l, e, t, a, n, u) {
    return (
      (Xe = u),
      (el = e),
      (e.memoizedState = null),
      (e.updateQueue = null),
      (e.lanes = 0),
      (T.H = l === null || l.memoizedState === null ? Dd : hc),
      (Lt = !1),
      (u = t(a, n)),
      (Lt = !1),
      ma && (u = Jf(e, t, a, n)),
      kf(l),
      u
    );
  }
  function kf(l) {
    T.H = tn;
    var e = Sl !== null && Sl.next !== null;
    if (((Xe = 0), (Hl = Sl = el = null), (nu = !1), (Pa = 0), (va = null), e))
      throw Error(d(300));
    l === null ||
      Bl ||
      ((l = l.dependencies), l !== null && $n(l) && (Bl = !0));
  }
  function Jf(l, e, t, a) {
    el = l;
    var n = 0;
    do {
      if ((ma && (va = null), (Pa = 0), (ma = !1), 25 <= n))
        throw Error(d(301));
      if (((n += 1), (Hl = Sl = null), l.updateQueue != null)) {
        var u = l.updateQueue;
        ((u.lastEffect = null),
          (u.events = null),
          (u.stores = null),
          u.memoCache != null && (u.memoCache.index = 0));
      }
      ((T.H = Cd), (u = e(t, a)));
    } while (ma);
    return u;
  }
  function om() {
    var l = T.H,
      e = l.useState()[0];
    return (
      (e = typeof e.then == "function" ? ln(e) : e),
      (l = l.useState()[0]),
      (Sl !== null ? Sl.memoizedState : null) !== l && (el.flags |= 1024),
      e
    );
  }
  function Pi() {
    var l = uu !== 0;
    return ((uu = 0), l);
  }
  function lc(l, e, t) {
    ((e.updateQueue = l.updateQueue), (e.flags &= -2053), (l.lanes &= ~t));
  }
  function ec(l) {
    if (nu) {
      for (l = l.memoizedState; l !== null;) {
        var e = l.queue;
        (e !== null && (e.pending = null), (l = l.next));
      }
      nu = !1;
    }
    ((Xe = 0), (Hl = Sl = el = null), (ma = !1), (Pa = uu = 0), (va = null));
  }
  function Wl() {
    var l = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null,
    };
    return (Hl === null ? (el.memoizedState = Hl = l) : (Hl = Hl.next = l), Hl);
  }
  function Ul() {
    if (Sl === null) {
      var l = el.alternate;
      l = l !== null ? l.memoizedState : null;
    } else l = Sl.next;
    var e = Hl === null ? el.memoizedState : Hl.next;
    if (e !== null) ((Hl = e), (Sl = l));
    else {
      if (l === null)
        throw el.alternate === null ? Error(d(467)) : Error(d(310));
      ((Sl = l),
        (l = {
          memoizedState: Sl.memoizedState,
          baseState: Sl.baseState,
          baseQueue: Sl.baseQueue,
          queue: Sl.queue,
          next: null,
        }),
        Hl === null ? (el.memoizedState = Hl = l) : (Hl = Hl.next = l));
    }
    return Hl;
  }
  function iu() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function ln(l) {
    var e = Pa;
    return (
      (Pa += 1),
      va === null && (va = []),
      (l = Yf(va, l, e)),
      (e = el),
      (Hl === null ? e.memoizedState : Hl.next) === null &&
        ((e = e.alternate),
        (T.H = e === null || e.memoizedState === null ? Dd : hc)),
      l
    );
  }
  function cu(l) {
    if (l !== null && typeof l == "object") {
      if (typeof l.then == "function") return ln(l);
      if (l.$$typeof === ol) return Kl(l);
    }
    throw Error(d(438, String(l)));
  }
  function tc(l) {
    var e = null,
      t = el.updateQueue;
    if ((t !== null && (e = t.memoCache), e == null)) {
      var a = el.alternate;
      a !== null &&
        ((a = a.updateQueue),
        a !== null &&
          ((a = a.memoCache),
          a != null &&
            (e = {
              data: a.data.map(function (n) {
                return n.slice();
              }),
              index: 0,
            })));
    }
    if (
      (e == null && (e = { data: [], index: 0 }),
      t === null && ((t = iu()), (el.updateQueue = t)),
      (t.memoCache = e),
      (t = e.data[e.index]),
      t === void 0)
    )
      for (t = e.data[e.index] = Array(l), a = 0; a < l; a++) t[a] = F;
    return (e.index++, t);
  }
  function Qe(l, e) {
    return typeof e == "function" ? e(l) : e;
  }
  function su(l) {
    var e = Ul();
    return ac(e, Sl, l);
  }
  function ac(l, e, t) {
    var a = l.queue;
    if (a === null) throw Error(d(311));
    a.lastRenderedReducer = t;
    var n = l.baseQueue,
      u = a.pending;
    if (u !== null) {
      if (n !== null) {
        var c = n.next;
        ((n.next = u.next), (u.next = c));
      }
      ((e.baseQueue = n = u), (a.pending = null));
    }
    if (((u = l.baseState), n === null)) l.memoizedState = u;
    else {
      e = n.next;
      var s = (c = null),
        r = null,
        b = e,
        A = !1;
      do {
        var M = b.lane & -536870913;
        if (M !== b.lane ? (fl & M) === M : (Xe & M) === M) {
          var S = b.revertLane;
          if (S === 0)
            (r !== null &&
              (r = r.next =
                {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: b.action,
                  hasEagerState: b.hasEagerState,
                  eagerState: b.eagerState,
                  next: null,
                }),
              M === fa && (A = !0));
          else if ((Xe & S) === S) {
            ((b = b.next), S === fa && (A = !0));
            continue;
          } else
            ((M = {
              lane: 0,
              revertLane: b.revertLane,
              gesture: null,
              action: b.action,
              hasEagerState: b.hasEagerState,
              eagerState: b.eagerState,
              next: null,
            }),
              r === null ? ((s = r = M), (c = u)) : (r = r.next = M),
              (el.lanes |= S),
              (ht |= S));
          ((M = b.action),
            Lt && t(u, M),
            (u = b.hasEagerState ? b.eagerState : t(u, M)));
        } else
          ((S = {
            lane: M,
            revertLane: b.revertLane,
            gesture: b.gesture,
            action: b.action,
            hasEagerState: b.hasEagerState,
            eagerState: b.eagerState,
            next: null,
          }),
            r === null ? ((s = r = S), (c = u)) : (r = r.next = S),
            (el.lanes |= M),
            (ht |= M));
        b = b.next;
      } while (b !== null && b !== e);
      if (
        (r === null ? (c = u) : (r.next = s),
        !fe(u, l.memoizedState) && ((Bl = !0), A && ((t = da), t !== null)))
      )
        throw t;
      ((l.memoizedState = u),
        (l.baseState = c),
        (l.baseQueue = r),
        (a.lastRenderedState = u));
    }
    return (n === null && (a.lanes = 0), [l.memoizedState, a.dispatch]);
  }
  function nc(l) {
    var e = Ul(),
      t = e.queue;
    if (t === null) throw Error(d(311));
    t.lastRenderedReducer = l;
    var a = t.dispatch,
      n = t.pending,
      u = e.memoizedState;
    if (n !== null) {
      t.pending = null;
      var c = (n = n.next);
      do ((u = l(u, c.action)), (c = c.next));
      while (c !== n);
      (fe(u, e.memoizedState) || (Bl = !0),
        (e.memoizedState = u),
        e.baseQueue === null && (e.baseState = u),
        (t.lastRenderedState = u));
    }
    return [u, a];
  }
  function $f(l, e, t) {
    var a = el,
      n = Ul(),
      u = rl;
    if (u) {
      if (t === void 0) throw Error(d(407));
      t = t();
    } else t = e();
    var c = !fe((Sl || n).memoizedState, t);
    if (
      (c && ((n.memoizedState = t), (Bl = !0)),
      (n = n.queue),
      cc(If.bind(null, a, n, l), [l]),
      n.getSnapshot !== e || c || (Hl !== null && Hl.memoizedState.tag & 1))
    ) {
      if (
        ((a.flags |= 2048),
        ya(9, { destroy: void 0 }, Ff.bind(null, a, n, t, e), null),
        Al === null)
      )
        throw Error(d(349));
      u || (Xe & 127) !== 0 || Wf(a, e, t);
    }
    return t;
  }
  function Wf(l, e, t) {
    ((l.flags |= 16384),
      (l = { getSnapshot: e, value: t }),
      (e = el.updateQueue),
      e === null
        ? ((e = iu()), (el.updateQueue = e), (e.stores = [l]))
        : ((t = e.stores), t === null ? (e.stores = [l]) : t.push(l)));
  }
  function Ff(l, e, t, a) {
    ((e.value = t), (e.getSnapshot = a), Pf(e) && ld(l));
  }
  function If(l, e, t) {
    return t(function () {
      Pf(e) && ld(l);
    });
  }
  function Pf(l) {
    var e = l.getSnapshot;
    l = l.value;
    try {
      var t = e();
      return !fe(l, t);
    } catch {
      return !0;
    }
  }
  function ld(l) {
    var e = _t(l, 2);
    e !== null && ne(e, l, 2);
  }
  function uc(l) {
    var e = Wl();
    if (typeof l == "function") {
      var t = l;
      if (((l = t()), Lt)) {
        Pe(!0);
        try {
          t();
        } finally {
          Pe(!1);
        }
      }
    }
    return (
      (e.memoizedState = e.baseState = l),
      (e.queue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Qe,
        lastRenderedState: l,
      }),
      e
    );
  }
  function ed(l, e, t, a) {
    return ((l.baseState = t), ac(l, Sl, typeof a == "function" ? a : Qe));
  }
  function hm(l, e, t, a, n) {
    if (ru(l)) throw Error(d(485));
    if (((l = e.action), l !== null)) {
      var u = {
        payload: n,
        action: l,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function (c) {
          u.listeners.push(c);
        },
      };
      (T.T !== null ? t(!0) : (u.isTransition = !1),
        a(u),
        (t = e.pending),
        t === null
          ? ((u.next = e.pending = u), td(e, u))
          : ((u.next = t.next), (e.pending = t.next = u)));
    }
  }
  function td(l, e) {
    var t = e.action,
      a = e.payload,
      n = l.state;
    if (e.isTransition) {
      var u = T.T,
        c = {};
      T.T = c;
      try {
        var s = t(n, a),
          r = T.S;
        (r !== null && r(c, s), ad(l, e, s));
      } catch (b) {
        ic(l, e, b);
      } finally {
        (u !== null && c.types !== null && (u.types = c.types), (T.T = u));
      }
    } else
      try {
        ((u = t(n, a)), ad(l, e, u));
      } catch (b) {
        ic(l, e, b);
      }
  }
  function ad(l, e, t) {
    t !== null && typeof t == "object" && typeof t.then == "function"
      ? t.then(
          function (a) {
            nd(l, e, a);
          },
          function (a) {
            return ic(l, e, a);
          },
        )
      : nd(l, e, t);
  }
  function nd(l, e, t) {
    ((e.status = "fulfilled"),
      (e.value = t),
      ud(e),
      (l.state = t),
      (e = l.pending),
      e !== null &&
        ((t = e.next),
        t === e ? (l.pending = null) : ((t = t.next), (e.next = t), td(l, t))));
  }
  function ic(l, e, t) {
    var a = l.pending;
    if (((l.pending = null), a !== null)) {
      a = a.next;
      do ((e.status = "rejected"), (e.reason = t), ud(e), (e = e.next));
      while (e !== a);
    }
    l.action = null;
  }
  function ud(l) {
    l = l.listeners;
    for (var e = 0; e < l.length; e++) (0, l[e])();
  }
  function id(l, e) {
    return e;
  }
  function cd(l, e) {
    if (rl) {
      var t = Al.formState;
      if (t !== null) {
        l: {
          var a = el;
          if (rl) {
            if (El) {
              e: {
                for (var n = El, u = je; n.nodeType !== 8;) {
                  if (!u) {
                    n = null;
                    break e;
                  }
                  if (((n = Ae(n.nextSibling)), n === null)) {
                    n = null;
                    break e;
                  }
                }
                ((u = n.data), (n = u === "F!" || u === "F" ? n : null));
              }
              if (n) {
                ((El = Ae(n.nextSibling)), (a = n.data === "F!"));
                break l;
              }
            }
            nt(a);
          }
          a = !1;
        }
        a && (e = t[0]);
      }
    }
    return (
      (t = Wl()),
      (t.memoizedState = t.baseState = e),
      (a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: id,
        lastRenderedState: e,
      }),
      (t.queue = a),
      (t = Td.bind(null, el, a)),
      (a.dispatch = t),
      (a = uc(!1)),
      (u = oc.bind(null, el, !1, a.queue)),
      (a = Wl()),
      (n = { state: e, dispatch: null, action: l, pending: null }),
      (a.queue = n),
      (t = hm.bind(null, el, n, u, t)),
      (n.dispatch = t),
      (a.memoizedState = l),
      [e, t, !1]
    );
  }
  function sd(l) {
    var e = Ul();
    return fd(e, Sl, l);
  }
  function fd(l, e, t) {
    if (
      ((e = ac(l, e, id)[0]),
      (l = su(Qe)[0]),
      typeof e == "object" && e !== null && typeof e.then == "function")
    )
      try {
        var a = ln(e);
      } catch (c) {
        throw c === ra ? In : c;
      }
    else a = e;
    e = Ul();
    var n = e.queue,
      u = n.dispatch;
    return (
      t !== e.memoizedState &&
        ((el.flags |= 2048),
        ya(9, { destroy: void 0 }, mm.bind(null, n, t), null)),
      [a, u, l]
    );
  }
  function mm(l, e) {
    l.action = e;
  }
  function dd(l) {
    var e = Ul(),
      t = Sl;
    if (t !== null) return fd(e, t, l);
    (Ul(), (e = e.memoizedState), (t = Ul()));
    var a = t.queue.dispatch;
    return ((t.memoizedState = l), [e, a, !1]);
  }
  function ya(l, e, t, a) {
    return (
      (l = { tag: l, create: t, deps: a, inst: e, next: null }),
      (e = el.updateQueue),
      e === null && ((e = iu()), (el.updateQueue = e)),
      (t = e.lastEffect),
      t === null
        ? (e.lastEffect = l.next = l)
        : ((a = t.next), (t.next = l), (l.next = a), (e.lastEffect = l)),
      l
    );
  }
  function rd() {
    return Ul().memoizedState;
  }
  function fu(l, e, t, a) {
    var n = Wl();
    ((el.flags |= l),
      (n.memoizedState = ya(
        1 | e,
        { destroy: void 0 },
        t,
        a === void 0 ? null : a,
      )));
  }
  function du(l, e, t, a) {
    var n = Ul();
    a = a === void 0 ? null : a;
    var u = n.memoizedState.inst;
    Sl !== null && a !== null && Fi(a, Sl.memoizedState.deps)
      ? (n.memoizedState = ya(e, u, t, a))
      : ((el.flags |= l), (n.memoizedState = ya(1 | e, u, t, a)));
  }
  function od(l, e) {
    fu(8390656, 8, l, e);
  }
  function cc(l, e) {
    du(2048, 8, l, e);
  }
  function vm(l) {
    el.flags |= 4;
    var e = el.updateQueue;
    if (e === null) ((e = iu()), (el.updateQueue = e), (e.events = [l]));
    else {
      var t = e.events;
      t === null ? (e.events = [l]) : t.push(l);
    }
  }
  function hd(l) {
    var e = Ul().memoizedState;
    return (
      vm({ ref: e, nextImpl: l }),
      function () {
        if ((vl & 2) !== 0) throw Error(d(440));
        return e.impl.apply(void 0, arguments);
      }
    );
  }
  function md(l, e) {
    return du(4, 2, l, e);
  }
  function vd(l, e) {
    return du(4, 4, l, e);
  }
  function yd(l, e) {
    if (typeof e == "function") {
      l = l();
      var t = e(l);
      return function () {
        typeof t == "function" ? t() : e(null);
      };
    }
    if (e != null)
      return (
        (l = l()),
        (e.current = l),
        function () {
          e.current = null;
        }
      );
  }
  function gd(l, e, t) {
    ((t = t != null ? t.concat([l]) : null), du(4, 4, yd.bind(null, e, l), t));
  }
  function sc() {}
  function pd(l, e) {
    var t = Ul();
    e = e === void 0 ? null : e;
    var a = t.memoizedState;
    return e !== null && Fi(e, a[1]) ? a[0] : ((t.memoizedState = [l, e]), l);
  }
  function bd(l, e) {
    var t = Ul();
    e = e === void 0 ? null : e;
    var a = t.memoizedState;
    if (e !== null && Fi(e, a[1])) return a[0];
    if (((a = l()), Lt)) {
      Pe(!0);
      try {
        l();
      } finally {
        Pe(!1);
      }
    }
    return ((t.memoizedState = [a, e]), a);
  }
  function fc(l, e, t) {
    return t === void 0 || ((Xe & 1073741824) !== 0 && (fl & 261930) === 0)
      ? (l.memoizedState = e)
      : ((l.memoizedState = t), (l = Sr()), (el.lanes |= l), (ht |= l), t);
  }
  function Sd(l, e, t, a) {
    return fe(t, e)
      ? t
      : ha.current !== null
        ? ((l = fc(l, t, a)), fe(l, e) || (Bl = !0), l)
        : (Xe & 42) === 0 || ((Xe & 1073741824) !== 0 && (fl & 261930) === 0)
          ? ((Bl = !0), (l.memoizedState = t))
          : ((l = Sr()), (el.lanes |= l), (ht |= l), e);
  }
  function xd(l, e, t, a, n) {
    var u = L.p;
    L.p = u !== 0 && 8 > u ? u : 8;
    var c = T.T,
      s = {};
    ((T.T = s), oc(l, !1, e, t));
    try {
      var r = n(),
        b = T.S;
      if (
        (b !== null && b(s, r),
        r !== null && typeof r == "object" && typeof r.then == "function")
      ) {
        var A = dm(r, a);
        en(l, e, A, ve(l));
      } else en(l, e, a, ve(l));
    } catch (M) {
      en(l, e, { then: function () {}, status: "rejected", reason: M }, ve());
    } finally {
      ((L.p = u),
        c !== null && s.types !== null && (c.types = s.types),
        (T.T = c));
    }
  }
  function ym() {}
  function dc(l, e, t, a) {
    if (l.tag !== 5) throw Error(d(476));
    var n = jd(l).queue;
    xd(
      l,
      n,
      e,
      $,
      t === null
        ? ym
        : function () {
            return (Nd(l), t(a));
          },
    );
  }
  function jd(l) {
    var e = l.memoizedState;
    if (e !== null) return e;
    e = {
      memoizedState: $,
      baseState: $,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Qe,
        lastRenderedState: $,
      },
      next: null,
    };
    var t = {};
    return (
      (e.next = {
        memoizedState: t,
        baseState: t,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Qe,
          lastRenderedState: t,
        },
        next: null,
      }),
      (l.memoizedState = e),
      (l = l.alternate),
      l !== null && (l.memoizedState = e),
      e
    );
  }
  function Nd(l) {
    var e = jd(l);
    (e.next === null && (e = l.alternate.memoizedState),
      en(l, e.next.queue, {}, ve()));
  }
  function rc() {
    return Kl(bn);
  }
  function Ad() {
    return Ul().memoizedState;
  }
  function Ed() {
    return Ul().memoizedState;
  }
  function gm(l) {
    for (var e = l.return; e !== null;) {
      switch (e.tag) {
        case 24:
        case 3:
          var t = ve();
          l = ct(t);
          var a = st(e, l, t);
          (a !== null && (ne(a, e, t), Wa(a, e, t)),
            (e = { cache: Li() }),
            (l.payload = e));
          return;
      }
      e = e.return;
    }
  }
  function pm(l, e, t) {
    var a = ve();
    ((t = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: t,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
      ru(l)
        ? zd(e, t)
        : ((t = Di(l, e, t, a)), t !== null && (ne(t, l, a), Md(t, e, a))));
  }
  function Td(l, e, t) {
    var a = ve();
    en(l, e, t, a);
  }
  function en(l, e, t, a) {
    var n = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: t,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    };
    if (ru(l)) zd(e, n);
    else {
      var u = l.alternate;
      if (
        l.lanes === 0 &&
        (u === null || u.lanes === 0) &&
        ((u = e.lastRenderedReducer), u !== null)
      )
        try {
          var c = e.lastRenderedState,
            s = u(c, t);
          if (((n.hasEagerState = !0), (n.eagerState = s), fe(s, c)))
            return (Kn(l, e, n, 0), Al === null && Zn(), !1);
        } catch {}
      if (((t = Di(l, e, n, a)), t !== null))
        return (ne(t, l, a), Md(t, e, a), !0);
    }
    return !1;
  }
  function oc(l, e, t, a) {
    if (
      ((a = {
        lane: 2,
        revertLane: Zc(),
        gesture: null,
        action: a,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
      ru(l))
    ) {
      if (e) throw Error(d(479));
    } else ((e = Di(l, t, a, 2)), e !== null && ne(e, l, 2));
  }
  function ru(l) {
    var e = l.alternate;
    return l === el || (e !== null && e === el);
  }
  function zd(l, e) {
    ma = nu = !0;
    var t = l.pending;
    (t === null ? (e.next = e) : ((e.next = t.next), (t.next = e)),
      (l.pending = e));
  }
  function Md(l, e, t) {
    if ((t & 4194048) !== 0) {
      var a = e.lanes;
      ((a &= l.pendingLanes), (t |= a), (e.lanes = t), Os(l, t));
    }
  }
  var tn = {
    readContext: Kl,
    use: cu,
    useCallback: Dl,
    useContext: Dl,
    useEffect: Dl,
    useImperativeHandle: Dl,
    useLayoutEffect: Dl,
    useInsertionEffect: Dl,
    useMemo: Dl,
    useReducer: Dl,
    useRef: Dl,
    useState: Dl,
    useDebugValue: Dl,
    useDeferredValue: Dl,
    useTransition: Dl,
    useSyncExternalStore: Dl,
    useId: Dl,
    useHostTransitionStatus: Dl,
    useFormState: Dl,
    useActionState: Dl,
    useOptimistic: Dl,
    useMemoCache: Dl,
    useCacheRefresh: Dl,
  };
  tn.useEffectEvent = Dl;
  var Dd = {
      readContext: Kl,
      use: cu,
      useCallback: function (l, e) {
        return ((Wl().memoizedState = [l, e === void 0 ? null : e]), l);
      },
      useContext: Kl,
      useEffect: od,
      useImperativeHandle: function (l, e, t) {
        ((t = t != null ? t.concat([l]) : null),
          fu(4194308, 4, yd.bind(null, e, l), t));
      },
      useLayoutEffect: function (l, e) {
        return fu(4194308, 4, l, e);
      },
      useInsertionEffect: function (l, e) {
        fu(4, 2, l, e);
      },
      useMemo: function (l, e) {
        var t = Wl();
        e = e === void 0 ? null : e;
        var a = l();
        if (Lt) {
          Pe(!0);
          try {
            l();
          } finally {
            Pe(!1);
          }
        }
        return ((t.memoizedState = [a, e]), a);
      },
      useReducer: function (l, e, t) {
        var a = Wl();
        if (t !== void 0) {
          var n = t(e);
          if (Lt) {
            Pe(!0);
            try {
              t(e);
            } finally {
              Pe(!1);
            }
          }
        } else n = e;
        return (
          (a.memoizedState = a.baseState = n),
          (l = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: l,
            lastRenderedState: n,
          }),
          (a.queue = l),
          (l = l.dispatch = pm.bind(null, el, l)),
          [a.memoizedState, l]
        );
      },
      useRef: function (l) {
        var e = Wl();
        return ((l = { current: l }), (e.memoizedState = l));
      },
      useState: function (l) {
        l = uc(l);
        var e = l.queue,
          t = Td.bind(null, el, e);
        return ((e.dispatch = t), [l.memoizedState, t]);
      },
      useDebugValue: sc,
      useDeferredValue: function (l, e) {
        var t = Wl();
        return fc(t, l, e);
      },
      useTransition: function () {
        var l = uc(!1);
        return (
          (l = xd.bind(null, el, l.queue, !0, !1)),
          (Wl().memoizedState = l),
          [!1, l]
        );
      },
      useSyncExternalStore: function (l, e, t) {
        var a = el,
          n = Wl();
        if (rl) {
          if (t === void 0) throw Error(d(407));
          t = t();
        } else {
          if (((t = e()), Al === null)) throw Error(d(349));
          (fl & 127) !== 0 || Wf(a, e, t);
        }
        n.memoizedState = t;
        var u = { value: t, getSnapshot: e };
        return (
          (n.queue = u),
          od(If.bind(null, a, u, l), [l]),
          (a.flags |= 2048),
          ya(9, { destroy: void 0 }, Ff.bind(null, a, u, t, e), null),
          t
        );
      },
      useId: function () {
        var l = Wl(),
          e = Al.identifierPrefix;
        if (rl) {
          var t = _e,
            a = Ce;
          ((t = (a & ~(1 << (32 - se(a) - 1))).toString(32) + t),
            (e = "_" + e + "R_" + t),
            (t = uu++),
            0 < t && (e += "H" + t.toString(32)),
            (e += "_"));
        } else ((t = rm++), (e = "_" + e + "r_" + t.toString(32) + "_"));
        return (l.memoizedState = e);
      },
      useHostTransitionStatus: rc,
      useFormState: cd,
      useActionState: cd,
      useOptimistic: function (l) {
        var e = Wl();
        e.memoizedState = e.baseState = l;
        var t = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: null,
          lastRenderedState: null,
        };
        return (
          (e.queue = t),
          (e = oc.bind(null, el, !0, t)),
          (t.dispatch = e),
          [l, e]
        );
      },
      useMemoCache: tc,
      useCacheRefresh: function () {
        return (Wl().memoizedState = gm.bind(null, el));
      },
      useEffectEvent: function (l) {
        var e = Wl(),
          t = { impl: l };
        return (
          (e.memoizedState = t),
          function () {
            if ((vl & 2) !== 0) throw Error(d(440));
            return t.impl.apply(void 0, arguments);
          }
        );
      },
    },
    hc = {
      readContext: Kl,
      use: cu,
      useCallback: pd,
      useContext: Kl,
      useEffect: cc,
      useImperativeHandle: gd,
      useInsertionEffect: md,
      useLayoutEffect: vd,
      useMemo: bd,
      useReducer: su,
      useRef: rd,
      useState: function () {
        return su(Qe);
      },
      useDebugValue: sc,
      useDeferredValue: function (l, e) {
        var t = Ul();
        return Sd(t, Sl.memoizedState, l, e);
      },
      useTransition: function () {
        var l = su(Qe)[0],
          e = Ul().memoizedState;
        return [typeof l == "boolean" ? l : ln(l), e];
      },
      useSyncExternalStore: $f,
      useId: Ad,
      useHostTransitionStatus: rc,
      useFormState: sd,
      useActionState: sd,
      useOptimistic: function (l, e) {
        var t = Ul();
        return ed(t, Sl, l, e);
      },
      useMemoCache: tc,
      useCacheRefresh: Ed,
    };
  hc.useEffectEvent = hd;
  var Cd = {
    readContext: Kl,
    use: cu,
    useCallback: pd,
    useContext: Kl,
    useEffect: cc,
    useImperativeHandle: gd,
    useInsertionEffect: md,
    useLayoutEffect: vd,
    useMemo: bd,
    useReducer: nc,
    useRef: rd,
    useState: function () {
      return nc(Qe);
    },
    useDebugValue: sc,
    useDeferredValue: function (l, e) {
      var t = Ul();
      return Sl === null ? fc(t, l, e) : Sd(t, Sl.memoizedState, l, e);
    },
    useTransition: function () {
      var l = nc(Qe)[0],
        e = Ul().memoizedState;
      return [typeof l == "boolean" ? l : ln(l), e];
    },
    useSyncExternalStore: $f,
    useId: Ad,
    useHostTransitionStatus: rc,
    useFormState: dd,
    useActionState: dd,
    useOptimistic: function (l, e) {
      var t = Ul();
      return Sl !== null
        ? ed(t, Sl, l, e)
        : ((t.baseState = l), [l, t.queue.dispatch]);
    },
    useMemoCache: tc,
    useCacheRefresh: Ed,
  };
  Cd.useEffectEvent = hd;
  function mc(l, e, t, a) {
    ((e = l.memoizedState),
      (t = t(a, e)),
      (t = t == null ? e : R({}, e, t)),
      (l.memoizedState = t),
      l.lanes === 0 && (l.updateQueue.baseState = t));
  }
  var vc = {
    enqueueSetState: function (l, e, t) {
      l = l._reactInternals;
      var a = ve(),
        n = ct(a);
      ((n.payload = e),
        t != null && (n.callback = t),
        (e = st(l, n, a)),
        e !== null && (ne(e, l, a), Wa(e, l, a)));
    },
    enqueueReplaceState: function (l, e, t) {
      l = l._reactInternals;
      var a = ve(),
        n = ct(a);
      ((n.tag = 1),
        (n.payload = e),
        t != null && (n.callback = t),
        (e = st(l, n, a)),
        e !== null && (ne(e, l, a), Wa(e, l, a)));
    },
    enqueueForceUpdate: function (l, e) {
      l = l._reactInternals;
      var t = ve(),
        a = ct(t);
      ((a.tag = 2),
        e != null && (a.callback = e),
        (e = st(l, a, t)),
        e !== null && (ne(e, l, t), Wa(e, l, t)));
    },
  };
  function _d(l, e, t, a, n, u, c) {
    return (
      (l = l.stateNode),
      typeof l.shouldComponentUpdate == "function"
        ? l.shouldComponentUpdate(a, u, c)
        : e.prototype && e.prototype.isPureReactComponent
          ? !Xa(t, a) || !Xa(n, u)
          : !0
    );
  }
  function Od(l, e, t, a) {
    ((l = e.state),
      typeof e.componentWillReceiveProps == "function" &&
        e.componentWillReceiveProps(t, a),
      typeof e.UNSAFE_componentWillReceiveProps == "function" &&
        e.UNSAFE_componentWillReceiveProps(t, a),
      e.state !== l && vc.enqueueReplaceState(e, e.state, null));
  }
  function Gt(l, e) {
    var t = e;
    if ("ref" in e) {
      t = {};
      for (var a in e) a !== "ref" && (t[a] = e[a]);
    }
    if ((l = l.defaultProps)) {
      t === e && (t = R({}, t));
      for (var n in l) t[n] === void 0 && (t[n] = l[n]);
    }
    return t;
  }
  function Ud(l) {
    Qn(l);
  }
  function Rd(l) {
    console.error(l);
  }
  function Hd(l) {
    Qn(l);
  }
  function ou(l, e) {
    try {
      var t = l.onUncaughtError;
      t(e.value, { componentStack: e.stack });
    } catch (a) {
      setTimeout(function () {
        throw a;
      });
    }
  }
  function Bd(l, e, t) {
    try {
      var a = l.onCaughtError;
      a(t.value, {
        componentStack: t.stack,
        errorBoundary: e.tag === 1 ? e.stateNode : null,
      });
    } catch (n) {
      setTimeout(function () {
        throw n;
      });
    }
  }
  function yc(l, e, t) {
    return (
      (t = ct(t)),
      (t.tag = 3),
      (t.payload = { element: null }),
      (t.callback = function () {
        ou(l, e);
      }),
      t
    );
  }
  function qd(l) {
    return ((l = ct(l)), (l.tag = 3), l);
  }
  function Yd(l, e, t, a) {
    var n = t.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var u = a.value;
      ((l.payload = function () {
        return n(u);
      }),
        (l.callback = function () {
          Bd(e, t, a);
        }));
    }
    var c = t.stateNode;
    c !== null &&
      typeof c.componentDidCatch == "function" &&
      (l.callback = function () {
        (Bd(e, t, a),
          typeof n != "function" &&
            (mt === null ? (mt = new Set([this])) : mt.add(this)));
        var s = a.stack;
        this.componentDidCatch(a.value, {
          componentStack: s !== null ? s : "",
        });
      });
  }
  function bm(l, e, t, a, n) {
    if (
      ((t.flags |= 32768),
      a !== null && typeof a == "object" && typeof a.then == "function")
    ) {
      if (
        ((e = t.alternate),
        e !== null && sa(e, t, n, !0),
        (t = re.current),
        t !== null)
      ) {
        switch (t.tag) {
          case 31:
          case 13:
            return (
              Ne === null ? Au() : t.alternate === null && Cl === 0 && (Cl = 3),
              (t.flags &= -257),
              (t.flags |= 65536),
              (t.lanes = n),
              a === Pn
                ? (t.flags |= 16384)
                : ((e = t.updateQueue),
                  e === null ? (t.updateQueue = new Set([a])) : e.add(a),
                  Gc(l, a, n)),
              !1
            );
          case 22:
            return (
              (t.flags |= 65536),
              a === Pn
                ? (t.flags |= 16384)
                : ((e = t.updateQueue),
                  e === null
                    ? ((e = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([a]),
                      }),
                      (t.updateQueue = e))
                    : ((t = e.retryQueue),
                      t === null ? (e.retryQueue = new Set([a])) : t.add(a)),
                  Gc(l, a, n)),
              !1
            );
        }
        throw Error(d(435, t.tag));
      }
      return (Gc(l, a, n), Au(), !1);
    }
    if (rl)
      return (
        (e = re.current),
        e !== null
          ? ((e.flags & 65536) === 0 && (e.flags |= 256),
            (e.flags |= 65536),
            (e.lanes = n),
            a !== Hi && ((l = Error(d(422), { cause: a })), Ka(be(l, t))))
          : (a !== Hi && ((e = Error(d(423), { cause: a })), Ka(be(e, t))),
            (l = l.current.alternate),
            (l.flags |= 65536),
            (n &= -n),
            (l.lanes |= n),
            (a = be(a, t)),
            (n = yc(l.stateNode, a, n)),
            Vi(l, n),
            Cl !== 4 && (Cl = 2)),
        !1
      );
    var u = Error(d(520), { cause: a });
    if (
      ((u = be(u, t)),
      rn === null ? (rn = [u]) : rn.push(u),
      Cl !== 4 && (Cl = 2),
      e === null)
    )
      return !0;
    ((a = be(a, t)), (t = e));
    do {
      switch (t.tag) {
        case 3:
          return (
            (t.flags |= 65536),
            (l = n & -n),
            (t.lanes |= l),
            (l = yc(t.stateNode, a, l)),
            Vi(t, l),
            !1
          );
        case 1:
          if (
            ((e = t.type),
            (u = t.stateNode),
            (t.flags & 128) === 0 &&
              (typeof e.getDerivedStateFromError == "function" ||
                (u !== null &&
                  typeof u.componentDidCatch == "function" &&
                  (mt === null || !mt.has(u)))))
          )
            return (
              (t.flags |= 65536),
              (n &= -n),
              (t.lanes |= n),
              (n = qd(n)),
              Yd(n, l, t, a),
              Vi(t, n),
              !1
            );
      }
      t = t.return;
    } while (t !== null);
    return !1;
  }
  var gc = Error(d(461)),
    Bl = !1;
  function Vl(l, e, t, a) {
    e.child = l === null ? Xf(e, null, t, a) : wt(e, l.child, t, a);
  }
  function wd(l, e, t, a, n) {
    t = t.render;
    var u = e.ref;
    if ("ref" in a) {
      var c = {};
      for (var s in a) s !== "ref" && (c[s] = a[s]);
    } else c = a;
    return (
      Ht(e),
      (a = Ii(l, e, t, c, u, n)),
      (s = Pi()),
      l !== null && !Bl
        ? (lc(l, e, n), Ze(l, e, n))
        : (rl && s && Ui(e), (e.flags |= 1), Vl(l, e, a, n), e.child)
    );
  }
  function Ld(l, e, t, a, n) {
    if (l === null) {
      var u = t.type;
      return typeof u == "function" &&
        !Ci(u) &&
        u.defaultProps === void 0 &&
        t.compare === null
        ? ((e.tag = 15), (e.type = u), Gd(l, e, u, a, n))
        : ((l = kn(t.type, null, a, e, e.mode, n)),
          (l.ref = e.ref),
          (l.return = e),
          (e.child = l));
    }
    if (((u = l.child), !Ec(l, n))) {
      var c = u.memoizedProps;
      if (
        ((t = t.compare), (t = t !== null ? t : Xa), t(c, a) && l.ref === e.ref)
      )
        return Ze(l, e, n);
    }
    return (
      (e.flags |= 1),
      (l = Ye(u, a)),
      (l.ref = e.ref),
      (l.return = e),
      (e.child = l)
    );
  }
  function Gd(l, e, t, a, n) {
    if (l !== null) {
      var u = l.memoizedProps;
      if (Xa(u, a) && l.ref === e.ref)
        if (((Bl = !1), (e.pendingProps = a = u), Ec(l, n)))
          (l.flags & 131072) !== 0 && (Bl = !0);
        else return ((e.lanes = l.lanes), Ze(l, e, n));
    }
    return pc(l, e, t, a, n);
  }
  function Xd(l, e, t, a) {
    var n = a.children,
      u = l !== null ? l.memoizedState : null;
    if (
      (l === null &&
        e.stateNode === null &&
        (e.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      a.mode === "hidden")
    ) {
      if ((e.flags & 128) !== 0) {
        if (((u = u !== null ? u.baseLanes | t : t), l !== null)) {
          for (a = e.child = l.child, n = 0; a !== null;)
            ((n = n | a.lanes | a.childLanes), (a = a.sibling));
          a = n & ~u;
        } else ((a = 0), (e.child = null));
        return Qd(l, e, u, t, a);
      }
      if ((t & 536870912) !== 0)
        ((e.memoizedState = { baseLanes: 0, cachePool: null }),
          l !== null && Fn(e, u !== null ? u.cachePool : null),
          u !== null ? Kf(e, u) : Ji(),
          Vf(e));
      else
        return (
          (a = e.lanes = 536870912),
          Qd(l, e, u !== null ? u.baseLanes | t : t, t, a)
        );
    } else
      u !== null
        ? (Fn(e, u.cachePool), Kf(e, u), dt(), (e.memoizedState = null))
        : (l !== null && Fn(e, null), Ji(), dt());
    return (Vl(l, e, n, t), e.child);
  }
  function an(l, e) {
    return (
      (l !== null && l.tag === 22) ||
        e.stateNode !== null ||
        (e.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      e.sibling
    );
  }
  function Qd(l, e, t, a, n) {
    var u = Xi();
    return (
      (u = u === null ? null : { parent: Rl._currentValue, pool: u }),
      (e.memoizedState = { baseLanes: t, cachePool: u }),
      l !== null && Fn(e, null),
      Ji(),
      Vf(e),
      l !== null && sa(l, e, a, !0),
      (e.childLanes = n),
      null
    );
  }
  function hu(l, e) {
    return (
      (e = vu({ mode: e.mode, children: e.children }, l.mode)),
      (e.ref = l.ref),
      (l.child = e),
      (e.return = l),
      e
    );
  }
  function Zd(l, e, t) {
    return (
      wt(e, l.child, null, t),
      (l = hu(e, e.pendingProps)),
      (l.flags |= 2),
      oe(e),
      (e.memoizedState = null),
      l
    );
  }
  function Sm(l, e, t) {
    var a = e.pendingProps,
      n = (e.flags & 128) !== 0;
    if (((e.flags &= -129), l === null)) {
      if (rl) {
        if (a.mode === "hidden")
          return ((l = hu(e, a)), (e.lanes = 536870912), an(null, l));
        if (
          (Wi(e),
          (l = El)
            ? ((l = to(l, je)),
              (l = l !== null && l.data === "&" ? l : null),
              l !== null &&
                ((e.memoizedState = {
                  dehydrated: l,
                  treeContext: tt !== null ? { id: Ce, overflow: _e } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (t = zf(l)),
                (t.return = e),
                (e.child = t),
                (Zl = e),
                (El = null)))
            : (l = null),
          l === null)
        )
          throw nt(e);
        return ((e.lanes = 536870912), null);
      }
      return hu(e, a);
    }
    var u = l.memoizedState;
    if (u !== null) {
      var c = u.dehydrated;
      if ((Wi(e), n))
        if (e.flags & 256) ((e.flags &= -257), (e = Zd(l, e, t)));
        else if (e.memoizedState !== null)
          ((e.child = l.child), (e.flags |= 128), (e = null));
        else throw Error(d(558));
      else if (
        (Bl || sa(l, e, t, !1), (n = (t & l.childLanes) !== 0), Bl || n)
      ) {
        if (
          ((a = Al),
          a !== null && ((c = Us(a, t)), c !== 0 && c !== u.retryLane))
        )
          throw ((u.retryLane = c), _t(l, c), ne(a, l, c), gc);
        (Au(), (e = Zd(l, e, t)));
      } else
        ((l = u.treeContext),
          (El = Ae(c.nextSibling)),
          (Zl = e),
          (rl = !0),
          (at = null),
          (je = !1),
          l !== null && Cf(e, l),
          (e = hu(e, a)),
          (e.flags |= 4096));
      return e;
    }
    return (
      (l = Ye(l.child, { mode: a.mode, children: a.children })),
      (l.ref = e.ref),
      (e.child = l),
      (l.return = e),
      l
    );
  }
  function mu(l, e) {
    var t = e.ref;
    if (t === null) l !== null && l.ref !== null && (e.flags |= 4194816);
    else {
      if (typeof t != "function" && typeof t != "object") throw Error(d(284));
      (l === null || l.ref !== t) && (e.flags |= 4194816);
    }
  }
  function pc(l, e, t, a, n) {
    return (
      Ht(e),
      (t = Ii(l, e, t, a, void 0, n)),
      (a = Pi()),
      l !== null && !Bl
        ? (lc(l, e, n), Ze(l, e, n))
        : (rl && a && Ui(e), (e.flags |= 1), Vl(l, e, t, n), e.child)
    );
  }
  function Kd(l, e, t, a, n, u) {
    return (
      Ht(e),
      (e.updateQueue = null),
      (t = Jf(e, a, t, n)),
      kf(l),
      (a = Pi()),
      l !== null && !Bl
        ? (lc(l, e, u), Ze(l, e, u))
        : (rl && a && Ui(e), (e.flags |= 1), Vl(l, e, t, u), e.child)
    );
  }
  function Vd(l, e, t, a, n) {
    if ((Ht(e), e.stateNode === null)) {
      var u = na,
        c = t.contextType;
      (typeof c == "object" && c !== null && (u = Kl(c)),
        (u = new t(a, u)),
        (e.memoizedState =
          u.state !== null && u.state !== void 0 ? u.state : null),
        (u.updater = vc),
        (e.stateNode = u),
        (u._reactInternals = e),
        (u = e.stateNode),
        (u.props = a),
        (u.state = e.memoizedState),
        (u.refs = {}),
        Zi(e),
        (c = t.contextType),
        (u.context = typeof c == "object" && c !== null ? Kl(c) : na),
        (u.state = e.memoizedState),
        (c = t.getDerivedStateFromProps),
        typeof c == "function" && (mc(e, t, c, a), (u.state = e.memoizedState)),
        typeof t.getDerivedStateFromProps == "function" ||
          typeof u.getSnapshotBeforeUpdate == "function" ||
          (typeof u.UNSAFE_componentWillMount != "function" &&
            typeof u.componentWillMount != "function") ||
          ((c = u.state),
          typeof u.componentWillMount == "function" && u.componentWillMount(),
          typeof u.UNSAFE_componentWillMount == "function" &&
            u.UNSAFE_componentWillMount(),
          c !== u.state && vc.enqueueReplaceState(u, u.state, null),
          Ia(e, a, u, n),
          Fa(),
          (u.state = e.memoizedState)),
        typeof u.componentDidMount == "function" && (e.flags |= 4194308),
        (a = !0));
    } else if (l === null) {
      u = e.stateNode;
      var s = e.memoizedProps,
        r = Gt(t, s);
      u.props = r;
      var b = u.context,
        A = t.contextType;
      ((c = na), typeof A == "object" && A !== null && (c = Kl(A)));
      var M = t.getDerivedStateFromProps;
      ((A =
        typeof M == "function" ||
        typeof u.getSnapshotBeforeUpdate == "function"),
        (s = e.pendingProps !== s),
        A ||
          (typeof u.UNSAFE_componentWillReceiveProps != "function" &&
            typeof u.componentWillReceiveProps != "function") ||
          ((s || b !== c) && Od(e, u, a, c)),
        (it = !1));
      var S = e.memoizedState;
      ((u.state = S),
        Ia(e, a, u, n),
        Fa(),
        (b = e.memoizedState),
        s || S !== b || it
          ? (typeof M == "function" && (mc(e, t, M, a), (b = e.memoizedState)),
            (r = it || _d(e, t, r, a, S, b, c))
              ? (A ||
                  (typeof u.UNSAFE_componentWillMount != "function" &&
                    typeof u.componentWillMount != "function") ||
                  (typeof u.componentWillMount == "function" &&
                    u.componentWillMount(),
                  typeof u.UNSAFE_componentWillMount == "function" &&
                    u.UNSAFE_componentWillMount()),
                typeof u.componentDidMount == "function" &&
                  (e.flags |= 4194308))
              : (typeof u.componentDidMount == "function" &&
                  (e.flags |= 4194308),
                (e.memoizedProps = a),
                (e.memoizedState = b)),
            (u.props = a),
            (u.state = b),
            (u.context = c),
            (a = r))
          : (typeof u.componentDidMount == "function" && (e.flags |= 4194308),
            (a = !1)));
    } else {
      ((u = e.stateNode),
        Ki(l, e),
        (c = e.memoizedProps),
        (A = Gt(t, c)),
        (u.props = A),
        (M = e.pendingProps),
        (S = u.context),
        (b = t.contextType),
        (r = na),
        typeof b == "object" && b !== null && (r = Kl(b)),
        (s = t.getDerivedStateFromProps),
        (b =
          typeof s == "function" ||
          typeof u.getSnapshotBeforeUpdate == "function") ||
          (typeof u.UNSAFE_componentWillReceiveProps != "function" &&
            typeof u.componentWillReceiveProps != "function") ||
          ((c !== M || S !== r) && Od(e, u, a, r)),
        (it = !1),
        (S = e.memoizedState),
        (u.state = S),
        Ia(e, a, u, n),
        Fa());
      var j = e.memoizedState;
      c !== M ||
      S !== j ||
      it ||
      (l !== null && l.dependencies !== null && $n(l.dependencies))
        ? (typeof s == "function" && (mc(e, t, s, a), (j = e.memoizedState)),
          (A =
            it ||
            _d(e, t, A, a, S, j, r) ||
            (l !== null && l.dependencies !== null && $n(l.dependencies)))
            ? (b ||
                (typeof u.UNSAFE_componentWillUpdate != "function" &&
                  typeof u.componentWillUpdate != "function") ||
                (typeof u.componentWillUpdate == "function" &&
                  u.componentWillUpdate(a, j, r),
                typeof u.UNSAFE_componentWillUpdate == "function" &&
                  u.UNSAFE_componentWillUpdate(a, j, r)),
              typeof u.componentDidUpdate == "function" && (e.flags |= 4),
              typeof u.getSnapshotBeforeUpdate == "function" &&
                (e.flags |= 1024))
            : (typeof u.componentDidUpdate != "function" ||
                (c === l.memoizedProps && S === l.memoizedState) ||
                (e.flags |= 4),
              typeof u.getSnapshotBeforeUpdate != "function" ||
                (c === l.memoizedProps && S === l.memoizedState) ||
                (e.flags |= 1024),
              (e.memoizedProps = a),
              (e.memoizedState = j)),
          (u.props = a),
          (u.state = j),
          (u.context = r),
          (a = A))
        : (typeof u.componentDidUpdate != "function" ||
            (c === l.memoizedProps && S === l.memoizedState) ||
            (e.flags |= 4),
          typeof u.getSnapshotBeforeUpdate != "function" ||
            (c === l.memoizedProps && S === l.memoizedState) ||
            (e.flags |= 1024),
          (a = !1));
    }
    return (
      (u = a),
      mu(l, e),
      (a = (e.flags & 128) !== 0),
      u || a
        ? ((u = e.stateNode),
          (t =
            a && typeof t.getDerivedStateFromError != "function"
              ? null
              : u.render()),
          (e.flags |= 1),
          l !== null && a
            ? ((e.child = wt(e, l.child, null, n)),
              (e.child = wt(e, null, t, n)))
            : Vl(l, e, t, n),
          (e.memoizedState = u.state),
          (l = e.child))
        : (l = Ze(l, e, n)),
      l
    );
  }
  function kd(l, e, t, a) {
    return (Ut(), (e.flags |= 256), Vl(l, e, t, a), e.child);
  }
  var bc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null,
  };
  function Sc(l) {
    return { baseLanes: l, cachePool: Bf() };
  }
  function xc(l, e, t) {
    return ((l = l !== null ? l.childLanes & ~t : 0), e && (l |= me), l);
  }
  function Jd(l, e, t) {
    var a = e.pendingProps,
      n = !1,
      u = (e.flags & 128) !== 0,
      c;
    if (
      ((c = u) ||
        (c =
          l !== null && l.memoizedState === null ? !1 : (Ol.current & 2) !== 0),
      c && ((n = !0), (e.flags &= -129)),
      (c = (e.flags & 32) !== 0),
      (e.flags &= -33),
      l === null)
    ) {
      if (rl) {
        if (
          (n ? ft(e) : dt(),
          (l = El)
            ? ((l = to(l, je)),
              (l = l !== null && l.data !== "&" ? l : null),
              l !== null &&
                ((e.memoizedState = {
                  dehydrated: l,
                  treeContext: tt !== null ? { id: Ce, overflow: _e } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (t = zf(l)),
                (t.return = e),
                (e.child = t),
                (Zl = e),
                (El = null)))
            : (l = null),
          l === null)
        )
          throw nt(e);
        return (as(l) ? (e.lanes = 32) : (e.lanes = 536870912), null);
      }
      var s = a.children;
      return (
        (a = a.fallback),
        n
          ? (dt(),
            (n = e.mode),
            (s = vu({ mode: "hidden", children: s }, n)),
            (a = Ot(a, n, t, null)),
            (s.return = e),
            (a.return = e),
            (s.sibling = a),
            (e.child = s),
            (a = e.child),
            (a.memoizedState = Sc(t)),
            (a.childLanes = xc(l, c, t)),
            (e.memoizedState = bc),
            an(null, a))
          : (ft(e), jc(e, s))
      );
    }
    var r = l.memoizedState;
    if (r !== null && ((s = r.dehydrated), s !== null)) {
      if (u)
        e.flags & 256
          ? (ft(e), (e.flags &= -257), (e = Nc(l, e, t)))
          : e.memoizedState !== null
            ? (dt(), (e.child = l.child), (e.flags |= 128), (e = null))
            : (dt(),
              (s = a.fallback),
              (n = e.mode),
              (a = vu({ mode: "visible", children: a.children }, n)),
              (s = Ot(s, n, t, null)),
              (s.flags |= 2),
              (a.return = e),
              (s.return = e),
              (a.sibling = s),
              (e.child = a),
              wt(e, l.child, null, t),
              (a = e.child),
              (a.memoizedState = Sc(t)),
              (a.childLanes = xc(l, c, t)),
              (e.memoizedState = bc),
              (e = an(null, a)));
      else if ((ft(e), as(s))) {
        if (((c = s.nextSibling && s.nextSibling.dataset), c)) var b = c.dgst;
        ((c = b),
          (a = Error(d(419))),
          (a.stack = ""),
          (a.digest = c),
          Ka({ value: a, source: null, stack: null }),
          (e = Nc(l, e, t)));
      } else if (
        (Bl || sa(l, e, t, !1), (c = (t & l.childLanes) !== 0), Bl || c)
      ) {
        if (
          ((c = Al),
          c !== null && ((a = Us(c, t)), a !== 0 && a !== r.retryLane))
        )
          throw ((r.retryLane = a), _t(l, a), ne(c, l, a), gc);
        (ts(s) || Au(), (e = Nc(l, e, t)));
      } else
        ts(s)
          ? ((e.flags |= 192), (e.child = l.child), (e = null))
          : ((l = r.treeContext),
            (El = Ae(s.nextSibling)),
            (Zl = e),
            (rl = !0),
            (at = null),
            (je = !1),
            l !== null && Cf(e, l),
            (e = jc(e, a.children)),
            (e.flags |= 4096));
      return e;
    }
    return n
      ? (dt(),
        (s = a.fallback),
        (n = e.mode),
        (r = l.child),
        (b = r.sibling),
        (a = Ye(r, { mode: "hidden", children: a.children })),
        (a.subtreeFlags = r.subtreeFlags & 65011712),
        b !== null ? (s = Ye(b, s)) : ((s = Ot(s, n, t, null)), (s.flags |= 2)),
        (s.return = e),
        (a.return = e),
        (a.sibling = s),
        (e.child = a),
        an(null, a),
        (a = e.child),
        (s = l.child.memoizedState),
        s === null
          ? (s = Sc(t))
          : ((n = s.cachePool),
            n !== null
              ? ((r = Rl._currentValue),
                (n = n.parent !== r ? { parent: r, pool: r } : n))
              : (n = Bf()),
            (s = { baseLanes: s.baseLanes | t, cachePool: n })),
        (a.memoizedState = s),
        (a.childLanes = xc(l, c, t)),
        (e.memoizedState = bc),
        an(l.child, a))
      : (ft(e),
        (t = l.child),
        (l = t.sibling),
        (t = Ye(t, { mode: "visible", children: a.children })),
        (t.return = e),
        (t.sibling = null),
        l !== null &&
          ((c = e.deletions),
          c === null ? ((e.deletions = [l]), (e.flags |= 16)) : c.push(l)),
        (e.child = t),
        (e.memoizedState = null),
        t);
  }
  function jc(l, e) {
    return (
      (e = vu({ mode: "visible", children: e }, l.mode)),
      (e.return = l),
      (l.child = e)
    );
  }
  function vu(l, e) {
    return ((l = de(22, l, null, e)), (l.lanes = 0), l);
  }
  function Nc(l, e, t) {
    return (
      wt(e, l.child, null, t),
      (l = jc(e, e.pendingProps.children)),
      (l.flags |= 2),
      (e.memoizedState = null),
      l
    );
  }
  function $d(l, e, t) {
    l.lanes |= e;
    var a = l.alternate;
    (a !== null && (a.lanes |= e), Yi(l.return, e, t));
  }
  function Ac(l, e, t, a, n, u) {
    var c = l.memoizedState;
    c === null
      ? (l.memoizedState = {
          isBackwards: e,
          rendering: null,
          renderingStartTime: 0,
          last: a,
          tail: t,
          tailMode: n,
          treeForkCount: u,
        })
      : ((c.isBackwards = e),
        (c.rendering = null),
        (c.renderingStartTime = 0),
        (c.last = a),
        (c.tail = t),
        (c.tailMode = n),
        (c.treeForkCount = u));
  }
  function Wd(l, e, t) {
    var a = e.pendingProps,
      n = a.revealOrder,
      u = a.tail;
    a = a.children;
    var c = Ol.current,
      s = (c & 2) !== 0;
    if (
      (s ? ((c = (c & 1) | 2), (e.flags |= 128)) : (c &= 1),
      G(Ol, c),
      Vl(l, e, a, t),
      (a = rl ? Za : 0),
      !s && l !== null && (l.flags & 128) !== 0)
    )
      l: for (l = e.child; l !== null;) {
        if (l.tag === 13) l.memoizedState !== null && $d(l, t, e);
        else if (l.tag === 19) $d(l, t, e);
        else if (l.child !== null) {
          ((l.child.return = l), (l = l.child));
          continue;
        }
        if (l === e) break l;
        for (; l.sibling === null;) {
          if (l.return === null || l.return === e) break l;
          l = l.return;
        }
        ((l.sibling.return = l.return), (l = l.sibling));
      }
    switch (n) {
      case "forwards":
        for (t = e.child, n = null; t !== null;)
          ((l = t.alternate),
            l !== null && au(l) === null && (n = t),
            (t = t.sibling));
        ((t = n),
          t === null
            ? ((n = e.child), (e.child = null))
            : ((n = t.sibling), (t.sibling = null)),
          Ac(e, !1, n, t, u, a));
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (t = null, n = e.child, e.child = null; n !== null;) {
          if (((l = n.alternate), l !== null && au(l) === null)) {
            e.child = n;
            break;
          }
          ((l = n.sibling), (n.sibling = t), (t = n), (n = l));
        }
        Ac(e, !0, t, null, u, a);
        break;
      case "together":
        Ac(e, !1, null, null, void 0, a);
        break;
      default:
        e.memoizedState = null;
    }
    return e.child;
  }
  function Ze(l, e, t) {
    if (
      (l !== null && (e.dependencies = l.dependencies),
      (ht |= e.lanes),
      (t & e.childLanes) === 0)
    )
      if (l !== null) {
        if ((sa(l, e, t, !1), (t & e.childLanes) === 0)) return null;
      } else return null;
    if (l !== null && e.child !== l.child) throw Error(d(153));
    if (e.child !== null) {
      for (
        l = e.child, t = Ye(l, l.pendingProps), e.child = t, t.return = e;
        l.sibling !== null;
      )
        ((l = l.sibling),
          (t = t.sibling = Ye(l, l.pendingProps)),
          (t.return = e));
      t.sibling = null;
    }
    return e.child;
  }
  function Ec(l, e) {
    return (l.lanes & e) !== 0
      ? !0
      : ((l = l.dependencies), !!(l !== null && $n(l)));
  }
  function xm(l, e, t) {
    switch (e.tag) {
      case 3:
        ($l(e, e.stateNode.containerInfo),
          ut(e, Rl, l.memoizedState.cache),
          Ut());
        break;
      case 27:
      case 5:
        Da(e);
        break;
      case 4:
        $l(e, e.stateNode.containerInfo);
        break;
      case 10:
        ut(e, e.type, e.memoizedProps.value);
        break;
      case 31:
        if (e.memoizedState !== null) return ((e.flags |= 128), Wi(e), null);
        break;
      case 13:
        var a = e.memoizedState;
        if (a !== null)
          return a.dehydrated !== null
            ? (ft(e), (e.flags |= 128), null)
            : (t & e.child.childLanes) !== 0
              ? Jd(l, e, t)
              : (ft(e), (l = Ze(l, e, t)), l !== null ? l.sibling : null);
        ft(e);
        break;
      case 19:
        var n = (l.flags & 128) !== 0;
        if (
          ((a = (t & e.childLanes) !== 0),
          a || (sa(l, e, t, !1), (a = (t & e.childLanes) !== 0)),
          n)
        ) {
          if (a) return Wd(l, e, t);
          e.flags |= 128;
        }
        if (
          ((n = e.memoizedState),
          n !== null &&
            ((n.rendering = null), (n.tail = null), (n.lastEffect = null)),
          G(Ol, Ol.current),
          a)
        )
          break;
        return null;
      case 22:
        return ((e.lanes = 0), Xd(l, e, t, e.pendingProps));
      case 24:
        ut(e, Rl, l.memoizedState.cache);
    }
    return Ze(l, e, t);
  }
  function Fd(l, e, t) {
    if (l !== null)
      if (l.memoizedProps !== e.pendingProps) Bl = !0;
      else {
        if (!Ec(l, t) && (e.flags & 128) === 0) return ((Bl = !1), xm(l, e, t));
        Bl = (l.flags & 131072) !== 0;
      }
    else ((Bl = !1), rl && (e.flags & 1048576) !== 0 && Df(e, Za, e.index));
    switch (((e.lanes = 0), e.tag)) {
      case 16:
        l: {
          var a = e.pendingProps;
          if (((l = qt(e.elementType)), (e.type = l), typeof l == "function"))
            Ci(l)
              ? ((a = Gt(l, a)), (e.tag = 1), (e = Vd(null, e, l, a, t)))
              : ((e.tag = 0), (e = pc(null, e, l, a, t)));
          else {
            if (l != null) {
              var n = l.$$typeof;
              if (n === sl) {
                ((e.tag = 11), (e = wd(null, e, l, a, t)));
                break l;
              } else if (n === W) {
                ((e.tag = 14), (e = Ld(null, e, l, a, t)));
                break l;
              }
            }
            throw ((e = Re(l) || l), Error(d(306, e, "")));
          }
        }
        return e;
      case 0:
        return pc(l, e, e.type, e.pendingProps, t);
      case 1:
        return ((a = e.type), (n = Gt(a, e.pendingProps)), Vd(l, e, a, n, t));
      case 3:
        l: {
          if (($l(e, e.stateNode.containerInfo), l === null))
            throw Error(d(387));
          a = e.pendingProps;
          var u = e.memoizedState;
          ((n = u.element), Ki(l, e), Ia(e, a, null, t));
          var c = e.memoizedState;
          if (
            ((a = c.cache),
            ut(e, Rl, a),
            a !== u.cache && wi(e, [Rl], t, !0),
            Fa(),
            (a = c.element),
            u.isDehydrated)
          )
            if (
              ((u = { element: a, isDehydrated: !1, cache: c.cache }),
              (e.updateQueue.baseState = u),
              (e.memoizedState = u),
              e.flags & 256)
            ) {
              e = kd(l, e, a, t);
              break l;
            } else if (a !== n) {
              ((n = be(Error(d(424)), e)), Ka(n), (e = kd(l, e, a, t)));
              break l;
            } else
              for (
                l = e.stateNode.containerInfo,
                  l.nodeType === 9
                    ? (l = l.body)
                    : (l = l.nodeName === "HTML" ? l.ownerDocument.body : l),
                  El = Ae(l.firstChild),
                  Zl = e,
                  rl = !0,
                  at = null,
                  je = !0,
                  t = Xf(e, null, a, t),
                  e.child = t;
                t;
              )
                ((t.flags = (t.flags & -3) | 4096), (t = t.sibling));
          else {
            if ((Ut(), a === n)) {
              e = Ze(l, e, t);
              break l;
            }
            Vl(l, e, a, t);
          }
          e = e.child;
        }
        return e;
      case 26:
        return (
          mu(l, e),
          l === null
            ? (t = so(e.type, null, e.pendingProps, null))
              ? (e.memoizedState = t)
              : rl ||
                ((t = e.type),
                (l = e.pendingProps),
                (a = _u(ul.current).createElement(t)),
                (a[Ql] = e),
                (a[Il] = l),
                kl(a, t, l),
                Ll(a),
                (e.stateNode = a))
            : (e.memoizedState = so(
                e.type,
                l.memoizedProps,
                e.pendingProps,
                l.memoizedState,
              )),
          null
        );
      case 27:
        return (
          Da(e),
          l === null &&
            rl &&
            ((a = e.stateNode = uo(e.type, e.pendingProps, ul.current)),
            (Zl = e),
            (je = !0),
            (n = El),
            pt(e.type) ? ((ns = n), (El = Ae(a.firstChild))) : (El = n)),
          Vl(l, e, e.pendingProps.children, t),
          mu(l, e),
          l === null && (e.flags |= 4194304),
          e.child
        );
      case 5:
        return (
          l === null &&
            rl &&
            ((n = a = El) &&
              ((a = Fm(a, e.type, e.pendingProps, je)),
              a !== null
                ? ((e.stateNode = a),
                  (Zl = e),
                  (El = Ae(a.firstChild)),
                  (je = !1),
                  (n = !0))
                : (n = !1)),
            n || nt(e)),
          Da(e),
          (n = e.type),
          (u = e.pendingProps),
          (c = l !== null ? l.memoizedProps : null),
          (a = u.children),
          Pc(n, u) ? (a = null) : c !== null && Pc(n, c) && (e.flags |= 32),
          e.memoizedState !== null &&
            ((n = Ii(l, e, om, null, null, t)), (bn._currentValue = n)),
          mu(l, e),
          Vl(l, e, a, t),
          e.child
        );
      case 6:
        return (
          l === null &&
            rl &&
            ((l = t = El) &&
              ((t = Im(t, e.pendingProps, je)),
              t !== null
                ? ((e.stateNode = t), (Zl = e), (El = null), (l = !0))
                : (l = !1)),
            l || nt(e)),
          null
        );
      case 13:
        return Jd(l, e, t);
      case 4:
        return (
          $l(e, e.stateNode.containerInfo),
          (a = e.pendingProps),
          l === null ? (e.child = wt(e, null, a, t)) : Vl(l, e, a, t),
          e.child
        );
      case 11:
        return wd(l, e, e.type, e.pendingProps, t);
      case 7:
        return (Vl(l, e, e.pendingProps, t), e.child);
      case 8:
        return (Vl(l, e, e.pendingProps.children, t), e.child);
      case 12:
        return (Vl(l, e, e.pendingProps.children, t), e.child);
      case 10:
        return (
          (a = e.pendingProps),
          ut(e, e.type, a.value),
          Vl(l, e, a.children, t),
          e.child
        );
      case 9:
        return (
          (n = e.type._context),
          (a = e.pendingProps.children),
          Ht(e),
          (n = Kl(n)),
          (a = a(n)),
          (e.flags |= 1),
          Vl(l, e, a, t),
          e.child
        );
      case 14:
        return Ld(l, e, e.type, e.pendingProps, t);
      case 15:
        return Gd(l, e, e.type, e.pendingProps, t);
      case 19:
        return Wd(l, e, t);
      case 31:
        return Sm(l, e, t);
      case 22:
        return Xd(l, e, t, e.pendingProps);
      case 24:
        return (
          Ht(e),
          (a = Kl(Rl)),
          l === null
            ? ((n = Xi()),
              n === null &&
                ((n = Al),
                (u = Li()),
                (n.pooledCache = u),
                u.refCount++,
                u !== null && (n.pooledCacheLanes |= t),
                (n = u)),
              (e.memoizedState = { parent: a, cache: n }),
              Zi(e),
              ut(e, Rl, n))
            : ((l.lanes & t) !== 0 && (Ki(l, e), Ia(e, null, null, t), Fa()),
              (n = l.memoizedState),
              (u = e.memoizedState),
              n.parent !== a
                ? ((n = { parent: a, cache: a }),
                  (e.memoizedState = n),
                  e.lanes === 0 &&
                    (e.memoizedState = e.updateQueue.baseState = n),
                  ut(e, Rl, a))
                : ((a = u.cache),
                  ut(e, Rl, a),
                  a !== n.cache && wi(e, [Rl], t, !0))),
          Vl(l, e, e.pendingProps.children, t),
          e.child
        );
      case 29:
        throw e.pendingProps;
    }
    throw Error(d(156, e.tag));
  }
  function Ke(l) {
    l.flags |= 4;
  }
  function Tc(l, e, t, a, n) {
    if (((e = (l.mode & 32) !== 0) && (e = !1), e)) {
      if (((l.flags |= 16777216), (n & 335544128) === n))
        if (l.stateNode.complete) l.flags |= 8192;
        else if (Ar()) l.flags |= 8192;
        else throw ((Yt = Pn), Qi);
    } else l.flags &= -16777217;
  }
  function Id(l, e) {
    if (e.type !== "stylesheet" || (e.state.loading & 4) !== 0)
      l.flags &= -16777217;
    else if (((l.flags |= 16777216), !mo(e)))
      if (Ar()) l.flags |= 8192;
      else throw ((Yt = Pn), Qi);
  }
  function yu(l, e) {
    (e !== null && (l.flags |= 4),
      l.flags & 16384 &&
        ((e = l.tag !== 22 ? Cs() : 536870912), (l.lanes |= e), (Sa |= e)));
  }
  function nn(l, e) {
    if (!rl)
      switch (l.tailMode) {
        case "hidden":
          e = l.tail;
          for (var t = null; e !== null;)
            (e.alternate !== null && (t = e), (e = e.sibling));
          t === null ? (l.tail = null) : (t.sibling = null);
          break;
        case "collapsed":
          t = l.tail;
          for (var a = null; t !== null;)
            (t.alternate !== null && (a = t), (t = t.sibling));
          a === null
            ? e || l.tail === null
              ? (l.tail = null)
              : (l.tail.sibling = null)
            : (a.sibling = null);
      }
  }
  function Tl(l) {
    var e = l.alternate !== null && l.alternate.child === l.child,
      t = 0,
      a = 0;
    if (e)
      for (var n = l.child; n !== null;)
        ((t |= n.lanes | n.childLanes),
          (a |= n.subtreeFlags & 65011712),
          (a |= n.flags & 65011712),
          (n.return = l),
          (n = n.sibling));
    else
      for (n = l.child; n !== null;)
        ((t |= n.lanes | n.childLanes),
          (a |= n.subtreeFlags),
          (a |= n.flags),
          (n.return = l),
          (n = n.sibling));
    return ((l.subtreeFlags |= a), (l.childLanes = t), e);
  }
  function jm(l, e, t) {
    var a = e.pendingProps;
    switch ((Ri(e), e.tag)) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return (Tl(e), null);
      case 1:
        return (Tl(e), null);
      case 3:
        return (
          (t = e.stateNode),
          (a = null),
          l !== null && (a = l.memoizedState.cache),
          e.memoizedState.cache !== a && (e.flags |= 2048),
          Ge(Rl),
          _l(),
          t.pendingContext &&
            ((t.context = t.pendingContext), (t.pendingContext = null)),
          (l === null || l.child === null) &&
            (ca(e)
              ? Ke(e)
              : l === null ||
                (l.memoizedState.isDehydrated && (e.flags & 256) === 0) ||
                ((e.flags |= 1024), Bi())),
          Tl(e),
          null
        );
      case 26:
        var n = e.type,
          u = e.memoizedState;
        return (
          l === null
            ? (Ke(e),
              u !== null ? (Tl(e), Id(e, u)) : (Tl(e), Tc(e, n, null, a, t)))
            : u
              ? u !== l.memoizedState
                ? (Ke(e), Tl(e), Id(e, u))
                : (Tl(e), (e.flags &= -16777217))
              : ((l = l.memoizedProps),
                l !== a && Ke(e),
                Tl(e),
                Tc(e, n, l, a, t)),
          null
        );
      case 27:
        if (
          (zn(e),
          (t = ul.current),
          (n = e.type),
          l !== null && e.stateNode != null)
        )
          l.memoizedProps !== a && Ke(e);
        else {
          if (!a) {
            if (e.stateNode === null) throw Error(d(166));
            return (Tl(e), null);
          }
          ((l = Q.current),
            ca(e) ? _f(e) : ((l = uo(n, a, t)), (e.stateNode = l), Ke(e)));
        }
        return (Tl(e), null);
      case 5:
        if ((zn(e), (n = e.type), l !== null && e.stateNode != null))
          l.memoizedProps !== a && Ke(e);
        else {
          if (!a) {
            if (e.stateNode === null) throw Error(d(166));
            return (Tl(e), null);
          }
          if (((u = Q.current), ca(e))) _f(e);
          else {
            var c = _u(ul.current);
            switch (u) {
              case 1:
                u = c.createElementNS("http://www.w3.org/2000/svg", n);
                break;
              case 2:
                u = c.createElementNS("http://www.w3.org/1998/Math/MathML", n);
                break;
              default:
                switch (n) {
                  case "svg":
                    u = c.createElementNS("http://www.w3.org/2000/svg", n);
                    break;
                  case "math":
                    u = c.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      n,
                    );
                    break;
                  case "script":
                    ((u = c.createElement("div")),
                      (u.innerHTML = "<script><\/script>"),
                      (u = u.removeChild(u.firstChild)));
                    break;
                  case "select":
                    ((u =
                      typeof a.is == "string"
                        ? c.createElement("select", { is: a.is })
                        : c.createElement("select")),
                      a.multiple
                        ? (u.multiple = !0)
                        : a.size && (u.size = a.size));
                    break;
                  default:
                    u =
                      typeof a.is == "string"
                        ? c.createElement(n, { is: a.is })
                        : c.createElement(n);
                }
            }
            ((u[Ql] = e), (u[Il] = a));
            l: for (c = e.child; c !== null;) {
              if (c.tag === 5 || c.tag === 6) u.appendChild(c.stateNode);
              else if (c.tag !== 4 && c.tag !== 27 && c.child !== null) {
                ((c.child.return = c), (c = c.child));
                continue;
              }
              if (c === e) break l;
              for (; c.sibling === null;) {
                if (c.return === null || c.return === e) break l;
                c = c.return;
              }
              ((c.sibling.return = c.return), (c = c.sibling));
            }
            e.stateNode = u;
            l: switch ((kl(u, n, a), n)) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break l;
              case "img":
                a = !0;
                break l;
              default:
                a = !1;
            }
            a && Ke(e);
          }
        }
        return (
          Tl(e),
          Tc(e, e.type, l === null ? null : l.memoizedProps, e.pendingProps, t),
          null
        );
      case 6:
        if (l && e.stateNode != null) l.memoizedProps !== a && Ke(e);
        else {
          if (typeof a != "string" && e.stateNode === null) throw Error(d(166));
          if (((l = ul.current), ca(e))) {
            if (
              ((l = e.stateNode),
              (t = e.memoizedProps),
              (a = null),
              (n = Zl),
              n !== null)
            )
              switch (n.tag) {
                case 27:
                case 5:
                  a = n.memoizedProps;
              }
            ((l[Ql] = e),
              (l = !!(
                l.nodeValue === t ||
                (a !== null && a.suppressHydrationWarning === !0) ||
                Jr(l.nodeValue, t)
              )),
              l || nt(e, !0));
          } else
            ((l = _u(l).createTextNode(a)), (l[Ql] = e), (e.stateNode = l));
        }
        return (Tl(e), null);
      case 31:
        if (((t = e.memoizedState), l === null || l.memoizedState !== null)) {
          if (((a = ca(e)), t !== null)) {
            if (l === null) {
              if (!a) throw Error(d(318));
              if (
                ((l = e.memoizedState),
                (l = l !== null ? l.dehydrated : null),
                !l)
              )
                throw Error(d(557));
              l[Ql] = e;
            } else
              (Ut(),
                (e.flags & 128) === 0 && (e.memoizedState = null),
                (e.flags |= 4));
            (Tl(e), (l = !1));
          } else
            ((t = Bi()),
              l !== null &&
                l.memoizedState !== null &&
                (l.memoizedState.hydrationErrors = t),
              (l = !0));
          if (!l) return e.flags & 256 ? (oe(e), e) : (oe(e), null);
          if ((e.flags & 128) !== 0) throw Error(d(558));
        }
        return (Tl(e), null);
      case 13:
        if (
          ((a = e.memoizedState),
          l === null ||
            (l.memoizedState !== null && l.memoizedState.dehydrated !== null))
        ) {
          if (((n = ca(e)), a !== null && a.dehydrated !== null)) {
            if (l === null) {
              if (!n) throw Error(d(318));
              if (
                ((n = e.memoizedState),
                (n = n !== null ? n.dehydrated : null),
                !n)
              )
                throw Error(d(317));
              n[Ql] = e;
            } else
              (Ut(),
                (e.flags & 128) === 0 && (e.memoizedState = null),
                (e.flags |= 4));
            (Tl(e), (n = !1));
          } else
            ((n = Bi()),
              l !== null &&
                l.memoizedState !== null &&
                (l.memoizedState.hydrationErrors = n),
              (n = !0));
          if (!n) return e.flags & 256 ? (oe(e), e) : (oe(e), null);
        }
        return (
          oe(e),
          (e.flags & 128) !== 0
            ? ((e.lanes = t), e)
            : ((t = a !== null),
              (l = l !== null && l.memoizedState !== null),
              t &&
                ((a = e.child),
                (n = null),
                a.alternate !== null &&
                  a.alternate.memoizedState !== null &&
                  a.alternate.memoizedState.cachePool !== null &&
                  (n = a.alternate.memoizedState.cachePool.pool),
                (u = null),
                a.memoizedState !== null &&
                  a.memoizedState.cachePool !== null &&
                  (u = a.memoizedState.cachePool.pool),
                u !== n && (a.flags |= 2048)),
              t !== l && t && (e.child.flags |= 8192),
              yu(e, e.updateQueue),
              Tl(e),
              null)
        );
      case 4:
        return (_l(), l === null && Jc(e.stateNode.containerInfo), Tl(e), null);
      case 10:
        return (Ge(e.type), Tl(e), null);
      case 19:
        if ((O(Ol), (a = e.memoizedState), a === null)) return (Tl(e), null);
        if (((n = (e.flags & 128) !== 0), (u = a.rendering), u === null))
          if (n) nn(a, !1);
          else {
            if (Cl !== 0 || (l !== null && (l.flags & 128) !== 0))
              for (l = e.child; l !== null;) {
                if (((u = au(l)), u !== null)) {
                  for (
                    e.flags |= 128,
                      nn(a, !1),
                      l = u.updateQueue,
                      e.updateQueue = l,
                      yu(e, l),
                      e.subtreeFlags = 0,
                      l = t,
                      t = e.child;
                    t !== null;
                  )
                    (Tf(t, l), (t = t.sibling));
                  return (
                    G(Ol, (Ol.current & 1) | 2),
                    rl && we(e, a.treeForkCount),
                    e.child
                  );
                }
                l = l.sibling;
              }
            a.tail !== null &&
              ie() > xu &&
              ((e.flags |= 128), (n = !0), nn(a, !1), (e.lanes = 4194304));
          }
        else {
          if (!n)
            if (((l = au(u)), l !== null)) {
              if (
                ((e.flags |= 128),
                (n = !0),
                (l = l.updateQueue),
                (e.updateQueue = l),
                yu(e, l),
                nn(a, !0),
                a.tail === null &&
                  a.tailMode === "hidden" &&
                  !u.alternate &&
                  !rl)
              )
                return (Tl(e), null);
            } else
              2 * ie() - a.renderingStartTime > xu &&
                t !== 536870912 &&
                ((e.flags |= 128), (n = !0), nn(a, !1), (e.lanes = 4194304));
          a.isBackwards
            ? ((u.sibling = e.child), (e.child = u))
            : ((l = a.last),
              l !== null ? (l.sibling = u) : (e.child = u),
              (a.last = u));
        }
        return a.tail !== null
          ? ((l = a.tail),
            (a.rendering = l),
            (a.tail = l.sibling),
            (a.renderingStartTime = ie()),
            (l.sibling = null),
            (t = Ol.current),
            G(Ol, n ? (t & 1) | 2 : t & 1),
            rl && we(e, a.treeForkCount),
            l)
          : (Tl(e), null);
      case 22:
      case 23:
        return (
          oe(e),
          $i(),
          (a = e.memoizedState !== null),
          l !== null
            ? (l.memoizedState !== null) !== a && (e.flags |= 8192)
            : a && (e.flags |= 8192),
          a
            ? (t & 536870912) !== 0 &&
              (e.flags & 128) === 0 &&
              (Tl(e), e.subtreeFlags & 6 && (e.flags |= 8192))
            : Tl(e),
          (t = e.updateQueue),
          t !== null && yu(e, t.retryQueue),
          (t = null),
          l !== null &&
            l.memoizedState !== null &&
            l.memoizedState.cachePool !== null &&
            (t = l.memoizedState.cachePool.pool),
          (a = null),
          e.memoizedState !== null &&
            e.memoizedState.cachePool !== null &&
            (a = e.memoizedState.cachePool.pool),
          a !== t && (e.flags |= 2048),
          l !== null && O(Bt),
          null
        );
      case 24:
        return (
          (t = null),
          l !== null && (t = l.memoizedState.cache),
          e.memoizedState.cache !== t && (e.flags |= 2048),
          Ge(Rl),
          Tl(e),
          null
        );
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(d(156, e.tag));
  }
  function Nm(l, e) {
    switch ((Ri(e), e.tag)) {
      case 1:
        return (
          (l = e.flags),
          l & 65536 ? ((e.flags = (l & -65537) | 128), e) : null
        );
      case 3:
        return (
          Ge(Rl),
          _l(),
          (l = e.flags),
          (l & 65536) !== 0 && (l & 128) === 0
            ? ((e.flags = (l & -65537) | 128), e)
            : null
        );
      case 26:
      case 27:
      case 5:
        return (zn(e), null);
      case 31:
        if (e.memoizedState !== null) {
          if ((oe(e), e.alternate === null)) throw Error(d(340));
          Ut();
        }
        return (
          (l = e.flags),
          l & 65536 ? ((e.flags = (l & -65537) | 128), e) : null
        );
      case 13:
        if (
          (oe(e), (l = e.memoizedState), l !== null && l.dehydrated !== null)
        ) {
          if (e.alternate === null) throw Error(d(340));
          Ut();
        }
        return (
          (l = e.flags),
          l & 65536 ? ((e.flags = (l & -65537) | 128), e) : null
        );
      case 19:
        return (O(Ol), null);
      case 4:
        return (_l(), null);
      case 10:
        return (Ge(e.type), null);
      case 22:
      case 23:
        return (
          oe(e),
          $i(),
          l !== null && O(Bt),
          (l = e.flags),
          l & 65536 ? ((e.flags = (l & -65537) | 128), e) : null
        );
      case 24:
        return (Ge(Rl), null);
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Pd(l, e) {
    switch ((Ri(e), e.tag)) {
      case 3:
        (Ge(Rl), _l());
        break;
      case 26:
      case 27:
      case 5:
        zn(e);
        break;
      case 4:
        _l();
        break;
      case 31:
        e.memoizedState !== null && oe(e);
        break;
      case 13:
        oe(e);
        break;
      case 19:
        O(Ol);
        break;
      case 10:
        Ge(e.type);
        break;
      case 22:
      case 23:
        (oe(e), $i(), l !== null && O(Bt));
        break;
      case 24:
        Ge(Rl);
    }
  }
  function un(l, e) {
    try {
      var t = e.updateQueue,
        a = t !== null ? t.lastEffect : null;
      if (a !== null) {
        var n = a.next;
        t = n;
        do {
          if ((t.tag & l) === l) {
            a = void 0;
            var u = t.create,
              c = t.inst;
            ((a = u()), (c.destroy = a));
          }
          t = t.next;
        } while (t !== n);
      }
    } catch (s) {
      pl(e, e.return, s);
    }
  }
  function rt(l, e, t) {
    try {
      var a = e.updateQueue,
        n = a !== null ? a.lastEffect : null;
      if (n !== null) {
        var u = n.next;
        a = u;
        do {
          if ((a.tag & l) === l) {
            var c = a.inst,
              s = c.destroy;
            if (s !== void 0) {
              ((c.destroy = void 0), (n = e));
              var r = t,
                b = s;
              try {
                b();
              } catch (A) {
                pl(n, r, A);
              }
            }
          }
          a = a.next;
        } while (a !== u);
      }
    } catch (A) {
      pl(e, e.return, A);
    }
  }
  function lr(l) {
    var e = l.updateQueue;
    if (e !== null) {
      var t = l.stateNode;
      try {
        Zf(e, t);
      } catch (a) {
        pl(l, l.return, a);
      }
    }
  }
  function er(l, e, t) {
    ((t.props = Gt(l.type, l.memoizedProps)), (t.state = l.memoizedState));
    try {
      t.componentWillUnmount();
    } catch (a) {
      pl(l, e, a);
    }
  }
  function cn(l, e) {
    try {
      var t = l.ref;
      if (t !== null) {
        switch (l.tag) {
          case 26:
          case 27:
          case 5:
            var a = l.stateNode;
            break;
          case 30:
            a = l.stateNode;
            break;
          default:
            a = l.stateNode;
        }
        typeof t == "function" ? (l.refCleanup = t(a)) : (t.current = a);
      }
    } catch (n) {
      pl(l, e, n);
    }
  }
  function Oe(l, e) {
    var t = l.ref,
      a = l.refCleanup;
    if (t !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (n) {
          pl(l, e, n);
        } finally {
          ((l.refCleanup = null),
            (l = l.alternate),
            l != null && (l.refCleanup = null));
        }
      else if (typeof t == "function")
        try {
          t(null);
        } catch (n) {
          pl(l, e, n);
        }
      else t.current = null;
  }
  function tr(l) {
    var e = l.type,
      t = l.memoizedProps,
      a = l.stateNode;
    try {
      l: switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          t.autoFocus && a.focus();
          break l;
        case "img":
          t.src ? (a.src = t.src) : t.srcSet && (a.srcset = t.srcSet);
      }
    } catch (n) {
      pl(l, l.return, n);
    }
  }
  function zc(l, e, t) {
    try {
      var a = l.stateNode;
      (Km(a, l.type, t, e), (a[Il] = e));
    } catch (n) {
      pl(l, l.return, n);
    }
  }
  function ar(l) {
    return (
      l.tag === 5 ||
      l.tag === 3 ||
      l.tag === 26 ||
      (l.tag === 27 && pt(l.type)) ||
      l.tag === 4
    );
  }
  function Mc(l) {
    l: for (;;) {
      for (; l.sibling === null;) {
        if (l.return === null || ar(l.return)) return null;
        l = l.return;
      }
      for (
        l.sibling.return = l.return, l = l.sibling;
        l.tag !== 5 && l.tag !== 6 && l.tag !== 18;
      ) {
        if (
          (l.tag === 27 && pt(l.type)) ||
          l.flags & 2 ||
          l.child === null ||
          l.tag === 4
        )
          continue l;
        ((l.child.return = l), (l = l.child));
      }
      if (!(l.flags & 2)) return l.stateNode;
    }
  }
  function Dc(l, e, t) {
    var a = l.tag;
    if (a === 5 || a === 6)
      ((l = l.stateNode),
        e
          ? (t.nodeType === 9
              ? t.body
              : t.nodeName === "HTML"
                ? t.ownerDocument.body
                : t
            ).insertBefore(l, e)
          : ((e =
              t.nodeType === 9
                ? t.body
                : t.nodeName === "HTML"
                  ? t.ownerDocument.body
                  : t),
            e.appendChild(l),
            (t = t._reactRootContainer),
            t != null || e.onclick !== null || (e.onclick = Be)));
    else if (
      a !== 4 &&
      (a === 27 && pt(l.type) && ((t = l.stateNode), (e = null)),
      (l = l.child),
      l !== null)
    )
      for (Dc(l, e, t), l = l.sibling; l !== null;)
        (Dc(l, e, t), (l = l.sibling));
  }
  function gu(l, e, t) {
    var a = l.tag;
    if (a === 5 || a === 6)
      ((l = l.stateNode), e ? t.insertBefore(l, e) : t.appendChild(l));
    else if (
      a !== 4 &&
      (a === 27 && pt(l.type) && (t = l.stateNode), (l = l.child), l !== null)
    )
      for (gu(l, e, t), l = l.sibling; l !== null;)
        (gu(l, e, t), (l = l.sibling));
  }
  function nr(l) {
    var e = l.stateNode,
      t = l.memoizedProps;
    try {
      for (var a = l.type, n = e.attributes; n.length;)
        e.removeAttributeNode(n[0]);
      (kl(e, a, t), (e[Ql] = l), (e[Il] = t));
    } catch (u) {
      pl(l, l.return, u);
    }
  }
  var Ve = !1,
    ql = !1,
    Cc = !1,
    ur = typeof WeakSet == "function" ? WeakSet : Set,
    Gl = null;
  function Am(l, e) {
    if (((l = l.containerInfo), (Fc = Yu), (l = gf(l)), Ni(l))) {
      if ("selectionStart" in l)
        var t = { start: l.selectionStart, end: l.selectionEnd };
      else
        l: {
          t = ((t = l.ownerDocument) && t.defaultView) || window;
          var a = t.getSelection && t.getSelection();
          if (a && a.rangeCount !== 0) {
            t = a.anchorNode;
            var n = a.anchorOffset,
              u = a.focusNode;
            a = a.focusOffset;
            try {
              (t.nodeType, u.nodeType);
            } catch {
              t = null;
              break l;
            }
            var c = 0,
              s = -1,
              r = -1,
              b = 0,
              A = 0,
              M = l,
              S = null;
            e: for (;;) {
              for (
                var j;
                M !== t || (n !== 0 && M.nodeType !== 3) || (s = c + n),
                  M !== u || (a !== 0 && M.nodeType !== 3) || (r = c + a),
                  M.nodeType === 3 && (c += M.nodeValue.length),
                  (j = M.firstChild) !== null;
              )
                ((S = M), (M = j));
              for (;;) {
                if (M === l) break e;
                if (
                  (S === t && ++b === n && (s = c),
                  S === u && ++A === a && (r = c),
                  (j = M.nextSibling) !== null)
                )
                  break;
                ((M = S), (S = M.parentNode));
              }
              M = j;
            }
            t = s === -1 || r === -1 ? null : { start: s, end: r };
          } else t = null;
        }
      t = t || { start: 0, end: 0 };
    } else t = null;
    for (
      Ic = { focusedElem: l, selectionRange: t }, Yu = !1, Gl = e;
      Gl !== null;
    )
      if (
        ((e = Gl), (l = e.child), (e.subtreeFlags & 1028) !== 0 && l !== null)
      )
        ((l.return = e), (Gl = l));
      else
        for (; Gl !== null;) {
          switch (((e = Gl), (u = e.alternate), (l = e.flags), e.tag)) {
            case 0:
              if (
                (l & 4) !== 0 &&
                ((l = e.updateQueue),
                (l = l !== null ? l.events : null),
                l !== null)
              )
                for (t = 0; t < l.length; t++)
                  ((n = l[t]), (n.ref.impl = n.nextImpl));
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((l & 1024) !== 0 && u !== null) {
                ((l = void 0),
                  (t = e),
                  (n = u.memoizedProps),
                  (u = u.memoizedState),
                  (a = t.stateNode));
                try {
                  var X = Gt(t.type, n);
                  ((l = a.getSnapshotBeforeUpdate(X, u)),
                    (a.__reactInternalSnapshotBeforeUpdate = l));
                } catch (J) {
                  pl(t, t.return, J);
                }
              }
              break;
            case 3:
              if ((l & 1024) !== 0) {
                if (
                  ((l = e.stateNode.containerInfo), (t = l.nodeType), t === 9)
                )
                  es(l);
                else if (t === 1)
                  switch (l.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      es(l);
                      break;
                    default:
                      l.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((l & 1024) !== 0) throw Error(d(163));
          }
          if (((l = e.sibling), l !== null)) {
            ((l.return = e.return), (Gl = l));
            break;
          }
          Gl = e.return;
        }
  }
  function ir(l, e, t) {
    var a = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        (Je(l, t), a & 4 && un(5, t));
        break;
      case 1:
        if ((Je(l, t), a & 4))
          if (((l = t.stateNode), e === null))
            try {
              l.componentDidMount();
            } catch (c) {
              pl(t, t.return, c);
            }
          else {
            var n = Gt(t.type, e.memoizedProps);
            e = e.memoizedState;
            try {
              l.componentDidUpdate(n, e, l.__reactInternalSnapshotBeforeUpdate);
            } catch (c) {
              pl(t, t.return, c);
            }
          }
        (a & 64 && lr(t), a & 512 && cn(t, t.return));
        break;
      case 3:
        if ((Je(l, t), a & 64 && ((l = t.updateQueue), l !== null))) {
          if (((e = null), t.child !== null))
            switch (t.child.tag) {
              case 27:
              case 5:
                e = t.child.stateNode;
                break;
              case 1:
                e = t.child.stateNode;
            }
          try {
            Zf(l, e);
          } catch (c) {
            pl(t, t.return, c);
          }
        }
        break;
      case 27:
        e === null && a & 4 && nr(t);
      case 26:
      case 5:
        (Je(l, t), e === null && a & 4 && tr(t), a & 512 && cn(t, t.return));
        break;
      case 12:
        Je(l, t);
        break;
      case 31:
        (Je(l, t), a & 4 && fr(l, t));
        break;
      case 13:
        (Je(l, t),
          a & 4 && dr(l, t),
          a & 64 &&
            ((l = t.memoizedState),
            l !== null &&
              ((l = l.dehydrated),
              l !== null && ((t = Um.bind(null, t)), Pm(l, t)))));
        break;
      case 22:
        if (((a = t.memoizedState !== null || Ve), !a)) {
          ((e = (e !== null && e.memoizedState !== null) || ql), (n = Ve));
          var u = ql;
          ((Ve = a),
            (ql = e) && !u ? $e(l, t, (t.subtreeFlags & 8772) !== 0) : Je(l, t),
            (Ve = n),
            (ql = u));
        }
        break;
      case 30:
        break;
      default:
        Je(l, t);
    }
  }
  function cr(l) {
    var e = l.alternate;
    (e !== null && ((l.alternate = null), cr(e)),
      (l.child = null),
      (l.deletions = null),
      (l.sibling = null),
      l.tag === 5 && ((e = l.stateNode), e !== null && ii(e)),
      (l.stateNode = null),
      (l.return = null),
      (l.dependencies = null),
      (l.memoizedProps = null),
      (l.memoizedState = null),
      (l.pendingProps = null),
      (l.stateNode = null),
      (l.updateQueue = null));
  }
  var zl = null,
    le = !1;
  function ke(l, e, t) {
    for (t = t.child; t !== null;) (sr(l, e, t), (t = t.sibling));
  }
  function sr(l, e, t) {
    if (ce && typeof ce.onCommitFiberUnmount == "function")
      try {
        ce.onCommitFiberUnmount(Ca, t);
      } catch {}
    switch (t.tag) {
      case 26:
        (ql || Oe(t, e),
          ke(l, e, t),
          t.memoizedState
            ? t.memoizedState.count--
            : t.stateNode && ((t = t.stateNode), t.parentNode.removeChild(t)));
        break;
      case 27:
        ql || Oe(t, e);
        var a = zl,
          n = le;
        (pt(t.type) && ((zl = t.stateNode), (le = !1)),
          ke(l, e, t),
          yn(t.stateNode),
          (zl = a),
          (le = n));
        break;
      case 5:
        ql || Oe(t, e);
      case 6:
        if (
          ((a = zl),
          (n = le),
          (zl = null),
          ke(l, e, t),
          (zl = a),
          (le = n),
          zl !== null)
        )
          if (le)
            try {
              (zl.nodeType === 9
                ? zl.body
                : zl.nodeName === "HTML"
                  ? zl.ownerDocument.body
                  : zl
              ).removeChild(t.stateNode);
            } catch (u) {
              pl(t, e, u);
            }
          else
            try {
              zl.removeChild(t.stateNode);
            } catch (u) {
              pl(t, e, u);
            }
        break;
      case 18:
        zl !== null &&
          (le
            ? ((l = zl),
              lo(
                l.nodeType === 9
                  ? l.body
                  : l.nodeName === "HTML"
                    ? l.ownerDocument.body
                    : l,
                t.stateNode,
              ),
              Ma(l))
            : lo(zl, t.stateNode));
        break;
      case 4:
        ((a = zl),
          (n = le),
          (zl = t.stateNode.containerInfo),
          (le = !0),
          ke(l, e, t),
          (zl = a),
          (le = n));
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        (rt(2, t, e), ql || rt(4, t, e), ke(l, e, t));
        break;
      case 1:
        (ql ||
          (Oe(t, e),
          (a = t.stateNode),
          typeof a.componentWillUnmount == "function" && er(t, e, a)),
          ke(l, e, t));
        break;
      case 21:
        ke(l, e, t);
        break;
      case 22:
        ((ql = (a = ql) || t.memoizedState !== null), ke(l, e, t), (ql = a));
        break;
      default:
        ke(l, e, t);
    }
  }
  function fr(l, e) {
    if (
      e.memoizedState === null &&
      ((l = e.alternate), l !== null && ((l = l.memoizedState), l !== null))
    ) {
      l = l.dehydrated;
      try {
        Ma(l);
      } catch (t) {
        pl(e, e.return, t);
      }
    }
  }
  function dr(l, e) {
    if (
      e.memoizedState === null &&
      ((l = e.alternate),
      l !== null &&
        ((l = l.memoizedState), l !== null && ((l = l.dehydrated), l !== null)))
    )
      try {
        Ma(l);
      } catch (t) {
        pl(e, e.return, t);
      }
  }
  function Em(l) {
    switch (l.tag) {
      case 31:
      case 13:
      case 19:
        var e = l.stateNode;
        return (e === null && (e = l.stateNode = new ur()), e);
      case 22:
        return (
          (l = l.stateNode),
          (e = l._retryCache),
          e === null && (e = l._retryCache = new ur()),
          e
        );
      default:
        throw Error(d(435, l.tag));
    }
  }
  function pu(l, e) {
    var t = Em(l);
    e.forEach(function (a) {
      if (!t.has(a)) {
        t.add(a);
        var n = Rm.bind(null, l, a);
        a.then(n, n);
      }
    });
  }
  function ee(l, e) {
    var t = e.deletions;
    if (t !== null)
      for (var a = 0; a < t.length; a++) {
        var n = t[a],
          u = l,
          c = e,
          s = c;
        l: for (; s !== null;) {
          switch (s.tag) {
            case 27:
              if (pt(s.type)) {
                ((zl = s.stateNode), (le = !1));
                break l;
              }
              break;
            case 5:
              ((zl = s.stateNode), (le = !1));
              break l;
            case 3:
            case 4:
              ((zl = s.stateNode.containerInfo), (le = !0));
              break l;
          }
          s = s.return;
        }
        if (zl === null) throw Error(d(160));
        (sr(u, c, n),
          (zl = null),
          (le = !1),
          (u = n.alternate),
          u !== null && (u.return = null),
          (n.return = null));
      }
    if (e.subtreeFlags & 13886)
      for (e = e.child; e !== null;) (rr(e, l), (e = e.sibling));
  }
  var Me = null;
  function rr(l, e) {
    var t = l.alternate,
      a = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        (ee(e, l),
          te(l),
          a & 4 && (rt(3, l, l.return), un(3, l), rt(5, l, l.return)));
        break;
      case 1:
        (ee(e, l),
          te(l),
          a & 512 && (ql || t === null || Oe(t, t.return)),
          a & 64 &&
            Ve &&
            ((l = l.updateQueue),
            l !== null &&
              ((a = l.callbacks),
              a !== null &&
                ((t = l.shared.hiddenCallbacks),
                (l.shared.hiddenCallbacks = t === null ? a : t.concat(a))))));
        break;
      case 26:
        var n = Me;
        if (
          (ee(e, l),
          te(l),
          a & 512 && (ql || t === null || Oe(t, t.return)),
          a & 4)
        ) {
          var u = t !== null ? t.memoizedState : null;
          if (((a = l.memoizedState), t === null))
            if (a === null)
              if (l.stateNode === null) {
                l: {
                  ((a = l.type),
                    (t = l.memoizedProps),
                    (n = n.ownerDocument || n));
                  e: switch (a) {
                    case "title":
                      ((u = n.getElementsByTagName("title")[0]),
                        (!u ||
                          u[Ua] ||
                          u[Ql] ||
                          u.namespaceURI === "http://www.w3.org/2000/svg" ||
                          u.hasAttribute("itemprop")) &&
                          ((u = n.createElement(a)),
                          n.head.insertBefore(
                            u,
                            n.querySelector("head > title"),
                          )),
                        kl(u, a, t),
                        (u[Ql] = l),
                        Ll(u),
                        (a = u));
                      break l;
                    case "link":
                      var c = oo("link", "href", n).get(a + (t.href || ""));
                      if (c) {
                        for (var s = 0; s < c.length; s++)
                          if (
                            ((u = c[s]),
                            u.getAttribute("href") ===
                              (t.href == null || t.href === ""
                                ? null
                                : t.href) &&
                              u.getAttribute("rel") ===
                                (t.rel == null ? null : t.rel) &&
                              u.getAttribute("title") ===
                                (t.title == null ? null : t.title) &&
                              u.getAttribute("crossorigin") ===
                                (t.crossOrigin == null ? null : t.crossOrigin))
                          ) {
                            c.splice(s, 1);
                            break e;
                          }
                      }
                      ((u = n.createElement(a)),
                        kl(u, a, t),
                        n.head.appendChild(u));
                      break;
                    case "meta":
                      if (
                        (c = oo("meta", "content", n).get(
                          a + (t.content || ""),
                        ))
                      ) {
                        for (s = 0; s < c.length; s++)
                          if (
                            ((u = c[s]),
                            u.getAttribute("content") ===
                              (t.content == null ? null : "" + t.content) &&
                              u.getAttribute("name") ===
                                (t.name == null ? null : t.name) &&
                              u.getAttribute("property") ===
                                (t.property == null ? null : t.property) &&
                              u.getAttribute("http-equiv") ===
                                (t.httpEquiv == null ? null : t.httpEquiv) &&
                              u.getAttribute("charset") ===
                                (t.charSet == null ? null : t.charSet))
                          ) {
                            c.splice(s, 1);
                            break e;
                          }
                      }
                      ((u = n.createElement(a)),
                        kl(u, a, t),
                        n.head.appendChild(u));
                      break;
                    default:
                      throw Error(d(468, a));
                  }
                  ((u[Ql] = l), Ll(u), (a = u));
                }
                l.stateNode = a;
              } else ho(n, l.type, l.stateNode);
            else l.stateNode = ro(n, a, l.memoizedProps);
          else
            u !== a
              ? (u === null
                  ? t.stateNode !== null &&
                    ((t = t.stateNode), t.parentNode.removeChild(t))
                  : u.count--,
                a === null
                  ? ho(n, l.type, l.stateNode)
                  : ro(n, a, l.memoizedProps))
              : a === null &&
                l.stateNode !== null &&
                zc(l, l.memoizedProps, t.memoizedProps);
        }
        break;
      case 27:
        (ee(e, l),
          te(l),
          a & 512 && (ql || t === null || Oe(t, t.return)),
          t !== null && a & 4 && zc(l, l.memoizedProps, t.memoizedProps));
        break;
      case 5:
        if (
          (ee(e, l),
          te(l),
          a & 512 && (ql || t === null || Oe(t, t.return)),
          l.flags & 32)
        ) {
          n = l.stateNode;
          try {
            Ft(n, "");
          } catch (X) {
            pl(l, l.return, X);
          }
        }
        (a & 4 &&
          l.stateNode != null &&
          ((n = l.memoizedProps), zc(l, n, t !== null ? t.memoizedProps : n)),
          a & 1024 && (Cc = !0));
        break;
      case 6:
        if ((ee(e, l), te(l), a & 4)) {
          if (l.stateNode === null) throw Error(d(162));
          ((a = l.memoizedProps), (t = l.stateNode));
          try {
            t.nodeValue = a;
          } catch (X) {
            pl(l, l.return, X);
          }
        }
        break;
      case 3:
        if (
          ((Ru = null),
          (n = Me),
          (Me = Ou(e.containerInfo)),
          ee(e, l),
          (Me = n),
          te(l),
          a & 4 && t !== null && t.memoizedState.isDehydrated)
        )
          try {
            Ma(e.containerInfo);
          } catch (X) {
            pl(l, l.return, X);
          }
        Cc && ((Cc = !1), or(l));
        break;
      case 4:
        ((a = Me),
          (Me = Ou(l.stateNode.containerInfo)),
          ee(e, l),
          te(l),
          (Me = a));
        break;
      case 12:
        (ee(e, l), te(l));
        break;
      case 31:
        (ee(e, l),
          te(l),
          a & 4 &&
            ((a = l.updateQueue),
            a !== null && ((l.updateQueue = null), pu(l, a))));
        break;
      case 13:
        (ee(e, l),
          te(l),
          l.child.flags & 8192 &&
            (l.memoizedState !== null) !=
              (t !== null && t.memoizedState !== null) &&
            (Su = ie()),
          a & 4 &&
            ((a = l.updateQueue),
            a !== null && ((l.updateQueue = null), pu(l, a))));
        break;
      case 22:
        n = l.memoizedState !== null;
        var r = t !== null && t.memoizedState !== null,
          b = Ve,
          A = ql;
        if (
          ((Ve = b || n),
          (ql = A || r),
          ee(e, l),
          (ql = A),
          (Ve = b),
          te(l),
          a & 8192)
        )
          l: for (
            e = l.stateNode,
              e._visibility = n ? e._visibility & -2 : e._visibility | 1,
              n && (t === null || r || Ve || ql || Xt(l)),
              t = null,
              e = l;
            ;
          ) {
            if (e.tag === 5 || e.tag === 26) {
              if (t === null) {
                r = t = e;
                try {
                  if (((u = r.stateNode), n))
                    ((c = u.style),
                      typeof c.setProperty == "function"
                        ? c.setProperty("display", "none", "important")
                        : (c.display = "none"));
                  else {
                    s = r.stateNode;
                    var M = r.memoizedProps.style,
                      S =
                        M != null && M.hasOwnProperty("display")
                          ? M.display
                          : null;
                    s.style.display =
                      S == null || typeof S == "boolean" ? "" : ("" + S).trim();
                  }
                } catch (X) {
                  pl(r, r.return, X);
                }
              }
            } else if (e.tag === 6) {
              if (t === null) {
                r = e;
                try {
                  r.stateNode.nodeValue = n ? "" : r.memoizedProps;
                } catch (X) {
                  pl(r, r.return, X);
                }
              }
            } else if (e.tag === 18) {
              if (t === null) {
                r = e;
                try {
                  var j = r.stateNode;
                  n ? eo(j, !0) : eo(r.stateNode, !1);
                } catch (X) {
                  pl(r, r.return, X);
                }
              }
            } else if (
              ((e.tag !== 22 && e.tag !== 23) ||
                e.memoizedState === null ||
                e === l) &&
              e.child !== null
            ) {
              ((e.child.return = e), (e = e.child));
              continue;
            }
            if (e === l) break l;
            for (; e.sibling === null;) {
              if (e.return === null || e.return === l) break l;
              (t === e && (t = null), (e = e.return));
            }
            (t === e && (t = null),
              (e.sibling.return = e.return),
              (e = e.sibling));
          }
        a & 4 &&
          ((a = l.updateQueue),
          a !== null &&
            ((t = a.retryQueue),
            t !== null && ((a.retryQueue = null), pu(l, t))));
        break;
      case 19:
        (ee(e, l),
          te(l),
          a & 4 &&
            ((a = l.updateQueue),
            a !== null && ((l.updateQueue = null), pu(l, a))));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        (ee(e, l), te(l));
    }
  }
  function te(l) {
    var e = l.flags;
    if (e & 2) {
      try {
        for (var t, a = l.return; a !== null;) {
          if (ar(a)) {
            t = a;
            break;
          }
          a = a.return;
        }
        if (t == null) throw Error(d(160));
        switch (t.tag) {
          case 27:
            var n = t.stateNode,
              u = Mc(l);
            gu(l, u, n);
            break;
          case 5:
            var c = t.stateNode;
            t.flags & 32 && (Ft(c, ""), (t.flags &= -33));
            var s = Mc(l);
            gu(l, s, c);
            break;
          case 3:
          case 4:
            var r = t.stateNode.containerInfo,
              b = Mc(l);
            Dc(l, b, r);
            break;
          default:
            throw Error(d(161));
        }
      } catch (A) {
        pl(l, l.return, A);
      }
      l.flags &= -3;
    }
    e & 4096 && (l.flags &= -4097);
  }
  function or(l) {
    if (l.subtreeFlags & 1024)
      for (l = l.child; l !== null;) {
        var e = l;
        (or(e),
          e.tag === 5 && e.flags & 1024 && e.stateNode.reset(),
          (l = l.sibling));
      }
  }
  function Je(l, e) {
    if (e.subtreeFlags & 8772)
      for (e = e.child; e !== null;) (ir(l, e.alternate, e), (e = e.sibling));
  }
  function Xt(l) {
    for (l = l.child; l !== null;) {
      var e = l;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (rt(4, e, e.return), Xt(e));
          break;
        case 1:
          Oe(e, e.return);
          var t = e.stateNode;
          (typeof t.componentWillUnmount == "function" && er(e, e.return, t),
            Xt(e));
          break;
        case 27:
          yn(e.stateNode);
        case 26:
        case 5:
          (Oe(e, e.return), Xt(e));
          break;
        case 22:
          e.memoizedState === null && Xt(e);
          break;
        case 30:
          Xt(e);
          break;
        default:
          Xt(e);
      }
      l = l.sibling;
    }
  }
  function $e(l, e, t) {
    for (t = t && (e.subtreeFlags & 8772) !== 0, e = e.child; e !== null;) {
      var a = e.alternate,
        n = l,
        u = e,
        c = u.flags;
      switch (u.tag) {
        case 0:
        case 11:
        case 15:
          ($e(n, u, t), un(4, u));
          break;
        case 1:
          if (
            ($e(n, u, t),
            (a = u),
            (n = a.stateNode),
            typeof n.componentDidMount == "function")
          )
            try {
              n.componentDidMount();
            } catch (b) {
              pl(a, a.return, b);
            }
          if (((a = u), (n = a.updateQueue), n !== null)) {
            var s = a.stateNode;
            try {
              var r = n.shared.hiddenCallbacks;
              if (r !== null)
                for (n.shared.hiddenCallbacks = null, n = 0; n < r.length; n++)
                  Qf(r[n], s);
            } catch (b) {
              pl(a, a.return, b);
            }
          }
          (t && c & 64 && lr(u), cn(u, u.return));
          break;
        case 27:
          nr(u);
        case 26:
        case 5:
          ($e(n, u, t), t && a === null && c & 4 && tr(u), cn(u, u.return));
          break;
        case 12:
          $e(n, u, t);
          break;
        case 31:
          ($e(n, u, t), t && c & 4 && fr(n, u));
          break;
        case 13:
          ($e(n, u, t), t && c & 4 && dr(n, u));
          break;
        case 22:
          (u.memoizedState === null && $e(n, u, t), cn(u, u.return));
          break;
        case 30:
          break;
        default:
          $e(n, u, t);
      }
      e = e.sibling;
    }
  }
  function _c(l, e) {
    var t = null;
    (l !== null &&
      l.memoizedState !== null &&
      l.memoizedState.cachePool !== null &&
      (t = l.memoizedState.cachePool.pool),
      (l = null),
      e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (l = e.memoizedState.cachePool.pool),
      l !== t && (l != null && l.refCount++, t != null && Va(t)));
  }
  function Oc(l, e) {
    ((l = null),
      e.alternate !== null && (l = e.alternate.memoizedState.cache),
      (e = e.memoizedState.cache),
      e !== l && (e.refCount++, l != null && Va(l)));
  }
  function De(l, e, t, a) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null;) (hr(l, e, t, a), (e = e.sibling));
  }
  function hr(l, e, t, a) {
    var n = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        (De(l, e, t, a), n & 2048 && un(9, e));
        break;
      case 1:
        De(l, e, t, a);
        break;
      case 3:
        (De(l, e, t, a),
          n & 2048 &&
            ((l = null),
            e.alternate !== null && (l = e.alternate.memoizedState.cache),
            (e = e.memoizedState.cache),
            e !== l && (e.refCount++, l != null && Va(l))));
        break;
      case 12:
        if (n & 2048) {
          (De(l, e, t, a), (l = e.stateNode));
          try {
            var u = e.memoizedProps,
              c = u.id,
              s = u.onPostCommit;
            typeof s == "function" &&
              s(
                c,
                e.alternate === null ? "mount" : "update",
                l.passiveEffectDuration,
                -0,
              );
          } catch (r) {
            pl(e, e.return, r);
          }
        } else De(l, e, t, a);
        break;
      case 31:
        De(l, e, t, a);
        break;
      case 13:
        De(l, e, t, a);
        break;
      case 23:
        break;
      case 22:
        ((u = e.stateNode),
          (c = e.alternate),
          e.memoizedState !== null
            ? u._visibility & 2
              ? De(l, e, t, a)
              : sn(l, e)
            : u._visibility & 2
              ? De(l, e, t, a)
              : ((u._visibility |= 2),
                ga(l, e, t, a, (e.subtreeFlags & 10256) !== 0 || !1)),
          n & 2048 && _c(c, e));
        break;
      case 24:
        (De(l, e, t, a), n & 2048 && Oc(e.alternate, e));
        break;
      default:
        De(l, e, t, a);
    }
  }
  function ga(l, e, t, a, n) {
    for (
      n = n && ((e.subtreeFlags & 10256) !== 0 || !1), e = e.child;
      e !== null;
    ) {
      var u = l,
        c = e,
        s = t,
        r = a,
        b = c.flags;
      switch (c.tag) {
        case 0:
        case 11:
        case 15:
          (ga(u, c, s, r, n), un(8, c));
          break;
        case 23:
          break;
        case 22:
          var A = c.stateNode;
          (c.memoizedState !== null
            ? A._visibility & 2
              ? ga(u, c, s, r, n)
              : sn(u, c)
            : ((A._visibility |= 2), ga(u, c, s, r, n)),
            n && b & 2048 && _c(c.alternate, c));
          break;
        case 24:
          (ga(u, c, s, r, n), n && b & 2048 && Oc(c.alternate, c));
          break;
        default:
          ga(u, c, s, r, n);
      }
      e = e.sibling;
    }
  }
  function sn(l, e) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null;) {
        var t = l,
          a = e,
          n = a.flags;
        switch (a.tag) {
          case 22:
            (sn(t, a), n & 2048 && _c(a.alternate, a));
            break;
          case 24:
            (sn(t, a), n & 2048 && Oc(a.alternate, a));
            break;
          default:
            sn(t, a);
        }
        e = e.sibling;
      }
  }
  var fn = 8192;
  function pa(l, e, t) {
    if (l.subtreeFlags & fn)
      for (l = l.child; l !== null;) (mr(l, e, t), (l = l.sibling));
  }
  function mr(l, e, t) {
    switch (l.tag) {
      case 26:
        (pa(l, e, t),
          l.flags & fn &&
            l.memoizedState !== null &&
            rv(t, Me, l.memoizedState, l.memoizedProps));
        break;
      case 5:
        pa(l, e, t);
        break;
      case 3:
      case 4:
        var a = Me;
        ((Me = Ou(l.stateNode.containerInfo)), pa(l, e, t), (Me = a));
        break;
      case 22:
        l.memoizedState === null &&
          ((a = l.alternate),
          a !== null && a.memoizedState !== null
            ? ((a = fn), (fn = 16777216), pa(l, e, t), (fn = a))
            : pa(l, e, t));
        break;
      default:
        pa(l, e, t);
    }
  }
  function vr(l) {
    var e = l.alternate;
    if (e !== null && ((l = e.child), l !== null)) {
      e.child = null;
      do ((e = l.sibling), (l.sibling = null), (l = e));
      while (l !== null);
    }
  }
  function dn(l) {
    var e = l.deletions;
    if ((l.flags & 16) !== 0) {
      if (e !== null)
        for (var t = 0; t < e.length; t++) {
          var a = e[t];
          ((Gl = a), gr(a, l));
        }
      vr(l);
    }
    if (l.subtreeFlags & 10256)
      for (l = l.child; l !== null;) (yr(l), (l = l.sibling));
  }
  function yr(l) {
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        (dn(l), l.flags & 2048 && rt(9, l, l.return));
        break;
      case 3:
        dn(l);
        break;
      case 12:
        dn(l);
        break;
      case 22:
        var e = l.stateNode;
        l.memoizedState !== null &&
        e._visibility & 2 &&
        (l.return === null || l.return.tag !== 13)
          ? ((e._visibility &= -3), bu(l))
          : dn(l);
        break;
      default:
        dn(l);
    }
  }
  function bu(l) {
    var e = l.deletions;
    if ((l.flags & 16) !== 0) {
      if (e !== null)
        for (var t = 0; t < e.length; t++) {
          var a = e[t];
          ((Gl = a), gr(a, l));
        }
      vr(l);
    }
    for (l = l.child; l !== null;) {
      switch (((e = l), e.tag)) {
        case 0:
        case 11:
        case 15:
          (rt(8, e, e.return), bu(e));
          break;
        case 22:
          ((t = e.stateNode),
            t._visibility & 2 && ((t._visibility &= -3), bu(e)));
          break;
        default:
          bu(e);
      }
      l = l.sibling;
    }
  }
  function gr(l, e) {
    for (; Gl !== null;) {
      var t = Gl;
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          rt(8, t, e);
          break;
        case 23:
        case 22:
          if (t.memoizedState !== null && t.memoizedState.cachePool !== null) {
            var a = t.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          Va(t.memoizedState.cache);
      }
      if (((a = t.child), a !== null)) ((a.return = t), (Gl = a));
      else
        l: for (t = l; Gl !== null;) {
          a = Gl;
          var n = a.sibling,
            u = a.return;
          if ((cr(a), a === t)) {
            Gl = null;
            break l;
          }
          if (n !== null) {
            ((n.return = u), (Gl = n));
            break l;
          }
          Gl = u;
        }
    }
  }
  var Tm = {
      getCacheForType: function (l) {
        var e = Kl(Rl),
          t = e.data.get(l);
        return (t === void 0 && ((t = l()), e.data.set(l, t)), t);
      },
      cacheSignal: function () {
        return Kl(Rl).controller.signal;
      },
    },
    zm = typeof WeakMap == "function" ? WeakMap : Map,
    vl = 0,
    Al = null,
    il = null,
    fl = 0,
    gl = 0,
    he = null,
    ot = !1,
    ba = !1,
    Uc = !1,
    We = 0,
    Cl = 0,
    ht = 0,
    Qt = 0,
    Rc = 0,
    me = 0,
    Sa = 0,
    rn = null,
    ae = null,
    Hc = !1,
    Su = 0,
    pr = 0,
    xu = 1 / 0,
    ju = null,
    mt = null,
    Yl = 0,
    vt = null,
    xa = null,
    Fe = 0,
    Bc = 0,
    qc = null,
    br = null,
    on = 0,
    Yc = null;
  function ve() {
    return (vl & 2) !== 0 && fl !== 0 ? fl & -fl : T.T !== null ? Zc() : Rs();
  }
  function Sr() {
    if (me === 0)
      if ((fl & 536870912) === 0 || rl) {
        var l = Cn;
        ((Cn <<= 1), (Cn & 3932160) === 0 && (Cn = 262144), (me = l));
      } else me = 536870912;
    return ((l = re.current), l !== null && (l.flags |= 32), me);
  }
  function ne(l, e, t) {
    (((l === Al && (gl === 2 || gl === 9)) || l.cancelPendingCommit !== null) &&
      (ja(l, 0), yt(l, fl, me, !1)),
      Oa(l, t),
      ((vl & 2) === 0 || l !== Al) &&
        (l === Al &&
          ((vl & 2) === 0 && (Qt |= t), Cl === 4 && yt(l, fl, me, !1)),
        Ue(l)));
  }
  function xr(l, e, t) {
    if ((vl & 6) !== 0) throw Error(d(327));
    var a = (!t && (e & 127) === 0 && (e & l.expiredLanes) === 0) || _a(l, e),
      n = a ? Cm(l, e) : Lc(l, e, !0),
      u = a;
    do {
      if (n === 0) {
        ba && !a && yt(l, e, 0, !1);
        break;
      } else {
        if (((t = l.current.alternate), u && !Mm(t))) {
          ((n = Lc(l, e, !1)), (u = !1));
          continue;
        }
        if (n === 2) {
          if (((u = e), l.errorRecoveryDisabledLanes & u)) var c = 0;
          else
            ((c = l.pendingLanes & -536870913),
              (c = c !== 0 ? c : c & 536870912 ? 536870912 : 0));
          if (c !== 0) {
            e = c;
            l: {
              var s = l;
              n = rn;
              var r = s.current.memoizedState.isDehydrated;
              if ((r && (ja(s, c).flags |= 256), (c = Lc(s, c, !1)), c !== 2)) {
                if (Uc && !r) {
                  ((s.errorRecoveryDisabledLanes |= u), (Qt |= u), (n = 4));
                  break l;
                }
                ((u = ae),
                  (ae = n),
                  u !== null &&
                    (ae === null ? (ae = u) : ae.push.apply(ae, u)));
              }
              n = c;
            }
            if (((u = !1), n !== 2)) continue;
          }
        }
        if (n === 1) {
          (ja(l, 0), yt(l, e, 0, !0));
          break;
        }
        l: {
          switch (((a = l), (u = n), u)) {
            case 0:
            case 1:
              throw Error(d(345));
            case 4:
              if ((e & 4194048) !== e) break;
            case 6:
              yt(a, e, me, !ot);
              break l;
            case 2:
              ae = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(d(329));
          }
          if ((e & 62914560) === e && ((n = Su + 300 - ie()), 10 < n)) {
            if ((yt(a, e, me, !ot), On(a, 0, !0) !== 0)) break l;
            ((Fe = e),
              (a.timeoutHandle = Ir(
                jr.bind(
                  null,
                  a,
                  t,
                  ae,
                  ju,
                  Hc,
                  e,
                  me,
                  Qt,
                  Sa,
                  ot,
                  u,
                  "Throttled",
                  -0,
                  0,
                ),
                n,
              )));
            break l;
          }
          jr(a, t, ae, ju, Hc, e, me, Qt, Sa, ot, u, null, -0, 0);
        }
      }
      break;
    } while (!0);
    Ue(l);
  }
  function jr(l, e, t, a, n, u, c, s, r, b, A, M, S, j) {
    if (
      ((l.timeoutHandle = -1),
      (M = e.subtreeFlags),
      M & 8192 || (M & 16785408) === 16785408)
    ) {
      ((M = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Be,
      }),
        mr(e, u, M));
      var X =
        (u & 62914560) === u ? Su - ie() : (u & 4194048) === u ? pr - ie() : 0;
      if (((X = ov(M, X)), X !== null)) {
        ((Fe = u),
          (l.cancelPendingCommit = X(
            Cr.bind(null, l, e, u, t, a, n, c, s, r, A, M, null, S, j),
          )),
          yt(l, u, c, !b));
        return;
      }
    }
    Cr(l, e, u, t, a, n, c, s, r);
  }
  function Mm(l) {
    for (var e = l; ;) {
      var t = e.tag;
      if (
        (t === 0 || t === 11 || t === 15) &&
        e.flags & 16384 &&
        ((t = e.updateQueue), t !== null && ((t = t.stores), t !== null))
      )
        for (var a = 0; a < t.length; a++) {
          var n = t[a],
            u = n.getSnapshot;
          n = n.value;
          try {
            if (!fe(u(), n)) return !1;
          } catch {
            return !1;
          }
        }
      if (((t = e.child), e.subtreeFlags & 16384 && t !== null))
        ((t.return = e), (e = t));
      else {
        if (e === l) break;
        for (; e.sibling === null;) {
          if (e.return === null || e.return === l) return !0;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    }
    return !0;
  }
  function yt(l, e, t, a) {
    ((e &= ~Rc),
      (e &= ~Qt),
      (l.suspendedLanes |= e),
      (l.pingedLanes &= ~e),
      a && (l.warmLanes |= e),
      (a = l.expirationTimes));
    for (var n = e; 0 < n;) {
      var u = 31 - se(n),
        c = 1 << u;
      ((a[u] = -1), (n &= ~c));
    }
    t !== 0 && _s(l, t, e);
  }
  function Nu() {
    return (vl & 6) === 0 ? (hn(0), !1) : !0;
  }
  function wc() {
    if (il !== null) {
      if (gl === 0) var l = il.return;
      else ((l = il), (Le = Rt = null), ec(l), (oa = null), (Ja = 0), (l = il));
      for (; l !== null;) (Pd(l.alternate, l), (l = l.return));
      il = null;
    }
  }
  function ja(l, e) {
    var t = l.timeoutHandle;
    (t !== -1 && ((l.timeoutHandle = -1), Jm(t)),
      (t = l.cancelPendingCommit),
      t !== null && ((l.cancelPendingCommit = null), t()),
      (Fe = 0),
      wc(),
      (Al = l),
      (il = t = Ye(l.current, null)),
      (fl = e),
      (gl = 0),
      (he = null),
      (ot = !1),
      (ba = _a(l, e)),
      (Uc = !1),
      (Sa = me = Rc = Qt = ht = Cl = 0),
      (ae = rn = null),
      (Hc = !1),
      (e & 8) !== 0 && (e |= e & 32));
    var a = l.entangledLanes;
    if (a !== 0)
      for (l = l.entanglements, a &= e; 0 < a;) {
        var n = 31 - se(a),
          u = 1 << n;
        ((e |= l[n]), (a &= ~u));
      }
    return ((We = e), Zn(), t);
  }
  function Nr(l, e) {
    ((el = null),
      (T.H = tn),
      e === ra || e === In
        ? ((e = wf()), (gl = 3))
        : e === Qi
          ? ((e = wf()), (gl = 4))
          : (gl =
              e === gc
                ? 8
                : e !== null &&
                    typeof e == "object" &&
                    typeof e.then == "function"
                  ? 6
                  : 1),
      (he = e),
      il === null && ((Cl = 1), ou(l, be(e, l.current))));
  }
  function Ar() {
    var l = re.current;
    return l === null
      ? !0
      : (fl & 4194048) === fl
        ? Ne === null
        : (fl & 62914560) === fl || (fl & 536870912) !== 0
          ? l === Ne
          : !1;
  }
  function Er() {
    var l = T.H;
    return ((T.H = tn), l === null ? tn : l);
  }
  function Tr() {
    var l = T.A;
    return ((T.A = Tm), l);
  }
  function Au() {
    ((Cl = 4),
      ot || ((fl & 4194048) !== fl && re.current !== null) || (ba = !0),
      ((ht & 134217727) === 0 && (Qt & 134217727) === 0) ||
        Al === null ||
        yt(Al, fl, me, !1));
  }
  function Lc(l, e, t) {
    var a = vl;
    vl |= 2;
    var n = Er(),
      u = Tr();
    ((Al !== l || fl !== e) && ((ju = null), ja(l, e)), (e = !1));
    var c = Cl;
    l: do
      try {
        if (gl !== 0 && il !== null) {
          var s = il,
            r = he;
          switch (gl) {
            case 8:
              (wc(), (c = 6));
              break l;
            case 3:
            case 2:
            case 9:
            case 6:
              re.current === null && (e = !0);
              var b = gl;
              if (((gl = 0), (he = null), Na(l, s, r, b), t && ba)) {
                c = 0;
                break l;
              }
              break;
            default:
              ((b = gl), (gl = 0), (he = null), Na(l, s, r, b));
          }
        }
        (Dm(), (c = Cl));
        break;
      } catch (A) {
        Nr(l, A);
      }
    while (!0);
    return (
      e && l.shellSuspendCounter++,
      (Le = Rt = null),
      (vl = a),
      (T.H = n),
      (T.A = u),
      il === null && ((Al = null), (fl = 0), Zn()),
      c
    );
  }
  function Dm() {
    for (; il !== null;) zr(il);
  }
  function Cm(l, e) {
    var t = vl;
    vl |= 2;
    var a = Er(),
      n = Tr();
    Al !== l || fl !== e
      ? ((ju = null), (xu = ie() + 500), ja(l, e))
      : (ba = _a(l, e));
    l: do
      try {
        if (gl !== 0 && il !== null) {
          e = il;
          var u = he;
          e: switch (gl) {
            case 1:
              ((gl = 0), (he = null), Na(l, e, u, 1));
              break;
            case 2:
            case 9:
              if (qf(u)) {
                ((gl = 0), (he = null), Mr(e));
                break;
              }
              ((e = function () {
                ((gl !== 2 && gl !== 9) || Al !== l || (gl = 7), Ue(l));
              }),
                u.then(e, e));
              break l;
            case 3:
              gl = 7;
              break l;
            case 4:
              gl = 5;
              break l;
            case 7:
              qf(u)
                ? ((gl = 0), (he = null), Mr(e))
                : ((gl = 0), (he = null), Na(l, e, u, 7));
              break;
            case 5:
              var c = null;
              switch (il.tag) {
                case 26:
                  c = il.memoizedState;
                case 5:
                case 27:
                  var s = il;
                  if (c ? mo(c) : s.stateNode.complete) {
                    ((gl = 0), (he = null));
                    var r = s.sibling;
                    if (r !== null) il = r;
                    else {
                      var b = s.return;
                      b !== null ? ((il = b), Eu(b)) : (il = null);
                    }
                    break e;
                  }
              }
              ((gl = 0), (he = null), Na(l, e, u, 5));
              break;
            case 6:
              ((gl = 0), (he = null), Na(l, e, u, 6));
              break;
            case 8:
              (wc(), (Cl = 6));
              break l;
            default:
              throw Error(d(462));
          }
        }
        _m();
        break;
      } catch (A) {
        Nr(l, A);
      }
    while (!0);
    return (
      (Le = Rt = null),
      (T.H = a),
      (T.A = n),
      (vl = t),
      il !== null ? 0 : ((Al = null), (fl = 0), Zn(), Cl)
    );
  }
  function _m() {
    for (; il !== null && !lh();) zr(il);
  }
  function zr(l) {
    var e = Fd(l.alternate, l, We);
    ((l.memoizedProps = l.pendingProps), e === null ? Eu(l) : (il = e));
  }
  function Mr(l) {
    var e = l,
      t = e.alternate;
    switch (e.tag) {
      case 15:
      case 0:
        e = Kd(t, e, e.pendingProps, e.type, void 0, fl);
        break;
      case 11:
        e = Kd(t, e, e.pendingProps, e.type.render, e.ref, fl);
        break;
      case 5:
        ec(e);
      default:
        (Pd(t, e), (e = il = Tf(e, We)), (e = Fd(t, e, We)));
    }
    ((l.memoizedProps = l.pendingProps), e === null ? Eu(l) : (il = e));
  }
  function Na(l, e, t, a) {
    ((Le = Rt = null), ec(e), (oa = null), (Ja = 0));
    var n = e.return;
    try {
      if (bm(l, n, e, t, fl)) {
        ((Cl = 1), ou(l, be(t, l.current)), (il = null));
        return;
      }
    } catch (u) {
      if (n !== null) throw ((il = n), u);
      ((Cl = 1), ou(l, be(t, l.current)), (il = null));
      return;
    }
    e.flags & 32768
      ? (rl || a === 1
          ? (l = !0)
          : ba || (fl & 536870912) !== 0
            ? (l = !1)
            : ((ot = l = !0),
              (a === 2 || a === 9 || a === 3 || a === 6) &&
                ((a = re.current),
                a !== null && a.tag === 13 && (a.flags |= 16384))),
        Dr(e, l))
      : Eu(e);
  }
  function Eu(l) {
    var e = l;
    do {
      if ((e.flags & 32768) !== 0) {
        Dr(e, ot);
        return;
      }
      l = e.return;
      var t = jm(e.alternate, e, We);
      if (t !== null) {
        il = t;
        return;
      }
      if (((e = e.sibling), e !== null)) {
        il = e;
        return;
      }
      il = e = l;
    } while (e !== null);
    Cl === 0 && (Cl = 5);
  }
  function Dr(l, e) {
    do {
      var t = Nm(l.alternate, l);
      if (t !== null) {
        ((t.flags &= 32767), (il = t));
        return;
      }
      if (
        ((t = l.return),
        t !== null &&
          ((t.flags |= 32768), (t.subtreeFlags = 0), (t.deletions = null)),
        !e && ((l = l.sibling), l !== null))
      ) {
        il = l;
        return;
      }
      il = l = t;
    } while (l !== null);
    ((Cl = 6), (il = null));
  }
  function Cr(l, e, t, a, n, u, c, s, r) {
    l.cancelPendingCommit = null;
    do Tu();
    while (Yl !== 0);
    if ((vl & 6) !== 0) throw Error(d(327));
    if (e !== null) {
      if (e === l.current) throw Error(d(177));
      if (
        ((u = e.lanes | e.childLanes),
        (u |= Mi),
        dh(l, t, u, c, s, r),
        l === Al && ((il = Al = null), (fl = 0)),
        (xa = e),
        (vt = l),
        (Fe = t),
        (Bc = u),
        (qc = n),
        (br = a),
        (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0
          ? ((l.callbackNode = null),
            (l.callbackPriority = 0),
            Hm(Mn, function () {
              return (Hr(), null);
            }))
          : ((l.callbackNode = null), (l.callbackPriority = 0)),
        (a = (e.flags & 13878) !== 0),
        (e.subtreeFlags & 13878) !== 0 || a)
      ) {
        ((a = T.T), (T.T = null), (n = L.p), (L.p = 2), (c = vl), (vl |= 4));
        try {
          Am(l, e, t);
        } finally {
          ((vl = c), (L.p = n), (T.T = a));
        }
      }
      ((Yl = 1), _r(), Or(), Ur());
    }
  }
  function _r() {
    if (Yl === 1) {
      Yl = 0;
      var l = vt,
        e = xa,
        t = (e.flags & 13878) !== 0;
      if ((e.subtreeFlags & 13878) !== 0 || t) {
        ((t = T.T), (T.T = null));
        var a = L.p;
        L.p = 2;
        var n = vl;
        vl |= 4;
        try {
          rr(e, l);
          var u = Ic,
            c = gf(l.containerInfo),
            s = u.focusedElem,
            r = u.selectionRange;
          if (
            c !== s &&
            s &&
            s.ownerDocument &&
            yf(s.ownerDocument.documentElement, s)
          ) {
            if (r !== null && Ni(s)) {
              var b = r.start,
                A = r.end;
              if ((A === void 0 && (A = b), "selectionStart" in s))
                ((s.selectionStart = b),
                  (s.selectionEnd = Math.min(A, s.value.length)));
              else {
                var M = s.ownerDocument || document,
                  S = (M && M.defaultView) || window;
                if (S.getSelection) {
                  var j = S.getSelection(),
                    X = s.textContent.length,
                    J = Math.min(r.start, X),
                    jl = r.end === void 0 ? J : Math.min(r.end, X);
                  !j.extend && J > jl && ((c = jl), (jl = J), (J = c));
                  var y = vf(s, J),
                    h = vf(s, jl);
                  if (
                    y &&
                    h &&
                    (j.rangeCount !== 1 ||
                      j.anchorNode !== y.node ||
                      j.anchorOffset !== y.offset ||
                      j.focusNode !== h.node ||
                      j.focusOffset !== h.offset)
                  ) {
                    var p = M.createRange();
                    (p.setStart(y.node, y.offset),
                      j.removeAllRanges(),
                      J > jl
                        ? (j.addRange(p), j.extend(h.node, h.offset))
                        : (p.setEnd(h.node, h.offset), j.addRange(p)));
                  }
                }
              }
            }
            for (M = [], j = s; (j = j.parentNode);)
              j.nodeType === 1 &&
                M.push({ element: j, left: j.scrollLeft, top: j.scrollTop });
            for (
              typeof s.focus == "function" && s.focus(), s = 0;
              s < M.length;
              s++
            ) {
              var z = M[s];
              ((z.element.scrollLeft = z.left), (z.element.scrollTop = z.top));
            }
          }
          ((Yu = !!Fc), (Ic = Fc = null));
        } finally {
          ((vl = n), (L.p = a), (T.T = t));
        }
      }
      ((l.current = e), (Yl = 2));
    }
  }
  function Or() {
    if (Yl === 2) {
      Yl = 0;
      var l = vt,
        e = xa,
        t = (e.flags & 8772) !== 0;
      if ((e.subtreeFlags & 8772) !== 0 || t) {
        ((t = T.T), (T.T = null));
        var a = L.p;
        L.p = 2;
        var n = vl;
        vl |= 4;
        try {
          ir(l, e.alternate, e);
        } finally {
          ((vl = n), (L.p = a), (T.T = t));
        }
      }
      Yl = 3;
    }
  }
  function Ur() {
    if (Yl === 4 || Yl === 3) {
      ((Yl = 0), eh());
      var l = vt,
        e = xa,
        t = Fe,
        a = br;
      (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0
        ? (Yl = 5)
        : ((Yl = 0), (xa = vt = null), Rr(l, l.pendingLanes));
      var n = l.pendingLanes;
      if (
        (n === 0 && (mt = null),
        ni(t),
        (e = e.stateNode),
        ce && typeof ce.onCommitFiberRoot == "function")
      )
        try {
          ce.onCommitFiberRoot(Ca, e, void 0, (e.current.flags & 128) === 128);
        } catch {}
      if (a !== null) {
        ((e = T.T), (n = L.p), (L.p = 2), (T.T = null));
        try {
          for (var u = l.onRecoverableError, c = 0; c < a.length; c++) {
            var s = a[c];
            u(s.value, { componentStack: s.stack });
          }
        } finally {
          ((T.T = e), (L.p = n));
        }
      }
      ((Fe & 3) !== 0 && Tu(),
        Ue(l),
        (n = l.pendingLanes),
        (t & 261930) !== 0 && (n & 42) !== 0
          ? l === Yc
            ? on++
            : ((on = 0), (Yc = l))
          : (on = 0),
        hn(0));
    }
  }
  function Rr(l, e) {
    (l.pooledCacheLanes &= e) === 0 &&
      ((e = l.pooledCache), e != null && ((l.pooledCache = null), Va(e)));
  }
  function Tu() {
    return (_r(), Or(), Ur(), Hr());
  }
  function Hr() {
    if (Yl !== 5) return !1;
    var l = vt,
      e = Bc;
    Bc = 0;
    var t = ni(Fe),
      a = T.T,
      n = L.p;
    try {
      ((L.p = 32 > t ? 32 : t), (T.T = null), (t = qc), (qc = null));
      var u = vt,
        c = Fe;
      if (((Yl = 0), (xa = vt = null), (Fe = 0), (vl & 6) !== 0))
        throw Error(d(331));
      var s = vl;
      if (
        ((vl |= 4),
        yr(u.current),
        hr(u, u.current, c, t),
        (vl = s),
        hn(0, !1),
        ce && typeof ce.onPostCommitFiberRoot == "function")
      )
        try {
          ce.onPostCommitFiberRoot(Ca, u);
        } catch {}
      return !0;
    } finally {
      ((L.p = n), (T.T = a), Rr(l, e));
    }
  }
  function Br(l, e, t) {
    ((e = be(t, e)),
      (e = yc(l.stateNode, e, 2)),
      (l = st(l, e, 2)),
      l !== null && (Oa(l, 2), Ue(l)));
  }
  function pl(l, e, t) {
    if (l.tag === 3) Br(l, l, t);
    else
      for (; e !== null;) {
        if (e.tag === 3) {
          Br(e, l, t);
          break;
        } else if (e.tag === 1) {
          var a = e.stateNode;
          if (
            typeof e.type.getDerivedStateFromError == "function" ||
            (typeof a.componentDidCatch == "function" &&
              (mt === null || !mt.has(a)))
          ) {
            ((l = be(t, l)),
              (t = qd(2)),
              (a = st(e, t, 2)),
              a !== null && (Yd(t, a, e, l), Oa(a, 2), Ue(a)));
            break;
          }
        }
        e = e.return;
      }
  }
  function Gc(l, e, t) {
    var a = l.pingCache;
    if (a === null) {
      a = l.pingCache = new zm();
      var n = new Set();
      a.set(e, n);
    } else ((n = a.get(e)), n === void 0 && ((n = new Set()), a.set(e, n)));
    n.has(t) ||
      ((Uc = !0), n.add(t), (l = Om.bind(null, l, e, t)), e.then(l, l));
  }
  function Om(l, e, t) {
    var a = l.pingCache;
    (a !== null && a.delete(e),
      (l.pingedLanes |= l.suspendedLanes & t),
      (l.warmLanes &= ~t),
      Al === l &&
        (fl & t) === t &&
        (Cl === 4 || (Cl === 3 && (fl & 62914560) === fl && 300 > ie() - Su)
          ? (vl & 2) === 0 && ja(l, 0)
          : (Rc |= t),
        Sa === fl && (Sa = 0)),
      Ue(l));
  }
  function qr(l, e) {
    (e === 0 && (e = Cs()), (l = _t(l, e)), l !== null && (Oa(l, e), Ue(l)));
  }
  function Um(l) {
    var e = l.memoizedState,
      t = 0;
    (e !== null && (t = e.retryLane), qr(l, t));
  }
  function Rm(l, e) {
    var t = 0;
    switch (l.tag) {
      case 31:
      case 13:
        var a = l.stateNode,
          n = l.memoizedState;
        n !== null && (t = n.retryLane);
        break;
      case 19:
        a = l.stateNode;
        break;
      case 22:
        a = l.stateNode._retryCache;
        break;
      default:
        throw Error(d(314));
    }
    (a !== null && a.delete(e), qr(l, t));
  }
  function Hm(l, e) {
    return li(l, e);
  }
  var zu = null,
    Aa = null,
    Xc = !1,
    Mu = !1,
    Qc = !1,
    gt = 0;
  function Ue(l) {
    (l !== Aa &&
      l.next === null &&
      (Aa === null ? (zu = Aa = l) : (Aa = Aa.next = l)),
      (Mu = !0),
      Xc || ((Xc = !0), qm()));
  }
  function hn(l, e) {
    if (!Qc && Mu) {
      Qc = !0;
      do
        for (var t = !1, a = zu; a !== null;) {
          if (l !== 0) {
            var n = a.pendingLanes;
            if (n === 0) var u = 0;
            else {
              var c = a.suspendedLanes,
                s = a.pingedLanes;
              ((u = (1 << (31 - se(42 | l) + 1)) - 1),
                (u &= n & ~(c & ~s)),
                (u = u & 201326741 ? (u & 201326741) | 1 : u ? u | 2 : 0));
            }
            u !== 0 && ((t = !0), Gr(a, u));
          } else
            ((u = fl),
              (u = On(
                a,
                a === Al ? u : 0,
                a.cancelPendingCommit !== null || a.timeoutHandle !== -1,
              )),
              (u & 3) === 0 || _a(a, u) || ((t = !0), Gr(a, u)));
          a = a.next;
        }
      while (t);
      Qc = !1;
    }
  }
  function Bm() {
    Yr();
  }
  function Yr() {
    Mu = Xc = !1;
    var l = 0;
    gt !== 0 && km() && (l = gt);
    for (var e = ie(), t = null, a = zu; a !== null;) {
      var n = a.next,
        u = wr(a, e);
      (u === 0
        ? ((a.next = null),
          t === null ? (zu = n) : (t.next = n),
          n === null && (Aa = t))
        : ((t = a), (l !== 0 || (u & 3) !== 0) && (Mu = !0)),
        (a = n));
    }
    ((Yl !== 0 && Yl !== 5) || hn(l), gt !== 0 && (gt = 0));
  }
  function wr(l, e) {
    for (
      var t = l.suspendedLanes,
        a = l.pingedLanes,
        n = l.expirationTimes,
        u = l.pendingLanes & -62914561;
      0 < u;
    ) {
      var c = 31 - se(u),
        s = 1 << c,
        r = n[c];
      (r === -1
        ? ((s & t) === 0 || (s & a) !== 0) && (n[c] = fh(s, e))
        : r <= e && (l.expiredLanes |= s),
        (u &= ~s));
    }
    if (
      ((e = Al),
      (t = fl),
      (t = On(
        l,
        l === e ? t : 0,
        l.cancelPendingCommit !== null || l.timeoutHandle !== -1,
      )),
      (a = l.callbackNode),
      t === 0 ||
        (l === e && (gl === 2 || gl === 9)) ||
        l.cancelPendingCommit !== null)
    )
      return (
        a !== null && a !== null && ei(a),
        (l.callbackNode = null),
        (l.callbackPriority = 0)
      );
    if ((t & 3) === 0 || _a(l, t)) {
      if (((e = t & -t), e === l.callbackPriority)) return e;
      switch ((a !== null && ei(a), ni(t))) {
        case 2:
        case 8:
          t = Ms;
          break;
        case 32:
          t = Mn;
          break;
        case 268435456:
          t = Ds;
          break;
        default:
          t = Mn;
      }
      return (
        (a = Lr.bind(null, l)),
        (t = li(t, a)),
        (l.callbackPriority = e),
        (l.callbackNode = t),
        e
      );
    }
    return (
      a !== null && a !== null && ei(a),
      (l.callbackPriority = 2),
      (l.callbackNode = null),
      2
    );
  }
  function Lr(l, e) {
    if (Yl !== 0 && Yl !== 5)
      return ((l.callbackNode = null), (l.callbackPriority = 0), null);
    var t = l.callbackNode;
    if (Tu() && l.callbackNode !== t) return null;
    var a = fl;
    return (
      (a = On(
        l,
        l === Al ? a : 0,
        l.cancelPendingCommit !== null || l.timeoutHandle !== -1,
      )),
      a === 0
        ? null
        : (xr(l, a, e),
          wr(l, ie()),
          l.callbackNode != null && l.callbackNode === t
            ? Lr.bind(null, l)
            : null)
    );
  }
  function Gr(l, e) {
    if (Tu()) return null;
    xr(l, e, !0);
  }
  function qm() {
    $m(function () {
      (vl & 6) !== 0 ? li(zs, Bm) : Yr();
    });
  }
  function Zc() {
    if (gt === 0) {
      var l = fa;
      (l === 0 && ((l = Dn), (Dn <<= 1), (Dn & 261888) === 0 && (Dn = 256)),
        (gt = l));
    }
    return gt;
  }
  function Xr(l) {
    return l == null || typeof l == "symbol" || typeof l == "boolean"
      ? null
      : typeof l == "function"
        ? l
        : Bn("" + l);
  }
  function Qr(l, e) {
    var t = e.ownerDocument.createElement("input");
    return (
      (t.name = e.name),
      (t.value = e.value),
      l.id && t.setAttribute("form", l.id),
      e.parentNode.insertBefore(t, e),
      (l = new FormData(l)),
      t.parentNode.removeChild(t),
      l
    );
  }
  function Ym(l, e, t, a, n) {
    if (e === "submit" && t && t.stateNode === n) {
      var u = Xr((n[Il] || null).action),
        c = a.submitter;
      c &&
        ((e = (e = c[Il] || null)
          ? Xr(e.formAction)
          : c.getAttribute("formAction")),
        e !== null && ((u = e), (c = null)));
      var s = new Ln("action", "action", null, a, n);
      l.push({
        event: s,
        listeners: [
          {
            instance: null,
            listener: function () {
              if (a.defaultPrevented) {
                if (gt !== 0) {
                  var r = c ? Qr(n, c) : new FormData(n);
                  dc(
                    t,
                    { pending: !0, data: r, method: n.method, action: u },
                    null,
                    r,
                  );
                }
              } else
                typeof u == "function" &&
                  (s.preventDefault(),
                  (r = c ? Qr(n, c) : new FormData(n)),
                  dc(
                    t,
                    { pending: !0, data: r, method: n.method, action: u },
                    u,
                    r,
                  ));
            },
            currentTarget: n,
          },
        ],
      });
    }
  }
  for (var Kc = 0; Kc < zi.length; Kc++) {
    var Vc = zi[Kc],
      wm = Vc.toLowerCase(),
      Lm = Vc[0].toUpperCase() + Vc.slice(1);
    ze(wm, "on" + Lm);
  }
  (ze(Sf, "onAnimationEnd"),
    ze(xf, "onAnimationIteration"),
    ze(jf, "onAnimationStart"),
    ze("dblclick", "onDoubleClick"),
    ze("focusin", "onFocus"),
    ze("focusout", "onBlur"),
    ze(tm, "onTransitionRun"),
    ze(am, "onTransitionStart"),
    ze(nm, "onTransitionCancel"),
    ze(Nf, "onTransitionEnd"),
    $t("onMouseEnter", ["mouseout", "mouseover"]),
    $t("onMouseLeave", ["mouseout", "mouseover"]),
    $t("onPointerEnter", ["pointerout", "pointerover"]),
    $t("onPointerLeave", ["pointerout", "pointerover"]),
    zt(
      "onChange",
      "change click focusin focusout input keydown keyup selectionchange".split(
        " ",
      ),
    ),
    zt(
      "onSelect",
      "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
        " ",
      ),
    ),
    zt("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    zt(
      "onCompositionEnd",
      "compositionend focusout keydown keypress keyup mousedown".split(" "),
    ),
    zt(
      "onCompositionStart",
      "compositionstart focusout keydown keypress keyup mousedown".split(" "),
    ),
    zt(
      "onCompositionUpdate",
      "compositionupdate focusout keydown keypress keyup mousedown".split(" "),
    ));
  var mn =
      "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " ",
      ),
    Gm = new Set(
      "beforetoggle cancel close invalid load scroll scrollend toggle"
        .split(" ")
        .concat(mn),
    );
  function Zr(l, e) {
    e = (e & 4) !== 0;
    for (var t = 0; t < l.length; t++) {
      var a = l[t],
        n = a.event;
      a = a.listeners;
      l: {
        var u = void 0;
        if (e)
          for (var c = a.length - 1; 0 <= c; c--) {
            var s = a[c],
              r = s.instance,
              b = s.currentTarget;
            if (((s = s.listener), r !== u && n.isPropagationStopped()))
              break l;
            ((u = s), (n.currentTarget = b));
            try {
              u(n);
            } catch (A) {
              Qn(A);
            }
            ((n.currentTarget = null), (u = r));
          }
        else
          for (c = 0; c < a.length; c++) {
            if (
              ((s = a[c]),
              (r = s.instance),
              (b = s.currentTarget),
              (s = s.listener),
              r !== u && n.isPropagationStopped())
            )
              break l;
            ((u = s), (n.currentTarget = b));
            try {
              u(n);
            } catch (A) {
              Qn(A);
            }
            ((n.currentTarget = null), (u = r));
          }
      }
    }
  }
  function cl(l, e) {
    var t = e[ui];
    t === void 0 && (t = e[ui] = new Set());
    var a = l + "__bubble";
    t.has(a) || (Kr(e, l, 2, !1), t.add(a));
  }
  function kc(l, e, t) {
    var a = 0;
    (e && (a |= 4), Kr(t, l, a, e));
  }
  var Du = "_reactListening" + Math.random().toString(36).slice(2);
  function Jc(l) {
    if (!l[Du]) {
      ((l[Du] = !0),
        qs.forEach(function (t) {
          t !== "selectionchange" && (Gm.has(t) || kc(t, !1, l), kc(t, !0, l));
        }));
      var e = l.nodeType === 9 ? l : l.ownerDocument;
      e === null || e[Du] || ((e[Du] = !0), kc("selectionchange", !1, e));
    }
  }
  function Kr(l, e, t, a) {
    switch (xo(e)) {
      case 2:
        var n = vv;
        break;
      case 8:
        n = yv;
        break;
      default:
        n = fs;
    }
    ((t = n.bind(null, e, t, l)),
      (n = void 0),
      !mi ||
        (e !== "touchstart" && e !== "touchmove" && e !== "wheel") ||
        (n = !0),
      a
        ? n !== void 0
          ? l.addEventListener(e, t, { capture: !0, passive: n })
          : l.addEventListener(e, t, !0)
        : n !== void 0
          ? l.addEventListener(e, t, { passive: n })
          : l.addEventListener(e, t, !1));
  }
  function $c(l, e, t, a, n) {
    var u = a;
    if ((e & 1) === 0 && (e & 2) === 0 && a !== null)
      l: for (;;) {
        if (a === null) return;
        var c = a.tag;
        if (c === 3 || c === 4) {
          var s = a.stateNode.containerInfo;
          if (s === n) break;
          if (c === 4)
            for (c = a.return; c !== null;) {
              var r = c.tag;
              if ((r === 3 || r === 4) && c.stateNode.containerInfo === n)
                return;
              c = c.return;
            }
          for (; s !== null;) {
            if (((c = Vt(s)), c === null)) return;
            if (((r = c.tag), r === 5 || r === 6 || r === 26 || r === 27)) {
              a = u = c;
              continue l;
            }
            s = s.parentNode;
          }
        }
        a = a.return;
      }
    $s(function () {
      var b = u,
        A = oi(t),
        M = [];
      l: {
        var S = Af.get(l);
        if (S !== void 0) {
          var j = Ln,
            X = l;
          switch (l) {
            case "keypress":
              if (Yn(t) === 0) break l;
            case "keydown":
            case "keyup":
              j = Rh;
              break;
            case "focusin":
              ((X = "focus"), (j = pi));
              break;
            case "focusout":
              ((X = "blur"), (j = pi));
              break;
            case "beforeblur":
            case "afterblur":
              j = pi;
              break;
            case "click":
              if (t.button === 2) break l;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              j = Is;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              j = jh;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              j = qh;
              break;
            case Sf:
            case xf:
            case jf:
              j = Eh;
              break;
            case Nf:
              j = wh;
              break;
            case "scroll":
            case "scrollend":
              j = Sh;
              break;
            case "wheel":
              j = Gh;
              break;
            case "copy":
            case "cut":
            case "paste":
              j = zh;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              j = lf;
              break;
            case "toggle":
            case "beforetoggle":
              j = Qh;
          }
          var J = (e & 4) !== 0,
            jl = !J && (l === "scroll" || l === "scrollend"),
            y = J ? (S !== null ? S + "Capture" : null) : S;
          J = [];
          for (var h = b, p; h !== null;) {
            var z = h;
            if (
              ((p = z.stateNode),
              (z = z.tag),
              (z !== 5 && z !== 26 && z !== 27) ||
                p === null ||
                y === null ||
                ((z = Ha(h, y)), z != null && J.push(vn(h, z, p))),
              jl)
            )
              break;
            h = h.return;
          }
          0 < J.length &&
            ((S = new j(S, X, null, t, A)), M.push({ event: S, listeners: J }));
        }
      }
      if ((e & 7) === 0) {
        l: {
          if (
            ((S = l === "mouseover" || l === "pointerover"),
            (j = l === "mouseout" || l === "pointerout"),
            S &&
              t !== ri &&
              (X = t.relatedTarget || t.fromElement) &&
              (Vt(X) || X[Kt]))
          )
            break l;
          if (
            (j || S) &&
            ((S =
              A.window === A
                ? A
                : (S = A.ownerDocument)
                  ? S.defaultView || S.parentWindow
                  : window),
            j
              ? ((X = t.relatedTarget || t.toElement),
                (j = b),
                (X = X ? Vt(X) : null),
                X !== null &&
                  ((jl = E(X)),
                  (J = X.tag),
                  X !== jl || (J !== 5 && J !== 27 && J !== 6)) &&
                  (X = null))
              : ((j = null), (X = b)),
            j !== X)
          ) {
            if (
              ((J = Is),
              (z = "onMouseLeave"),
              (y = "onMouseEnter"),
              (h = "mouse"),
              (l === "pointerout" || l === "pointerover") &&
                ((J = lf),
                (z = "onPointerLeave"),
                (y = "onPointerEnter"),
                (h = "pointer")),
              (jl = j == null ? S : Ra(j)),
              (p = X == null ? S : Ra(X)),
              (S = new J(z, h + "leave", j, t, A)),
              (S.target = jl),
              (S.relatedTarget = p),
              (z = null),
              Vt(A) === b &&
                ((J = new J(y, h + "enter", X, t, A)),
                (J.target = p),
                (J.relatedTarget = jl),
                (z = J)),
              (jl = z),
              j && X)
            )
              e: {
                for (J = Xm, y = j, h = X, p = 0, z = y; z; z = J(z)) p++;
                z = 0;
                for (var V = h; V; V = J(V)) z++;
                for (; 0 < p - z;) ((y = J(y)), p--);
                for (; 0 < z - p;) ((h = J(h)), z--);
                for (; p--;) {
                  if (y === h || (h !== null && y === h.alternate)) {
                    J = y;
                    break e;
                  }
                  ((y = J(y)), (h = J(h)));
                }
                J = null;
              }
            else J = null;
            (j !== null && Vr(M, S, j, J, !1),
              X !== null && jl !== null && Vr(M, jl, X, J, !0));
          }
        }
        l: {
          if (
            ((S = b ? Ra(b) : window),
            (j = S.nodeName && S.nodeName.toLowerCase()),
            j === "select" || (j === "input" && S.type === "file"))
          )
            var hl = ff;
          else if (cf(S))
            if (df) hl = Ph;
            else {
              hl = Fh;
              var Z = Wh;
            }
          else
            ((j = S.nodeName),
              !j ||
              j.toLowerCase() !== "input" ||
              (S.type !== "checkbox" && S.type !== "radio")
                ? b && di(b.elementType) && (hl = ff)
                : (hl = Ih));
          if (hl && (hl = hl(l, b))) {
            sf(M, hl, t, A);
            break l;
          }
          (Z && Z(l, S, b),
            l === "focusout" &&
              b &&
              S.type === "number" &&
              b.memoizedProps.value != null &&
              fi(S, "number", S.value));
        }
        switch (((Z = b ? Ra(b) : window), l)) {
          case "focusin":
            (cf(Z) || Z.contentEditable === "true") &&
              ((ea = Z), (Ai = b), (Qa = null));
            break;
          case "focusout":
            Qa = Ai = ea = null;
            break;
          case "mousedown":
            Ei = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            ((Ei = !1), pf(M, t, A));
            break;
          case "selectionchange":
            if (em) break;
          case "keydown":
          case "keyup":
            pf(M, t, A);
        }
        var tl;
        if (Si)
          l: {
            switch (l) {
              case "compositionstart":
                var dl = "onCompositionStart";
                break l;
              case "compositionend":
                dl = "onCompositionEnd";
                break l;
              case "compositionupdate":
                dl = "onCompositionUpdate";
                break l;
            }
            dl = void 0;
          }
        else
          la
            ? nf(l, t) && (dl = "onCompositionEnd")
            : l === "keydown" &&
              t.keyCode === 229 &&
              (dl = "onCompositionStart");
        (dl &&
          (ef &&
            t.locale !== "ko" &&
            (la || dl !== "onCompositionStart"
              ? dl === "onCompositionEnd" && la && (tl = Ws())
              : ((et = A),
                (vi = "value" in et ? et.value : et.textContent),
                (la = !0))),
          (Z = Cu(b, dl)),
          0 < Z.length &&
            ((dl = new Ps(dl, l, null, t, A)),
            M.push({ event: dl, listeners: Z }),
            tl
              ? (dl.data = tl)
              : ((tl = uf(t)), tl !== null && (dl.data = tl)))),
          (tl = Kh ? Vh(l, t) : kh(l, t)) &&
            ((dl = Cu(b, "onBeforeInput")),
            0 < dl.length &&
              ((Z = new Ps("onBeforeInput", "beforeinput", null, t, A)),
              M.push({ event: Z, listeners: dl }),
              (Z.data = tl))),
          Ym(M, l, b, t, A));
      }
      Zr(M, e);
    });
  }
  function vn(l, e, t) {
    return { instance: l, listener: e, currentTarget: t };
  }
  function Cu(l, e) {
    for (var t = e + "Capture", a = []; l !== null;) {
      var n = l,
        u = n.stateNode;
      if (
        ((n = n.tag),
        (n !== 5 && n !== 26 && n !== 27) ||
          u === null ||
          ((n = Ha(l, t)),
          n != null && a.unshift(vn(l, n, u)),
          (n = Ha(l, e)),
          n != null && a.push(vn(l, n, u))),
        l.tag === 3)
      )
        return a;
      l = l.return;
    }
    return [];
  }
  function Xm(l) {
    if (l === null) return null;
    do l = l.return;
    while (l && l.tag !== 5 && l.tag !== 27);
    return l || null;
  }
  function Vr(l, e, t, a, n) {
    for (var u = e._reactName, c = []; t !== null && t !== a;) {
      var s = t,
        r = s.alternate,
        b = s.stateNode;
      if (((s = s.tag), r !== null && r === a)) break;
      ((s !== 5 && s !== 26 && s !== 27) ||
        b === null ||
        ((r = b),
        n
          ? ((b = Ha(t, u)), b != null && c.unshift(vn(t, b, r)))
          : n || ((b = Ha(t, u)), b != null && c.push(vn(t, b, r)))),
        (t = t.return));
    }
    c.length !== 0 && l.push({ event: e, listeners: c });
  }
  var Qm = /\r\n?/g,
    Zm = /\u0000|\uFFFD/g;
  function kr(l) {
    return (typeof l == "string" ? l : "" + l)
      .replace(
        Qm,
        `
`,
      )
      .replace(Zm, "");
  }
  function Jr(l, e) {
    return ((e = kr(e)), kr(l) === e);
  }
  function xl(l, e, t, a, n, u) {
    switch (t) {
      case "children":
        typeof a == "string"
          ? e === "body" || (e === "textarea" && a === "") || Ft(l, a)
          : (typeof a == "number" || typeof a == "bigint") &&
            e !== "body" &&
            Ft(l, "" + a);
        break;
      case "className":
        Rn(l, "class", a);
        break;
      case "tabIndex":
        Rn(l, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        Rn(l, t, a);
        break;
      case "style":
        ks(l, a, u);
        break;
      case "data":
        if (e !== "object") {
          Rn(l, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (e !== "a" || t !== "href")) {
          l.removeAttribute(t);
          break;
        }
        if (
          a == null ||
          typeof a == "function" ||
          typeof a == "symbol" ||
          typeof a == "boolean"
        ) {
          l.removeAttribute(t);
          break;
        }
        ((a = Bn("" + a)), l.setAttribute(t, a));
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          l.setAttribute(
            t,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')",
          );
          break;
        } else
          typeof u == "function" &&
            (t === "formAction"
              ? (e !== "input" && xl(l, e, "name", n.name, n, null),
                xl(l, e, "formEncType", n.formEncType, n, null),
                xl(l, e, "formMethod", n.formMethod, n, null),
                xl(l, e, "formTarget", n.formTarget, n, null))
              : (xl(l, e, "encType", n.encType, n, null),
                xl(l, e, "method", n.method, n, null),
                xl(l, e, "target", n.target, n, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          l.removeAttribute(t);
          break;
        }
        ((a = Bn("" + a)), l.setAttribute(t, a));
        break;
      case "onClick":
        a != null && (l.onclick = Be);
        break;
      case "onScroll":
        a != null && cl("scroll", l);
        break;
      case "onScrollEnd":
        a != null && cl("scrollend", l);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(d(61));
          if (((t = a.__html), t != null)) {
            if (n.children != null) throw Error(d(60));
            l.innerHTML = t;
          }
        }
        break;
      case "multiple":
        l.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        l.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (
          a == null ||
          typeof a == "function" ||
          typeof a == "boolean" ||
          typeof a == "symbol"
        ) {
          l.removeAttribute("xlink:href");
          break;
        }
        ((t = Bn("" + a)),
          l.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", t));
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol"
          ? l.setAttribute(t, "" + a)
          : l.removeAttribute(t);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol"
          ? l.setAttribute(t, "")
          : l.removeAttribute(t);
        break;
      case "capture":
      case "download":
        a === !0
          ? l.setAttribute(t, "")
          : a !== !1 &&
              a != null &&
              typeof a != "function" &&
              typeof a != "symbol"
            ? l.setAttribute(t, a)
            : l.removeAttribute(t);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null &&
        typeof a != "function" &&
        typeof a != "symbol" &&
        !isNaN(a) &&
        1 <= a
          ? l.setAttribute(t, a)
          : l.removeAttribute(t);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a)
          ? l.removeAttribute(t)
          : l.setAttribute(t, a);
        break;
      case "popover":
        (cl("beforetoggle", l), cl("toggle", l), Un(l, "popover", a));
        break;
      case "xlinkActuate":
        He(l, "http://www.w3.org/1999/xlink", "xlink:actuate", a);
        break;
      case "xlinkArcrole":
        He(l, "http://www.w3.org/1999/xlink", "xlink:arcrole", a);
        break;
      case "xlinkRole":
        He(l, "http://www.w3.org/1999/xlink", "xlink:role", a);
        break;
      case "xlinkShow":
        He(l, "http://www.w3.org/1999/xlink", "xlink:show", a);
        break;
      case "xlinkTitle":
        He(l, "http://www.w3.org/1999/xlink", "xlink:title", a);
        break;
      case "xlinkType":
        He(l, "http://www.w3.org/1999/xlink", "xlink:type", a);
        break;
      case "xmlBase":
        He(l, "http://www.w3.org/XML/1998/namespace", "xml:base", a);
        break;
      case "xmlLang":
        He(l, "http://www.w3.org/XML/1998/namespace", "xml:lang", a);
        break;
      case "xmlSpace":
        He(l, "http://www.w3.org/XML/1998/namespace", "xml:space", a);
        break;
      case "is":
        Un(l, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < t.length) ||
          (t[0] !== "o" && t[0] !== "O") ||
          (t[1] !== "n" && t[1] !== "N")) &&
          ((t = ph.get(t) || t), Un(l, t, a));
    }
  }
  function Wc(l, e, t, a, n, u) {
    switch (t) {
      case "style":
        ks(l, a, u);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a)) throw Error(d(61));
          if (((t = a.__html), t != null)) {
            if (n.children != null) throw Error(d(60));
            l.innerHTML = t;
          }
        }
        break;
      case "children":
        typeof a == "string"
          ? Ft(l, a)
          : (typeof a == "number" || typeof a == "bigint") && Ft(l, "" + a);
        break;
      case "onScroll":
        a != null && cl("scroll", l);
        break;
      case "onScrollEnd":
        a != null && cl("scrollend", l);
        break;
      case "onClick":
        a != null && (l.onclick = Be);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!Ys.hasOwnProperty(t))
          l: {
            if (
              t[0] === "o" &&
              t[1] === "n" &&
              ((n = t.endsWith("Capture")),
              (e = t.slice(2, n ? t.length - 7 : void 0)),
              (u = l[Il] || null),
              (u = u != null ? u[t] : null),
              typeof u == "function" && l.removeEventListener(e, u, n),
              typeof a == "function")
            ) {
              (typeof u != "function" &&
                u !== null &&
                (t in l
                  ? (l[t] = null)
                  : l.hasAttribute(t) && l.removeAttribute(t)),
                l.addEventListener(e, a, n));
              break l;
            }
            t in l
              ? (l[t] = a)
              : a === !0
                ? l.setAttribute(t, "")
                : Un(l, t, a);
          }
    }
  }
  function kl(l, e, t) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        (cl("error", l), cl("load", l));
        var a = !1,
          n = !1,
          u;
        for (u in t)
          if (t.hasOwnProperty(u)) {
            var c = t[u];
            if (c != null)
              switch (u) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  n = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(d(137, e));
                default:
                  xl(l, e, u, c, t, null);
              }
          }
        (n && xl(l, e, "srcSet", t.srcSet, t, null),
          a && xl(l, e, "src", t.src, t, null));
        return;
      case "input":
        cl("invalid", l);
        var s = (u = c = n = null),
          r = null,
          b = null;
        for (a in t)
          if (t.hasOwnProperty(a)) {
            var A = t[a];
            if (A != null)
              switch (a) {
                case "name":
                  n = A;
                  break;
                case "type":
                  c = A;
                  break;
                case "checked":
                  r = A;
                  break;
                case "defaultChecked":
                  b = A;
                  break;
                case "value":
                  u = A;
                  break;
                case "defaultValue":
                  s = A;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (A != null) throw Error(d(137, e));
                  break;
                default:
                  xl(l, e, a, A, t, null);
              }
          }
        Qs(l, u, s, r, b, c, n, !1);
        return;
      case "select":
        (cl("invalid", l), (a = c = u = null));
        for (n in t)
          if (t.hasOwnProperty(n) && ((s = t[n]), s != null))
            switch (n) {
              case "value":
                u = s;
                break;
              case "defaultValue":
                c = s;
                break;
              case "multiple":
                a = s;
              default:
                xl(l, e, n, s, t, null);
            }
        ((e = u),
          (t = c),
          (l.multiple = !!a),
          e != null ? Wt(l, !!a, e, !1) : t != null && Wt(l, !!a, t, !0));
        return;
      case "textarea":
        (cl("invalid", l), (u = n = a = null));
        for (c in t)
          if (t.hasOwnProperty(c) && ((s = t[c]), s != null))
            switch (c) {
              case "value":
                a = s;
                break;
              case "defaultValue":
                n = s;
                break;
              case "children":
                u = s;
                break;
              case "dangerouslySetInnerHTML":
                if (s != null) throw Error(d(91));
                break;
              default:
                xl(l, e, c, s, t, null);
            }
        Ks(l, a, n, u);
        return;
      case "option":
        for (r in t)
          t.hasOwnProperty(r) &&
            ((a = t[r]), a != null) &&
            (r === "selected"
              ? (l.selected =
                  a && typeof a != "function" && typeof a != "symbol")
              : xl(l, e, r, a, t, null));
        return;
      case "dialog":
        (cl("beforetoggle", l),
          cl("toggle", l),
          cl("cancel", l),
          cl("close", l));
        break;
      case "iframe":
      case "object":
        cl("load", l);
        break;
      case "video":
      case "audio":
        for (a = 0; a < mn.length; a++) cl(mn[a], l);
        break;
      case "image":
        (cl("error", l), cl("load", l));
        break;
      case "details":
        cl("toggle", l);
        break;
      case "embed":
      case "source":
      case "link":
        (cl("error", l), cl("load", l));
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (b in t)
          if (t.hasOwnProperty(b) && ((a = t[b]), a != null))
            switch (b) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(d(137, e));
              default:
                xl(l, e, b, a, t, null);
            }
        return;
      default:
        if (di(e)) {
          for (A in t)
            t.hasOwnProperty(A) &&
              ((a = t[A]), a !== void 0 && Wc(l, e, A, a, t, void 0));
          return;
        }
    }
    for (s in t)
      t.hasOwnProperty(s) && ((a = t[s]), a != null && xl(l, e, s, a, t, null));
  }
  function Km(l, e, t, a) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var n = null,
          u = null,
          c = null,
          s = null,
          r = null,
          b = null,
          A = null;
        for (j in t) {
          var M = t[j];
          if (t.hasOwnProperty(j) && M != null)
            switch (j) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                r = M;
              default:
                a.hasOwnProperty(j) || xl(l, e, j, null, a, M);
            }
        }
        for (var S in a) {
          var j = a[S];
          if (((M = t[S]), a.hasOwnProperty(S) && (j != null || M != null)))
            switch (S) {
              case "type":
                u = j;
                break;
              case "name":
                n = j;
                break;
              case "checked":
                b = j;
                break;
              case "defaultChecked":
                A = j;
                break;
              case "value":
                c = j;
                break;
              case "defaultValue":
                s = j;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (j != null) throw Error(d(137, e));
                break;
              default:
                j !== M && xl(l, e, S, j, a, M);
            }
        }
        si(l, c, s, r, b, A, u, n);
        return;
      case "select":
        j = c = s = S = null;
        for (u in t)
          if (((r = t[u]), t.hasOwnProperty(u) && r != null))
            switch (u) {
              case "value":
                break;
              case "multiple":
                j = r;
              default:
                a.hasOwnProperty(u) || xl(l, e, u, null, a, r);
            }
        for (n in a)
          if (
            ((u = a[n]),
            (r = t[n]),
            a.hasOwnProperty(n) && (u != null || r != null))
          )
            switch (n) {
              case "value":
                S = u;
                break;
              case "defaultValue":
                s = u;
                break;
              case "multiple":
                c = u;
              default:
                u !== r && xl(l, e, n, u, a, r);
            }
        ((e = s),
          (t = c),
          (a = j),
          S != null
            ? Wt(l, !!t, S, !1)
            : !!a != !!t &&
              (e != null ? Wt(l, !!t, e, !0) : Wt(l, !!t, t ? [] : "", !1)));
        return;
      case "textarea":
        j = S = null;
        for (s in t)
          if (
            ((n = t[s]),
            t.hasOwnProperty(s) && n != null && !a.hasOwnProperty(s))
          )
            switch (s) {
              case "value":
                break;
              case "children":
                break;
              default:
                xl(l, e, s, null, a, n);
            }
        for (c in a)
          if (
            ((n = a[c]),
            (u = t[c]),
            a.hasOwnProperty(c) && (n != null || u != null))
          )
            switch (c) {
              case "value":
                S = n;
                break;
              case "defaultValue":
                j = n;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (n != null) throw Error(d(91));
                break;
              default:
                n !== u && xl(l, e, c, n, a, u);
            }
        Zs(l, S, j);
        return;
      case "option":
        for (var X in t)
          ((S = t[X]),
            t.hasOwnProperty(X) &&
              S != null &&
              !a.hasOwnProperty(X) &&
              (X === "selected" ? (l.selected = !1) : xl(l, e, X, null, a, S)));
        for (r in a)
          ((S = a[r]),
            (j = t[r]),
            a.hasOwnProperty(r) &&
              S !== j &&
              (S != null || j != null) &&
              (r === "selected"
                ? (l.selected =
                    S && typeof S != "function" && typeof S != "symbol")
                : xl(l, e, r, S, a, j)));
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var J in t)
          ((S = t[J]),
            t.hasOwnProperty(J) &&
              S != null &&
              !a.hasOwnProperty(J) &&
              xl(l, e, J, null, a, S));
        for (b in a)
          if (
            ((S = a[b]),
            (j = t[b]),
            a.hasOwnProperty(b) && S !== j && (S != null || j != null))
          )
            switch (b) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (S != null) throw Error(d(137, e));
                break;
              default:
                xl(l, e, b, S, a, j);
            }
        return;
      default:
        if (di(e)) {
          for (var jl in t)
            ((S = t[jl]),
              t.hasOwnProperty(jl) &&
                S !== void 0 &&
                !a.hasOwnProperty(jl) &&
                Wc(l, e, jl, void 0, a, S));
          for (A in a)
            ((S = a[A]),
              (j = t[A]),
              !a.hasOwnProperty(A) ||
                S === j ||
                (S === void 0 && j === void 0) ||
                Wc(l, e, A, S, a, j));
          return;
        }
    }
    for (var y in t)
      ((S = t[y]),
        t.hasOwnProperty(y) &&
          S != null &&
          !a.hasOwnProperty(y) &&
          xl(l, e, y, null, a, S));
    for (M in a)
      ((S = a[M]),
        (j = t[M]),
        !a.hasOwnProperty(M) ||
          S === j ||
          (S == null && j == null) ||
          xl(l, e, M, S, a, j));
  }
  function $r(l) {
    switch (l) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function Vm() {
    if (typeof performance.getEntriesByType == "function") {
      for (
        var l = 0, e = 0, t = performance.getEntriesByType("resource"), a = 0;
        a < t.length;
        a++
      ) {
        var n = t[a],
          u = n.transferSize,
          c = n.initiatorType,
          s = n.duration;
        if (u && s && $r(c)) {
          for (c = 0, s = n.responseEnd, a += 1; a < t.length; a++) {
            var r = t[a],
              b = r.startTime;
            if (b > s) break;
            var A = r.transferSize,
              M = r.initiatorType;
            A &&
              $r(M) &&
              ((r = r.responseEnd), (c += A * (r < s ? 1 : (s - b) / (r - b))));
          }
          if ((--a, (e += (8 * (u + c)) / (n.duration / 1e3)), l++, 10 < l))
            break;
        }
      }
      if (0 < l) return e / l / 1e6;
    }
    return navigator.connection &&
      ((l = navigator.connection.downlink), typeof l == "number")
      ? l
      : 5;
  }
  var Fc = null,
    Ic = null;
  function _u(l) {
    return l.nodeType === 9 ? l : l.ownerDocument;
  }
  function Wr(l) {
    switch (l) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Fr(l, e) {
    if (l === 0)
      switch (e) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return l === 1 && e === "foreignObject" ? 0 : l;
  }
  function Pc(l, e) {
    return (
      l === "textarea" ||
      l === "noscript" ||
      typeof e.children == "string" ||
      typeof e.children == "number" ||
      typeof e.children == "bigint" ||
      (typeof e.dangerouslySetInnerHTML == "object" &&
        e.dangerouslySetInnerHTML !== null &&
        e.dangerouslySetInnerHTML.__html != null)
    );
  }
  var ls = null;
  function km() {
    var l = window.event;
    return l && l.type === "popstate"
      ? l === ls
        ? !1
        : ((ls = l), !0)
      : ((ls = null), !1);
  }
  var Ir = typeof setTimeout == "function" ? setTimeout : void 0,
    Jm = typeof clearTimeout == "function" ? clearTimeout : void 0,
    Pr = typeof Promise == "function" ? Promise : void 0,
    $m =
      typeof queueMicrotask == "function"
        ? queueMicrotask
        : typeof Pr < "u"
          ? function (l) {
              return Pr.resolve(null).then(l).catch(Wm);
            }
          : Ir;
  function Wm(l) {
    setTimeout(function () {
      throw l;
    });
  }
  function pt(l) {
    return l === "head";
  }
  function lo(l, e) {
    var t = e,
      a = 0;
    do {
      var n = t.nextSibling;
      if ((l.removeChild(t), n && n.nodeType === 8))
        if (((t = n.data), t === "/$" || t === "/&")) {
          if (a === 0) {
            (l.removeChild(n), Ma(e));
            return;
          }
          a--;
        } else if (
          t === "$" ||
          t === "$?" ||
          t === "$~" ||
          t === "$!" ||
          t === "&"
        )
          a++;
        else if (t === "html") yn(l.ownerDocument.documentElement);
        else if (t === "head") {
          ((t = l.ownerDocument.head), yn(t));
          for (var u = t.firstChild; u;) {
            var c = u.nextSibling,
              s = u.nodeName;
            (u[Ua] ||
              s === "SCRIPT" ||
              s === "STYLE" ||
              (s === "LINK" && u.rel.toLowerCase() === "stylesheet") ||
              t.removeChild(u),
              (u = c));
          }
        } else t === "body" && yn(l.ownerDocument.body);
      t = n;
    } while (t);
    Ma(e);
  }
  function eo(l, e) {
    var t = l;
    l = 0;
    do {
      var a = t.nextSibling;
      if (
        (t.nodeType === 1
          ? e
            ? ((t._stashedDisplay = t.style.display),
              (t.style.display = "none"))
            : ((t.style.display = t._stashedDisplay || ""),
              t.getAttribute("style") === "" && t.removeAttribute("style"))
          : t.nodeType === 3 &&
            (e
              ? ((t._stashedText = t.nodeValue), (t.nodeValue = ""))
              : (t.nodeValue = t._stashedText || "")),
        a && a.nodeType === 8)
      )
        if (((t = a.data), t === "/$")) {
          if (l === 0) break;
          l--;
        } else (t !== "$" && t !== "$?" && t !== "$~" && t !== "$!") || l++;
      t = a;
    } while (t);
  }
  function es(l) {
    var e = l.firstChild;
    for (e && e.nodeType === 10 && (e = e.nextSibling); e;) {
      var t = e;
      switch (((e = e.nextSibling), t.nodeName)) {
        case "HTML":
        case "HEAD":
        case "BODY":
          (es(t), ii(t));
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (t.rel.toLowerCase() === "stylesheet") continue;
      }
      l.removeChild(t);
    }
  }
  function Fm(l, e, t, a) {
    for (; l.nodeType === 1;) {
      var n = t;
      if (l.nodeName.toLowerCase() !== e.toLowerCase()) {
        if (!a && (l.nodeName !== "INPUT" || l.type !== "hidden")) break;
      } else if (a) {
        if (!l[Ua])
          switch (e) {
            case "meta":
              if (!l.hasAttribute("itemprop")) break;
              return l;
            case "link":
              if (
                ((u = l.getAttribute("rel")),
                u === "stylesheet" && l.hasAttribute("data-precedence"))
              )
                break;
              if (
                u !== n.rel ||
                l.getAttribute("href") !==
                  (n.href == null || n.href === "" ? null : n.href) ||
                l.getAttribute("crossorigin") !==
                  (n.crossOrigin == null ? null : n.crossOrigin) ||
                l.getAttribute("title") !== (n.title == null ? null : n.title)
              )
                break;
              return l;
            case "style":
              if (l.hasAttribute("data-precedence")) break;
              return l;
            case "script":
              if (
                ((u = l.getAttribute("src")),
                (u !== (n.src == null ? null : n.src) ||
                  l.getAttribute("type") !== (n.type == null ? null : n.type) ||
                  l.getAttribute("crossorigin") !==
                    (n.crossOrigin == null ? null : n.crossOrigin)) &&
                  u &&
                  l.hasAttribute("async") &&
                  !l.hasAttribute("itemprop"))
              )
                break;
              return l;
            default:
              return l;
          }
      } else if (e === "input" && l.type === "hidden") {
        var u = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && l.getAttribute("name") === u) return l;
      } else return l;
      if (((l = Ae(l.nextSibling)), l === null)) break;
    }
    return null;
  }
  function Im(l, e, t) {
    if (e === "") return null;
    for (; l.nodeType !== 3;)
      if (
        ((l.nodeType !== 1 || l.nodeName !== "INPUT" || l.type !== "hidden") &&
          !t) ||
        ((l = Ae(l.nextSibling)), l === null)
      )
        return null;
    return l;
  }
  function to(l, e) {
    for (; l.nodeType !== 8;)
      if (
        ((l.nodeType !== 1 || l.nodeName !== "INPUT" || l.type !== "hidden") &&
          !e) ||
        ((l = Ae(l.nextSibling)), l === null)
      )
        return null;
    return l;
  }
  function ts(l) {
    return l.data === "$?" || l.data === "$~";
  }
  function as(l) {
    return (
      l.data === "$!" ||
      (l.data === "$?" && l.ownerDocument.readyState !== "loading")
    );
  }
  function Pm(l, e) {
    var t = l.ownerDocument;
    if (l.data === "$~") l._reactRetry = e;
    else if (l.data !== "$?" || t.readyState !== "loading") e();
    else {
      var a = function () {
        (e(), t.removeEventListener("DOMContentLoaded", a));
      };
      (t.addEventListener("DOMContentLoaded", a), (l._reactRetry = a));
    }
  }
  function Ae(l) {
    for (; l != null; l = l.nextSibling) {
      var e = l.nodeType;
      if (e === 1 || e === 3) break;
      if (e === 8) {
        if (
          ((e = l.data),
          e === "$" ||
            e === "$!" ||
            e === "$?" ||
            e === "$~" ||
            e === "&" ||
            e === "F!" ||
            e === "F")
        )
          break;
        if (e === "/$" || e === "/&") return null;
      }
    }
    return l;
  }
  var ns = null;
  function ao(l) {
    l = l.nextSibling;
    for (var e = 0; l;) {
      if (l.nodeType === 8) {
        var t = l.data;
        if (t === "/$" || t === "/&") {
          if (e === 0) return Ae(l.nextSibling);
          e--;
        } else
          (t !== "$" && t !== "$!" && t !== "$?" && t !== "$~" && t !== "&") ||
            e++;
      }
      l = l.nextSibling;
    }
    return null;
  }
  function no(l) {
    l = l.previousSibling;
    for (var e = 0; l;) {
      if (l.nodeType === 8) {
        var t = l.data;
        if (t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&") {
          if (e === 0) return l;
          e--;
        } else (t !== "/$" && t !== "/&") || e++;
      }
      l = l.previousSibling;
    }
    return null;
  }
  function uo(l, e, t) {
    switch (((e = _u(t)), l)) {
      case "html":
        if (((l = e.documentElement), !l)) throw Error(d(452));
        return l;
      case "head":
        if (((l = e.head), !l)) throw Error(d(453));
        return l;
      case "body":
        if (((l = e.body), !l)) throw Error(d(454));
        return l;
      default:
        throw Error(d(451));
    }
  }
  function yn(l) {
    for (var e = l.attributes; e.length;) l.removeAttributeNode(e[0]);
    ii(l);
  }
  var Ee = new Map(),
    io = new Set();
  function Ou(l) {
    return typeof l.getRootNode == "function"
      ? l.getRootNode()
      : l.nodeType === 9
        ? l
        : l.ownerDocument;
  }
  var Ie = L.d;
  L.d = { f: lv, r: ev, D: tv, C: av, L: nv, m: uv, X: cv, S: iv, M: sv };
  function lv() {
    var l = Ie.f(),
      e = Nu();
    return l || e;
  }
  function ev(l) {
    var e = kt(l);
    e !== null && e.tag === 5 && e.type === "form" ? Nd(e) : Ie.r(l);
  }
  var Ea = typeof document > "u" ? null : document;
  function co(l, e, t) {
    var a = Ea;
    if (a && typeof e == "string" && e) {
      var n = ge(e);
      ((n = 'link[rel="' + l + '"][href="' + n + '"]'),
        typeof t == "string" && (n += '[crossorigin="' + t + '"]'),
        io.has(n) ||
          (io.add(n),
          (l = { rel: l, crossOrigin: t, href: e }),
          a.querySelector(n) === null &&
            ((e = a.createElement("link")),
            kl(e, "link", l),
            Ll(e),
            a.head.appendChild(e))));
    }
  }
  function tv(l) {
    (Ie.D(l), co("dns-prefetch", l, null));
  }
  function av(l, e) {
    (Ie.C(l, e), co("preconnect", l, e));
  }
  function nv(l, e, t) {
    Ie.L(l, e, t);
    var a = Ea;
    if (a && l && e) {
      var n = 'link[rel="preload"][as="' + ge(e) + '"]';
      e === "image" && t && t.imageSrcSet
        ? ((n += '[imagesrcset="' + ge(t.imageSrcSet) + '"]'),
          typeof t.imageSizes == "string" &&
            (n += '[imagesizes="' + ge(t.imageSizes) + '"]'))
        : (n += '[href="' + ge(l) + '"]');
      var u = n;
      switch (e) {
        case "style":
          u = Ta(l);
          break;
        case "script":
          u = za(l);
      }
      Ee.has(u) ||
        ((l = R(
          {
            rel: "preload",
            href: e === "image" && t && t.imageSrcSet ? void 0 : l,
            as: e,
          },
          t,
        )),
        Ee.set(u, l),
        a.querySelector(n) !== null ||
          (e === "style" && a.querySelector(gn(u))) ||
          (e === "script" && a.querySelector(pn(u))) ||
          ((e = a.createElement("link")),
          kl(e, "link", l),
          Ll(e),
          a.head.appendChild(e)));
    }
  }
  function uv(l, e) {
    Ie.m(l, e);
    var t = Ea;
    if (t && l) {
      var a = e && typeof e.as == "string" ? e.as : "script",
        n =
          'link[rel="modulepreload"][as="' + ge(a) + '"][href="' + ge(l) + '"]',
        u = n;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          u = za(l);
      }
      if (
        !Ee.has(u) &&
        ((l = R({ rel: "modulepreload", href: l }, e)),
        Ee.set(u, l),
        t.querySelector(n) === null)
      ) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (t.querySelector(pn(u))) return;
        }
        ((a = t.createElement("link")),
          kl(a, "link", l),
          Ll(a),
          t.head.appendChild(a));
      }
    }
  }
  function iv(l, e, t) {
    Ie.S(l, e, t);
    var a = Ea;
    if (a && l) {
      var n = Jt(a).hoistableStyles,
        u = Ta(l);
      e = e || "default";
      var c = n.get(u);
      if (!c) {
        var s = { loading: 0, preload: null };
        if ((c = a.querySelector(gn(u)))) s.loading = 5;
        else {
          ((l = R({ rel: "stylesheet", href: l, "data-precedence": e }, t)),
            (t = Ee.get(u)) && us(l, t));
          var r = (c = a.createElement("link"));
          (Ll(r),
            kl(r, "link", l),
            (r._p = new Promise(function (b, A) {
              ((r.onload = b), (r.onerror = A));
            })),
            r.addEventListener("load", function () {
              s.loading |= 1;
            }),
            r.addEventListener("error", function () {
              s.loading |= 2;
            }),
            (s.loading |= 4),
            Uu(c, e, a));
        }
        ((c = { type: "stylesheet", instance: c, count: 1, state: s }),
          n.set(u, c));
      }
    }
  }
  function cv(l, e) {
    Ie.X(l, e);
    var t = Ea;
    if (t && l) {
      var a = Jt(t).hoistableScripts,
        n = za(l),
        u = a.get(n);
      u ||
        ((u = t.querySelector(pn(n))),
        u ||
          ((l = R({ src: l, async: !0 }, e)),
          (e = Ee.get(n)) && is(l, e),
          (u = t.createElement("script")),
          Ll(u),
          kl(u, "link", l),
          t.head.appendChild(u)),
        (u = { type: "script", instance: u, count: 1, state: null }),
        a.set(n, u));
    }
  }
  function sv(l, e) {
    Ie.M(l, e);
    var t = Ea;
    if (t && l) {
      var a = Jt(t).hoistableScripts,
        n = za(l),
        u = a.get(n);
      u ||
        ((u = t.querySelector(pn(n))),
        u ||
          ((l = R({ src: l, async: !0, type: "module" }, e)),
          (e = Ee.get(n)) && is(l, e),
          (u = t.createElement("script")),
          Ll(u),
          kl(u, "link", l),
          t.head.appendChild(u)),
        (u = { type: "script", instance: u, count: 1, state: null }),
        a.set(n, u));
    }
  }
  function so(l, e, t, a) {
    var n = (n = ul.current) ? Ou(n) : null;
    if (!n) throw Error(d(446));
    switch (l) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof t.precedence == "string" && typeof t.href == "string"
          ? ((e = Ta(t.href)),
            (t = Jt(n).hoistableStyles),
            (a = t.get(e)),
            a ||
              ((a = { type: "style", instance: null, count: 0, state: null }),
              t.set(e, a)),
            a)
          : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (
          t.rel === "stylesheet" &&
          typeof t.href == "string" &&
          typeof t.precedence == "string"
        ) {
          l = Ta(t.href);
          var u = Jt(n).hoistableStyles,
            c = u.get(l);
          if (
            (c ||
              ((n = n.ownerDocument || n),
              (c = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null },
              }),
              u.set(l, c),
              (u = n.querySelector(gn(l))) &&
                !u._p &&
                ((c.instance = u), (c.state.loading = 5)),
              Ee.has(l) ||
                ((t = {
                  rel: "preload",
                  as: "style",
                  href: t.href,
                  crossOrigin: t.crossOrigin,
                  integrity: t.integrity,
                  media: t.media,
                  hrefLang: t.hrefLang,
                  referrerPolicy: t.referrerPolicy,
                }),
                Ee.set(l, t),
                u || fv(n, l, t, c.state))),
            e && a === null)
          )
            throw Error(d(528, ""));
          return c;
        }
        if (e && a !== null) throw Error(d(529, ""));
        return null;
      case "script":
        return (
          (e = t.async),
          (t = t.src),
          typeof t == "string" &&
          e &&
          typeof e != "function" &&
          typeof e != "symbol"
            ? ((e = za(t)),
              (t = Jt(n).hoistableScripts),
              (a = t.get(e)),
              a ||
                ((a = {
                  type: "script",
                  instance: null,
                  count: 0,
                  state: null,
                }),
                t.set(e, a)),
              a)
            : { type: "void", instance: null, count: 0, state: null }
        );
      default:
        throw Error(d(444, l));
    }
  }
  function Ta(l) {
    return 'href="' + ge(l) + '"';
  }
  function gn(l) {
    return 'link[rel="stylesheet"][' + l + "]";
  }
  function fo(l) {
    return R({}, l, { "data-precedence": l.precedence, precedence: null });
  }
  function fv(l, e, t, a) {
    l.querySelector('link[rel="preload"][as="style"][' + e + "]")
      ? (a.loading = 1)
      : ((e = l.createElement("link")),
        (a.preload = e),
        e.addEventListener("load", function () {
          return (a.loading |= 1);
        }),
        e.addEventListener("error", function () {
          return (a.loading |= 2);
        }),
        kl(e, "link", t),
        Ll(e),
        l.head.appendChild(e));
  }
  function za(l) {
    return '[src="' + ge(l) + '"]';
  }
  function pn(l) {
    return "script[async]" + l;
  }
  function ro(l, e, t) {
    if ((e.count++, e.instance === null))
      switch (e.type) {
        case "style":
          var a = l.querySelector('style[data-href~="' + ge(t.href) + '"]');
          if (a) return ((e.instance = a), Ll(a), a);
          var n = R({}, t, {
            "data-href": t.href,
            "data-precedence": t.precedence,
            href: null,
            precedence: null,
          });
          return (
            (a = (l.ownerDocument || l).createElement("style")),
            Ll(a),
            kl(a, "style", n),
            Uu(a, t.precedence, l),
            (e.instance = a)
          );
        case "stylesheet":
          n = Ta(t.href);
          var u = l.querySelector(gn(n));
          if (u) return ((e.state.loading |= 4), (e.instance = u), Ll(u), u);
          ((a = fo(t)),
            (n = Ee.get(n)) && us(a, n),
            (u = (l.ownerDocument || l).createElement("link")),
            Ll(u));
          var c = u;
          return (
            (c._p = new Promise(function (s, r) {
              ((c.onload = s), (c.onerror = r));
            })),
            kl(u, "link", a),
            (e.state.loading |= 4),
            Uu(u, t.precedence, l),
            (e.instance = u)
          );
        case "script":
          return (
            (u = za(t.src)),
            (n = l.querySelector(pn(u)))
              ? ((e.instance = n), Ll(n), n)
              : ((a = t),
                (n = Ee.get(u)) && ((a = R({}, t)), is(a, n)),
                (l = l.ownerDocument || l),
                (n = l.createElement("script")),
                Ll(n),
                kl(n, "link", a),
                l.head.appendChild(n),
                (e.instance = n))
          );
        case "void":
          return null;
        default:
          throw Error(d(443, e.type));
      }
    else
      e.type === "stylesheet" &&
        (e.state.loading & 4) === 0 &&
        ((a = e.instance), (e.state.loading |= 4), Uu(a, t.precedence, l));
    return e.instance;
  }
  function Uu(l, e, t) {
    for (
      var a = t.querySelectorAll(
          'link[rel="stylesheet"][data-precedence],style[data-precedence]',
        ),
        n = a.length ? a[a.length - 1] : null,
        u = n,
        c = 0;
      c < a.length;
      c++
    ) {
      var s = a[c];
      if (s.dataset.precedence === e) u = s;
      else if (u !== n) break;
    }
    u
      ? u.parentNode.insertBefore(l, u.nextSibling)
      : ((e = t.nodeType === 9 ? t.head : t), e.insertBefore(l, e.firstChild));
  }
  function us(l, e) {
    (l.crossOrigin == null && (l.crossOrigin = e.crossOrigin),
      l.referrerPolicy == null && (l.referrerPolicy = e.referrerPolicy),
      l.title == null && (l.title = e.title));
  }
  function is(l, e) {
    (l.crossOrigin == null && (l.crossOrigin = e.crossOrigin),
      l.referrerPolicy == null && (l.referrerPolicy = e.referrerPolicy),
      l.integrity == null && (l.integrity = e.integrity));
  }
  var Ru = null;
  function oo(l, e, t) {
    if (Ru === null) {
      var a = new Map(),
        n = (Ru = new Map());
      n.set(t, a);
    } else ((n = Ru), (a = n.get(t)), a || ((a = new Map()), n.set(t, a)));
    if (a.has(l)) return a;
    for (
      a.set(l, null), t = t.getElementsByTagName(l), n = 0;
      n < t.length;
      n++
    ) {
      var u = t[n];
      if (
        !(
          u[Ua] ||
          u[Ql] ||
          (l === "link" && u.getAttribute("rel") === "stylesheet")
        ) &&
        u.namespaceURI !== "http://www.w3.org/2000/svg"
      ) {
        var c = u.getAttribute(e) || "";
        c = l + c;
        var s = a.get(c);
        s ? s.push(u) : a.set(c, [u]);
      }
    }
    return a;
  }
  function ho(l, e, t) {
    ((l = l.ownerDocument || l),
      l.head.insertBefore(
        t,
        e === "title" ? l.querySelector("head > title") : null,
      ));
  }
  function dv(l, e, t) {
    if (t === 1 || e.itemProp != null) return !1;
    switch (l) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (
          typeof e.precedence != "string" ||
          typeof e.href != "string" ||
          e.href === ""
        )
          break;
        return !0;
      case "link":
        if (
          typeof e.rel != "string" ||
          typeof e.href != "string" ||
          e.href === "" ||
          e.onLoad ||
          e.onError
        )
          break;
        return e.rel === "stylesheet"
          ? ((l = e.disabled), typeof e.precedence == "string" && l == null)
          : !0;
      case "script":
        if (
          e.async &&
          typeof e.async != "function" &&
          typeof e.async != "symbol" &&
          !e.onLoad &&
          !e.onError &&
          e.src &&
          typeof e.src == "string"
        )
          return !0;
    }
    return !1;
  }
  function mo(l) {
    return !(l.type === "stylesheet" && (l.state.loading & 3) === 0);
  }
  function rv(l, e, t, a) {
    if (
      t.type === "stylesheet" &&
      (typeof a.media != "string" || matchMedia(a.media).matches !== !1) &&
      (t.state.loading & 4) === 0
    ) {
      if (t.instance === null) {
        var n = Ta(a.href),
          u = e.querySelector(gn(n));
        if (u) {
          ((e = u._p),
            e !== null &&
              typeof e == "object" &&
              typeof e.then == "function" &&
              (l.count++, (l = Hu.bind(l)), e.then(l, l)),
            (t.state.loading |= 4),
            (t.instance = u),
            Ll(u));
          return;
        }
        ((u = e.ownerDocument || e),
          (a = fo(a)),
          (n = Ee.get(n)) && us(a, n),
          (u = u.createElement("link")),
          Ll(u));
        var c = u;
        ((c._p = new Promise(function (s, r) {
          ((c.onload = s), (c.onerror = r));
        })),
          kl(u, "link", a),
          (t.instance = u));
      }
      (l.stylesheets === null && (l.stylesheets = new Map()),
        l.stylesheets.set(t, e),
        (e = t.state.preload) &&
          (t.state.loading & 3) === 0 &&
          (l.count++,
          (t = Hu.bind(l)),
          e.addEventListener("load", t),
          e.addEventListener("error", t)));
    }
  }
  var cs = 0;
  function ov(l, e) {
    return (
      l.stylesheets && l.count === 0 && qu(l, l.stylesheets),
      0 < l.count || 0 < l.imgCount
        ? function (t) {
            var a = setTimeout(function () {
              if ((l.stylesheets && qu(l, l.stylesheets), l.unsuspend)) {
                var u = l.unsuspend;
                ((l.unsuspend = null), u());
              }
            }, 6e4 + e);
            0 < l.imgBytes && cs === 0 && (cs = 62500 * Vm());
            var n = setTimeout(
              function () {
                if (
                  ((l.waitingForImages = !1),
                  l.count === 0 &&
                    (l.stylesheets && qu(l, l.stylesheets), l.unsuspend))
                ) {
                  var u = l.unsuspend;
                  ((l.unsuspend = null), u());
                }
              },
              (l.imgBytes > cs ? 50 : 800) + e,
            );
            return (
              (l.unsuspend = t),
              function () {
                ((l.unsuspend = null), clearTimeout(a), clearTimeout(n));
              }
            );
          }
        : null
    );
  }
  function Hu() {
    if (
      (this.count--,
      this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))
    ) {
      if (this.stylesheets) qu(this, this.stylesheets);
      else if (this.unsuspend) {
        var l = this.unsuspend;
        ((this.unsuspend = null), l());
      }
    }
  }
  var Bu = null;
  function qu(l, e) {
    ((l.stylesheets = null),
      l.unsuspend !== null &&
        (l.count++,
        (Bu = new Map()),
        e.forEach(hv, l),
        (Bu = null),
        Hu.call(l)));
  }
  function hv(l, e) {
    if (!(e.state.loading & 4)) {
      var t = Bu.get(l);
      if (t) var a = t.get(null);
      else {
        ((t = new Map()), Bu.set(l, t));
        for (
          var n = l.querySelectorAll(
              "link[data-precedence],style[data-precedence]",
            ),
            u = 0;
          u < n.length;
          u++
        ) {
          var c = n[u];
          (c.nodeName === "LINK" || c.getAttribute("media") !== "not all") &&
            (t.set(c.dataset.precedence, c), (a = c));
        }
        a && t.set(null, a);
      }
      ((n = e.instance),
        (c = n.getAttribute("data-precedence")),
        (u = t.get(c) || a),
        u === a && t.set(null, n),
        t.set(c, n),
        this.count++,
        (a = Hu.bind(this)),
        n.addEventListener("load", a),
        n.addEventListener("error", a),
        u
          ? u.parentNode.insertBefore(n, u.nextSibling)
          : ((l = l.nodeType === 9 ? l.head : l),
            l.insertBefore(n, l.firstChild)),
        (e.state.loading |= 4));
    }
  }
  var bn = {
    $$typeof: ol,
    Provider: null,
    Consumer: null,
    _currentValue: $,
    _currentValue2: $,
    _threadCount: 0,
  };
  function mv(l, e, t, a, n, u, c, s, r) {
    ((this.tag = 1),
      (this.containerInfo = l),
      (this.pingCache = this.current = this.pendingChildren = null),
      (this.timeoutHandle = -1),
      (this.callbackNode =
        this.next =
        this.pendingContext =
        this.context =
        this.cancelPendingCommit =
          null),
      (this.callbackPriority = 0),
      (this.expirationTimes = ti(-1)),
      (this.entangledLanes =
        this.shellSuspendCounter =
        this.errorRecoveryDisabledLanes =
        this.expiredLanes =
        this.warmLanes =
        this.pingedLanes =
        this.suspendedLanes =
        this.pendingLanes =
          0),
      (this.entanglements = ti(0)),
      (this.hiddenUpdates = ti(null)),
      (this.identifierPrefix = a),
      (this.onUncaughtError = n),
      (this.onCaughtError = u),
      (this.onRecoverableError = c),
      (this.pooledCache = null),
      (this.pooledCacheLanes = 0),
      (this.formState = r),
      (this.incompleteTransitions = new Map()));
  }
  function vo(l, e, t, a, n, u, c, s, r, b, A, M) {
    return (
      (l = new mv(l, e, t, c, r, b, A, M, s)),
      (e = 1),
      u === !0 && (e |= 24),
      (u = de(3, null, null, e)),
      (l.current = u),
      (u.stateNode = l),
      (e = Li()),
      e.refCount++,
      (l.pooledCache = e),
      e.refCount++,
      (u.memoizedState = { element: a, isDehydrated: t, cache: e }),
      Zi(u),
      l
    );
  }
  function yo(l) {
    return l ? ((l = na), l) : na;
  }
  function go(l, e, t, a, n, u) {
    ((n = yo(n)),
      a.context === null ? (a.context = n) : (a.pendingContext = n),
      (a = ct(e)),
      (a.payload = { element: t }),
      (u = u === void 0 ? null : u),
      u !== null && (a.callback = u),
      (t = st(l, a, e)),
      t !== null && (ne(t, l, e), Wa(t, l, e)));
  }
  function po(l, e) {
    if (((l = l.memoizedState), l !== null && l.dehydrated !== null)) {
      var t = l.retryLane;
      l.retryLane = t !== 0 && t < e ? t : e;
    }
  }
  function ss(l, e) {
    (po(l, e), (l = l.alternate) && po(l, e));
  }
  function bo(l) {
    if (l.tag === 13 || l.tag === 31) {
      var e = _t(l, 67108864);
      (e !== null && ne(e, l, 67108864), ss(l, 67108864));
    }
  }
  function So(l) {
    if (l.tag === 13 || l.tag === 31) {
      var e = ve();
      e = ai(e);
      var t = _t(l, e);
      (t !== null && ne(t, l, e), ss(l, e));
    }
  }
  var Yu = !0;
  function vv(l, e, t, a) {
    var n = T.T;
    T.T = null;
    var u = L.p;
    try {
      ((L.p = 2), fs(l, e, t, a));
    } finally {
      ((L.p = u), (T.T = n));
    }
  }
  function yv(l, e, t, a) {
    var n = T.T;
    T.T = null;
    var u = L.p;
    try {
      ((L.p = 8), fs(l, e, t, a));
    } finally {
      ((L.p = u), (T.T = n));
    }
  }
  function fs(l, e, t, a) {
    if (Yu) {
      var n = ds(a);
      if (n === null) ($c(l, e, a, wu, t), jo(l, a));
      else if (pv(n, l, e, t, a)) a.stopPropagation();
      else if ((jo(l, a), e & 4 && -1 < gv.indexOf(l))) {
        for (; n !== null;) {
          var u = kt(n);
          if (u !== null)
            switch (u.tag) {
              case 3:
                if (((u = u.stateNode), u.current.memoizedState.isDehydrated)) {
                  var c = Tt(u.pendingLanes);
                  if (c !== 0) {
                    var s = u;
                    for (s.pendingLanes |= 2, s.entangledLanes |= 2; c;) {
                      var r = 1 << (31 - se(c));
                      ((s.entanglements[1] |= r), (c &= ~r));
                    }
                    (Ue(u), (vl & 6) === 0 && ((xu = ie() + 500), hn(0)));
                  }
                }
                break;
              case 31:
              case 13:
                ((s = _t(u, 2)), s !== null && ne(s, u, 2), Nu(), ss(u, 2));
            }
          if (((u = ds(a)), u === null && $c(l, e, a, wu, t), u === n)) break;
          n = u;
        }
        n !== null && a.stopPropagation();
      } else $c(l, e, a, null, t);
    }
  }
  function ds(l) {
    return ((l = oi(l)), rs(l));
  }
  var wu = null;
  function rs(l) {
    if (((wu = null), (l = Vt(l)), l !== null)) {
      var e = E(l);
      if (e === null) l = null;
      else {
        var t = e.tag;
        if (t === 13) {
          if (((l = D(e)), l !== null)) return l;
          l = null;
        } else if (t === 31) {
          if (((l = w(e)), l !== null)) return l;
          l = null;
        } else if (t === 3) {
          if (e.stateNode.current.memoizedState.isDehydrated)
            return e.tag === 3 ? e.stateNode.containerInfo : null;
          l = null;
        } else e !== l && (l = null);
      }
    }
    return ((wu = l), null);
  }
  function xo(l) {
    switch (l) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (th()) {
          case zs:
            return 2;
          case Ms:
            return 8;
          case Mn:
          case ah:
            return 32;
          case Ds:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var os = !1,
    bt = null,
    St = null,
    xt = null,
    Sn = new Map(),
    xn = new Map(),
    jt = [],
    gv =
      "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " ",
      );
  function jo(l, e) {
    switch (l) {
      case "focusin":
      case "focusout":
        bt = null;
        break;
      case "dragenter":
      case "dragleave":
        St = null;
        break;
      case "mouseover":
      case "mouseout":
        xt = null;
        break;
      case "pointerover":
      case "pointerout":
        Sn.delete(e.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        xn.delete(e.pointerId);
    }
  }
  function jn(l, e, t, a, n, u) {
    return l === null || l.nativeEvent !== u
      ? ((l = {
          blockedOn: e,
          domEventName: t,
          eventSystemFlags: a,
          nativeEvent: u,
          targetContainers: [n],
        }),
        e !== null && ((e = kt(e)), e !== null && bo(e)),
        l)
      : ((l.eventSystemFlags |= a),
        (e = l.targetContainers),
        n !== null && e.indexOf(n) === -1 && e.push(n),
        l);
  }
  function pv(l, e, t, a, n) {
    switch (e) {
      case "focusin":
        return ((bt = jn(bt, l, e, t, a, n)), !0);
      case "dragenter":
        return ((St = jn(St, l, e, t, a, n)), !0);
      case "mouseover":
        return ((xt = jn(xt, l, e, t, a, n)), !0);
      case "pointerover":
        var u = n.pointerId;
        return (Sn.set(u, jn(Sn.get(u) || null, l, e, t, a, n)), !0);
      case "gotpointercapture":
        return (
          (u = n.pointerId),
          xn.set(u, jn(xn.get(u) || null, l, e, t, a, n)),
          !0
        );
    }
    return !1;
  }
  function No(l) {
    var e = Vt(l.target);
    if (e !== null) {
      var t = E(e);
      if (t !== null) {
        if (((e = t.tag), e === 13)) {
          if (((e = D(t)), e !== null)) {
            ((l.blockedOn = e),
              Hs(l.priority, function () {
                So(t);
              }));
            return;
          }
        } else if (e === 31) {
          if (((e = w(t)), e !== null)) {
            ((l.blockedOn = e),
              Hs(l.priority, function () {
                So(t);
              }));
            return;
          }
        } else if (e === 3 && t.stateNode.current.memoizedState.isDehydrated) {
          l.blockedOn = t.tag === 3 ? t.stateNode.containerInfo : null;
          return;
        }
      }
    }
    l.blockedOn = null;
  }
  function Lu(l) {
    if (l.blockedOn !== null) return !1;
    for (var e = l.targetContainers; 0 < e.length;) {
      var t = ds(l.nativeEvent);
      if (t === null) {
        t = l.nativeEvent;
        var a = new t.constructor(t.type, t);
        ((ri = a), t.target.dispatchEvent(a), (ri = null));
      } else return ((e = kt(t)), e !== null && bo(e), (l.blockedOn = t), !1);
      e.shift();
    }
    return !0;
  }
  function Ao(l, e, t) {
    Lu(l) && t.delete(e);
  }
  function bv() {
    ((os = !1),
      bt !== null && Lu(bt) && (bt = null),
      St !== null && Lu(St) && (St = null),
      xt !== null && Lu(xt) && (xt = null),
      Sn.forEach(Ao),
      xn.forEach(Ao));
  }
  function Gu(l, e) {
    l.blockedOn === e &&
      ((l.blockedOn = null),
      os ||
        ((os = !0),
        f.unstable_scheduleCallback(f.unstable_NormalPriority, bv)));
  }
  var Xu = null;
  function Eo(l) {
    Xu !== l &&
      ((Xu = l),
      f.unstable_scheduleCallback(f.unstable_NormalPriority, function () {
        Xu === l && (Xu = null);
        for (var e = 0; e < l.length; e += 3) {
          var t = l[e],
            a = l[e + 1],
            n = l[e + 2];
          if (typeof a != "function") {
            if (rs(a || t) === null) continue;
            break;
          }
          var u = kt(t);
          u !== null &&
            (l.splice(e, 3),
            (e -= 3),
            dc(u, { pending: !0, data: n, method: t.method, action: a }, a, n));
        }
      }));
  }
  function Ma(l) {
    function e(r) {
      return Gu(r, l);
    }
    (bt !== null && Gu(bt, l),
      St !== null && Gu(St, l),
      xt !== null && Gu(xt, l),
      Sn.forEach(e),
      xn.forEach(e));
    for (var t = 0; t < jt.length; t++) {
      var a = jt[t];
      a.blockedOn === l && (a.blockedOn = null);
    }
    for (; 0 < jt.length && ((t = jt[0]), t.blockedOn === null);)
      (No(t), t.blockedOn === null && jt.shift());
    if (((t = (l.ownerDocument || l).$$reactFormReplay), t != null))
      for (a = 0; a < t.length; a += 3) {
        var n = t[a],
          u = t[a + 1],
          c = n[Il] || null;
        if (typeof u == "function") c || Eo(t);
        else if (c) {
          var s = null;
          if (u && u.hasAttribute("formAction")) {
            if (((n = u), (c = u[Il] || null))) s = c.formAction;
            else if (rs(n) !== null) continue;
          } else s = c.action;
          (typeof s == "function" ? (t[a + 1] = s) : (t.splice(a, 3), (a -= 3)),
            Eo(t));
        }
      }
  }
  function To() {
    function l(u) {
      u.canIntercept &&
        u.info === "react-transition" &&
        u.intercept({
          handler: function () {
            return new Promise(function (c) {
              return (n = c);
            });
          },
          focusReset: "manual",
          scroll: "manual",
        });
    }
    function e() {
      (n !== null && (n(), (n = null)), a || setTimeout(t, 20));
    }
    function t() {
      if (!a && !navigation.transition) {
        var u = navigation.currentEntry;
        u &&
          u.url != null &&
          navigation.navigate(u.url, {
            state: u.getState(),
            info: "react-transition",
            history: "replace",
          });
      }
    }
    if (typeof navigation == "object") {
      var a = !1,
        n = null;
      return (
        navigation.addEventListener("navigate", l),
        navigation.addEventListener("navigatesuccess", e),
        navigation.addEventListener("navigateerror", e),
        setTimeout(t, 100),
        function () {
          ((a = !0),
            navigation.removeEventListener("navigate", l),
            navigation.removeEventListener("navigatesuccess", e),
            navigation.removeEventListener("navigateerror", e),
            n !== null && (n(), (n = null)));
        }
      );
    }
  }
  function hs(l) {
    this._internalRoot = l;
  }
  ((Qu.prototype.render = hs.prototype.render =
    function (l) {
      var e = this._internalRoot;
      if (e === null) throw Error(d(409));
      var t = e.current,
        a = ve();
      go(t, a, l, e, null, null);
    }),
    (Qu.prototype.unmount = hs.prototype.unmount =
      function () {
        var l = this._internalRoot;
        if (l !== null) {
          this._internalRoot = null;
          var e = l.containerInfo;
          (go(l.current, 2, null, l, null, null), Nu(), (e[Kt] = null));
        }
      }));
  function Qu(l) {
    this._internalRoot = l;
  }
  Qu.prototype.unstable_scheduleHydration = function (l) {
    if (l) {
      var e = Rs();
      l = { blockedOn: null, target: l, priority: e };
      for (var t = 0; t < jt.length && e !== 0 && e < jt[t].priority; t++);
      (jt.splice(t, 0, l), t === 0 && No(l));
    }
  };
  var zo = o.version;
  if (zo !== "19.2.7") throw Error(d(527, zo, "19.2.7"));
  L.findDOMNode = function (l) {
    var e = l._reactInternals;
    if (e === void 0)
      throw typeof l.render == "function"
        ? Error(d(188))
        : ((l = Object.keys(l).join(",")), Error(d(268, l)));
    return (
      (l = g(e)),
      (l = l !== null ? B(l) : null),
      (l = l === null ? null : l.stateNode),
      l
    );
  };
  var Sv = {
    bundleType: 0,
    version: "19.2.7",
    rendererPackageName: "react-dom",
    currentDispatcherRef: T,
    reconcilerVersion: "19.2.7",
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Zu = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Zu.isDisabled && Zu.supportsFiber)
      try {
        ((Ca = Zu.inject(Sv)), (ce = Zu));
      } catch {}
  }
  return (
    (An.createRoot = function (l, e) {
      if (!x(l)) throw Error(d(299));
      var t = !1,
        a = "",
        n = Ud,
        u = Rd,
        c = Hd;
      return (
        e != null &&
          (e.unstable_strictMode === !0 && (t = !0),
          e.identifierPrefix !== void 0 && (a = e.identifierPrefix),
          e.onUncaughtError !== void 0 && (n = e.onUncaughtError),
          e.onCaughtError !== void 0 && (u = e.onCaughtError),
          e.onRecoverableError !== void 0 && (c = e.onRecoverableError)),
        (e = vo(l, 1, !1, null, null, t, a, null, n, u, c, To)),
        (l[Kt] = e.current),
        Jc(l),
        new hs(e)
      );
    }),
    (An.hydrateRoot = function (l, e, t) {
      if (!x(l)) throw Error(d(299));
      var a = !1,
        n = "",
        u = Ud,
        c = Rd,
        s = Hd,
        r = null;
      return (
        t != null &&
          (t.unstable_strictMode === !0 && (a = !0),
          t.identifierPrefix !== void 0 && (n = t.identifierPrefix),
          t.onUncaughtError !== void 0 && (u = t.onUncaughtError),
          t.onCaughtError !== void 0 && (c = t.onCaughtError),
          t.onRecoverableError !== void 0 && (s = t.onRecoverableError),
          t.formState !== void 0 && (r = t.formState)),
        (e = vo(l, 1, !0, e, t ?? null, a, n, r, u, c, s, To)),
        (e.context = yo(null)),
        (t = e.current),
        (a = ve()),
        (a = ai(a)),
        (n = ct(a)),
        (n.callback = null),
        st(t, n, a),
        (t = a),
        (e.current.lanes = t),
        Oa(e, t),
        Ue(e),
        (l[Kt] = e.current),
        Jc(l),
        new Qu(e)
      );
    }),
    (An.version = "19.2.7"),
    An
  );
}
var qo;
function Ov() {
  if (qo) return ys.exports;
  qo = 1;
  function f() {
    if (!(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    ))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(f);
      } catch (o) {
        console.error(o);
      }
  }
  return (f(), (ys.exports = _v()), ys.exports);
}
var Uv = Ov();
const Rv = { system: "◐", light: "☀", dark: "☾" },
  Yo = { system: "System theme", light: "Light theme", dark: "Dark theme" };
function Hv({
  view: f,
  onNavigate: o,
  providers: v,
  keys: d,
  accountCount: x,
  themePref: E,
  onCycleTheme: D,
}) {
  const w = (g) => (d ?? []).filter((B) => B.record.provider === g).length,
    C = (g) => {
      const B = (d ?? []).filter((R) => R.record.provider === g);
      return B.some((R) => R.status === "red")
        ? "red"
        : B.some((R) => R.status === "yellow")
          ? "yellow"
          : null;
    };
  return i.jsxs("nav", {
    className: "sidebar",
    "aria-label": "Primary",
    children: [
      i.jsxs("div", {
        className: "sidebar-brand",
        children: [
          i.jsx("svg", {
            className: "brand-mark",
            viewBox: "0 0 24 24",
            "aria-hidden": "true",
            children: i.jsx("path", {
              d: "M12 2l2.1 6.3L20 6l-3.9 5 5.9 1-5.9 1L20 18l-5.9-2.3L12 22l-2.1-6.3L4 18l3.9-5L2 12l5.9-1L4 6l5.9 2.3z",
              fill: "currentColor",
            }),
          }),
          i.jsx("span", {
            className: "sidebar-title",
            children: "Account Manager",
          }),
        ],
      }),
      i.jsxs("div", {
        className: "sidebar-section",
        children: [
          i.jsx("div", {
            className: "sidebar-heading",
            children: "Claude Code",
          }),
          i.jsx(Zt, {
            active: f === "dashboard",
            onClick: () => o("dashboard"),
            icon: "⌂",
            label: "Dashboard",
          }),
          i.jsx(Zt, {
            active: f === "accounts",
            onClick: () => o("accounts"),
            icon: "◍",
            label: "Other Accounts",
            badge: x ?? void 0,
          }),
          i.jsx(Zt, {
            active: f === "skills-sync",
            onClick: () => o("skills-sync"),
            icon: "⇄",
            label: "Skills Sync",
          }),
        ],
      }),
      i.jsxs("div", {
        className: "sidebar-section",
        children: [
          i.jsx("div", {
            className: "sidebar-heading",
            children: "API Analytics",
          }),
          i.jsx(Zt, {
            active: f === "api-dashboard",
            onClick: () => o("api-dashboard"),
            icon: "▦",
            label: "Dashboard",
          }),
          i.jsx(Zt, {
            active: f === "api-keys",
            onClick: () => o("api-keys"),
            icon: "🔑",
            label: "API Keys",
            badge: d?.length ?? void 0,
          }),
          i.jsx(Zt, {
            active: f === "analytics",
            onClick: () => o("analytics"),
            icon: "📈",
            label: "Analytics",
          }),
        ],
      }),
      i.jsxs("div", {
        className: "sidebar-section",
        children: [
          i.jsx("div", { className: "sidebar-heading", children: "Providers" }),
          v.map((g) =>
            i.jsx(
              Zt,
              {
                active: f === `provider:${g.id}`,
                onClick: () => o(`provider:${g.id}`),
                dot: g.accent,
                label: g.displayName,
                badge: w(g.id) || void 0,
                status: C(g.id),
              },
              g.id,
            ),
          ),
        ],
      }),
      i.jsx("div", {
        className: "sidebar-foot",
        children: i.jsx("button", {
          className: "btn btn-icon",
          onClick: D,
          title: Yo[E],
          "aria-label": Yo[E],
          children: Rv[E],
        }),
      }),
    ],
  });
}
function Zt({
  active: f,
  onClick: o,
  icon: v,
  dot: d,
  label: x,
  badge: E,
  status: D,
}) {
  return i.jsxs("button", {
    className: "nav-item",
    "data-active": f || void 0,
    onClick: o,
    children: [
      d
        ? i.jsx("span", { className: "nav-dot", style: { background: d } })
        : i.jsx("span", {
            className: "nav-icon",
            "aria-hidden": "true",
            children: v ?? "•",
          }),
      i.jsx("span", { className: "nav-label", children: x }),
      D &&
        i.jsx("span", {
          className: "nav-status-dot",
          "data-kind": D,
          "aria-hidden": "true",
        }),
      E !== void 0 && i.jsx("span", { className: "nav-badge", children: E }),
    ],
  });
}
function Ns({ children: f, onClose: o }) {
  return (
    q.useEffect(() => {
      const v = (d) => d.key === "Escape" && o();
      return (
        document.addEventListener("keydown", v),
        () => document.removeEventListener("keydown", v)
      );
    }, [o]),
    i.jsx("div", {
      className: "overlay",
      onMouseDown: (v) => v.target === v.currentTarget && o(),
      children: i.jsx("div", {
        className: "dialog",
        role: "dialog",
        "aria-modal": "true",
        children: f,
      }),
    })
  );
}
function Bv({ providers: f, initialProvider: o, onClose: v, onDone: d }) {
  const [x, E] = q.useState(o ?? f[0]?.id ?? "openrouter"),
    [D, w] = q.useState(""),
    [C, g] = q.useState(""),
    [B, R] = q.useState(!1),
    [_, Y] = q.useState(""),
    [U, H] = q.useState(!1),
    [N, K] = q.useState(null),
    [nl, ol] = q.useState(!1),
    [sl, k] = q.useState(null),
    [permissionReport, setPermissionReport] = q.useState(null),
    [validatedSecret, setValidatedSecret] = q.useState(""),
    al = q.useMemo(() => f.find((F) => F.id === x), [f, x]),
    W = async () => {
      (ol(!0), K(null), k(null), setPermissionReport(null));
      try {
        const F = await window.cam.apiKeys.validate(x, C);
        setPermissionReport(F);
        F.ok
          ? (k(`${F.keyKind ?? "Valid key"} verified ✓`),
            setValidatedSecret(C),
            R(Boolean(F.isAdminKey)))
          : K(F.error ?? "Validation failed.");
      } finally {
        ol(!1);
      }
    },
    P = async () => {
      (ol(!0), K(null));
      try {
        if (!permissionReport?.ok || validatedSecret !== C) {
          K(
            "Validate this exact key and review its permissions before saving.",
          );
          return;
        }
        const F = _.trim() ? Number(_) : null;
        if (F !== null && (!Number.isFinite(F) || F < 0)) {
          K("Monthly budget must be a positive number.");
          return;
        }
        const Ml = await window.cam.apiKeys.add({
          provider: x,
          nickname: D,
          secret: C,
          isAdminKey: B,
          monthlyBudgetUsd: F,
        });
        if (!Ml.ok || !Ml.record) {
          K(Ml.error ?? "Failed to add key.");
          return;
        }
        d(`Added "${Ml.record.nickname}".`);
      } finally {
        ol(!1);
      }
    },
    Xl =
      D.trim() &&
      C.trim() &&
      !nl &&
      permissionReport?.ok &&
      validatedSecret === C;
  return i.jsxs(Ns, {
    onClose: v,
    children: [
      i.jsx("h2", { children: "Add API key" }),
      i.jsxs("div", {
        className: "setup-steps",
        children: [
          i.jsx("span", { "data-active": !0, children: "1 Provider" }),
          i.jsx("span", {
            "data-active": Boolean(C.trim()),
            children: "2 Verify permissions",
          }),
          i.jsx("span", {
            "data-active": Boolean(Xl),
            children: "3 Save",
          }),
        ],
      }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Provider" }),
          i.jsx("div", {
            className: "provider-choice",
            children: f.map((F) =>
              i.jsx(
                "button",
                {
                  type: "button",
                  className: "provider-pill",
                  "data-active": F.id === x || void 0,
                  style: { "--pill-accent": F.accent },
                  onClick: () => {
                    (E(F.id),
                      setPermissionReport(null),
                      setValidatedSecret(""),
                      K(null),
                      k(null),
                      R(!1));
                  },
                  children: F.displayName,
                },
                F.id,
              ),
            ),
          }),
        ],
      }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Nickname" }),
          i.jsx("input", {
            autoFocus: !0,
            value: D,
            placeholder: "e.g. Personal OpenRouter",
            onChange: (F) => w(F.target.value),
          }),
        ],
      }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "API key" }),
          i.jsxs("div", {
            className: "pathrow",
            children: [
              i.jsx("input", {
                type: U ? "text" : "password",
                value: C,
                placeholder: al?.keyPrefixes[0]
                  ? `${al.keyPrefixes[0]}…`
                  : "Paste the key",
                onChange: (F) => {
                  (g(F.target.value),
                    k(null),
                    K(null),
                    setPermissionReport(null),
                    setValidatedSecret(""),
                    R(!1));
                },
                autoComplete: "off",
                spellCheck: !1,
              }),
              i.jsx("button", {
                type: "button",
                className: "btn",
                onClick: () => H((F) => !F),
                "aria-label": "Toggle key visibility",
                children: U ? "Hide" : "Show",
              }),
            ],
          }),
        ],
      }),
      al?.supportsAdminKey &&
        i.jsx("div", {
          className: "setup-guidance",
          children:
            "Key type is detected automatically. Organization spend and token analytics require an admin key; project or standard keys remain valid for API calls only.",
        }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Monthly budget (USD, optional)" }),
          i.jsx("input", {
            value: _,
            inputMode: "decimal",
            placeholder: "e.g. 50",
            onChange: (F) => Y(F.target.value),
          }),
        ],
      }),
      i.jsx(qv, { meta: al }),
      permissionReport &&
        i.jsx(PermissionReport, { report: permissionReport, meta: al }),
      sl &&
        i.jsx("div", {
          className: "banner",
          "data-kind": "ok-info",
          children: sl,
        }),
      N &&
        i.jsx("div", { className: "banner", "data-kind": "crit", children: N }),
      i.jsxs("div", {
        className: "dialog-actions",
        children: [
          i.jsx("button", { className: "btn", onClick: v, children: "Cancel" }),
          i.jsx("button", {
            className: "btn",
            onClick: () => {
              W();
            },
            disabled: !C.trim() || nl,
            children: nl ? "Checking…" : "Validate",
          }),
          i.jsx("button", {
            className: "btn btn-primary",
            onClick: () => {
              P();
            },
            disabled: !Xl,
            children: "Add key",
          }),
        ],
      }),
    ],
  });
}
function qv({ meta: f }) {
  if (!f) return null;
  const o = {
      exact: "live",
      admin: "admin key",
      derived: "tracked",
      estimated: "estimated",
      none: "unavailable",
    },
    v = f.capabilities;
  return i.jsxs("p", {
    className: "hint",
    children: [
      "For ",
      f.displayName,
      ": balance ",
      i.jsx("b", { children: o[v.balance] }),
      " · usage ",
      i.jsx("b", { children: o[v.usage] }),
      " · cost",
      " ",
      i.jsx("b", { children: o[v.cost] }),
      " · rate limits ",
      i.jsx("b", { children: o[v.rateLimits] }),
      ". Keys are encrypted with Windows DPAPI and never leave this machine except to ",
      f.displayName,
      "'s own API.",
    ],
  });
}
function PermissionReport({ report: f, meta: o }) {
  const v = Object.entries(f.capabilities ?? {});
  return i.jsxs("section", {
    className: "permission-report",
    "data-ready": f.analyticsReady ? "true" : "false",
    children: [
      i.jsxs("div", {
        className: "permission-report-head",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("span", { children: "Detected key type" }),
              i.jsx("strong", { children: f.keyKind ?? "Unknown" }),
            ],
          }),
          i.jsx("span", {
            className: "permission-readiness",
            "data-kind": f.analyticsReady ? "ok" : f.ok ? "warn" : "crit",
            children: f.analyticsReady
              ? "Analytics ready"
              : f.ok
                ? "Limited analytics"
                : "Not ready",
          }),
        ],
      }),
      i.jsx("div", {
        className: "permission-checks",
        children: (f.checks ?? []).map((d, x) =>
          i.jsxs(
            "div",
            {
              className: "permission-check",
              "data-status": d.status,
              children: [
                i.jsx("span", {
                  className: "permission-check-icon",
                  children:
                    d.status === "pass" ? "✓" : d.status === "fail" ? "!" : "i",
                }),
                i.jsxs("div", {
                  children: [
                    i.jsx("strong", { children: d.label }),
                    d.detail && i.jsx("span", { children: d.detail }),
                  ],
                }),
              ],
            },
            `${d.label}-${x}`,
          ),
        ),
      }),
      v.length > 0 &&
        i.jsx("div", {
          className: "permission-capabilities",
          children: v.map(([d, x]) =>
            i.jsxs(
              "div",
              {
                title: x?.detail ?? "",
                children: [
                  i.jsx("span", { children: d }),
                  i.jsx("b", {
                    "data-value": x?.value,
                    children: x?.value ?? "unknown",
                  }),
                ],
              },
              d,
            ),
          ),
        }),
      f.recommendation &&
        i.jsx("p", {
          className: "permission-recommendation",
          children: f.recommendation,
        }),
      o?.docsUrl &&
        i.jsx("a", {
          className: "permission-doc-link",
          href: o.docsUrl,
          target: "_blank",
          rel: "noreferrer",
          children: "Open provider permission documentation ↗",
        }),
    ],
  });
}
function Qo({ state: f, onClose: o, onDone: v }) {
  const [d, x] = q.useState(f.record.nickname),
    [E, D] = q.useState(
      f.record.monthlyBudgetUsd != null
        ? String(f.record.monthlyBudgetUsd)
        : "",
    ),
    [w, C] = q.useState(!!f.record.isAdminKey),
    [g, B] = q.useState(""),
    [R, _] = q.useState(null),
    [Y, U] = q.useState(!1),
    H = async () => {
      (U(!0), _(null));
      try {
        const N = E.trim() ? Number(E) : null;
        if (N !== null && (!Number.isFinite(N) || N < 0)) {
          _("Monthly budget must be a positive number.");
          return;
        }
        const K = { nickname: d, isAdminKey: w, monthlyBudgetUsd: N };
        g.trim() && (K.secret = g.trim());
        const nl = await window.cam.apiKeys.update(f.record.id, K);
        if (!nl.ok) {
          _(nl.error ?? "Update failed.");
          return;
        }
        v(`Updated "${d}".`);
      } finally {
        U(!1);
      }
    };
  return i.jsxs(Ns, {
    onClose: o,
    children: [
      i.jsxs("h2", { children: ["Edit “", f.record.nickname, "”"] }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Nickname" }),
          i.jsx("input", {
            autoFocus: !0,
            value: d,
            onChange: (N) => x(N.target.value),
          }),
        ],
      }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Monthly budget (USD, optional)" }),
          i.jsx("input", {
            value: E,
            inputMode: "decimal",
            placeholder: "none",
            onChange: (N) => D(N.target.value),
          }),
        ],
      }),
      f.meta.supportsAdminKey &&
        i.jsxs("label", {
          className: "check",
          children: [
            i.jsx("input", {
              type: "checkbox",
              checked: w,
              onChange: (N) => C(N.target.checked),
            }),
            i.jsx("span", { children: "Admin / organization key" }),
          ],
        }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Rotate key (optional)" }),
          i.jsx("input", {
            type: "password",
            value: g,
            placeholder: `Currently ${f.record.maskedKey}`,
            onChange: (N) => B(N.target.value),
            autoComplete: "off",
            spellCheck: !1,
          }),
        ],
      }),
      R &&
        i.jsx("div", { className: "banner", "data-kind": "crit", children: R }),
      i.jsxs("div", {
        className: "dialog-actions",
        children: [
          i.jsx("button", { className: "btn", onClick: o, children: "Cancel" }),
          i.jsx("button", {
            className: "btn btn-primary",
            onClick: () => {
              H();
            },
            disabled: !d.trim() || Y,
            children: "Save",
          }),
        ],
      }),
    ],
  });
}
function Zo({ state: f, onClose: o, onDone: v }) {
  const [d, x] = q.useState(null),
    E = async () => {
      const D = await window.cam.apiKeys.remove(f.record.id);
      D.ok
        ? v(`Removed "${f.record.nickname}".`)
        : x(D.error ?? "Remove failed.");
    };
  return i.jsxs(Ns, {
    onClose: o,
    children: [
      i.jsxs("h2", { children: ["Remove “", f.record.nickname, "”"] }),
      i.jsxs("p", {
        className: "hint",
        children: [
          "This deletes the encrypted key and its local usage history from this machine. It does not affect the key at",
          " ",
          f.meta.displayName,
          " — revoke it there if needed.",
        ],
      }),
      d &&
        i.jsx("div", { className: "banner", "data-kind": "crit", children: d }),
      i.jsxs("div", {
        className: "dialog-actions",
        children: [
          i.jsx("button", { className: "btn", onClick: o, children: "Cancel" }),
          i.jsx("button", {
            className: "btn btn-danger",
            onClick: () => {
              E();
            },
            children: "Remove key",
          }),
        ],
      }),
    ],
  });
}
function Tn(f, o) {
  if (!f) return "never";
  const v = Math.max(0, Math.floor((o - f) / 1e3));
  if (v < 45) return "just now";
  const d = Math.floor(v / 60);
  if (d < 60) return `${d}m ago`;
  const x = Math.floor(d / 60);
  if (x < 24) return `${x}h ago`;
  const E = Math.floor(x / 24);
  return E < 14 ? `${E}d ago` : new Date(f).toLocaleDateString();
}
function Yv(f, o) {
  if (!f) return null;
  const v = Date.parse(f);
  if (!Number.isFinite(v)) return null;
  let d = Math.floor((v - o) / 1e3);
  if (d <= 0) return "now";
  const x = Math.floor(d / 86400);
  d -= x * 86400;
  const E = Math.floor(d / 3600);
  d -= E * 3600;
  const D = Math.floor(d / 60);
  return x > 0
    ? `${x}d ${E}h`
    : E > 0
      ? `${E}h ${String(D).padStart(2, "0")}m`
      : `${D}m`;
}
function wv(f, o = "USD", v = 2) {
  if (f === void 0) return "";
  const d = f / Math.pow(10, v);
  try {
    return new Intl.NumberFormat(void 0, {
      style: "currency",
      currency: o,
    }).format(d);
  } catch {
    return `${d.toFixed(v)} ${o}`;
  }
}
function Ko(f) {
  return f
    ? f >= 1e9
      ? `${(f / 1e9).toFixed(1)}B`
      : f >= 1e6
        ? `${(f / 1e6).toFixed(1)}M`
        : f >= 1e3
          ? `${(f / 1e3).toFixed(1)}k`
          : String(f)
    : "0";
}
function Lv(f) {
  return f ? f.charAt(0).toUpperCase() + f.slice(1) : "";
}
function wl(f, o = {}) {
  if (f == null || !Number.isFinite(f)) return "—";
  const v = Math.abs(f),
    d = v > 0 && v < 1 ? (v < 0.01 ? 4 : 3) : 2,
    x = f.toLocaleString(void 0, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  return o.sign && f > 0 ? `+${x}` : x;
}
function wo(f, o) {
  return f === "cost" ? wl(o) : f === "tokens" ? Ko(o) : o.toLocaleString();
}
function Vo(f) {
  return f === null || !Number.isFinite(f)
    ? "—"
    : f >= 365
      ? "1yr+"
      : f >= 60
        ? `${Math.round(f)}d`
        : `${Math.floor(f)}d`;
}
function ko(f, o) {
  const v = (f || "").toLowerCase();
  return v.includes("crit") ||
    v.includes("exceed") ||
    v.includes("limit") ||
    o >= 100
    ? "crit"
    : v.includes("warn") || v.includes("elevat") || o >= 80
      ? "warn"
      : "ok";
}
function Gv(f) {
  if (!f.identity.loggedIn) return { kind: "off", label: "Logged out" };
  const o = f.usage;
  if (o && !o.ok && o.error?.toLowerCase().includes("expired"))
    return { kind: "crit", label: "Re-login needed" };
  if (!o || o.limits.length === 0)
    return { kind: "unknown", label: "Usage unknown" };
  let v = "ok";
  for (const d of o.limits) {
    const x = ko(d.severity, d.percent);
    x === "crit" ? (v = "crit") : x === "warn" && v !== "crit" && (v = "warn");
  }
  return v === "crit"
    ? { kind: "crit", label: "Rate limited" }
    : v === "warn"
      ? { kind: "warn", label: "Usage high" }
      : { kind: "ok", label: "Active" };
}
function Xv(f) {
  const o = (v) =>
    v.kind === "session"
      ? 0
      : v.kind === "weekly_all"
        ? 1
        : v.kind === "weekly_scoped"
          ? 2
          : 3;
  return [...f].sort((v, d) => o(v) - o(d));
}
function Lo(f) {
  return f.kind === "session"
    ? "Session (5h)"
    : f.kind === "weekly_all"
      ? "Weekly · all models"
      : f.kind === "weekly_scoped"
        ? `Weekly · ${f.modelName ?? "model"}`
        : f.kind.replace(/_/g, " ");
}
function Qv({ limit: f, now: o }) {
  const v = ko(f.severity, f.percent),
    d = Math.max(0, Math.min(100, f.percent)),
    x = Yv(f.resetsAt, o);
  return i.jsxs("div", {
    className: "meter",
    children: [
      i.jsxs("div", {
        className: "meter-top",
        children: [
          i.jsx("span", { className: "meter-label", children: Lo(f) }),
          i.jsx("span", {
            className: "meter-reset",
            children: x ? (x === "now" ? "resets now" : `resets in ${x}`) : "",
          }),
          i.jsxs("span", {
            className: "meter-pct",
            children: [Math.round(f.percent), "%"],
          }),
        ],
      }),
      i.jsx("div", {
        className: "meter-track",
        role: "progressbar",
        "aria-valuenow": Math.round(f.percent),
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": Lo(f),
        children: i.jsx("div", {
          className: "meter-fill",
          "data-kind": v,
          style: { width: `${d === 0 ? 0 : Math.max(2, d)}%` },
        }),
      }),
    ],
  });
}
function Zv(f, o) {
  const v = o?.match(/max_(\d+)x/i);
  return v ? `Max ${v[1]}x` : Lv(f);
}
function Jo({
  state: f,
  now: o,
  onLaunch: v,
  onSetDefault: d,
  onRename: x,
  onRemove: E,
  onReveal: D,
  onRefresh: w,
}) {
  const [C, g] = q.useState(!1),
    B = q.useRef(null),
    { profile: R, identity: _, usage: Y, activity: U, isDefault: H } = f,
    N = Gv(f);
  q.useEffect(() => {
    if (!C) return;
    const k = (al) => {
      B.current && !B.current.contains(al.target) && g(!1);
    };
    return (
      document.addEventListener("mousedown", k),
      () => document.removeEventListener("mousedown", k)
    );
  }, [C]);
  const K = Zv(_.subscriptionType, _.rateLimitTier),
    nl = [_.email, K, _.orgName].filter((k, al, W) => k && W.indexOf(k) === al),
    ol = Y ? Xv(Y.limits) : [],
    sl = Y !== null && !Y.ok && U.estPrompts7d !== void 0;
  return i.jsxs("article", {
    className: "card",
    "data-status": N.kind,
    children: [
      i.jsxs("header", {
        className: "card-head",
        children: [
          i.jsx("span", {
            className: "dot",
            "data-kind": N.kind,
            "aria-hidden": "true",
          }),
          i.jsx("h3", {
            className: "card-name",
            title: R.configDir,
            children: R.name,
          }),
          H &&
            i.jsx("span", {
              className: "badge badge-default",
              children: "Default",
            }),
          i.jsx("span", {
            className: "status-label",
            "data-kind": N.kind,
            children: N.label,
          }),
          i.jsxs("div", {
            className: "menu-wrap",
            ref: B,
            children: [
              i.jsx("button", {
                className: "btn btn-icon",
                "aria-label": "Account menu",
                "aria-expanded": C,
                onClick: () => g((k) => !k),
                children: "⋯",
              }),
              C &&
                i.jsxs("div", {
                  className: "menu",
                  role: "menu",
                  children: [
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (g(!1), w());
                      },
                      children: "Refresh usage",
                    }),
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (g(!1), x());
                      },
                      children: "Rename…",
                    }),
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (g(!1), D());
                      },
                      children: "Open config folder",
                    }),
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (g(!1), d(!H));
                      },
                      children: H ? "Clear default" : "Set as default",
                    }),
                    _.loggedIn &&
                      i.jsx("button", {
                        role: "menuitem",
                        onClick: () => {
                          (g(!1), v("login"));
                        },
                        children: "Re-login…",
                      }),
                    i.jsx("button", {
                      role: "menuitem",
                      className: "danger",
                      onClick: () => {
                        (g(!1), E());
                      },
                      children: "Remove…",
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
      i.jsx("div", {
        className: "card-sub",
        title: R.configDir,
        children: nl.length > 0 ? nl.join(" · ") : R.configDir,
      }),
      _.loggedIn
        ? i.jsxs(i.Fragment, {
            children: [
              ol.length > 0 &&
                i.jsx("div", {
                  className: "meters",
                  children: ol.map((k, al) =>
                    i.jsx(
                      Qv,
                      { limit: k, now: o },
                      `${k.kind}-${k.modelName ?? al}`,
                    ),
                  ),
                }),
              Y?.extra?.enabled &&
                Y.extra.usedCredits !== void 0 &&
                Y.extra.usedCredits > 0 &&
                i.jsxs("div", {
                  className: "extra-usage",
                  children: [
                    "Extra usage: ",
                    wv(
                      Y.extra.usedCredits,
                      Y.extra.currency,
                      Y.extra.decimalPlaces,
                    ),
                    " used",
                  ],
                }),
              Y &&
                !Y.ok &&
                i.jsxs("div", {
                  className: "banner",
                  "data-kind": Y.error?.toLowerCase().includes("expired")
                    ? "crit"
                    : "warn",
                  children: [
                    Y.error ?? "Usage unavailable",
                    Y.limits.length > 0 && " — showing last known values",
                  ],
                }),
              sl &&
                i.jsxs("div", {
                  className: "estimate",
                  children: [
                    "Local estimate (7d): ~",
                    U.estPrompts7d,
                    " prompts · ~",
                    Ko(U.estTokens7d),
                    " tokens",
                  ],
                }),
              i.jsxs("div", {
                className: "card-meta",
                children: [
                  i.jsxs("span", {
                    children: ["Last active ", Tn(U.lastActiveAt, o)],
                  }),
                  i.jsx("span", { className: "sep", children: "·" }),
                  i.jsxs("span", {
                    children: [
                      U.sessions7d,
                      " session",
                      U.sessions7d === 1 ? "" : "s",
                      " this week",
                    ],
                  }),
                  Y &&
                    Y.limits.length > 0 &&
                    i.jsxs(i.Fragment, {
                      children: [
                        i.jsx("span", { className: "sep", children: "·" }),
                        i.jsxs("span", {
                          children: ["updated ", Tn(Y.fetchedAt, o)],
                        }),
                      ],
                    }),
                ],
              }),
              i.jsxs("footer", {
                className: "card-actions",
                children: [
                  i.jsx("button", {
                    className: "btn btn-primary",
                    onClick: () => v("claude"),
                    children: "Open Claude",
                  }),
                  i.jsx("button", {
                    className: "btn",
                    onClick: () => v("vscode"),
                    title:
                      "If VS Code is already running, close it first so the new window picks up this account's environment",
                    children: "VS Code",
                  }),
                  i.jsx("button", {
                    className: "btn",
                    onClick: () => v("powershell"),
                    children: "PowerShell",
                  }),
                  i.jsx("button", {
                    className: "btn",
                    "data-active": H || void 0,
                    onClick: () => d(!H),
                    title:
                      "Make this account the default CLAUDE_CONFIG_DIR for all new shells",
                    children: H ? "★ Default" : "☆ Set Default",
                  }),
                ],
              }),
            ],
          })
        : i.jsxs(i.Fragment, {
            children: [
              i.jsx("div", {
                className: "banner",
                "data-kind": "off",
                children:
                  "Not signed in. Log in via your browser — Anthropic or Google — from a terminal bound to this profile. No passwords are stored.",
              }),
              i.jsxs("footer", {
                className: "card-actions",
                children: [
                  i.jsx("button", {
                    className: "btn btn-primary",
                    onClick: () => v("login"),
                    children: "Log in…",
                  }),
                  i.jsx("button", {
                    className: "btn",
                    onClick: () => v("powershell"),
                    children: "PowerShell",
                  }),
                ],
              }),
            ],
          }),
    ],
  });
}
function As({ children: f, onClose: o }) {
  return (
    q.useEffect(() => {
      const v = (d) => d.key === "Escape" && o();
      return (
        document.addEventListener("keydown", v),
        () => document.removeEventListener("keydown", v)
      );
    }, [o]),
    i.jsx("div", {
      className: "overlay",
      onMouseDown: (v) => v.target === v.currentTarget && o(),
      children: i.jsx("div", {
        className: "dialog",
        role: "dialog",
        "aria-modal": "true",
        children: f,
      }),
    })
  );
}
function Kv({ onClose: f, onDone: o }) {
  const [v, d] = q.useState("create"),
    [x, E] = q.useState(""),
    [D, w] = q.useState(""),
    [C, g] = q.useState(!0),
    [B, R] = q.useState(null),
    [_, Y] = q.useState(!1),
    U = async () => {
      (Y(!0), R(null));
      try {
        if (v === "create") {
          const N = await window.cam.createProfile(x);
          if (!N.ok || !N.profile) {
            R(N.error ?? "Failed to create account.");
            return;
          }
          (C && (await window.cam.launch("login", N.profile.id)),
            o(
              C
                ? `"${N.profile.name}" created — finish signing in from the terminal that just opened.`
                : `"${N.profile.name}" created.`,
            ));
        } else {
          const N = await window.cam.importProfile(x, D);
          if (!N.ok || !N.profile) {
            R(N.error ?? "Failed to import account.");
            return;
          }
          o(`"${N.profile.name}" imported.`);
        }
      } finally {
        Y(!1);
      }
    },
    H = x.trim().length > 0 && (v === "create" || D.trim().length > 0) && !_;
  return i.jsxs(As, {
    onClose: f,
    children: [
      i.jsx("h2", { children: "Add account" }),
      i.jsxs("div", {
        className: "segmented",
        role: "tablist",
        children: [
          i.jsx("button", {
            role: "tab",
            "aria-selected": v === "create",
            "data-active": v === "create" || void 0,
            onClick: () => d("create"),
            children: "Create new",
          }),
          i.jsx("button", {
            role: "tab",
            "aria-selected": v === "import",
            "data-active": v === "import" || void 0,
            onClick: () => d("import"),
            children: "Import existing",
          }),
        ],
      }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Account name" }),
          i.jsx("input", {
            autoFocus: !0,
            value: x,
            placeholder: v === "create" ? "e.g. Personal Max" : "e.g. Work Max",
            onChange: (N) => E(N.target.value),
            onKeyDown: (N) => N.key === "Enter" && H && void U(),
          }),
        ],
      }),
      v === "create"
        ? i.jsxs(i.Fragment, {
            children: [
              i.jsxs("p", {
                className: "hint",
                children: [
                  "A fresh, isolated profile folder is created under your home directory (e.g. ",
                  i.jsx("code", { children: ".claude-personal-max" }),
                  "). Sign-in happens in your browser via",
                  i.jsx("code", { children: " claude auth login" }),
                  " — Anthropic or Google. No passwords are ever stored.",
                ],
              }),
              i.jsxs("label", {
                className: "check",
                children: [
                  i.jsx("input", {
                    type: "checkbox",
                    checked: C,
                    onChange: (N) => g(N.target.checked),
                  }),
                  i.jsx("span", { children: "Open the login terminal now" }),
                ],
              }),
            ],
          })
        : i.jsxs(i.Fragment, {
            children: [
              i.jsxs("label", {
                className: "field",
                children: [
                  i.jsx("span", {
                    children: "Existing CLAUDE_CONFIG_DIR folder",
                  }),
                  i.jsxs("div", {
                    className: "pathrow",
                    children: [
                      i.jsx("input", {
                        value: D,
                        placeholder: "C:\\Users\\you\\.claude",
                        onChange: (N) => w(N.target.value),
                      }),
                      i.jsx("button", {
                        className: "btn",
                        onClick: async () => {
                          const N = await window.cam.pickFolder();
                          N && w(N);
                        },
                        children: "Browse…",
                      }),
                    ],
                  }),
                ],
              }),
              i.jsxs("p", {
                className: "hint",
                children: [
                  "Point at any folder already used by Claude Code — including your default",
                  " ",
                  i.jsx("code", { children: "%USERPROFILE%\\.claude" }),
                  ". The folder is registered as-is; nothing is moved or copied.",
                ],
              }),
            ],
          }),
      B &&
        i.jsx("div", { className: "banner", "data-kind": "crit", children: B }),
      i.jsxs("div", {
        className: "dialog-actions",
        children: [
          i.jsx("button", { className: "btn", onClick: f, children: "Cancel" }),
          i.jsx("button", {
            className: "btn btn-primary",
            disabled: !H,
            onClick: () => {
              U();
            },
            children: v === "create" ? "Create account" : "Import account",
          }),
        ],
      }),
    ],
  });
}
function $o({ state: f, onClose: o, onDone: v }) {
  const [d, x] = q.useState(f.profile.name),
    [E, D] = q.useState(null),
    w = async () => {
      const C = await window.cam.renameProfile(f.profile.id, d);
      C.ok ? v() : D(C.error ?? "Rename failed.");
    };
  return i.jsxs(As, {
    onClose: o,
    children: [
      i.jsx("h2", { children: "Rename account" }),
      i.jsxs("label", {
        className: "field",
        children: [
          i.jsx("span", { children: "Account name" }),
          i.jsx("input", {
            autoFocus: !0,
            value: d,
            onChange: (C) => x(C.target.value),
            onKeyDown: (C) => C.key === "Enter" && d.trim() && void w(),
          }),
        ],
      }),
      E &&
        i.jsx("div", { className: "banner", "data-kind": "crit", children: E }),
      i.jsxs("div", {
        className: "dialog-actions",
        children: [
          i.jsx("button", { className: "btn", onClick: o, children: "Cancel" }),
          i.jsx("button", {
            className: "btn btn-primary",
            disabled: !d.trim(),
            onClick: () => {
              w();
            },
            children: "Rename",
          }),
        ],
      }),
    ],
  });
}
function Wo({ state: f, onClose: o, onDone: v }) {
  const [d, x] = q.useState(!1),
    [E, D] = q.useState(null),
    w = async () => {
      const C = await window.cam.removeProfile(f.profile.id, d);
      C.ok
        ? v(
            d
              ? `"${f.profile.name}" removed and its folder deleted.`
              : `"${f.profile.name}" removed from the list.`,
          )
        : D(C.error ?? "Remove failed.");
    };
  return i.jsxs(As, {
    onClose: o,
    children: [
      i.jsxs("h2", { children: ["Remove “", f.profile.name, "”"] }),
      i.jsxs("p", {
        className: "hint",
        children: [
          "By default this only removes the account from AI Account Manager. The profile folder—and its Claude Code session—stays on disk at ",
          i.jsx("code", { children: f.profile.configDir }),
          ".",
        ],
      }),
      i.jsxs("label", {
        className: "check",
        children: [
          i.jsx("input", {
            type: "checkbox",
            checked: d,
            onChange: (C) => x(C.target.checked),
          }),
          i.jsxs("span", {
            children: [
              "Also delete the folder from disk. ",
              i.jsx("strong", {
                children: "This signs the account out on this machine",
              }),
              " and deletes its local session history.",
            ],
          }),
        ],
      }),
      E &&
        i.jsx("div", { className: "banner", "data-kind": "crit", children: E }),
      i.jsxs("div", {
        className: "dialog-actions",
        children: [
          i.jsx("button", { className: "btn", onClick: o, children: "Cancel" }),
          i.jsx("button", {
            className: "btn btn-danger",
            onClick: () => {
              w();
            },
            children: d ? "Remove and delete folder" : "Remove from list",
          }),
        ],
      }),
    ],
  });
}
function formatGptPlan(f) {
  return f
    ? String(f)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (o) => o.toUpperCase())
    : "ChatGPT";
}
function formatGptTokens(f) {
  return f === null || f === void 0 || !Number.isFinite(Number(f))
    ? "—"
    : new Intl.NumberFormat(void 0, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(Number(f));
}
function gptWindowName(f) {
  if (!f || !Number.isFinite(f)) return "Usage window";
  if (f === 10080) return "Weekly window";
  if (f % 1440 === 0) return `${f / 1440}-day window`;
  if (f % 60 === 0) return `${f / 60}-hour window`;
  return `${f}-minute window`;
}
function gptBucketName(f) {
  const o = f.limitName || f.limitId;
  if (!o || o === "codex") return "Codex";
  return String(o)
    .replace(/^codex[_-]?/i, "Codex ")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (v) => v.toUpperCase())
    .trim();
}
function collectGptWindows(f) {
  const o = f?.rateLimits;
  if (!o) return [];
  const v = o.rateLimitsByLimitId
      ? Object.values(o.rateLimitsByLimitId)
      : o.rateLimits
        ? [o.rateLimits]
        : [],
    d = [],
    x = /* @__PURE__ */ new Set();
  for (const E of v) {
    for (const [D, w] of [
      ["primary", E?.primary],
      ["secondary", E?.secondary],
    ]) {
      if (!w || !Number.isFinite(w.usedPercent)) continue;
      const C = `${E.limitId ?? "codex"}-${D}-${w.windowDurationMins ?? 0}`;
      if (x.has(C)) continue;
      x.add(C);
      d.push({
        key: C,
        label: `${gptBucketName(E)} · ${gptWindowName(w.windowDurationMins)}`,
        usedPercent: w.usedPercent,
        resetsAt: w.resetsAt,
      });
    }
  }
  return d.slice(0, 6);
}
function GptUsageMeter({ window: f, now: o }) {
  const v = Math.max(0, Math.min(100, f.usedPercent)),
    d = ko("", f.usedPercent),
    x = f.resetsAt ? Yv(new Date(f.resetsAt * 1e3).toISOString(), o) : null;
  return i.jsxs("div", {
    className: "meter",
    children: [
      i.jsxs("div", {
        className: "meter-top",
        children: [
          i.jsx("span", { className: "meter-label", children: f.label }),
          i.jsx("span", {
            className: "meter-reset",
            children: x ? (x === "now" ? "resets now" : `resets in ${x}`) : "",
          }),
          i.jsxs("span", {
            className: "meter-pct",
            children: [Math.round(f.usedPercent), "%"],
          }),
        ],
      }),
      i.jsx("div", {
        className: "meter-track",
        role: "progressbar",
        "aria-valuenow": Math.round(f.usedPercent),
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-label": f.label,
        children: i.jsx("div", {
          className: "meter-fill",
          "data-kind": d,
          style: { width: `${v === 0 ? 0 : Math.max(2, v)}%` },
        }),
      }),
    ],
  });
}
function GptUsageCard({ usage: f, now: o, refreshing: v, onRefresh: d }) {
  const x = collectGptWindows(f),
    E = f?.usage?.summary,
    D = f?.account,
    w = f?.rateLimits?.rateLimitResetCredits?.availableCount;
  return i.jsxs("section", {
    className: "card gpt-usage-card",
    "aria-label": "GPT and Codex account usage",
    children: [
      i.jsxs("div", {
        className: "gpt-card-head",
        children: [
          i.jsx("div", { className: "gpt-brand-mark", children: "GPT" }),
          i.jsxs("div", {
            className: "gpt-card-title-wrap",
            children: [
              i.jsxs("div", {
                className: "gpt-card-title-line",
                children: [
                  i.jsx("h2", { children: "GPT / Codex usage" }),
                  D?.planType &&
                    i.jsx("span", {
                      className: "gpt-plan-badge",
                      children: formatGptPlan(D.planType),
                    }),
                ],
              }),
              i.jsx("div", {
                className: "gpt-account-line",
                children: D?.email
                  ? `${D.email} · signed-in ChatGPT account`
                  : "Signed-in ChatGPT account",
              }),
            ],
          }),
          i.jsx("button", {
            className: "btn btn-small gpt-refresh",
            onClick: d,
            disabled: v,
            children: v ? "Refreshing…" : "↻ Refresh",
          }),
        ],
      }),
      f === null
        ? i.jsx("div", {
            className: "gpt-loading",
            children: "Loading GPT usage from Codex…",
          })
        : !f.ok
          ? i.jsxs("div", {
              className: "gpt-error",
              children: [
                i.jsx("strong", { children: "GPT usage unavailable" }),
                i.jsx("span", {
                  children:
                    f.error ??
                    "Codex did not return account usage information.",
                }),
              ],
            })
          : i.jsxs(i.Fragment, {
              children: [
                i.jsxs("div", {
                  className: "gpt-stat-grid",
                  children: [
                    i.jsxs("div", {
                      className: "gpt-stat",
                      children: [
                        i.jsx("span", { children: "Lifetime tokens" }),
                        i.jsx("b", {
                          children: formatGptTokens(E?.lifetimeTokens),
                        }),
                      ],
                    }),
                    i.jsxs("div", {
                      className: "gpt-stat",
                      children: [
                        i.jsx("span", { children: "Peak day" }),
                        i.jsx("b", {
                          children: formatGptTokens(E?.peakDailyTokens),
                        }),
                      ],
                    }),
                    i.jsxs("div", {
                      className: "gpt-stat",
                      children: [
                        i.jsx("span", { children: "Current streak" }),
                        i.jsx("b", {
                          children:
                            E?.currentStreakDays === null ||
                            E?.currentStreakDays === void 0
                              ? "—"
                              : `${E.currentStreakDays}d`,
                        }),
                      ],
                    }),
                    Number.isFinite(w) &&
                      i.jsxs("div", {
                        className: "gpt-stat",
                        children: [
                          i.jsx("span", { children: "Usage resets" }),
                          i.jsx("b", { children: String(w) }),
                        ],
                      }),
                  ],
                }),
                x.length > 0
                  ? i.jsx("div", {
                      className: "meters gpt-meters",
                      children: x.map((C) =>
                        i.jsx(GptUsageMeter, { window: C, now: o }, C.key),
                      ),
                    })
                  : i.jsx("div", {
                      className: "gpt-empty-limits",
                      children:
                        "No rolling usage windows were returned for this account.",
                    }),
                f.warning &&
                  i.jsx("div", {
                    className: "gpt-warning",
                    children: f.warning,
                  }),
                i.jsxs("div", {
                  className: "gpt-card-foot",
                  children: [
                    i.jsx("span", {
                      children:
                        "ChatGPT plan usage via the local Codex service",
                    }),
                    i.jsx("span", {
                      children: f.fetchedAt
                        ? `updated ${Tn(f.fetchedAt, o)}`
                        : "",
                    }),
                  ],
                }),
              ],
            }),
    ],
  });
}
function AlertSettingsDialog({ onClose: f, onSaved: o }) {
  const [v, d] = q.useState(null),
    [x, E] = q.useState("70, 85, 100"),
    [D, w] = q.useState(null),
    [C, g] = q.useState(!1);
  q.useEffect(() => {
    window.cam.alerts.get().then((settings) => {
      (d(settings), E((settings.thresholds ?? []).join(", ")));
    });
  }, []);
  const B = async () => {
    if (!v) return;
    g(!0);
    try {
      const thresholds = x
        .split(/[,\s]+/)
        .map(Number)
        .filter((value) => Number.isFinite(value));
      const saved = await window.cam.alerts.set({ ...v, thresholds });
      (d(saved), o("Usage alert settings saved."), f());
    } catch (R) {
      w(R.message ?? "Could not save alert settings.");
    } finally {
      g(!1);
    }
  };
  return i.jsx(Ns, {
    onClose: f,
    children: i.jsxs("div", {
      className: "settings-dialog",
      children: [
        i.jsx("h2", { children: "Usage alerts" }),
        i.jsx("p", {
          className: "hint",
          children:
            "Optional Windows notifications for Claude and GPT usage windows. Each threshold or reset reminder is sent only once per quota cycle.",
        }),
        v === null
          ? i.jsx("p", { className: "hint", children: "Loading settings…" })
          : i.jsxs(i.Fragment, {
              children: [
                i.jsxs("label", {
                  className: "check",
                  children: [
                    i.jsx("input", {
                      type: "checkbox",
                      checked: v.enabled,
                      onChange: (R) => d({ ...v, enabled: R.target.checked }),
                    }),
                    i.jsx("span", { children: "Enable usage notifications" }),
                  ],
                }),
                i.jsxs("label", {
                  className: "field",
                  children: [
                    i.jsx("span", { children: "Alert thresholds (%)" }),
                    i.jsx("input", {
                      value: x,
                      disabled: !v.enabled,
                      placeholder: "70, 85, 100",
                      onChange: (R) => E(R.target.value),
                    }),
                  ],
                }),
                i.jsxs("label", {
                  className: "check",
                  children: [
                    i.jsx("input", {
                      type: "checkbox",
                      checked: v.resetReminders,
                      disabled: !v.enabled,
                      onChange: (R) =>
                        d({ ...v, resetReminders: R.target.checked }),
                    }),
                    i.jsx("span", {
                      children: "Notify before usage windows reset",
                    }),
                  ],
                }),
                i.jsxs("label", {
                  className: "field inline-setting",
                  children: [
                    i.jsx("span", {
                      children: "Reset reminder lead time (minutes)",
                    }),
                    i.jsx("input", {
                      type: "number",
                      min: 5,
                      max: 1440,
                      value: v.resetReminderMinutes,
                      disabled: !v.enabled || !v.resetReminders,
                      onChange: (R) =>
                        d({
                          ...v,
                          resetReminderMinutes: Number(R.target.value),
                        }),
                    }),
                  ],
                }),
                i.jsxs("label", {
                  className: "check",
                  children: [
                    i.jsx("input", {
                      type: "checkbox",
                      checked: v.credentialExpiry,
                      disabled: !v.enabled,
                      onChange: (R) =>
                        d({ ...v, credentialExpiry: R.target.checked }),
                    }),
                    i.jsx("span", {
                      children: "Warn before Claude sign-ins expire",
                    }),
                  ],
                }),
                i.jsxs("label", {
                  className: "field inline-setting",
                  children: [
                    i.jsx("span", {
                      children: "Credential warning lead time (hours)",
                    }),
                    i.jsx("input", {
                      type: "number",
                      min: 1,
                      max: 168,
                      value: v.credentialExpiryHours,
                      disabled: !v.enabled || !v.credentialExpiry,
                      onChange: (R) =>
                        d({
                          ...v,
                          credentialExpiryHours: Number(R.target.value),
                        }),
                    }),
                  ],
                }),
              ],
            }),
        D &&
          i.jsx("div", {
            className: "banner",
            "data-kind": "crit",
            children: D,
          }),
        i.jsxs("div", {
          className: "dialog-actions",
          children: [
            i.jsx("button", {
              className: "btn",
              onClick: async () => {
                const result = await window.cam.alerts.test();
                o(
                  result.ok
                    ? "Test notification sent."
                    : "Windows notifications are not available for this app.",
                );
              },
              children: "Send test",
            }),
            i.jsx("button", {
              className: "btn",
              onClick: f,
              children: "Cancel",
            }),
            i.jsx("button", {
              className: "btn btn-primary",
              onClick: B,
              disabled: !v || C,
              children: C ? "Saving…" : "Save alerts",
            }),
          ],
        }),
      ],
    }),
  });
}
function UpdateSettingsDialog({ onClose: f, onToast: o }) {
  const [v, d] = q.useState(null),
    [x, E] = q.useState({ autoCheck: !0, manifestUrl: "" }),
    [D, w] = q.useState(!1);
  q.useEffect(() => {
    Promise.all([window.cam.updates.get(), window.cam.getVersions()]).then(
      ([state, versions]) => {
        (d({ ...state, currentVersion: state?.currentVersion ?? versions.app }),
          E(state?.settings ?? { autoCheck: !0, manifestUrl: "" }));
      },
    );
  }, []);
  const C = async () => {
      w(!0);
      try {
        await window.cam.updates.configure(x);
        d(await window.cam.updates.check());
      } finally {
        w(!1);
      }
    },
    g = async () => {
      const result = await window.cam.updates.openDownload();
      !result.ok && o(result.error ?? "Could not open the update download.");
    };
  return i.jsx(Ns, {
    onClose: f,
    children: i.jsxs("div", {
      className: "settings-dialog update-dialog",
      children: [
        i.jsx("h2", { children: "App updates" }),
        i.jsxs("div", {
          className: "update-version-row",
          children: [
            i.jsx("span", { children: "Installed version" }),
            i.jsx("b", { children: `v${v?.currentVersion ?? "…"}` }),
          ],
        }),
        v?.update
          ? i.jsxs("div", {
              className: "update-available",
              children: [
                i.jsx("strong", {
                  children: `Version ${v.update.version} is available`,
                }),
                v.update.notes && i.jsx("p", { children: v.update.notes }),
                i.jsx("button", {
                  className: "btn btn-primary",
                  onClick: g,
                  children: "Open verified download ↗",
                }),
              ],
            })
          : i.jsx("div", {
              className: "update-status",
              "data-kind": v?.error ? "crit" : "ok",
              children: v?.error
                ? v.error
                : v?.configured
                  ? "No newer release was found."
                  : "No release channel is configured yet.",
            }),
        i.jsxs("label", {
          className: "field",
          children: [
            i.jsx("span", { children: "HTTPS update manifest URL" }),
            i.jsx("input", {
              value: x.manifestUrl,
              placeholder:
                "https://example.com/ai-account-manager/latest.json",
              onChange: (R) => E({ ...x, manifestUrl: R.target.value }),
            }),
          ],
        }),
        i.jsxs("label", {
          className: "check",
          children: [
            i.jsx("input", {
              type: "checkbox",
              checked: x.autoCheck,
              onChange: (R) => E({ ...x, autoCheck: R.target.checked }),
            }),
            i.jsx("span", {
              children: "Check this channel when the app starts",
            }),
          ],
        }),
        i.jsx("p", {
          className: "hint",
          children:
            "The updater accepts only HTTPS manifests and downloads with a published SHA-256 checksum. Code signing is configured at build time.",
        }),
        i.jsxs("div", {
          className: "dialog-actions",
          children: [
            i.jsx("button", {
              className: "btn",
              onClick: f,
              children: "Close",
            }),
            i.jsx("button", {
              className: "btn btn-primary",
              onClick: C,
              disabled: D,
              children: D ? "Checking…" : "Save & check",
            }),
          ],
        }),
      ],
    }),
  });
}
function Vv({ now: f, showToast: o, onGoAccounts: v }) {
  const [d, x] = q.useState(null),
    [E, D] = q.useState(null),
    [w, C] = q.useState(!1),
    [gptUsage, setGptUsage] = q.useState(null),
    [gptRefreshing, setGptRefreshing] = q.useState(!1),
    [showAlerts, setShowAlerts] = q.useState(!1),
    [showUpdates, setShowUpdates] = q.useState(!1);
  q.useEffect(
    () => (window.cam.listStates().then(x), window.cam.onStateChanged(x)),
    [],
  );
  q.useEffect(() => {
    const unsubscribe = window.cam.onGptUsageChanged(setGptUsage);
    window.cam.getGptUsage().then((U) => {
      U ? setGptUsage(U) : window.cam.refreshGptUsage().then(setGptUsage);
    });
    return unsubscribe;
  }, []);
  const refreshGptOnly = async () => {
      setGptRefreshing(!0);
      try {
        setGptUsage(await window.cam.refreshGptUsage());
      } finally {
        setGptRefreshing(!1);
      }
    },
    g = async () => {
      C(!0);
      setGptRefreshing(!0);
      try {
        const [, U] = await Promise.allSettled([
          window.cam.refreshUsage(),
          window.cam.refreshGptUsage(),
        ]);
        U.status === "fulfilled" && setGptUsage(U.value);
      } finally {
        C(!1);
        setGptRefreshing(!1);
      }
    },
    B = async (U, H) => {
      const N = await window.cam.launch(U, H);
      !N.ok && N.error && o(N.error);
    },
    R = async (U, H) => {
      const N = await window.cam.setDefault(H ? U : null);
      !N.ok && N.error
        ? o(N.error)
        : o(
            H
              ? "Default set. New terminals will use this account."
              : "Default cleared. New terminals will use ~/.claude.",
          );
    },
    _ = d?.find((U) => U.isDefault) ?? null,
    Y = d ? d.filter((U) => !U.isDefault).length : 0;
  return i.jsxs("div", {
    className: "view",
    children: [
      i.jsxs("header", {
        className: "view-head",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("h1", { children: "Dashboard" }),
              i.jsx("p", {
                className: "view-sub",
                children:
                  d === null
                    ? "Loading…"
                    : _
                      ? "Your default Claude Code account"
                      : "No default account set",
              }),
            ],
          }),
          i.jsx("div", {
            className: "view-actions",
            children: i.jsxs(i.Fragment, {
              children: [
                i.jsx("button", {
                  className: "btn",
                  onClick: () => setShowAlerts(!0),
                  children: "🔔 Alerts",
                }),
                i.jsx("button", {
                  className: "btn",
                  onClick: () => setShowUpdates(!0),
                  children: "Updates",
                }),
                i.jsx("button", {
                  className: "btn",
                  onClick: () => {
                    g();
                  },
                  disabled: w,
                  children: w ? "Refreshing…" : "↻ Refresh",
                }),
              ],
            }),
          }),
        ],
      }),
      d === null
        ? i.jsx("div", {
            className: "empty",
            children: i.jsx("p", { children: "Loading accounts…" }),
          })
        : d.length === 0
          ? i.jsxs("div", {
              className: "empty",
              children: [
                i.jsx("h2", { children: "No accounts yet" }),
                i.jsxs("p", {
                  children: [
                    "Each account is an isolated Claude Code profile folder (its own ",
                    i.jsx("code", { children: "CLAUDE_CONFIG_DIR" }),
                    ").",
                  ],
                }),
                i.jsx("div", {
                  className: "empty-actions",
                  children: i.jsx("button", {
                    className: "btn btn-primary",
                    onClick: v,
                    children: "Add an account →",
                  }),
                }),
              ],
            })
          : _ === null
            ? i.jsxs("div", {
                className: "empty",
                children: [
                  i.jsx("h2", { children: "No default account set" }),
                  i.jsxs("p", {
                    children: [
                      "Pick the account you use day-to-day and mark it ",
                      i.jsx("b", { children: "☆ Set Default" }),
                      " — it will appear here, and every new terminal will use it.",
                    ],
                  }),
                  i.jsx("div", {
                    className: "empty-actions",
                    children: i.jsx("button", {
                      className: "btn btn-primary",
                      onClick: v,
                      children: "Choose from your accounts →",
                    }),
                  }),
                ],
              })
            : i.jsxs(i.Fragment, {
                children: [
                  i.jsxs("div", {
                    className: "summary-row",
                    children: [
                      i.jsx(Ku, {
                        label: "Sessions this week",
                        value: String(_.activity.sessions7d),
                      }),
                      i.jsx(Ku, {
                        label: "Projects",
                        value: String(_.activity.projects),
                      }),
                      i.jsx(Ku, {
                        label: "Last active",
                        value: Tn(_.activity.lastActiveAt, f),
                      }),
                      i.jsx(Ku, {
                        label: "Other accounts",
                        value: String(Y),
                        hint:
                          Y > 0
                            ? "On the Other Accounts page"
                            : "This is your only account",
                      }),
                    ],
                  }),
                  i.jsxs("div", {
                    className: "hero-card dashboard-claude-card",
                    children: i.jsx(Jo, {
                      state: _,
                      now: f,
                      onLaunch: (U) => {
                        B(U, _.profile.id);
                      },
                      onSetDefault: (U) => {
                        R(_.profile.id, U);
                      },
                      onRename: () => D({ type: "rename", state: _ }),
                      onRemove: () => D({ type: "remove", state: _ }),
                      onReveal: () => {
                        window.cam.revealFolder(_.profile.id);
                      },
                      onRefresh: () => {
                        window.cam.refreshUsage(_.profile.id);
                      },
                    }),
                  }),
                ],
              }),
      i.jsx(GptUsageCard, {
        usage: gptUsage,
        now: f,
        refreshing: gptRefreshing,
        onRefresh: refreshGptOnly,
      }),
      E?.type === "rename" &&
        i.jsx($o, {
          state: E.state,
          onClose: () => D(null),
          onDone: () => D(null),
        }),
      E?.type === "remove" &&
        i.jsx(Wo, {
          state: E.state,
          onClose: () => D(null),
          onDone: (U) => {
            (D(null), o(U));
          },
        }),
      showAlerts &&
        i.jsx(AlertSettingsDialog, {
          onClose: () => setShowAlerts(!1),
          onSaved: o,
        }),
      showUpdates &&
        i.jsx(UpdateSettingsDialog, {
          onClose: () => setShowUpdates(!1),
          onToast: o,
        }),
    ],
  });
}
function Ku({ label: f, value: o, hint: v }) {
  return i.jsxs("div", {
    className: "summary-tile",
    children: [
      i.jsx("div", { className: "summary-tile-label", children: f }),
      i.jsx("div", { className: "summary-tile-value", children: o }),
      v && i.jsx("div", { className: "summary-tile-hint", children: v }),
    ],
  });
}
function kv({ now: f, showToast: o }) {
  const [v, d] = q.useState(null),
    [x, E] = q.useState(""),
    [D, w] = q.useState(null),
    [C, g] = q.useState(!1);
  q.useEffect(
    () => (window.cam.listStates().then(d), window.cam.onStateChanged(d)),
    [],
  );
  const B = async () => {
      g(!0);
      try {
        await window.cam.refreshUsage();
      } finally {
        g(!1);
      }
    },
    R = async (N, K) => {
      const nl = await window.cam.launch(N, K);
      !nl.ok && nl.error && o(nl.error);
    },
    _ = async (N, K) => {
      const nl = await window.cam.setDefault(K ? N : null);
      !nl.ok && nl.error
        ? o(nl.error)
        : o(
            K
              ? "Default set. New terminals will use this account."
              : "Default cleared. New terminals will use ~/.claude.",
          );
    },
    Y = async () => {
      const N = await window.cam.exportProfiles();
      N.ok && N.path
        ? o(`Exported account list to ${N.path}`)
        : N.error && o(N.error);
    },
    U = q.useMemo(() => v?.filter((N) => !N.isDefault) ?? null, [v]),
    H = q.useMemo(() => {
      if (!U) return null;
      const N = x.trim().toLowerCase();
      return [
        ...(N
          ? U.filter(
              (nl) =>
                nl.profile.name.toLowerCase().includes(N) ||
                (nl.identity.email ?? "").toLowerCase().includes(N) ||
                (nl.identity.orgName ?? "").toLowerCase().includes(N) ||
                nl.profile.configDir.toLowerCase().includes(N),
            )
          : U),
      ].sort((nl, ol) => nl.profile.name.localeCompare(ol.profile.name));
    }, [U, x]);
  return i.jsxs("div", {
    className: "view",
    children: [
      i.jsxs("header", {
        className: "view-head",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("h1", { children: "Other Accounts" }),
              i.jsx("p", {
                className: "view-sub",
                children: U
                  ? `${U.length} other Claude Code account${U.length === 1 ? "" : "s"} — your default account is on the Dashboard`
                  : "Loading…",
              }),
            ],
          }),
          i.jsxs("div", {
            className: "view-actions",
            children: [
              i.jsx("div", {
                className: "search",
                children: i.jsx("input", {
                  type: "search",
                  placeholder: "Search accounts…",
                  value: x,
                  onChange: (N) => E(N.target.value),
                  "aria-label": "Search accounts",
                }),
              }),
              i.jsx("button", {
                className: "btn",
                onClick: () => {
                  B();
                },
                disabled: C,
                children: C ? "Refreshing…" : "↻ Refresh",
              }),
              i.jsx("button", {
                className: "btn",
                onClick: () => {
                  Y();
                },
                children: "Export",
              }),
              i.jsx("button", {
                className: "btn btn-primary",
                onClick: () => w({ type: "add" }),
                children: "+ Add account",
              }),
            ],
          }),
        ],
      }),
      H === null
        ? i.jsx("div", {
            className: "empty",
            children: i.jsx("p", { children: "Loading accounts…" }),
          })
        : H.length === 0 && U && U.length > 0
          ? i.jsxs("div", {
              className: "empty",
              children: [
                i.jsx("h2", { children: "No matches" }),
                i.jsxs("p", { children: ["No accounts match “", x, "”."] }),
              ],
            })
          : H.length === 0 && v && v.length > 0
            ? i.jsxs("div", {
                className: "empty",
                children: [
                  i.jsx("h2", { children: "No other accounts" }),
                  i.jsx("p", {
                    children:
                      "Your default account lives on the Dashboard. Add another account to see it here.",
                  }),
                  i.jsx("div", {
                    className: "empty-actions",
                    children: i.jsx("button", {
                      className: "btn btn-primary",
                      onClick: () => w({ type: "add" }),
                      children: "+ Add account",
                    }),
                  }),
                ],
              })
            : H.length === 0
              ? i.jsxs("div", {
                  className: "empty",
                  children: [
                    i.jsx("h2", { children: "No accounts yet" }),
                    i.jsxs("p", {
                      children: [
                        "Each account is an isolated Claude Code profile folder (its own ",
                        i.jsx("code", { children: "CLAUDE_CONFIG_DIR" }),
                        ").",
                      ],
                    }),
                    i.jsx("div", {
                      className: "empty-actions",
                      children: i.jsx("button", {
                        className: "btn btn-primary",
                        onClick: () => w({ type: "add" }),
                        children: "+ Add your first account",
                      }),
                    }),
                  ],
                })
              : i.jsx("div", {
                  className: "grid",
                  children: H.map((N) =>
                    i.jsx(
                      Jo,
                      {
                        state: N,
                        now: f,
                        onLaunch: (K) => {
                          R(K, N.profile.id);
                        },
                        onSetDefault: (K) => {
                          _(N.profile.id, K);
                        },
                        onRename: () => w({ type: "rename", state: N }),
                        onRemove: () => w({ type: "remove", state: N }),
                        onReveal: () => {
                          window.cam.revealFolder(N.profile.id);
                        },
                        onRefresh: () => {
                          window.cam.refreshUsage(N.profile.id);
                        },
                      },
                      N.profile.id,
                    ),
                  ),
                }),
      D?.type === "add" &&
        i.jsx(Kv, {
          onClose: () => w(null),
          onDone: (N) => {
            (w(null), o(N));
          },
        }),
      D?.type === "rename" &&
        i.jsx($o, {
          state: D.state,
          onClose: () => w(null),
          onDone: () => w(null),
        }),
      D?.type === "remove" &&
        i.jsx(Wo, {
          state: D.state,
          onClose: () => w(null),
          onDone: (N) => {
            (w(null), o(N));
          },
        }),
    ],
  });
}
const Ss = {
  UpToDate: "up to date",
  Missing: "missing",
  Outdated: "outdated",
  NewerAtTarget: "newer here",
  Modified: "modified",
};
function Jv({ showToast: f }) {
  const [o, v] = q.useState(null),
    [d, x] = q.useState(null),
    [E, D] = q.useState(null),
    w = q.useCallback(async () => {
      x("Scanning profiles…");
      try {
        v(await window.cam.skills.overview());
      } finally {
        x(null);
      }
    }, []);
  q.useEffect(() => {
    w();
  }, [w]);
  const C = q.useCallback(
      (_, Y) => o?.matrix.find((U) => U.skill === _ && U.profile === Y),
      [o],
    ),
    g = q.useMemo(() => {
      if (!o) return null;
      const _ = o.matrix.length,
        Y = o.matrix.filter((K) => K.state === "UpToDate").length,
        U = o.matrix.filter((K) => K.state === "Missing").length,
        H = o.matrix.filter((K) => K.state === "Outdated").length,
        N = o.matrix.filter(
          (K) => K.state === "NewerAtTarget" || K.state === "Modified",
        ).length;
      return { total: _, upToDate: Y, missing: U, outdated: H, protected: N };
    }, [o]),
    B = async (_) => {
      const Y = _.skills?.length
        ? `'${_.skills[0]}'`
        : _.profiles?.length
          ? `all skills → ${_.profiles[0]}`
          : "all skills → all profiles";
      (x(`Installing ${Y}…`), D(null));
      try {
        const U = await window.cam.skills.install(_);
        if ((D(U), U.error)) f(`Install failed: ${U.error}`);
        else {
          const H = U.results.filter(
              (K) =>
                K.success &&
                (K.action === "Installed" || K.action === "Updated"),
            ).length,
            N = U.results.filter((K) => K.action === "SkippedProtected").length;
          f(
            H === 0
              ? "Already in sync — nothing to install."
              : `${H} install/update action(s) applied${N ? `, ${N} protected` : ""}.`,
          );
        }
        await w();
      } finally {
        x(null);
      }
    },
    R = async () => {
      x("Running environment audit…");
      try {
        const _ = await window.cam.skills.runAudit();
        f(
          _.ok
            ? _.output.split(`
`)[0] || "Audit complete."
            : `Audit failed: ${_.output}`,
        );
      } finally {
        x(null);
      }
    };
  return o
    ? o.engineFound
      ? i.jsxs("div", {
          className: "view",
          children: [
            i.jsx(Go, { busy: d, onReload: w, overview: o }),
            o.error &&
              i.jsx("div", {
                className: "headline-warning",
                "data-kind": "crit",
                children: o.error,
              }),
            g &&
              i.jsxs("div", {
                className: "summary-row",
                children: [
                  i.jsx(Vu, {
                    label: "Curated skills",
                    value: String(o.skills.length),
                    hint: `engine v${o.engineVersion ?? "?"}`,
                  }),
                  i.jsx(Vu, {
                    label: "Profiles",
                    value: String(o.profiles.length),
                  }),
                  i.jsx(Vu, {
                    label: "Up to date",
                    value: `${g.upToDate}/${g.total}`,
                  }),
                  i.jsx(Vu, {
                    label: "Needs install",
                    value: String(g.missing + g.outdated),
                    hint: g.protected
                      ? `${g.protected} protected (newer/modified)`
                      : void 0,
                  }),
                ],
              }),
            i.jsxs("section", {
              className: "panel",
              children: [
                i.jsxs("div", {
                  className: "panel-head-row",
                  children: [
                    i.jsx("h3", {
                      className: "panel-title",
                      children: "Skill deployment matrix",
                    }),
                    i.jsxs("div", {
                      className: "view-actions",
                      children: [
                        i.jsx("button", {
                          className: "btn",
                          onClick: () => {
                            R();
                          },
                          disabled: d !== null,
                          children: "Run audit",
                        }),
                        i.jsx("button", {
                          className: "btn btn-primary",
                          onClick: () => {
                            B({});
                          },
                          disabled:
                            d !== null ||
                            (g !== null && g.missing + g.outdated === 0),
                          children: d ?? "Install all skills to all profiles",
                        }),
                      ],
                    }),
                  ],
                }),
                i.jsx("p", {
                  className: "view-sub",
                  style: { margin: "2px 0 10px" },
                  children:
                    "Every change is backed up first and checksum-verified. Profiles with newer or locally modified copies are protected and never overwritten.",
                }),
                i.jsx("div", {
                  className: "skills-matrix-wrap",
                  children: i.jsxs("table", {
                    className: "skills-matrix",
                    children: [
                      i.jsx("thead", {
                        children: i.jsxs("tr", {
                          children: [
                            i.jsx("th", { children: "Skill" }),
                            o.profiles.map((_) =>
                              i.jsx(
                                "th",
                                { title: _.path, children: _.name },
                                _.name,
                              ),
                            ),
                            i.jsx("th", {}),
                          ],
                        }),
                      }),
                      i.jsx("tbody", {
                        children: o.skills.map((_) =>
                          i.jsxs(
                            "tr",
                            {
                              children: [
                                i.jsxs("td", {
                                  className: "skills-name",
                                  title: _.description,
                                  children: [
                                    i.jsx("span", { children: _.name }),
                                    i.jsxs("span", {
                                      className: "skills-version",
                                      children: ["v", _.version],
                                    }),
                                  ],
                                }),
                                o.profiles.map((Y) => {
                                  const U = C(_.name, Y.name),
                                    H = U?.state ?? "Missing";
                                  return i.jsx(
                                    "td",
                                    {
                                      children: i.jsx("span", {
                                        className: "skills-chip",
                                        "data-state": H,
                                        title:
                                          H === "UpToDate"
                                            ? `v${_.version} installed`
                                            : U?.installedVersion
                                              ? `${Ss[H]} (v${U.installedVersion})`
                                              : Ss[H],
                                        children: Ss[H],
                                      }),
                                    },
                                    Y.name,
                                  );
                                }),
                                i.jsx("td", {
                                  children: i.jsx("button", {
                                    className: "btn btn-small",
                                    disabled: d !== null,
                                    onClick: () => {
                                      B({ skills: [_.name] });
                                    },
                                    title: `Install/update '${_.name}' in every profile`,
                                    children: "Sync",
                                  }),
                                }),
                              ],
                            },
                            _.name,
                          ),
                        ),
                      }),
                    ],
                  }),
                }),
              ],
            }),
            E &&
              E.results.length > 0 &&
              i.jsxs("section", {
                className: "panel",
                children: [
                  i.jsx("h3", {
                    className: "panel-title",
                    children: "Last run",
                  }),
                  i.jsxs("div", {
                    className: "skills-results",
                    children: [
                      E.results
                        .filter((_) => _.action !== "SkippedUpToDate")
                        .slice(0, 40)
                        .map((_, Y) =>
                          i.jsxs(
                            "div",
                            {
                              className: "skills-result-row",
                              "data-ok": _.success,
                              children: [
                                i.jsx("span", {
                                  className: "skills-result-action",
                                  children: _.action,
                                }),
                                i.jsxs("span", {
                                  children: [_.skill, " → ", _.profile],
                                }),
                                i.jsx("span", {
                                  className: "skills-result-detail",
                                  children: _.detail,
                                }),
                              ],
                            },
                            Y,
                          ),
                        ),
                      E.results.every((_) => _.action === "SkippedUpToDate") &&
                        i.jsx("p", {
                          className: "view-sub",
                          children: "Everything was already up to date.",
                        }),
                    ],
                  }),
                ],
              }),
          ],
        })
      : i.jsxs("div", {
          className: "view",
          children: [
            i.jsx(Go, { busy: d, onReload: w, overview: o }),
            i.jsxs("div", {
              className: "empty",
              children: [
                i.jsx("h2", { children: "AI Environment Manager not found" }),
                i.jsxs("p", {
                  children: [
                    "Skills Sync is powered by the AI Environment Manager engine. Install it (Desktop folder",
                    " ",
                    i.jsx("code", { children: "AI Environment Manager" }),
                    " or its installer), then refresh.",
                  ],
                }),
                i.jsx("div", {
                  className: "empty-actions",
                  children: i.jsx("button", {
                    className: "btn btn-primary",
                    onClick: () => {
                      w();
                    },
                    children: "↻ Retry detection",
                  }),
                }),
              ],
            }),
          ],
        })
    : i.jsx("div", {
        className: "view",
        children: i.jsx("div", {
          className: "empty",
          children: i.jsx("p", { children: d ?? "Loading…" }),
        }),
      });
}
function Go({ busy: f, onReload: o, overview: v }) {
  return i.jsxs("header", {
    className: "view-head",
    children: [
      i.jsxs("div", {
        children: [
          i.jsx("h1", { children: "Skills Sync" }),
          i.jsx("p", {
            className: "view-sub",
            children:
              "Curated Claude skills — superpowers, claude-mem, reviews, docs & release tooling — kept identical across every profile",
          }),
        ],
      }),
      i.jsxs("div", {
        className: "view-actions",
        children: [
          v.engineFound &&
            i.jsx("button", {
              className: "btn",
              onClick: () => {
                window.cam.skills.openApp();
              },
              title: v.enginePath,
              children: "Open full app",
            }),
          i.jsx("button", {
            className: "btn",
            onClick: () => {
              o();
            },
            disabled: f !== null,
            children: "↻ Refresh",
          }),
        ],
      }),
    ],
  });
}
function Vu({ label: f, value: o, hint: v }) {
  return i.jsxs("div", {
    className: "summary-tile",
    children: [
      i.jsx("div", { className: "summary-tile-label", children: f }),
      i.jsx("div", { className: "summary-tile-value", children: o }),
      v && i.jsx("div", { className: "summary-tile-hint", children: v }),
    ],
  });
}
function $v({ keys: f, summary: o, now: v, onOpenProvider: d, onGoKeys: x }) {
  if (f === null)
    return i.jsx("div", {
      className: "view",
      children: i.jsx("div", {
        className: "empty",
        children: i.jsx("p", { children: "Loading…" }),
      }),
    });
  if (f.length === 0)
    return i.jsxs("div", {
      className: "view",
      children: [
        i.jsx("header", {
          className: "view-head",
          children: i.jsxs("div", {
            children: [
              i.jsx("h1", { children: "API Dashboard" }),
              i.jsx("p", {
                className: "view-sub",
                children: "Balances and spend across your providers",
              }),
            ],
          }),
        }),
        i.jsxs("div", {
          className: "empty",
          children: [
            i.jsx("h2", { children: "Nothing to show yet" }),
            i.jsx("p", {
              children:
                "Add an API key to see balances, daily and weekly spend, and runway projections here.",
            }),
            i.jsx("div", {
              className: "empty-actions",
              children: i.jsx("button", {
                className: "btn btn-primary",
                onClick: x,
                children: "+ Add an API key",
              }),
            }),
          ],
        }),
      ],
    });
  const E = o?.shortestRunway ?? null;
  return i.jsxs("div", {
    className: "view",
    children: [
      i.jsxs("header", {
        className: "view-head",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("h1", { children: "API Dashboard" }),
              i.jsx("p", {
                className: "view-sub",
                children: "Balances and spend across your providers",
              }),
            ],
          }),
          i.jsx("div", {
            className: "view-actions",
            children: i.jsx("button", {
              className: "btn",
              onClick: () => {
                window.cam.apiKeys.refresh();
              },
              children: "↻ Refresh",
            }),
          }),
        ],
      }),
      E &&
        E.days < 30 &&
        i.jsxs("div", {
          className: "headline-warning",
          "data-kind": E.days < 7 ? "crit" : "warn",
          children: [
            i.jsx("strong", { children: "Heads up:" }),
            " your ",
            i.jsx("b", { children: E.nickname }),
            " credits are projected to last",
            " ",
            i.jsxs("b", {
              children: [
                Math.floor(E.days),
                " day",
                Math.floor(E.days) === 1 ? "" : "s",
              ],
            }),
            " at the current burn rate.",
          ],
        }),
      o &&
        i.jsxs("div", {
          className: "summary-row",
          children: [
            i.jsx(ku, {
              label: "Total balance",
              value: wl(o.totalBalanceUsd),
              hint: "Across prepaid providers",
            }),
            i.jsx(ku, { label: "Spend today", value: wl(o.spendToday) }),
            i.jsx(ku, { label: "Spend this week", value: wl(o.spendWeek) }),
            i.jsx(ku, {
              label: "Projected month",
              value: wl(o.projectedMonthlyUsd),
              hint: `${wl(o.avgDailySpendUsd)}/day avg`,
            }),
          ],
        }),
      i.jsx("div", {
        className: "dash-cards",
        children: f.map((D) =>
          i.jsxs(
            "button",
            {
              className: "dash-card",
              onClick: () => d(D.record.provider),
              "data-status": D.status,
              children: [
                i.jsxs("div", {
                  className: "dash-card-head",
                  children: [
                    i.jsx("span", {
                      className: "dot",
                      "data-kind": D.status,
                      "aria-hidden": "true",
                    }),
                    i.jsx("span", {
                      className: "dash-card-provider",
                      style: { "--pill-accent": D.meta.accent },
                      children: D.meta.displayName,
                    }),
                    i.jsx("span", {
                      className: "dash-card-nick",
                      children: D.record.nickname,
                    }),
                  ],
                }),
                i.jsx("div", {
                  className: "dash-card-balance",
                  children:
                    D.balanceUsd !== null
                      ? i.jsxs(i.Fragment, {
                          children: [
                            i.jsx("span", {
                              className: "dash-balance-value",
                              children: wl(D.balanceUsd),
                            }),
                            i.jsx("span", {
                              className: "dash-balance-label",
                              children:
                                D.meta.billingModel === "prepaid"
                                  ? "credits"
                                  : "balance",
                            }),
                          ],
                        })
                      : i.jsxs("span", {
                          className: "dash-balance-value muted",
                          children: [
                            wl(D.usage.cost.month),
                            i.jsx("span", {
                              className: "dash-balance-label",
                              children: " this month",
                            }),
                          ],
                        }),
                }),
                i.jsxs("div", {
                  className: "dash-card-row",
                  children: [
                    i.jsxs("span", {
                      children: ["Today ", wl(D.usage.cost.today)],
                    }),
                    i.jsxs("span", {
                      children: ["Week ", wl(D.usage.cost.week)],
                    }),
                    D.runwayDays !== null &&
                      i.jsxs("span", {
                        children: ["Runway ", Vo(D.runwayDays)],
                      }),
                  ],
                }),
                i.jsx("div", {
                  className: "dash-card-foot",
                  children: D.lastUpdated
                    ? `updated ${Tn(D.lastUpdated, v)}`
                    : "not yet updated",
                }),
              ],
            },
            D.record.id,
          ),
        ),
      }),
    ],
  });
}
function ku({ label: f, value: o, hint: v }) {
  return i.jsxs("div", {
    className: "summary-tile",
    children: [
      i.jsx("div", { className: "summary-tile-label", children: f }),
      i.jsx("div", { className: "summary-tile-value", children: o }),
      v && i.jsx("div", { className: "summary-tile-hint", children: v }),
    ],
  });
}
const Wv = {
  green: "Healthy",
  yellow: "Watch",
  red: "Critical",
  unknown: "Unknown",
};
function Fv(f) {
  if (!f.latest) return "No data yet — refreshing.";
  if (!f.latest.ok) return f.latest.error ?? "Last refresh failed.";
  if (f.status === "unknown")
    return "Connected; no spend data available for this key type.";
  if (f.runwayDays !== null && f.runwayDays < 21) {
    const o = Math.floor(f.runwayDays);
    return `~${o} day${o === 1 ? "" : "s"} of credit left at current burn.`;
  }
  return f.record.monthlyBudgetUsd && f.usage.cost.month > 0
    ? `${Math.round((f.usage.cost.month / f.record.monthlyBudgetUsd) * 100)}% of monthly budget used.`
    : "Within normal thresholds.";
}
const Iv = {
  exact: "Live",
  admin: "Admin key",
  derived: "Tracked",
  estimated: "Estimated",
  none: "Unavailable",
};
function Fo({
  state: f,
  now: o,
  onEdit: v,
  onRemove: d,
  onRefresh: x,
  onOpenProvider: E,
}) {
  const [D, w] = q.useState(!1),
    C = q.useRef(null),
    { record: g, meta: B, status: R } = f;
  q.useEffect(() => {
    if (!D) return;
    const H = (N) => {
      C.current && !C.current.contains(N.target) && w(!1);
    };
    return (
      document.addEventListener("mousedown", H),
      () => document.removeEventListener("mousedown", H)
    );
  }, [D]);
  const _ = f.usage.cost,
    Y = g.monthlyBudgetUsd ?? null,
    U = Y && Y > 0 ? Math.min(100, (_.month / Y) * 100) : null;
  return i.jsxs("article", {
    className: "card apikey-card",
    "data-status": R,
    children: [
      i.jsxs("header", {
        className: "card-head",
        children: [
          i.jsx("span", {
            className: "dot",
            "data-kind": R,
            "aria-hidden": "true",
          }),
          i.jsx("h3", {
            className: "card-name",
            title: g.maskedKey,
            children: g.nickname,
          }),
          i.jsx("span", {
            className: "provider-tag",
            style: { "--pill-accent": B.accent },
            children: B.displayName,
          }),
          g.isAdminKey &&
            i.jsx("span", {
              className: "badge badge-default",
              children: "admin",
            }),
          i.jsx("span", {
            className: "status-label",
            "data-kind": R,
            children: Wv[R],
          }),
          i.jsxs("div", {
            className: "menu-wrap",
            ref: C,
            children: [
              i.jsx("button", {
                className: "btn btn-icon",
                "aria-label": "Key menu",
                "aria-expanded": D,
                onClick: () => w((H) => !H),
                children: "⋯",
              }),
              D &&
                i.jsxs("div", {
                  className: "menu",
                  role: "menu",
                  children: [
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (w(!1), x());
                      },
                      children: "Refresh now",
                    }),
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (w(!1), E());
                      },
                      children: "Open provider page",
                    }),
                    i.jsx("button", {
                      role: "menuitem",
                      onClick: () => {
                        (w(!1), v());
                      },
                      children: "Edit…",
                    }),
                    i.jsx("button", {
                      role: "menuitem",
                      className: "danger",
                      onClick: () => {
                        (w(!1), d());
                      },
                      children: "Remove…",
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
      i.jsx("div", {
        className: "card-sub",
        children: i.jsx("code", { children: g.maskedKey }),
      }),
      i.jsxs("div", {
        className: "apikey-stats",
        children: [
          f.balanceUsd !== null
            ? i.jsx(En, {
                label: B.billingModel === "prepaid" ? "Balance" : "Credits",
                value: wl(f.balanceUsd),
                strong: !0,
              })
            : i.jsx(En, {
                label: "Balance",
                value: "n/a",
                muted: !0,
                title: "No balance API for this provider",
              }),
          i.jsx(En, { label: "Today", value: wl(_.today) }),
          i.jsx(En, { label: "Week", value: wl(_.week) }),
          i.jsx(En, { label: "Month", value: wl(_.month) }),
        ],
      }),
      U !== null &&
        i.jsxs("div", {
          className: "meter",
          children: [
            i.jsxs("div", {
              className: "meter-top",
              children: [
                i.jsx("span", {
                  className: "meter-label",
                  children: "Monthly budget",
                }),
                i.jsxs("span", {
                  className: "meter-pct",
                  children: [Math.round(U), "%"],
                }),
              ],
            }),
            i.jsx("div", {
              className: "meter-track",
              children: i.jsx("div", {
                className: "meter-fill",
                "data-kind":
                  R === "unknown" || R === "green"
                    ? "ok"
                    : R === "yellow"
                      ? "warn"
                      : "crit",
                style: { width: `${Math.max(2, U)}%` },
              }),
            }),
          ],
        }),
      f.runwayDays !== null &&
        i.jsxs("div", {
          className: "runway-line",
          children: [
            "Runway ",
            i.jsx("b", { children: Vo(f.runwayDays) }),
            " · projected month ",
            wl(f.projectedMonthlyUsd),
          ],
        }),
      i.jsx("div", {
        className: "card-meta",
        children: i.jsx("span", { children: Fv(f) }),
      }),
      i.jsxs("div", {
        className: "card-meta subtle",
        children: [
          i.jsx("span", {
            children: f.lastUpdated
              ? `updated ${Tn(f.lastUpdated, o)}`
              : "never updated",
          }),
          !f.derivedFromSnapshots &&
            f.latest?.ok &&
            i.jsxs(i.Fragment, {
              children: [
                i.jsx("span", { className: "sep", children: "·" }),
                i.jsx("span", { children: "live windows" }),
              ],
            }),
        ],
      }),
    ],
  });
}
function En({ label: f, value: o, strong: v, muted: d, title: x }) {
  return i.jsxs("div", {
    className: "stat",
    title: x,
    children: [
      i.jsx("div", {
        className: `stat-value${v ? " strong" : ""}${d ? " muted" : ""}`,
        children: o,
      }),
      i.jsx("div", { className: "stat-label", children: f }),
    ],
  });
}
function Pv({
  keys: f,
  providers: o,
  now: v,
  showToast: d,
  onOpenProvider: x,
}) {
  const [E, D] = q.useState(null),
    [w, C] = q.useState(!1),
    [g, B] = q.useState(""),
    R = async () => {
      C(!0);
      try {
        await window.cam.apiKeys.refresh();
      } finally {
        C(!1);
      }
    },
    _ = async () => {
      const H = await window.cam.apiKeys.export();
      H.ok && H.path
        ? d(`Exported key list to ${H.path}`)
        : H.error && d(H.error);
    },
    Y = g.trim().toLowerCase(),
    U = (f ?? []).filter(
      (H) =>
        !Y ||
        H.record.nickname.toLowerCase().includes(Y) ||
        H.meta.displayName.toLowerCase().includes(Y),
    );
  return i.jsxs("div", {
    className: "view",
    children: [
      i.jsxs("header", {
        className: "view-head",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("h1", { children: "API Keys" }),
              i.jsx("p", {
                className: "view-sub",
                children: f
                  ? `${f.length} key${f.length === 1 ? "" : "s"} · encrypted with Windows DPAPI`
                  : "Loading…",
              }),
            ],
          }),
          i.jsxs("div", {
            className: "view-actions",
            children: [
              i.jsx("div", {
                className: "search",
                children: i.jsx("input", {
                  type: "search",
                  placeholder: "Search keys…",
                  value: g,
                  onChange: (H) => B(H.target.value),
                  "aria-label": "Search keys",
                }),
              }),
              i.jsx("button", {
                className: "btn",
                onClick: () => {
                  R();
                },
                disabled: w,
                children: w ? "Refreshing…" : "↻ Refresh",
              }),
              i.jsx("button", {
                className: "btn",
                onClick: () => {
                  _();
                },
                children: "Export",
              }),
              i.jsx("button", {
                className: "btn btn-primary",
                onClick: () => D({ type: "add" }),
                children: "+ Add key",
              }),
            ],
          }),
        ],
      }),
      f === null
        ? i.jsx("div", {
            className: "empty",
            children: i.jsx("p", { children: "Loading…" }),
          })
        : f.length === 0
          ? i.jsxs("div", {
              className: "empty",
              children: [
                i.jsx("h2", { children: "No API keys yet" }),
                i.jsx("p", {
                  children:
                    "Add a provider key to track balance, spend, and usage trends. Keys are encrypted at rest with Windows DPAPI and only ever sent to their own provider.",
                }),
                i.jsx("div", {
                  className: "empty-actions",
                  children: i.jsx("button", {
                    className: "btn btn-primary",
                    onClick: () => D({ type: "add" }),
                    children: "+ Add your first key",
                  }),
                }),
              ],
            })
          : U.length === 0
            ? i.jsxs("div", {
                className: "empty",
                children: [
                  i.jsx("h2", { children: "No matches" }),
                  i.jsxs("p", { children: ["No keys match “", g, "”."] }),
                ],
              })
            : i.jsx("div", {
                className: "grid",
                children: U.map((H) =>
                  i.jsx(
                    Fo,
                    {
                      state: H,
                      now: v,
                      onEdit: () => D({ type: "edit", state: H }),
                      onRemove: () => D({ type: "remove", state: H }),
                      onRefresh: () => {
                        window.cam.apiKeys.refresh(H.record.id);
                      },
                      onOpenProvider: () => x(H.record.provider),
                    },
                    H.record.id,
                  ),
                ),
              }),
      E?.type === "add" &&
        i.jsx(Bv, {
          providers: o,
          initialProvider: E.provider,
          onClose: () => D(null),
          onDone: (H) => {
            (D(null), d(H));
          },
        }),
      E?.type === "edit" &&
        i.jsx(Qo, {
          state: E.state,
          onClose: () => D(null),
          onDone: (H) => {
            (D(null), d(H));
          },
        }),
      E?.type === "remove" &&
        i.jsx(Zo, {
          state: E.state,
          onClose: () => D(null),
          onDone: (H) => {
            (D(null), d(H));
          },
        }),
    ],
  });
}
const ue = { top: 14, right: 14, bottom: 22, left: 48 };
function ly({
  buckets: f,
  mode: o,
  chartType: v,
  metric: d,
  color: x,
  height: E = 200,
}) {
  const [D, w] = q.useState(null),
    C = q.useRef(null),
    g = 640,
    B = f.map((k) => (o === "daily" ? k.daily : k.running)),
    R = Math.max(1e-9, ...B),
    _ = g - ue.left - ue.right,
    Y = E - ue.top - ue.bottom,
    U = q.useMemo(
      () =>
        B.map((k, al) => {
          const W =
              ue.left + (B.length <= 1 ? _ / 2 : (al / (B.length - 1)) * _),
            P = ue.top + Y - (k / R) * Y;
          return { x: W, y: P, v: k, date: f[al]?.date ?? "" };
        }),
      [B, R, _, Y, f],
    ),
    H = U.map(
      (k, al) => `${al === 0 ? "M" : "L"}${k.x.toFixed(1)},${k.y.toFixed(1)}`,
    ).join(" "),
    N =
      U.length > 0
        ? `${H} L${U[U.length - 1].x.toFixed(1)},${(ue.top + Y).toFixed(1)} L${U[0].x.toFixed(1)},${(ue.top + Y).toFixed(1)} Z`
        : "",
    K = [0, R / 2, R].map((k) => ({ v: k, y: ue.top + Y - (k / R) * Y })),
    nl =
      U.length <= 1 ? [0] : [0, Math.floor((U.length - 1) / 2), U.length - 1],
    ol = (k) => {
      const al = k.currentTarget.getBoundingClientRect(),
        W = ((k.clientX - al.left) / al.width) * g;
      let P = 0,
        Xl = 1 / 0;
      for (let F = 0; F < U.length; F++) {
        const Ml = Math.abs(U[F].x - W);
        Ml < Xl && ((Xl = Ml), (P = F));
      }
      w(P);
    },
    sl = D !== null ? U[D] : null;
  return i.jsxs("div", {
    className: "chart",
    ref: C,
    children: [
      i.jsxs("svg", {
        viewBox: `0 0 ${g} ${E}`,
        preserveAspectRatio: "none",
        role: "img",
        "aria-label": `${o === "daily" ? "Daily" : "Cumulative"} ${d} trend`,
        onMouseMove: ol,
        onMouseLeave: () => w(null),
        children: [
          K.map((k, al) =>
            i.jsxs(
              "g",
              {
                children: [
                  i.jsx("line", {
                    x1: ue.left,
                    y1: k.y,
                    x2: g - ue.right,
                    y2: k.y,
                    className: "chart-grid",
                  }),
                  i.jsx("text", {
                    x: ue.left - 6,
                    y: k.y + 3,
                    textAnchor: "end",
                    className: "chart-axis-label",
                    children: wo(d, k.v),
                  }),
                ],
              },
              al,
            ),
          ),
          v === "area" && N && i.jsx("path", { d: N, fill: x, opacity: 0.14 }),
          H &&
            i.jsx("path", {
              d: H,
              fill: "none",
              stroke: x,
              strokeWidth: 2,
              strokeLinejoin: "round",
              strokeLinecap: "round",
            }),
          U.length === 1 &&
            i.jsx("circle", { cx: U[0].x, cy: U[0].y, r: 4, fill: x }),
          nl.map((k) =>
            i.jsx(
              "text",
              {
                x: U[k]?.x ?? 0,
                y: E - 6,
                textAnchor: "middle",
                className: "chart-axis-label",
                children: ey(U[k]?.date),
              },
              k,
            ),
          ),
          sl &&
            i.jsxs("g", {
              children: [
                i.jsx("line", {
                  x1: sl.x,
                  y1: ue.top,
                  x2: sl.x,
                  y2: ue.top + Y,
                  className: "chart-crosshair",
                }),
                i.jsx("circle", {
                  cx: sl.x,
                  cy: sl.y,
                  r: 4,
                  fill: x,
                  stroke: "var(--surface)",
                  strokeWidth: 2,
                }),
              ],
            }),
        ],
      }),
      sl &&
        i.jsxs("div", {
          className: "chart-tooltip",
          style: { left: `${(sl.x / g) * 100}%`, top: `${(sl.y / E) * 100}%` },
          children: [
            i.jsx("div", {
              className: "chart-tooltip-date",
              children: ty(sl.date),
            }),
            i.jsx("div", {
              className: "chart-tooltip-val",
              children: wo(d, sl.v),
            }),
          ],
        }),
    ],
  });
}
function ey(f) {
  if (!f) return "";
  const [, o, v] = f.split("-");
  return `${Number(o)}/${Number(v)}`;
}
function ty(f) {
  return f
    ? new Date(`${f}T00:00:00`).toLocaleDateString(void 0, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";
}
const ay = ["cost", "tokens", "requests"],
  ny = ["1d", "7d", "30d", "lifetime"],
  uy = {
    "1d": "1 Day",
    "7d": "7 Days",
    "30d": "30 Days",
    lifetime: "Lifetime",
  },
  Xo = { cost: "Cost", tokens: "Tokens", requests: "Requests" };
function Io({ keys: f, now: o }) {
  const [v, d] = q.useState(f[0]?.record.id ?? ""),
    [x, E] = q.useState("cost"),
    [D, w] = q.useState("7d"),
    [C, g] = q.useState("area"),
    [B, R] = q.useState("daily"),
    [_, Y] = q.useState(null);
  (q.useEffect(() => {
    f.some((N) => N.record.id === v) || d(f[0]?.record.id ?? "");
  }, [f, v]),
    q.useEffect(() => {
      if (!v) {
        Y(null);
        return;
      }
      let N = !0;
      return (
        window.cam.apiKeys.chart(v, x, D).then((K) => {
          N && Y(K);
        }),
        () => {
          N = !1;
        }
      );
    }, [v, x, D, o]));
  const U = f.find((N) => N.record.id === v),
    H = U?.meta.accent ?? "#2a78d6";
  return f.length === 0
    ? null
    : i.jsxs("section", {
        className: "panel chart-panel",
        children: [
          i.jsxs("div", {
            className: "chart-controls",
            children: [
              i.jsxs("div", {
                className: "chart-control-group",
                children: [
                  i.jsx("label", { className: "mini-label", children: "Key" }),
                  i.jsx("select", {
                    className: "select",
                    value: v,
                    onChange: (N) => d(N.target.value),
                    children: f.map((N) =>
                      i.jsxs(
                        "option",
                        {
                          value: N.record.id,
                          children: [
                            N.record.nickname,
                            " (",
                            N.meta.displayName,
                            ")",
                          ],
                        },
                        N.record.id,
                      ),
                    ),
                  }),
                ],
              }),
              i.jsx(Ju, {
                label: "Metric",
                options: ay,
                value: x,
                onChange: E,
                render: (N) => Xo[N],
              }),
              i.jsx(Ju, {
                label: "Range",
                options: ny,
                value: D,
                onChange: w,
                render: (N) => uy[N],
              }),
              i.jsx(Ju, {
                label: "Type",
                options: ["line", "area"],
                value: C,
                onChange: g,
                render: (N) => (N === "line" ? "Line" : "Area"),
              }),
              i.jsx(Ju, {
                label: "Total",
                options: ["daily", "running"],
                value: B,
                onChange: R,
                render: (N) => (N === "daily" ? "Daily" : "Running"),
              }),
            ],
          }),
          _ && _.buckets.length > 0
            ? i.jsxs(i.Fragment, {
                children: [
                  i.jsx(ly, {
                    buckets: _.buckets,
                    mode: B,
                    chartType: C,
                    metric: x,
                    color: H,
                  }),
                  _.sparse &&
                    i.jsxs("p", {
                      className: "chart-note",
                      children: [
                        "Only a short history has been recorded so far — the trend fills in as more snapshots are collected",
                        x !== "cost" &&
                        U &&
                        U.meta.capabilities.usage !== "exact" &&
                        U.meta.capabilities.usage !== "admin"
                          ? `, and ${Xo[x].toLowerCase()} isn't reported by ${U.meta.displayName}.`
                          : ".",
                      ],
                    }),
                ],
              })
            : i.jsx("div", {
                className: "chart-empty",
                children: "No data recorded yet for this selection.",
              }),
        ],
      });
}
function Ju({ label: f, options: o, value: v, onChange: d, render: x }) {
  return i.jsxs("div", {
    className: "chart-control-group",
    children: [
      i.jsx("label", { className: "mini-label", children: f }),
      i.jsx("div", {
        className: "segmented small",
        children: o.map((E) =>
          i.jsx(
            "button",
            {
              "data-active": E === v || void 0,
              onClick: () => d(E),
              children: x(E),
            },
            E,
          ),
        ),
      }),
    ],
  });
}
function iy(f, o) {
  const v = Math.floor(o);
  return v <= 0
    ? `Your ${f} credits are effectively exhausted at the current burn rate.`
    : `Your ${f} credits are projected to last ${v} day${v === 1 ? "" : "s"} at the current burn rate.`;
}
function usageHistorySeries(gptBuckets, claudeBuckets, days) {
  const gpt = new Map(
      (gptBuckets ?? []).map((bucket) => [
        bucket.startDate,
        Number(bucket.tokens) || 0,
      ]),
    ),
    claude = new Map(
      (claudeBuckets ?? []).map((bucket) => [
        bucket.startDate,
        Number(bucket.tokens) || 0,
      ]),
    ),
    result = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 864e5)
      .toISOString()
      .slice(0, 10);
    result.push({
      date,
      gpt: gpt.get(date) ?? 0,
      claude: claude.get(date) ?? 0,
    });
  }
  return result;
}
function historyPath(rows, key, width, height) {
  if (!rows.length) return "";
  const left = 44,
    right = 14,
    top = 16,
    bottom = 30,
    chartWidth = width - left - right,
    chartHeight = height - top - bottom,
    max = Math.max(...rows.flatMap((row) => [row.gpt, row.claude]), 1);
  return rows
    .map((row, index) => {
      const x = left + (index / Math.max(1, rows.length - 1)) * chartWidth,
        y = top + chartHeight - (row[key] / max) * chartHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
function UsageComparisonChart({ rows: f }) {
  const width = 760,
    height = 230,
    max = Math.max(...f.flatMap((o) => [o.gpt, o.claude]), 1),
    start = f[0]?.date,
    end = f[f.length - 1]?.date;
  return i.jsxs("div", {
    className: "usage-comparison-chart",
    children: [
      i.jsxs("div", {
        className: "usage-chart-legend",
        children: [
          i.jsxs("span", {
            children: [i.jsx("i", { "data-series": "gpt" }), "GPT / Codex"],
          }),
          i.jsxs("span", {
            children: [i.jsx("i", { "data-series": "claude" }), "Claude Code"],
          }),
          i.jsx("span", {
            className: "usage-chart-scale",
            children: `scale max ${formatGptTokens(max)} tokens/day`,
          }),
        ],
      }),
      i.jsxs("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": "Daily token comparison for GPT and Claude",
        children: [
          [0, 0.25, 0.5, 0.75, 1].map((o) =>
            i.jsx(
              "line",
              {
                className: "usage-grid-line",
                x1: 44,
                x2: width - 14,
                y1: 16 + o * (height - 46),
                y2: 16 + o * (height - 46),
              },
              o,
            ),
          ),
          i.jsx("path", {
            className: "usage-history-line",
            "data-series": "gpt",
            d: historyPath(f, "gpt", width, height),
          }),
          i.jsx("path", {
            className: "usage-history-line",
            "data-series": "claude",
            d: historyPath(f, "claude", width, height),
          }),
          i.jsx("text", { x: 44, y: height - 8, children: start }),
          i.jsx("text", {
            x: width - 14,
            y: height - 8,
            textAnchor: "end",
            children: end,
          }),
        ],
      }),
    ],
  });
}
function UsageHistoryPanel({ now: f }) {
  const [o, v] = q.useState(null),
    [d, x] = q.useState(null),
    [E, D] = q.useState(30),
    [w, C] = q.useState(!1),
    g = q.useCallback(async (refreshGpt = !1) => {
      C(!0);
      try {
        const [gpt, claude] = await Promise.all([
          refreshGpt ? window.cam.refreshGptUsage() : window.cam.getGptUsage(),
          window.cam.getClaudeHistory(90),
        ]);
        (v(gpt), x(claude));
      } finally {
        C(!1);
      }
    }, []);
  q.useEffect(() => {
    g();
    const unsubscribe = window.cam.onGptUsageChanged(v);
    return unsubscribe;
  }, [g]);
  const B = usageHistorySeries(
      o?.usage?.dailyUsageBuckets,
      d?.dailyUsageBuckets,
      E,
    ),
    R = B.reduce((sum, row) => sum + row.gpt, 0),
    _ = B.reduce((sum, row) => sum + row.claude, 0),
    Y = B.filter((row) => row.gpt > 0 || row.claude > 0).length;
  return i.jsxs("section", {
    className: "panel usage-history-panel",
    children: [
      i.jsxs("div", {
        className: "panel-head-row",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("h3", {
                className: "panel-title",
                children: "Account token history",
              }),
              i.jsx("p", {
                className: "view-sub",
                children:
                  "GPT account activity compared with tokens recorded in local Claude Code transcripts",
              }),
            ],
          }),
          i.jsxs("div", {
            className: "usage-history-actions",
            children: [
              i.jsx("div", {
                className: "segmented small",
                children: [7, 30, 90].map((range) =>
                  i.jsx(
                    "button",
                    {
                      "data-active": range === E || void 0,
                      onClick: () => D(range),
                      children: `${range}D`,
                    },
                    range,
                  ),
                ),
              }),
              i.jsx("button", {
                className: "btn btn-small",
                onClick: () => g(!0),
                disabled: w,
                children: w ? "Refreshing…" : "↻ Refresh",
              }),
            ],
          }),
        ],
      }),
      i.jsxs("div", {
        className: "usage-history-summary",
        children: [
          i.jsxs("div", {
            children: [
              i.jsx("span", { children: "GPT tokens" }),
              i.jsx("b", { children: formatGptTokens(R) }),
            ],
          }),
          i.jsxs("div", {
            children: [
              i.jsx("span", { children: "Claude tokens" }),
              i.jsx("b", { children: formatGptTokens(_) }),
            ],
          }),
          i.jsxs("div", {
            children: [
              i.jsx("span", { children: "Active days" }),
              i.jsxs("b", { children: [Y, "/", E] }),
            ],
          }),
          i.jsxs("div", {
            children: [
              i.jsx("span", { children: "Last updated" }),
              i.jsx("b", {
                children: Tn(Math.max(o?.fetchedAt ?? 0, d?.fetchedAt ?? 0), f),
              }),
            ],
          }),
        ],
      }),
      B.some((row) => row.gpt || row.claude)
        ? i.jsx(UsageComparisonChart, { rows: B })
        : i.jsx("div", {
            className: "chart-empty compact",
            children: "No daily token history was returned for this range.",
          }),
      i.jsx("p", {
        className: "chart-note",
        children:
          "GPT totals come from the signed-in ChatGPT account service. Claude totals are calculated locally from transcript usage records, so deleted or external sessions are not included.",
      }),
    ],
  });
}
function cy({ keys: f, summary: o, now: v, onGoKeys: d }) {
  return f === null
    ? i.jsx("div", {
        className: "view",
        children: i.jsx("div", {
          className: "empty",
          children: i.jsx("p", { children: "Loading…" }),
        }),
      })
    : f.length === 0
      ? i.jsxs("div", {
          className: "view",
          children: [
            i.jsx("header", {
              className: "view-head",
              children: i.jsxs("div", {
                children: [
                  i.jsx("h1", { children: "Analytics" }),
                  i.jsx("p", {
                    className: "view-sub",
                    children:
                      "Account tokens, spend trends, projections, and runway",
                  }),
                ],
              }),
            }),
            i.jsx(UsageHistoryPanel, { now: v }),
            i.jsxs("div", {
              className: "empty",
              children: [
                i.jsx("h2", { children: "No analytics yet" }),
                i.jsx("p", {
                  children:
                    "Add API keys to unlock spend trends, projected monthly cost, and credit runway.",
                }),
                i.jsx("div", {
                  className: "empty-actions",
                  children: i.jsx("button", {
                    className: "btn btn-primary",
                    onClick: d,
                    children: "+ Add an API key",
                  }),
                }),
              ],
            }),
          ],
        })
      : i.jsxs("div", {
          className: "view",
          children: [
            i.jsxs("header", {
              className: "view-head",
              children: [
                i.jsxs("div", {
                  children: [
                    i.jsx("h1", { children: "Analytics" }),
                    i.jsx("p", {
                      className: "view-sub",
                      children:
                        "Account tokens, spend trends, projections, and runway",
                    }),
                  ],
                }),
                i.jsx("div", {
                  className: "view-actions",
                  children: i.jsx("button", {
                    className: "btn",
                    onClick: () => {
                      window.cam.apiKeys.refresh();
                    },
                    children: "↻ Refresh",
                  }),
                }),
              ],
            }),
            i.jsx(UsageHistoryPanel, { now: v }),
            o &&
              i.jsxs("div", {
                className: "summary-row",
                children: [
                  i.jsx($u, {
                    label: "Top spending provider",
                    value: o.topProvider ? o.topProvider.displayName : "—",
                    hint: o.topProvider
                      ? `${wl(o.topProvider.spendMonth)} this month`
                      : "no spend recorded",
                  }),
                  i.jsx($u, {
                    label: "Avg daily spend",
                    value: wl(o.avgDailySpendUsd),
                  }),
                  i.jsx($u, {
                    label: "Projected monthly",
                    value: wl(o.projectedMonthlyUsd),
                  }),
                  i.jsx($u, {
                    label: "Most used model",
                    value: o.mostUsedModel ?? "—",
                    hint: o.mostUsedModel
                      ? void 0
                      : "not reported by providers",
                  }),
                ],
              }),
            o?.shortestRunway &&
              i.jsx("div", {
                className: "headline-warning",
                "data-kind": o.shortestRunway.days < 7 ? "crit" : "warn",
                children: iy(o.shortestRunway.nickname, o.shortestRunway.days),
              }),
            o &&
              o.perProviderMonthSpend.length > 0 &&
              i.jsxs("section", {
                className: "panel",
                children: [
                  i.jsx("h3", {
                    className: "panel-title",
                    children: "Spend by provider — this month",
                  }),
                  i.jsx("div", {
                    className: "bars",
                    children: (() => {
                      const x = Math.max(
                        ...o.perProviderMonthSpend.map((E) => E.spend),
                        1e-9,
                      );
                      return o.perProviderMonthSpend.map((E) =>
                        i.jsxs(
                          "div",
                          {
                            className: "bar-row",
                            children: [
                              i.jsx("span", {
                                className: "bar-label",
                                children: E.displayName,
                              }),
                              i.jsx("div", {
                                className: "bar-track",
                                children: i.jsx("div", {
                                  className: "bar-fill",
                                  style: {
                                    width: `${Math.max(2, (E.spend / x) * 100)}%`,
                                  },
                                }),
                              }),
                              i.jsx("span", {
                                className: "bar-value",
                                children: wl(E.spend),
                              }),
                            ],
                          },
                          E.provider,
                        ),
                      );
                    })(),
                  }),
                ],
              }),
            i.jsx(Io, { keys: f, now: v }),
          ],
        });
}
function $u({ label: f, value: o, hint: v }) {
  return i.jsxs("div", {
    className: "summary-tile",
    children: [
      i.jsx("div", { className: "summary-tile-label", children: f }),
      i.jsx("div", { className: "summary-tile-value", children: o }),
      v && i.jsx("div", { className: "summary-tile-hint", children: v }),
    ],
  });
}
function sy({
  provider: f,
  meta: o,
  keys: v,
  now: d,
  showToast: x,
  onAddKey: E,
  onEditKey: D,
  onRemoveKey: w,
}) {
  if (!o)
    return i.jsx("div", {
      className: "view",
      children: i.jsx("div", {
        className: "empty",
        children: i.jsx("p", { children: "Unknown provider." }),
      }),
    });
  const C = (v ?? []).filter((B) => B.record.provider === f),
    g = [
      ["Balance / credits", o.capabilities.balance],
      ["Usage (tokens/requests)", o.capabilities.usage],
      ["Cost (USD)", o.capabilities.cost],
      ["Rate limits", o.capabilities.rateLimits],
    ];
  return i.jsxs("div", {
    className: "view",
    children: [
      i.jsxs("header", {
        className: "view-head",
        children: [
          i.jsxs("div", {
            children: [
              i.jsxs("h1", {
                children: [
                  i.jsx("span", {
                    className: "provider-dot",
                    style: { background: o.accent },
                  }),
                  " ",
                  o.displayName,
                ],
              }),
              i.jsxs("p", {
                className: "view-sub",
                children: [
                  C.length,
                  " key",
                  C.length === 1 ? "" : "s",
                  " · ",
                  o.billingModel,
                  " billing",
                ],
              }),
            ],
          }),
          i.jsxs("div", {
            className: "view-actions",
            children: [
              i.jsx("button", {
                className: "btn",
                onClick: () => {
                  window.cam.openUsageGuide();
                },
                children: "📖 Usage guide",
              }),
              i.jsx("button", {
                className: "btn",
                onClick: () => {
                  window.cam.apiKeys.refresh();
                },
                children: "↻ Refresh",
              }),
              i.jsxs("button", {
                className: "btn btn-primary",
                onClick: () => E(f),
                children: ["+ Add ", o.displayName, " key"],
              }),
            ],
          }),
        ],
      }),
      i.jsxs("section", {
        className: "panel",
        children: [
          i.jsx("h3", {
            className: "panel-title",
            children: "What this provider exposes",
          }),
          i.jsx("div", {
            className: "cap-grid",
            children: g.map(([B, R]) =>
              i.jsxs(
                "div",
                {
                  className: "cap-item",
                  "data-cap": R,
                  children: [
                    i.jsx("span", { className: "cap-label", children: B }),
                    i.jsx("span", { className: "cap-value", children: Iv[R] }),
                  ],
                },
                B,
              ),
            ),
          }),
          i.jsxs("p", {
            className: "hint",
            children: [
              dy(f),
              " ",
              i.jsx("a", {
                href: o.docsUrl,
                onClick: (B) => {
                  (B.preventDefault(),
                    x("Opening provider docs in your browser…"),
                    window.open(o.docsUrl, "_blank"));
                },
                children: "Provider docs ↗",
              }),
            ],
          }),
        ],
      }),
      f === "anthropic" && i.jsx(fy, {}),
      C.length === 0
        ? i.jsxs("div", {
            className: "empty",
            children: [
              i.jsxs("h2", { children: ["No ", o.displayName, " keys"] }),
              i.jsx("p", { children: "Add one to start tracking it here." }),
              i.jsx("div", {
                className: "empty-actions",
                children: i.jsx("button", {
                  className: "btn btn-primary",
                  onClick: () => E(f),
                  children: "+ Add key",
                }),
              }),
            ],
          })
        : i.jsxs(i.Fragment, {
            children: [
              i.jsx("div", {
                className: "grid",
                children: C.map((B) =>
                  i.jsx(
                    Fo,
                    {
                      state: B,
                      now: d,
                      onEdit: () => D(B),
                      onRemove: () => w(B),
                      onRefresh: () => {
                        window.cam.apiKeys.refresh(B.record.id);
                      },
                      onOpenProvider: () => {},
                    },
                    B.record.id,
                  ),
                ),
              }),
              i.jsx(Io, { keys: C, now: d }),
            ],
          }),
    ],
  });
}
function fy() {
  const [f, o] = q.useState(null);
  q.useEffect(() => {
    window.cam.apiKeys
      .localLedger()
      .then(o)
      .catch(() => o(null));
  }, []);
  const v = (x) =>
      x >= 100
        ? `$${x.toFixed(0)}`
        : x >= 1
          ? `$${x.toFixed(2)}`
          : x > 0
            ? `$${x.toFixed(4)}`
            : "$0.00",
    d = [
      ["day", "Past 24h"],
      ["week", "7 days"],
      ["month", "30 days"],
      ["lifetime", "Lifetime"],
    ];
  return i.jsxs("section", {
    className: "panel",
    children: [
      i.jsx("h3", {
        className: "panel-title",
        children: "Measured locally (no admin key needed)",
      }),
      !f || !f.available
        ? i.jsx("p", {
            className: "hint",
            children:
              "No locally measured usage yet. The Lifted desktop apps (Stage 2, PDF Splitter, AI Document Splitter, ApplAI, …) record the exact token usage of every Anthropic call they make into a shared ledger on this PC — once any of them makes a call, real spend appears here. Click “📖 Usage guide” above for the full picture.",
          })
        : i.jsxs(i.Fragment, {
            children: [
              i.jsx("div", {
                className: "cap-grid",
                children: d.map(([x, E]) =>
                  i.jsxs(
                    "div",
                    {
                      className: "cap-item",
                      "data-cap": "exact",
                      children: [
                        i.jsx("span", { className: "cap-label", children: E }),
                        i.jsxs("span", {
                          className: "cap-value",
                          children: [
                            v(f.cost[x]),
                            " · ",
                            f.calls[x].toLocaleString(),
                            " calls",
                          ],
                        }),
                      ],
                    },
                    x,
                  ),
                ),
              }),
              i.jsx("div", {
                style: { marginTop: 8 },
                children: f.byApp.map(({ app: x, windows: E }) =>
                  i.jsxs(
                    "div",
                    {
                      style: {
                        display: "flex",
                        gap: 12,
                        fontSize: 13,
                        padding: "2px 0",
                      },
                      children: [
                        i.jsx("span", {
                          style: { minWidth: 190, opacity: 0.85 },
                          children: x,
                        }),
                        i.jsxs("span", { children: [v(E.day), " / 24h"] }),
                        i.jsxs("span", { children: [v(E.week), " / 7d"] }),
                        i.jsxs("span", { children: [v(E.month), " / 30d"] }),
                        i.jsxs("span", {
                          children: [v(E.lifetime), " lifetime"],
                        }),
                      ],
                    },
                    x,
                  ),
                ),
              }),
              i.jsxs("p", {
                className: "hint",
                style: { marginTop: 8 },
                children: [
                  "Exact token counts recorded from every API response by the desktop apps on this PC (",
                  f.rows.toLocaleString(),
                  " calls since ",
                  f.since,
                  "); $ estimated from the price table. Covers calls made through those apps — not other machines or tools.",
                ],
              }),
            ],
          }),
    ],
  });
}
function dy(f) {
  switch (f) {
    case "openrouter":
      return "OpenRouter reports balance and rolling daily/weekly/monthly spend directly from your key — everything here is live.";
    case "anthropic":
      return "Anthropic only exposes spend & usage via an Admin/organization key (sk-ant-admin…) — a standard key validates but reports no metrics, and there is no balance API. Workaround: the 'Measured locally' panel below shows real usage recorded by the desktop apps on this PC. Full options: the “📖 Usage guide” button above.";
    case "openai":
      return "OpenAI exposes spend & usage only via an Admin key (sk-admin-…). Standard project keys can be validated but report no metrics; there is no balance API.";
    case "gemini":
      return "Google AI Studio keys are inference-only: no usage, cost, or balance API exists. Cost can only be estimated locally from a price table.";
    default:
      return "";
  }
}
function ry(f) {
  return f.startsWith("provider:") ? f.slice(9) : null;
}
const xs = ["system", "light", "dark"];
function oy(f) {
  const [o, v] = q.useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  return (
    q.useEffect(() => {
      const d = window.matchMedia("(prefers-color-scheme: dark)"),
        x = () => v(d.matches ? "dark" : "light");
      return (
        d.addEventListener("change", x),
        () => d.removeEventListener("change", x)
      );
    }, []),
    f === "system" ? o : f
  );
}
function hy() {
  const [f, o] = q.useState("dashboard"),
    [v, d] = q.useState("system"),
    [x, E] = q.useState(null),
    [D, w] = q.useState(() => Date.now()),
    [C, g] = q.useState([]),
    [B, R] = q.useState(null),
    [_, Y] = q.useState(null),
    [U, H] = q.useState(null),
    [N, K] = q.useState(null),
    nl = oy(v);
  (q.useEffect(() => {
    document.documentElement.dataset.theme = nl;
  }, [nl]),
    q.useEffect(() => {
      const P = setInterval(() => w(Date.now()), 3e4);
      return () => clearInterval(P);
    }, []));
  const ol = q.useCallback(() => {
    window.cam.apiKeys.summary().then(Y);
  }, []);
  q.useEffect(() => {
    (window.cam.getTheme().then(d),
      window.cam.apiKeys.providerMeta().then(g),
      window.cam.apiKeys.list().then((F) => {
        (R(F), ol());
      }),
      window.cam
        .listStates()
        .then((F) => H(F.filter((Ml) => !Ml.isDefault).length)));
    const P = window.cam.apiKeys.onChanged((F) => {
        (R(F), ol(), w(Date.now()));
      }),
      Xl = window.cam.onStateChanged((F) =>
        H(F.filter((Ml) => !Ml.isDefault).length),
      );
    return () => {
      (P(), Xl());
    };
  }, [ol]);
  const sl = q.useCallback((P) => {
      (E(P), window.setTimeout(() => E(null), 4500));
    }, []),
    k = () => {
      const P = xs[(xs.indexOf(v) + 1) % xs.length];
      (d(P), window.cam.setTheme(P));
    },
    al = (P) => o(`provider:${P}`),
    W = ry(f);
  return i.jsxs("div", {
    className: "app-shell",
    children: [
      i.jsx(Hv, {
        view: f,
        onNavigate: o,
        providers: C,
        keys: B,
        accountCount: U,
        themePref: v,
        onCycleTheme: k,
      }),
      i.jsxs("main", {
        className: "main-scroll",
        children: [
          f === "dashboard" &&
            i.jsx(Vv, {
              now: D,
              showToast: sl,
              onGoAccounts: () => o("accounts"),
            }),
          f === "accounts" && i.jsx(kv, { now: D, showToast: sl }),
          f === "skills-sync" && i.jsx(Jv, { showToast: sl }),
          f === "api-dashboard" &&
            i.jsx($v, {
              keys: B,
              summary: _,
              now: D,
              onOpenProvider: al,
              onGoKeys: () => o("api-keys"),
            }),
          f === "api-keys" &&
            i.jsx(Pv, {
              keys: B,
              providers: C,
              now: D,
              showToast: sl,
              onOpenProvider: al,
            }),
          f === "analytics" &&
            i.jsx(cy, {
              keys: B,
              summary: _,
              now: D,
              onGoKeys: () => o("api-keys"),
            }),
          W &&
            i.jsx(sy, {
              provider: W,
              meta: C.find((P) => P.id === W),
              keys: B,
              now: D,
              showToast: sl,
              onAddKey: () => o("api-keys"),
              onEditKey: (P) => K({ type: "edit", state: P }),
              onRemoveKey: (P) => K({ type: "remove", state: P }),
            }),
        ],
      }),
      N?.type === "edit" &&
        i.jsx(Qo, {
          state: N.state,
          onClose: () => K(null),
          onDone: (P) => {
            (K(null), sl(P));
          },
        }),
      N?.type === "remove" &&
        i.jsx(Zo, {
          state: N.state,
          onClose: () => K(null),
          onDone: (P) => {
            (K(null), sl(P));
          },
        }),
      x && i.jsx("div", { className: "toast", role: "status", children: x }),
    ],
  });
}
Uv.createRoot(document.getElementById("root")).render(
  i.jsx(Tv.StrictMode, { children: i.jsx(hy, {}) }),
);
