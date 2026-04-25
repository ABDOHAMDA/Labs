import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bug,
  ChevronRight,
  FileText,
  Heart,
  Hourglass,
  Home,
  Key,
  List,
  LogOut,
  Search,
  ShoppingCart,
  RotateCcw,
  Shield,
  Swords,
  Terminal,
  User,
} from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950 text-slate-100">
      <WarGameLab30 />
    </div>
  );
}

function WarGameLab30() {
  const GAME_SECONDS = 120;
  const [phase, setPhase] = useState("setup"); // setup | running | ended
  const [role, setRole] = useState(null); // red | blue
  const [level, setLevel] = useState("medium"); // low | medium | hard
  const [secondsLeft, setSecondsLeft] = useState(GAME_SECONDS);

  const [redScore, setRedScore] = useState(0);
  const [blueScore, setBlueScore] = useState(0);

  const [xssPatched, setXssPatched] = useState(false);
  const [sqliPatched, setSqliPatched] = useState(false);
  const [bacPatched, setBacPatched] = useState(false);

  const [trapArmed, setTrapArmed] = useState(false);
  const [trapTriggered, setTrapTriggered] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const [events, setEvents] = useState([]);

  // "Site" state
  const [page, setPage] = useState("home"); // home | catalog | product | search | cart | login | orders | profile | security | scoreboard
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { id, username, role }
  const [searchQ, setSearchQ] = useState("");
  const [searchHtml, setSearchHtml] = useState(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginResult, setLoginResult] = useState(null);
  const [requestedUserId, setRequestedUserId] = useState("2");
  const [profileResult, setProfileResult] = useState(null);

  const [catalogQ, setCatalogQ] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("101");
  const [reviewText, setReviewText] = useState("");
  const [reviewHtml, setReviewHtml] = useState(null);
  const [cart, setCart] = useState([]); // [{id, qty}]

  const [blueRule, setBlueRule] = useState("");
  const [blueDeployResult, setBlueDeployResult] = useState(null);

  const tickRef = useRef(null);
  const botRef = useRef(null);

  const applyUrl = (next) => {
    const url = new URL(window.location.href);
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, String(v));
    });
    window.history.replaceState({}, "", url);
  };

  const navigate = (nextPage, extra = {}) => {
    setPage(nextPage);
    applyUrl({ page: nextPage, ...extra });
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const p = url.searchParams.get("page");
    const allowed = new Set([
      "home",
      "catalog",
      "product",
      "search",
      "cart",
      "login",
      "orders",
      "profile",
      "security",
      "scoreboard",
    ]);
    if (p && allowed.has(p)) setPage(p);

    const q = url.searchParams.get("q");
    if (q !== null) setSearchQ(q);

    const userId = url.searchParams.get("userId");
    if (userId !== null) setRequestedUserId(userId);

    const pid = url.searchParams.get("productId");
    if (pid !== null) setSelectedProductId(pid);

    const onPop = () => {
      const u = new URL(window.location.href);
      const pp = u.searchParams.get("page");
      if (pp && allowed.has(pp)) setPage(pp);
      const qq = u.searchParams.get("q");
      if (qq !== null) setSearchQ(qq);
      const uid = u.searchParams.get("userId");
      if (uid !== null) setRequestedUserId(uid);
      const ppid = u.searchParams.get("productId");
      if (ppid !== null) setSelectedProductId(ppid);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const reset = () => {
    setPhase("setup");
    setRole(null);
    setLevel("medium");
    setSecondsLeft(GAME_SECONDS);
    setRedScore(0);
    setBlueScore(0);
    setXssPatched(false);
    setSqliPatched(false);
    setBacPatched(false);
    setTrapArmed(false);
    setTrapTriggered(false);
    setLogOpen(false);
    setEvents([]);
    setPage("home");
    applyUrl({ page: "home", q: null, userId: null, productId: null });
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSearchQ("");
    setSearchHtml(null);
    setLoginUser("");
    setLoginPass("");
    setLoginResult(null);
    setRequestedUserId("2");
    setProfileResult(null);
    setCatalogQ("");
    setSelectedProductId("101");
    setReviewText("");
    setReviewHtml(null);
    setCart([]);
    setBlueRule("");
    setBlueDeployResult(null);
  };

  const pushEvent = (kind, text) => {
    setEvents((prev) => [{ t: Date.now(), kind, text }, ...prev].slice(0, 12));
  };

  const award = (side, points, reason) => {
    if (points <= 0) return;
    if (side === "red") setRedScore((s) => s + points);
    else setBlueScore((s) => s + points);
    pushEvent("score", `${side.toUpperCase()} +${points}: ${reason}`);
  };

  const endGame = () => {
    setPhase("ended");
    setPage("scoreboard");
    applyUrl({ page: "scoreboard" });
    pushEvent("end", "Game ended.");
  };

  useEffect(() => {
    if (phase !== "running") return;

    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(tickRef.current);
          tickRef.current = null;
          endGame();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;

    const botSide = role === "red" ? "blue" : "red";
    pushEvent("info", `${botSide.toUpperCase()} bot is active.`);

    const BOT = {
      low: { intervalMs: 6500, patchChance: 0.38, trapChance: 0.06, attackChance: 0.42 },
      medium: { intervalMs: 4500, patchChance: 0.54, trapChance: 0.1, attackChance: 0.62 },
      hard: { intervalMs: 2800, patchChance: 0.76, trapChance: 0.18, attackChance: 0.82 },
    }[level];

    botRef.current = window.setInterval(() => {
      const r = Math.random();

      if (botSide === "blue") {
        // Blue bot patches + traps
        if (!xssPatched && r < BOT.patchChance * 0.32) {
          setXssPatched(true);
          award("blue", 8, "Patched XSS");
          pushEvent("blue", "Blue patched XSS.");
          return;
        }
        if (!sqliPatched && r >= BOT.patchChance * 0.32 && r < BOT.patchChance * 0.68) {
          setSqliPatched(true);
          award("blue", 10, "Patched SQL injection");
          pushEvent("blue", "Blue patched SQLi.");
          return;
        }
        if (!bacPatched && r >= BOT.patchChance * 0.68 && r < BOT.patchChance) {
          setBacPatched(true);
          award("blue", 12, "Patched broken access control");
          pushEvent("blue", "Blue patched Broken Access.");
          return;
        }
        if (!trapArmed && r >= BOT.patchChance && r < BOT.patchChance + BOT.trapChance) {
          setTrapArmed(true);
          pushEvent("blue", "Blue armed a trap (honeypot).");
          return;
        }
        if (trapArmed && !trapTriggered && r >= BOT.patchChance + BOT.trapChance) {
          pushEvent("blue", "Trap is waiting for a trigger.");
          return;
        }
      } else {
        // Red bot attempts exploits
        if (!xssPatched && r < BOT.attackChance * 0.33) {
          award("red", 10, "Exploited XSS");
          pushEvent("red", "Red bot exploited XSS.");
          return;
        }
        if (!sqliPatched && r >= BOT.attackChance * 0.33 && r < BOT.attackChance * 0.66) {
          award("red", 14, "Exploited SQL injection");
          pushEvent("red", "Red bot exploited SQLi.");
          return;
        }
        if (!bacPatched && r >= BOT.attackChance * 0.66 && r < BOT.attackChance) {
          award("red", 16, "Exploited broken access control");
          pushEvent("red", "Red bot exploited Broken Access.");
          return;
        }
      }
    }, BOT.intervalMs);

    return () => {
      if (botRef.current) window.clearInterval(botRef.current);
      botRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase,
    role,
    level,
    xssPatched,
    sqliPatched,
    bacPatched,
    trapArmed,
    trapTriggered,
  ]);

  const doBluePatch = (type) => {
    if (phase !== "running") return;
    if (role !== "blue") return;

    if (type === "xss") {
      if (xssPatched) return pushEvent("blue", "XSS already patched.");
      setXssPatched(true);
      award("blue", 8, "Patched XSS");
      pushEvent("blue", "You patched XSS.");
    }
    if (type === "sqli") {
      if (sqliPatched) return pushEvent("blue", "SQLi already patched.");
      setSqliPatched(true);
      award("blue", 10, "Patched SQL injection");
      pushEvent("blue", "You patched SQLi.");
    }
    if (type === "bac") {
      if (bacPatched) return pushEvent("blue", "Broken Access already patched.");
      setBacPatched(true);
      award("blue", 12, "Patched broken access control");
      pushEvent("blue", "You patched Broken Access.");
    }
    if (type === "trap") {
      if (trapArmed) return pushEvent("blue", "Trap already armed.");
      setTrapArmed(true);
      pushEvent("blue", "You armed a trap.");
    }
  };

  const redProbe = (kind) => {
    if (phase !== "running") return;
    if (role !== "red") return;

    if (trapArmed && !trapTriggered) {
      const chance = level === "hard" ? 0.55 : level === "medium" ? 0.4 : 0.25;
      if (Math.random() < chance) {
        setTrapTriggered(true);
        award("blue", 15, `Trap triggered by ${kind.toUpperCase()} probe`);
        pushEvent("blue", `Trap triggered by red (${kind}).`);
        return { ok: false, kind: "error", text: "Honeypot triggered. Blue scored." };
      }
    }
    return null;
  };

  const tryRedSql = (e) => {
    e.preventDefault();
    if (phase !== "running") return;
    if (role !== "red") return;

    const u = String(loginUser || "");
    const p = String(loginPass || "");
    const looksLikeSqli = /('|%27)\s*or\s*1\s*=\s*1|--|#|\/\*/i.test(u + " " + p);

    const trap = looksLikeSqli ? redProbe("sqli") : null;
    if (trap) {
      setLoginResult(trap);
      return;
    }

    if (sqliPatched) {
      setLoginResult({ kind: "error", text: "SQLi blocked (patched)." });
      pushEvent("info", "SQLi attempt blocked (patched).");
      return;
    }

    if (looksLikeSqli) {
      award("red", 14, "Exploited SQL injection");
      setLoginResult({ kind: "ok", text: "SQL injection worked. Red scored." });
      pushEvent("red", "SQL injection exploited.");
      return;
    }

    setLoginResult({ kind: "hint", text: "Login failed. Try an injection payload." });
  };

  const tryRedBac = (e) => {
    e.preventDefault();
    if (phase !== "running") return;
    if (role !== "red") return;

    const id = String(requestedUserId || "").trim();
    const wantsAdmin = id === "1";

    const trap = wantsAdmin ? redProbe("idor") : null;
    if (trap) {
      setProfileResult(trap);
      return;
    }

    if (bacPatched) {
      setProfileResult({ kind: "error", text: "Access control enforced (patched)." });
      pushEvent("info", "Broken access attempt blocked (patched).");
      return;
    }

    if (wantsAdmin) {
      award("red", 16, "Exploited broken access control (IDOR)");
      setProfileResult({ kind: "ok", text: "IDOR succeeded. Red accessed admin data." });
      pushEvent("red", "Broken access control exploited.");
      return;
    }

    setProfileResult({
      kind: "hint",
      text: "Profile loaded. Try changing userId to see what happens.",
    });
  };

  const trySearch = (e) => {
    e.preventDefault();
    if (phase !== "running") return;

    const q = String(searchQ || "");
    applyUrl({ page: "search", q });
    const probe = /<\s*script\b|onerror\s*=|onload\s*=|javascript:/i.test(q);

    if (role === "red" && probe) {
      const trap = redProbe("xss");
      if (trap) {
        setSearchHtml(
          `<div class="result">Search failed. <b>${trap.text}</b></div>`,
        );
        pushEvent("info", "Search blocked due to trap.");
        return;
      }

      if (xssPatched) {
        setSearchHtml(`<div class="result">No results for: ${escapeHtml(q)}</div>`);
        pushEvent("info", "XSS attempt blocked (patched).");
        return;
      }

      award("red", 10, "Found a bug in search");
      pushEvent("red", "Red exploited an issue in search.");
    }

    // Vulnerable vs patched rendering (simulated)
    if (xssPatched) {
      setSearchHtml(`<div class="result">No results for: ${escapeHtml(q)}</div>`);
    } else {
      setSearchHtml(`<div class="result">No results for: ${q}</div>`);
    }
  };

  const tryLogin = (e) => {
    e.preventDefault();
    if (phase !== "running") return;

    const u = String(loginUser || "");
    const p = String(loginPass || "");
    const looksLikeSqli = /('|%27)\s*or\s*1\s*=\s*1|--|#|\/\*/i.test(u + " " + p);

    if (role === "red" && looksLikeSqli) {
      const trap = redProbe("sqli");
      if (trap) return setLoginResult(trap);
      if (!sqliPatched) award("red", 14, "Bypassed login");
    }

    if (sqliPatched) {
      if (u === "admin" && p === "admin") {
        setIsLoggedIn(true);
        setCurrentUser({ id: 1, username: "admin", role: "admin" });
        setLoginResult({ kind: "ok", text: "Welcome back." });
        setPage("profile");
      } else {
        setLoginResult({ kind: "error", text: "Invalid credentials." });
      }
      return;
    }

    if (looksLikeSqli) {
      setIsLoggedIn(true);
      setCurrentUser({ id: 1, username: "admin", role: "admin" });
      setLoginResult({ kind: "ok", text: "Logged in." });
      setPage("profile");
      pushEvent("red", "Login bypassed.");
      return;
    }

    if (u === "user" && p === "user") {
      setIsLoggedIn(true);
      setCurrentUser({ id: 2, username: "user", role: "user" });
      setLoginResult({ kind: "ok", text: "Logged in." });
      setPage("profile");
      return;
    }

    setLoginResult({ kind: "error", text: "Invalid credentials." });
  };

  const doLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate("home");
  };

  const fetchProfile = (e) => {
    e.preventDefault();
    if (phase !== "running") return;
    applyUrl({ page: "profile", userId: requestedUserId });
    if (!isLoggedIn) {
      setProfileResult({ kind: "error", text: "Please login first." });
      return;
    }

    const id = String(requestedUserId || "").trim();
    const wantsAdmin = id === "1";

    if (role === "red" && wantsAdmin) {
      const trap = redProbe("idor");
      if (trap) return setProfileResult(trap);
      if (!bacPatched) award("red", 16, "Accessed a restricted profile");
    }

    if (bacPatched && wantsAdmin && currentUser?.id !== 1) {
      setProfileResult({ kind: "error", text: "Forbidden." });
      pushEvent("info", "Access control enforced (patched).");
      return;
    }

    setProfileResult({
      kind: wantsAdmin ? "ok" : "hint",
      text: wantsAdmin ? "Profile: admin" : `Profile: user #${id}`,
    });
  };

  const setupInfo = (
    <div className="mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2 font-bold text-white mb-4">
            <Swords className="w-5 h-5 text-teal-400" aria-hidden="true" />
            Choose role
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("red")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                role === "red"
                  ? "border-rose-500/50 bg-rose-500/10 ring-2 ring-rose-400/30"
                  : "border-white/10 bg-slate-950/40 hover:border-white/20"
              }`}
            >
              <div className="font-bold text-white">Red Team</div>
              <p className="mt-1 text-sm text-slate-400">You attack. Blue is a bot.</p>
            </button>
            <button
              type="button"
              onClick={() => setRole("blue")}
              className={`rounded-2xl border p-4 text-left transition-all ${
                role === "blue"
                  ? "border-sky-500/50 bg-sky-500/10 ring-2 ring-sky-400/30"
                  : "border-white/10 bg-slate-950/40 hover:border-white/20"
              }`}
            >
              <div className="font-bold text-white">Blue Team</div>
              <p className="mt-1 text-sm text-slate-400">You defend. Red is a bot.</p>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2 font-bold text-white mb-4">
            <List className="w-5 h-5 text-teal-400" aria-hidden="true" />
            Choose level
          </div>
          <div className="flex flex-wrap gap-2">
            {["low", "medium", "hard"].map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  level === lv
                    ? "bg-teal-500 text-slate-900"
                    : "bg-slate-950/50 text-slate-300 border border-white/10 hover:border-teal-500/30"
                }`}
              >
                {lv.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Level controls bot speed and how fast it can patch/attack.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          type="button"
          onClick={() => {
            pushEvent("info", "Lab 30 started. Duration: 2 minutes.");
            pushEvent(
              "info",
              role === "red"
                ? "You are RED. BLUE is a bot."
                : "You are BLUE. RED is a bot.",
            );
            setPhase("running");
          }}
          disabled={!role}
          className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-8 py-3 text-sm font-bold shadow-md transition-colors disabled:opacity-40"
        >
          Start (2 minutes)
        </button>
        <p className="text-sm text-slate-400 max-w-xl">
          Tip: explore the shop like a real site — issues are not labeled on screen.
        </p>
      </div>
    </div>
  );

  const navBtn = (isActive) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "bg-teal-500/15 text-teal-200" : "text-slate-300 hover:bg-teal-500/10 hover:text-teal-200"
    }`;

  const siteNav = (
    <nav
      className="flex flex-wrap items-center gap-1 border-b border-white/5 bg-slate-900/90 px-2 py-2 sm:px-4"
      aria-label="Store navigation"
    >
      <button type="button" className={navBtn(page === "home")} onClick={() => navigate("home")}>
        <Home className="w-4 h-4" />
        Home
      </button>
      <button type="button" className={navBtn(page === "catalog")} onClick={() => navigate("catalog")}>
        <ShoppingCart className="w-4 h-4" />
        Shop
      </button>
      <button type="button" className={navBtn(page === "cart")} onClick={() => navigate("cart")}>
        <ShoppingCart className="w-4 h-4" />
        Cart
      </button>
      <button type="button" className={navBtn(page === "orders")} onClick={() => navigate("orders", { userId: requestedUserId })}>
        <FileText className="w-4 h-4" />
        Orders
      </button>
      <button type="button" className={navBtn(page === "search")} onClick={() => navigate("search")}>
        <Search className="w-4 h-4" />
        Search
      </button>
      <button type="button" className={navBtn(page === "login")} onClick={() => navigate("login")}>
        <Key className="w-4 h-4" />
        Login
      </button>
      <button type="button" className={navBtn(page === "profile")} onClick={() => navigate("profile", { userId: requestedUserId })}>
        <User className="w-4 h-4" />
        Account
      </button>
      <button type="button" className={navBtn(page === "security")} onClick={() => navigate("security")}>
        <Shield className="w-4 h-4" />
        Security
      </button>
      <button type="button" className={navBtn(page === "scoreboard")} onClick={() => navigate("scoreboard")}>
        <Bug className="w-4 h-4" />
        Live score
      </button>
      {isLoggedIn ? (
        <button type="button" className={navBtn(false)} onClick={doLogout}>
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      ) : null}
    </nav>
  );

  const youSide = role;
  const botSide = role === "red" ? "blue" : "red";
  const winner = redScore === blueScore ? "draw" : redScore > blueScore ? "red" : "blue";
  const youWon = phase === "ended" && winner !== "draw" && winner === youSide;
  const youLost = phase === "ended" && winner !== "draw" && winner !== youSide;

  const PRODUCTS = useMemo(
    () => [
      { id: "101", name: "Aurora Backpack", price: 49, tag: "New", icon: "🎒", short: "Travel-ready comfort." },
      { id: "102", name: "Nimbus Headphones", price: 129, tag: "Hot", icon: "🎧", short: "Noise isolation + deep bass." },
      { id: "103", name: "Lumen Desk Lamp", price: 35, tag: "Sale", icon: "💡", short: "Warm light for late sessions." },
      { id: "104", name: "Orbit Water Bottle", price: 19, tag: "Eco", icon: "♻️", short: "Stainless steel insulated." },
      { id: "105", name: "Pulse Smartwatch", price: 199, tag: "Pro", icon: "⌚", short: "Health + notifications." },
      { id: "106", name: "Nova Mechanical Keyboard", price: 89, tag: "New", icon: "⌨️", short: "Hot-swap switches." },
      { id: "107", name: "Cedar Yoga Mat", price: 42, tag: "Fitness", icon: "🧘", short: "Non-slip + carry strap." },
      { id: "108", name: "Summit Hiking Boots", price: 139, tag: "Outdoor", icon: "🥾", short: "Waterproof mid boot." },
      { id: "109", name: "Velvet Throw Blanket", price: 39, tag: "Home", icon: "🛋️", short: "Soft microfiber." },
      { id: "110", name: "ChefCast Iron Skillet", price: 55, tag: "Kitchen", icon: "🍳", short: "Pre-seasoned 10 inch." },
      { id: "111", name: "Pixel Drawing Tablet", price: 249, tag: "Creative", icon: "🖊️", short: "8192 pressure levels." },
      { id: "112", name: "Breeze Air Purifier", price: 179, tag: "Home", icon: "🌬️", short: "HEPA + quiet night mode." },
      { id: "113", name: "Titanium Power Bank", price: 59, tag: "Tech", icon: "🔋", short: "20,000 mAh USB-C." },
      { id: "114", name: "Alpine Cooler Box", price: 72, tag: "Outdoor", icon: "🧊", short: "Keeps ice for days." },
      { id: "115", name: "Silk Sleep Mask", price: 18, tag: "Wellness", icon: "😴", short: "Light blocking." },
      { id: "116", name: "Drone Mini 4K", price: 329, tag: "Pro", icon: "🛸", short: "Compact aerial shots." },
      { id: "117", name: "Kids STEM Kit", price: 45, tag: "Education", icon: "🧪", short: "Build + learn circuits." },
      { id: "118", name: "Ceramic Plant Pot Set", price: 28, tag: "Home", icon: "🪴", short: "3 sizes, drip trays." },
    ],
    [],
  );

  const product = PRODUCTS.find((p) => p.id === selectedProductId) || PRODUCTS[0];

  const addToCart = (id) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx === -1) return [...prev, { id, qty: 1 }];
      return prev.map((x, i) => (i === idx ? { ...x, qty: x.qty + 1 } : x));
    });
    pushEvent("info", `Added product ${id} to cart.`);
  };

  const openProduct = (id) => {
    setSelectedProductId(id);
    navigate("product", { productId: id });
  };

  const submitReview = (e) => {
    e.preventDefault();
    if (phase !== "running") return;
    const txt = String(reviewText || "");
    const probe = /<\s*script\b|onerror\s*=|onload\s*=|javascript:/i.test(txt);
    if (role === "red" && probe) {
      const trap = redProbe("xss");
      if (trap) {
        setReviewHtml(`<div class="result"><b>${trap.text}</b></div>`);
        return;
      }
      if (!xssPatched) award("red", 10, "Executed script in review");
    }
    // vulnerable vs patched rendering
    if (xssPatched) setReviewHtml(`<div class="result">${escapeHtml(txt)}</div>`);
    else setReviewHtml(`<div class="result">${txt}</div>`);
  };

  const deployBlueRule = (e) => {
    e.preventDefault();
    if (phase !== "running") return;
    if (role !== "blue") return;
    // Blue must "fix" by typing defensive concepts (simulated manual patching)
    const rule = String(blueRule || "").toLowerCase();
    const didXss = rule.includes("escape") || rule.includes("encode") || rule.includes("sanit");
    const didSql = rule.includes("prepared") || rule.includes("parameter") || rule.includes("bind");
    const didBac = rule.includes("authorize") || rule.includes("check user") || rule.includes("rbac");
    const didTrap = rule.includes("honeypot") || rule.includes("trap") || rule.includes("decoy");

    let any = false;
    if (didXss && !xssPatched) {
      setXssPatched(true);
      award("blue", 8, "Deployed output encoding");
      any = true;
    }
    if (didSql && !sqliPatched) {
      setSqliPatched(true);
      award("blue", 10, "Deployed prepared statements");
      any = true;
    }
    if (didBac && !bacPatched) {
      setBacPatched(true);
      award("blue", 12, "Deployed authorization checks");
      any = true;
    }
    if (didTrap && !trapArmed) {
      setTrapArmed(true);
      any = true;
      pushEvent("blue", "Blue deployed a decoy trap.");
    }
    setBlueDeployResult(
      any
        ? { kind: "ok", text: "Deployment applied." }
        : { kind: "hint", text: "No effective rule detected. Be more specific." },
    );
  };

  const alertClass = (kind) =>
    ({
      ok: "rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-4 text-sm mt-4",
      hint: "rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm mt-4",
      error: "rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-4 text-sm mt-4",
      info: "rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4",
    })[kind] ||
    "rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4";

  return (
    <>
      {phase === "setup" ? (
        <main className="min-h-screen">
          <section className="py-10 sm:py-14 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center rounded-3xl bg-white/95 text-slate-900 shadow-xl shadow-black/20 px-6 py-10 sm:py-12">
              <p className="text-sm font-semibold text-teal-700 tracking-widest uppercase mb-2">Lab 30</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                <ShoppingCart className="w-8 h-8 text-teal-600" />
                OmniMart
              </h1>
              <p className="text-slate-600 max-w-xl mx-auto mb-6 text-base leading-relaxed">
                A general store simulation: Red vs Blue for 2 minutes. Pick a side and difficulty, then explore the shop.
              </p>
            </div>
            <div className="max-w-5xl mx-auto mt-8">{setupInfo}</div>
          </section>
        </main>
      ) : (
        <>
          <header className="border-b border-white/5 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <ShoppingCart className="w-7 h-7 text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-lg font-bold text-white tracking-tight truncate">OmniMart</div>
                  <div className="text-xs text-slate-400">
                    Lab 30 · Level {level} · You {role?.toUpperCase()} · Bot{" "}
                    {role === "red" ? "BLUE" : "RED"}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/50 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                  <Hourglass className="w-3.5 h-3.5 text-teal-300" />
                  {secondsLeft}s
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/50 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                  <Bug className="w-3.5 h-3.5 text-rose-300" />R {redScore}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950/50 border border-white/10 px-3 py-1.5 text-xs text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-sky-300" />B {blueScore}
                </span>
                <button
                  type="button"
                  onClick={() => setLogOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-teal-500/10 hover:text-teal-200 transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  Event log
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restart
                </button>
              </div>
            </div>
            {siteNav}
          </header>

          <main className="min-h-screen py-8 px-4 sm:px-6 pb-20">
            <div className="max-w-5xl mx-auto">
            {page === "home" ? (
              <div className="mb-10">
                <div className="max-w-4xl mx-auto text-center rounded-3xl bg-white/95 text-slate-900 shadow-xl shadow-black/20 px-6 py-10 sm:py-12">
                  <p className="text-sm font-semibold text-teal-700 tracking-widest uppercase mb-2">
                    Everything in one place
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">OmniMart</h1>
                  <p className="text-slate-600 max-w-xl mx-auto mb-8 text-base leading-relaxed">
                    Electronics, home, kitchen, outdoors, and more. Browse the shop, sign in, and use search & account
                    tools like a real customer site.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("catalog")}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Browse the store
                  </button>
                </div>
                <div className="max-w-3xl mx-auto mt-8 rounded-2xl border border-sky-200 bg-sky-50 text-sky-950 p-5 text-sm text-left leading-relaxed">
                  {role === "red"
                    ? "Tip: explore every corner — pages, inputs, and URLs behave like production code."
                    : "Tip: if something feels risky, describe real mitigations in Security Center (encode output, prepared statements, authorization checks, decoys)."}
                </div>
              </div>
            ) : null}

            {page === "catalog" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <ShoppingCart className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Store</div>
                    <div className="text-sm text-slate-600 mt-1">Browse products and open a product page.</div>
                  </div>
                </div>
                <form
                  className="space-y-4 mt-4 max-w-lg"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyUrl({ page: "catalog", q: catalogQ });
                  }}
                >
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Search products</label>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                    value={catalogQ}
                    onChange={(e) => setCatalogQ(e.target.value)}
                    placeholder="Name, category, or keyword…"
                  />
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                  {PRODUCTS.filter((p) =>
                    `${p.name} ${p.tag} ${p.short || ""} ${p.icon || ""}`
                      .toLowerCase()
                      .includes(String(catalogQ).toLowerCase()),
                  ).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl bg-white text-left text-slate-900 shadow-lg hover:shadow-xl hover:ring-2 hover:ring-teal-400/50 transition-all p-6 flex flex-col h-full border border-slate-100"
                    >
                      <span className="text-4xl mb-3">{p.icon}</span>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-slate-900 leading-snug">{p.name}</h3>
                        <span className="shrink-0 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold px-2.5 py-1 border border-teal-100">
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed flex-1">{p.short}</p>
                      <div className="mt-4 text-xl font-bold text-slate-900">${p.price}</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                          onClick={() => openProduct(p.id)}
                        >
                          View <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 text-sm font-bold shadow-md transition-colors"
                          onClick={() => addToCart(p.id)}
                        >
                          Add to cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {page === "product" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <Heart className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">{product.name}</div>
                    <div className="text-sm text-slate-600 mt-1">Leave a review.</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6">
                  <div className="text-5xl mb-3">{product.icon}</div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-2xl font-bold text-slate-900">${product.price}</div>
                    <button
                      className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 text-sm font-bold shadow-md transition-colors"
                      type="button"
                      onClick={() => addToCart(product.id)}
                    >
                      Add to cart
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mt-3">Ships worldwide · 30-day returns · Genuine warranty</p>
                </div>
                <form className="space-y-4 mt-4 max-w-lg" onSubmit={submitReview}>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Your review</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="How was your experience?"
                    />
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                    type="submit"
                  >
                    Post review
                  </button>
                </form>
                {reviewHtml ? (
                  <div
                    className="mt-4 rounded-2xl border border-slate-200 overflow-x-auto bg-white p-4 text-sm text-slate-800 shadow-inner"
                    dangerouslySetInnerHTML={{ __html: reviewHtml }}
                  />
                ) : (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4">Reviews are public.</div>
                )}
              </div>
            ) : null}

            {page === "cart" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <ShoppingCart className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Cart</div>
                    <div className="text-sm text-slate-600 mt-1">Items you added</div>
                  </div>
                </div>
                {cart.length ? (
                  <div className="mt-4 space-y-3">
                    {cart.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      >
                        <span className="font-semibold text-slate-900">
                          {PRODUCTS.find((p) => p.id === it.id)?.name || it.id}
                        </span>
                        <span className="text-sm text-slate-600">Qty: {it.qty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4">Cart is empty.</div>
                )}
              </div>
            ) : null}

            {page === "search" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <Search className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Search</div>
                    <div className="text-sm text-slate-600 mt-1">Find help articles and policies.</div>
                  </div>
                </div>
                <form className="space-y-4 mt-4 max-w-lg" onSubmit={trySearch}>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Search query</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      placeholder="Policies, shipping, returns…"
                    />
                  </div>
                  <button
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 text-sm font-bold shadow-md transition-colors"
                    type="submit"
                  >
                    Search
                  </button>
                </form>
                {searchHtml ? (
                  <div
                    className="mt-4 rounded-2xl border border-slate-200 overflow-x-auto bg-slate-50 p-4 text-sm text-slate-800"
                    // Intentional: this simulates an unsafe rendering path before blue patches it.
                    dangerouslySetInnerHTML={{ __html: searchHtml }}
                  />
                ) : null}
              </div>
            ) : null}

            {page === "login" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <Key className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Login</div>
                    <div className="text-sm text-slate-600 mt-1">Sign in to access your profile.</div>
                  </div>
                </div>
                <form className="space-y-4 mt-4 max-w-md" onSubmit={tryLogin}>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                      value={loginUser}
                      onChange={(e) => setLoginUser(e.target.value)}
                      placeholder="user"
                      autoComplete="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <button
                    className="w-full inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white py-3 text-sm font-bold shadow-md transition-colors"
                    type="submit"
                  >
                    Sign in
                  </button>
                </form>
                {loginResult ? (
                  <div className={alertClass(loginResult.kind)}>{loginResult.text}</div>
                ) : (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4">Try: `user/user`</div>
                )}
              </div>
            ) : null}

            {page === "orders" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <FileText className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Orders</div>
                    <div className="text-sm text-slate-600 mt-1">Your recent purchases</div>
                  </div>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4">
                  Orders are tied to a userId parameter.
                </div>
              </div>
            ) : null}

            {page === "profile" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <User className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Profile</div>
                    <div className="text-sm text-slate-600 mt-1">
                      {isLoggedIn
                        ? `Signed in as ${currentUser?.username}`
                        : "Please login first."}
                    </div>
                  </div>
                </div>
                <form className="space-y-4 mt-4 max-w-md" onSubmit={fetchProfile}>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">User ID</label>
                    <input
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                      value={requestedUserId}
                      onChange={(e) => setRequestedUserId(e.target.value)}
                      placeholder="2"
                      inputMode="numeric"
                    />
                  </div>
                  <button
                    className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 text-sm font-bold shadow-md transition-colors"
                    type="submit"
                  >
                    Load profile
                  </button>
                </form>
                {profileResult ? (
                  <div className={alertClass(profileResult.kind)}>{profileResult.text}</div>
                ) : null}
              </div>
            ) : null}

            {page === "security" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <Shield className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Security Center</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Deploy mitigations by writing a rule (manual).
                    </div>
                  </div>
                </div>
                {role !== "blue" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 p-4 text-sm mt-4">Access denied.</div>
                ) : (
                  <>
                    <form className="space-y-4 mt-4 max-w-xl" onSubmit={deployBlueRule}>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Deployment note</label>
                        <input
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                          value={blueRule}
                          onChange={(e) => setBlueRule(e.target.value)}
                          placeholder="e.g. HTML encode output, prepared statements for login, check user on every profile request…"
                        />
                      </div>
                      <button
                        className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 text-sm font-bold shadow-md transition-colors"
                        type="submit"
                      >
                        Deploy
                      </button>
                    </form>
                    {blueDeployResult ? (
                      <div className={alertClass(blueDeployResult.kind)}>
                        {blueDeployResult.text}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm mt-4">
                        Write what you’d actually deploy (encode/escape, prepared statements, authorization checks, honeypot).
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {page === "scoreboard" ? (
              <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-6">
                <div className="flex items-start gap-3 mb-6">
                  <Bug className="w-6 h-6 text-teal-600 shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Scoreboard</div>
                    <div className="text-sm text-slate-600 mt-1">Live score and events</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-900 p-4 text-sm">
                    Red: <b>{redScore}</b>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50 text-sky-900 p-4 text-sm">
                    Blue: <b>{blueScore}</b>
                  </div>
                </div>
                {phase === "ended" ? (
                  <div
                    className={
                      winner === "draw"
                        ? alertClass("info")
                        : alertClass("ok")
                    }
                  >
                    {winner === "draw"
                      ? "Draw. Same score."
                      : winner === "red"
                        ? "RED wins."
                        : "BLUE wins."}
                  </div>
                ) : null}
              </div>
            ) : null}
            </div>
          </main>
        </>
      )}

      {phase !== "setup" && logOpen ? (
        <div
          className="fixed top-4 right-4 z-50 w-[min(100%,26rem)] max-h-[min(86vh,32rem)] overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md"
          role="dialog"
          aria-label="Event log"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="font-bold text-white">Event log</div>
            <button
              type="button"
              onClick={() => setLogOpen(false)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Close
            </button>
          </div>
          <div className="space-y-2">
            {events.length ? (
              events.map((ev) => (
                <div
                  key={ev.t}
                  className="flex flex-wrap items-start gap-2 rounded-lg border border-white/10 bg-slate-950/50 p-2.5 text-sm text-slate-200"
                >
                  <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-200">
                    {ev.kind}
                  </span>
                  <span className="flex-1 text-slate-300">{ev.text}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No events yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {phase === "ended" && (youWon || youLost) ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-label="Game result"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl animate-popup-in">
            <div className="text-2xl font-bold text-white mb-2">{youWon ? "YOU WIN" : "GAME OVER"}</div>
            <p className="text-sm text-slate-400 mb-4">
              You: {youSide?.toUpperCase()} · Winner: {winner.toUpperCase()}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 py-2 text-rose-100">
                Red <b>{redScore}</b>
              </div>
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 py-2 text-sky-100">
                Blue <b>{blueScore}</b>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 text-sm font-bold shadow-md transition-colors"
              >
                Play again
              </button>
              <button
                type="button"
                onClick={() => setLogOpen(true)}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                View event log
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

