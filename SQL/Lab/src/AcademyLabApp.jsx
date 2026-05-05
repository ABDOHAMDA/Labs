import React, { useState, useEffect } from "react";
import { User, LogOut, Trash2, Code, BookOpen, CheckCircle2, X, GraduationCap } from "lucide-react";

const ACADEMY_FLAG = "FLAG{ACADEMY_SQLI_DELETED}";
const HACKME_API_BASE =
  window.location.protocol + "//" + window.location.hostname + "/HackMe/server/controllers/labs";

/**
 * Academy PHP API (docker-compose maps api:80 → host :3000).
 * Set VITE_ACADEMY_API_BASE in Lab/.env to override.
 *
 * In Vite dev, prefer same-origin `/academy` so requests use vite.config.js proxy (avoids
 * wrong service on :3000 returning HTML → JSON.parse fails with "Invalid response from server").
 */
function getAcademyApiBase() {
  if (import.meta.env.VITE_ACADEMY_API_BASE) {
    return String(import.meta.env.VITE_ACADEMY_API_BASE).replace(/\/$/, "");
  }
  if (typeof window === "undefined") return "http://127.0.0.1:3000/academy";
  if (import.meta.env.DEV) {
    return `${window.location.origin}/academy`;
  }
  const host = window.location.hostname || "127.0.0.1";
  return `http://${host}:3000/academy`;
}
const API_BASE = getAcademyApiBase();

/** Tries several bases — fixes empty responses when one path fails (proxy, hostname, cache). */
function getAcademyApiBaseList() {
  const list = [];
  if (import.meta.env.VITE_ACADEMY_API_BASE) {
    list.push(String(import.meta.env.VITE_ACADEMY_API_BASE).replace(/\/$/, ""));
  }
  if (typeof window !== "undefined") {
    if (import.meta.env.DEV) {
      list.push(`${window.location.origin}/academy`);
    }
    const h = window.location.hostname || "127.0.0.1";
    list.push(`http://${h}:3000/academy`);
    list.push("http://127.0.0.1:3000/academy");
    list.push("http://localhost:3000/academy");
    if (!import.meta.env.DEV) {
      list.push(`${window.location.origin}/academy`);
    }
  } else {
    list.push("http://127.0.0.1:3000/academy");
  }
  return [...new Set(list)];
}

async function fetchAcademyMemberJson(id) {
  const bases = getAcademyApiBaseList();
  let lastErr = null;
  for (const base of bases) {
    try {
      const url = `${base}/member.php?id=${encodeURIComponent(id)}&_=${Date.now()}`;
      const r = await fetch(url, { cache: "no-store", mode: "cors" });
      const raw = await r.text();
      const text = raw.replace(/^\uFEFF/, "").trim();
      if (!text) {
        lastErr = new Error(
          `Empty response from ${base} (HTTP ${r.status}). Tried all bases: ${bases.join(", ")}`
        );
        continue;
      }
      try {
        return JSON.parse(text);
      } catch {
        const preview = text.slice(0, 120).replace(/\s+/g, " ");
        lastErr = new Error(
          `Invalid JSON from ${base}: ${preview}${text.length > 120 ? "…" : ""}`
        );
        continue;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("Academy member API unreachable.");
}

/** Render cell for API row (strings / numbers / null). */
function formatMemberCell(v) {
  if (v === null || v === undefined) return "—";
  return String(v);
}

/** UNION rows with placeholder 1,1,1 (cols 2–4) first, then others; sorted by user_name. */
function sortMemberRows(rows) {
  if (!rows?.length) return rows || [];
  const isUnionFiller = (r) =>
    String(r.password ?? "") === "1" &&
    String(r.role ?? "") === "1" &&
    String(r.email ?? "") === "1";
  const byUserName = (a, b) =>
    String(a.user_name ?? "").localeCompare(String(b.user_name ?? ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  const a = [];
  const b = [];
  for (const r of rows) {
    (isUnionFiller(r) ? a : b).push(r);
  }
  a.sort(byUserName);
  b.sort(byUserName);
  return [...a, ...b];
}

/** Persist login across URL edits / full page reload (same tab, same labId). */
const academySessionKey = (labId) => (labId ? `academy_auth_${labId}` : null);
const loadAcademySession = (labId) => {
  if (!labId || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(academySessionKey(labId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user) return { token: parsed.token, user: parsed.user };
  } catch (_) { }
  return null;
};
const saveAcademySession = (labId, token, user) => {
  if (!labId || !token || !user) return;
  try {
    sessionStorage.setItem(academySessionKey(labId), JSON.stringify({ token, user }));
  } catch (_) { }
};
const clearAcademySession = (labId) => {
  if (!labId) return;
  try {
    sessionStorage.removeItem(academySessionKey(labId));
  } catch (_) { }
};

const COURSES = [
  {
    id: "1",
    name: "Python Basics",
    short: "From variables to small projects.",
    icon: "🐍",
    overview:
      "This course is for beginners who want to learn Python step by step. You will write real scripts, understand how programs run, and build confidence before moving to web or data topics.",
    whatYouLearn: [
      "Variables, types, input/output, and basic operators",
      "Control flow: if/else, loops (for / while)",
      "Functions, modules, and simple file handling",
      "Introduction to lists, dictionaries, and basic OOP",
    ],
    duration: "8 weeks · ~4 hours/week",
  },
  {
    id: "2",
    name: "JavaScript & Web",
    short: "Build interactive pages in the browser.",
    icon: "🌐",
    overview:
      "Learn how modern web pages work: HTML structure, CSS layout, and JavaScript behavior. You will manipulate the DOM, handle events, and call APIs from the browser.",
    whatYouLearn: [
      "DOM selection and updates, events, and forms",
      "Async JavaScript: fetch, promises, async/await",
      "Basic tooling: browser dev tools and debugging",
      "Simple SPA-style patterns (components, state in small apps)",
    ],
    duration: "10 weeks · ~5 hours/week",
  },
  {
    id: "3",
    name: "Web Security",
    short: "Think like a defender and a tester.",
    icon: "🔒",
    overview:
      "Understand common web risks and how to reduce them. You will map OWASP categories to real features (auth, sessions, input handling) and practice safe coding habits.",
    whatYouLearn: [
      "OWASP Top 10 at a practical level",
      "Authentication, sessions, and access control basics",
      "Input validation, encoding, and secure defaults",
      "Introduction to security testing mindset (no illegal activity)",
    ],
    duration: "6 weeks · ~3 hours/week",
  },
];

const AcademyLabApp = () => {
  const [accessStatus, setAccessStatus] = useState("checking");
  const [labParams, setLabParams] = useState({
    labId: null,
    token: null,
    userId: null,
    deviceBind: "",
    machineMac: "",
    clientLocalIp: "",
  });
  const [view, setView] = useState("home");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersListError, setUsersListError] = useState("");
  const [usersListLoading, setUsersListLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popup, setPopup] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [courseMemberData, setCourseMemberData] = useState(null);
  const [courseMemberLoading, setCourseMemberLoading] = useState(false);
  const [courseMemberError, setCourseMemberError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const labId = params.get("labId");
    const token = params.get("token");
    const deviceBind = params.get("device_bind") || "";
    const machineMac = params.get("mac_address") || "";
    const clientLocalIp = params.get("client_local_ip") || "";
    if (!labId || !token) {
      setAccessStatus("denied");
      return;
    }
    (async () => {
      try {
        const bindQ =
          (deviceBind ? `&device_bind=${encodeURIComponent(deviceBind)}` : "") +
          (machineMac ? `&mac_address=${encodeURIComponent(machineMac)}` : "") +
          (clientLocalIp ? `&client_local_ip=${encodeURIComponent(clientLocalIp)}` : "");
        const url = `${HACKME_API_BASE}/verify_lab_token.php?token=${encodeURIComponent(token)}&lab_id=${encodeURIComponent(labId)}${bindQ}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        setAccessStatus(data.valid ? "granted" : "denied");
        if (data.valid) {
          setLabParams({
            labId,
            token,
            userId: data.user_id > 0 ? data.user_id : null,
            deviceBind,
            machineMac,
            clientLocalIp,
          });
        }
      } catch {
        setAccessStatus("denied");
      }
    })();
  }, []);

  /** Restore academy login after reload / manual URL change (keeps labId + token in query). */
  useEffect(() => {
    if (accessStatus !== "granted" || !labParams.labId) return;
    const saved = loadAcademySession(labParams.labId);
    if (saved) {
      setAuthToken(saved.token);
      setUser(saved.user);
    }
  }, [accessStatus, labParams.labId]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("view") === "course") setView("course");
  }, []);

  const submitLabSolved = async () => {
    const { labId, token, deviceBind, machineMac, clientLocalIp } = labParams;
    if (!labId || !token) return;
    const payload = {
      lab_id: Number(labId),
      token: token || "",
      device_bind: deviceBind || "",
      mac_address: machineMac || "",
      client_local_ip: clientLocalIp || "",
    };
    try {
      const res = await fetch(`${HACKME_API_BASE}/labs_api/lab_solved.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setPopup({
          type: "flag_error",
          message: "Invalid response from HackMe",
          detail: raw.slice(0, 200),
        });
        return;
      }
      const msg = String(data?.message || "");
      if (data.success || msg === "LAB_ALREADY_SOLVED") {
        const isFirstTime = msg === "LAB_SOLVED";
        // Parent toast (LabDetailsModern) only for real new points; refresh total in App either way.
        const ptsForParent = isFirstTime ? (data.data?.points_earned || 150) : 0;
        setPopup({ type: isFirstTime ? "solved" : "already_solved" });
        if (window.opener) {
          // LabDetailsModern listens for HACKME_LAB_SOLVED; App.jsx refreshes points on LAB_SOLVED or HACKME_LAB_SOLVED.
          window.opener.postMessage(
            { type: "HACKME_LAB_SOLVED", labId: Number(labId), lab_id: Number(labId), points: ptsForParent },
            "*"
          );
          window.opener.postMessage({ type: "LAB_SOLVED", labId: Number(labId) }, "*");
        }
        return;
      }
      let errMsg =
        data.detail ||
        msg ||
        (res.ok ? "Could not record solve" : `HackMe error (HTTP ${res.status})`);
      if (msg === "INVALID_FLAG" && Number(labId) === 10) {
        errMsg =
          "HackMe does not have lab 10 flag data yet, or labId in the URL is not 10. Pull latest HackMe code, then delete the user again. If it persists, open this lab only via Start Lab (not a bookmark).";
      }
      setPopup({
        type: "flag_error",
        message: errMsg,
        detail: data.message && data.detail && data.detail !== errMsg ? data.message : "",
      });
    } catch (e) {
      setPopup({
        type: "flag_error",
        message: e instanceof Error ? e.message : "Network error — is HackMe running at this PC?",
        detail: "",
      });
    }
  };

  const fetchUsers = async () => {
    if (!authToken) return;
    setUsersListError("");
    setUsersListLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token: authToken }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setUsersListError("Invalid response from server");
        setUsers([]);
        return;
      }
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setUsersListError(data.message || `Could not load users (${res.status})`);
        setUsers([]);
      }
    } catch (e) {
      setUsersListError(e instanceof Error ? e.message : "Network error");
      setUsers([]);
    } finally {
      setUsersListLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin" && authToken) fetchUsers();
  }, [user?.role, authToken]);

  useEffect(() => {
    if (view === "admin" && user?.role === "admin" && authToken) fetchUsers();
  }, [view, user?.role, authToken]);

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const urlView = params?.get("view") || "";
  const urlCourseId = params?.get("id") ?? "";

  useEffect(() => {
    if (urlView === "course") setView("course");
  }, [urlView]);

  const isDefaultCourseId = (() => {
    const raw = (urlCourseId ?? "").trim();
    if (raw === "") return true;
    return ["1", "2", "3"].includes(raw);
  })();

  useEffect(() => {
    if (view !== "course") return;
    if (isDefaultCourseId) {
      setCourseMemberLoading(false);
      setCourseMemberError("");
      setCourseMemberData(null);
      return;
    }
    const id = urlCourseId.trim();
    setCourseMemberLoading(true);
    setCourseMemberError("");
    setCourseMemberData(null);
    let cancelled = false;
    fetchAcademyMemberJson(id)
      .then((data) => {
        if (!cancelled) setCourseMemberData(data);
      })
      .catch((err) => {
        if (!cancelled) setCourseMemberError(err.message || "Request failed");
      })
      .finally(() => {
        if (!cancelled) setCourseMemberLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, urlCourseId, isDefaultCourseId]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ user_name: userName, password }),
      });
      const raw = await res.text();
      const text = raw.replace(/^\uFEFF/, "").trim();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        const preview = text.replace(/\s+/g, " ").slice(0, 160);
        setError(
          preview
            ? `Invalid response from server (${res.status}): ${preview}${text.length > 160 ? "…" : ""}`
            : `Invalid response from server (empty body, HTTP ${res.status}). Is the PHP API running?`
        );
        setLoading(false);
        return;
      }
      if (data.success && data.token) {
        setUser(data.user);
        setAuthToken(data.token);
        const labId = new URLSearchParams(window.location.search).get("labId") || labParams.labId;
        if (labId) saveAcademySession(labId, data.token, data.user);
        setPassword("");
        setView("home");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch(`${API_BASE}/logout.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({ token: authToken }),
        });
      } catch (_) { }
    }
    const lid =
      labParams.labId || new URLSearchParams(window.location.search).get("labId");
    clearAcademySession(lid);
    setAuthToken("");
    setUser(null);
    setView("home");
  };

  const openCourse = (courseId) => {
    try {
      sessionStorage.setItem("academyLastCourse", courseId);
    } catch (_) { }
    const sp = new URLSearchParams(window.location.search);
    sp.set("view", "course");
    sp.set("id", courseId);
    window.history.pushState({}, "", "?" + sp.toString());
    setView("course");
  };

  const handleDeleteUser = async (targetUserId) => {
    if (!authToken || user?.role !== "admin") return;
    setDeleteError("");
    setDeletingId(targetUserId);
    try {
      const res = await fetch(`${API_BASE}/delete_user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ user_id: targetUserId, token: authToken }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setDeleteError("Invalid server response");
        return;
      }
      if (data.success && data.deleted) {
        setUsers((prev) => prev.filter((u) => u.user_id !== targetUserId));
        await submitLabSolved();
      } else {
        setDeleteError(data.message || "Delete failed");
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Network error");
    } finally {
      setDeletingId(null);
    }
  };

  if (accessStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin mb-4" />
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (accessStatus === "denied") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-slate-800/90 p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400">
            This lab can only be opened from the Start Lab button in HackMe.
          </p>
        </div>
      </div>
    );
  }

  const Header = () => (
    <header className="border-b border-white/5 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="#" onClick={(e) => { e.preventDefault(); const sp = new URLSearchParams(window.location.search); sp.delete("view"); sp.delete("id"); window.history.pushState({}, "", "?" + sp.toString()); setView("home"); }} className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Code className="w-6 h-6 text-teal-400" />
          Code Academy
        </a>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="text-sm text-slate-300 hidden sm:inline">{user.user_name}</span>
              {user.role === "admin" && (
                <button
                  onClick={() => setView("admin")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-teal-500/10 hover:text-teal-200 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Manage Users
                </button>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </>
          )}
          {!user && (
            <button
              onClick={() => setView("login")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-900 text-sm font-semibold transition-colors"
            >
              <User className="w-4 h-4" />
              Log In
            </button>
          )}
        </div>
      </div>
    </header>
  );

  const SolvedPopup = () => {
    if (!popup) return null;
    if (popup.type === "flag_error") {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-rose-500/40 shadow-2xl p-8 text-center animate-popup-in">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
              <X className="w-10 h-10 text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Could not sync with HackMe</h3>
            <p className="text-sm text-rose-200/90 mb-2">{popup.message}</p>
            {popup.detail ? <p className="text-xs text-slate-500 mb-4">{popup.detail}</p> : null}
            <p className="text-xs text-slate-400 mb-6">
              Log in on HackMe, open this lab with <strong>Start Lab</strong> again, then delete the user once more. The delete in the academy still worked.
            </p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="w-full rounded-lg bg-slate-600 hover:bg-slate-500 text-white py-2.5 text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    const isFirstTime = popup.type === "solved";
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-teal-500/30 shadow-2xl p-8 text-center animate-popup-in">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isFirstTime ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
            <CheckCircle2 className={`w-10 h-10 ${isFirstTime ? "text-emerald-400" : "text-amber-400"}`} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isFirstTime ? "You solved the lab!" : "Already solved"}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            {isFirstTime
              ? "Congratulations! You've successfully completed this lab."
              : "You've solved this lab before. No additional points awarded."}
          </p>
          <p className="text-xs font-mono text-teal-300 mb-4 break-all">{ACADEMY_FLAG}</p>
          <button
            type="button"
            onClick={() => setPopup(null)}
            className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-900 py-2.5 text-sm font-semibold transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };

  const HomePage = () => (
    <main className="min-h-screen">
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center rounded-3xl bg-white/95 text-slate-900 shadow-xl shadow-black/20 px-6 py-10 sm:py-12">
          <p className="text-sm font-semibold text-teal-700 tracking-widest uppercase mb-2">Learn to Code</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Code Academy</h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-8 text-base leading-relaxed">
            A programming academy with hands-on courses. Log in as a student to follow lessons; administrators can open the user management panel.
          </p>
          {!user && (
            <button
              type="button"
              onClick={() => setView("login")}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-md transition-colors"
            >
              <User className="w-5 h-5" />
              Log In
            </button>
          )}
        </div>
        <div className="max-w-5xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-300" />
            Our courses
          </h3>
          <p className="text-slate-300 mb-8 text-sm sm:text-base max-w-2xl">
            Open a course to read the full syllabus.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COURSES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openCourse(c.id)}
                className="rounded-2xl bg-white text-left text-slate-900 shadow-lg hover:shadow-xl hover:ring-2 hover:ring-teal-400/50 transition-all p-6 flex flex-col h-full"
              >
                <span className="text-4xl mb-3">{c.icon}</span>
                <h4 className="font-bold text-lg text-slate-900 mb-1">{c.name}</h4>
                <p className="text-sm text-teal-700 font-medium mb-3">{c.short}</p>
                <p className="text-sm text-slate-600 leading-relaxed flex-1">{c.overview}</p>
                <span className="mt-4 text-xs font-semibold text-teal-600">Open course →</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );

  const CoursePage = () => {
    const simpleId = /^[123]$/.test((urlCourseId || "").trim()) ? urlCourseId.trim() : null;
    let lastStored = null;
    try {
      lastStored = sessionStorage.getItem("academyLastCourse");
    } catch (_) { }
    const course =
      COURSES.find((c) => c.id === simpleId) ||
      COURSES.find((c) => c.id === lastStored) ||
      COURSES[0];

    const rows = courseMemberData?.rows?.length
      ? courseMemberData.rows
      : courseMemberData?.member
        ? [courseMemberData.member]
        : [];

    // ── Step detection from URL id param ──────────────────────────────────
    const idLower = (urlCourseId || "").toLowerCase();
    const isStep1 =
      !isDefaultCourseId &&
      idLower.includes("union") &&
      !idLower.includes("information_schema") &&
      !idLower.includes("from academy_users");
    const isStep2 = idLower.includes("information_schema.tables");
    const isStep3 = idLower.includes("information_schema.columns");
    const isStep4 =
      idLower.includes("from academy_users") &&
      !idLower.includes("information_schema");

    // ── Row filtering per step ─────────────────────────────────────────────
    const sorted = sortMemberRows(rows);
    const filteredRows = (() => {
      if (isStep1) {
        // Show ONLY the placeholder rows (e.g. user_name is '1' or numeric)
        return sorted.filter(r => !isNaN(r.user_name) || r.user_name === '1');
      }
      if (isStep2) {
        // Show ONLY the academy_users table entry
        return sorted.filter(
          (r) => String(r.user_name || "").toLowerCase() === "academy_users"
        );
      }
      if (isStep3) {
        // Just show the column names returned by information_schema
        return sorted;
      }
      if (isStep4) {
        // Show ONLY admin row(s) with real passwords
        return sorted.filter(
          (r) => r.role === "admin" && r.password && r.password !== "1"
        );
      }
      // Default view: if it's a UNION but not a specific step, might be a partial attempt
      if (!isDefaultCourseId && idLower.includes("union")) {
         // If they haven't reached step 4, hide admin rows from general UNION results
         return sorted.filter(r => r.role !== 'admin' || r.password === '1');
      }
      return sorted;
    })();

    // Steps 2 & 3 show only one column (the enumerated name); steps 1 & 4 show all 4
    const multiCol = !isStep2 && !isStep3;
    const firstColHeader = isStep2
      ? "table_name"
      : isStep3
        ? "column_name"
        : "user_name";

    const showDataPanel = !isDefaultCourseId;



    return (
      <main className="min-h-screen py-8 px-4 sm:px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => {
              const sp = new URLSearchParams(window.location.search);
              sp.delete("view");
              sp.delete("id");
              window.history.pushState({}, "", "?" + sp.toString());
              setView("home");
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-200 hover:text-white mb-6 transition-colors"
          >
            ← Back to Home
          </button>


          <article className="rounded-3xl bg-white text-slate-900 shadow-xl p-6 sm:p-10 mb-8">
            <span className="text-4xl mb-4 block">{course.icon}</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{course.name}</h1>
            <p className="text-teal-700 font-semibold mb-6">{course.duration}</p>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">About this course</h2>
            <p className="text-slate-700 leading-relaxed mb-8">{course.overview}</p>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">What you will learn</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-800">
              {course.whatYouLearn.map((line, i) => (
                <li key={i} className="leading-relaxed">{line}</li>
              ))}
            </ul>
          </article>

          {showDataPanel && (
            <div className="rounded-2xl bg-slate-900 border border-teal-500/40 overflow-hidden shadow-xl">
              <div className="px-4 py-3 bg-teal-900/50 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Response data</h3>
              </div>
              {courseMemberLoading && (
                <div className="p-8 text-center text-slate-400 text-sm bg-slate-950">Loading…</div>
              )}
              {courseMemberError && (
                <div className="p-4 text-rose-300 text-sm bg-slate-950">{courseMemberError}</div>
              )}
              {!courseMemberLoading && !courseMemberError && courseMemberData && (
                <div className="overflow-x-auto bg-white">
                  {filteredRows.length > 0 ? (
                    <table className="w-full border-collapse text-sm text-slate-900">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-3 py-2.5 text-left text-xs font-semibold text-slate-800">
                            {firstColHeader}
                          </th>
                          {multiCol && (
                            <>
                              <th className="border border-slate-300 px-3 py-2.5 text-left text-xs font-semibold text-slate-800">password</th>
                              <th className="border border-slate-300 px-3 py-2.5 text-left text-xs font-semibold text-slate-800">role</th>
                              <th className="border border-slate-300 px-3 py-2.5 text-left text-xs font-semibold text-slate-800">email</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, idx) => (
                          <tr key={idx} className="odd:bg-white even:bg-slate-50/80 hover:bg-teal-50/60">
                            <td className="border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-900 break-words">
                              {formatMemberCell(row.user_name)}
                            </td>
                            {multiCol && (
                              <>
                                <td className="border border-slate-200 px-3 py-2.5 text-xs font-mono text-slate-900 break-words">
                                  {formatMemberCell(row.password)}
                                </td>
                                <td className="border border-slate-200 px-3 py-2.5 text-xs text-slate-900 break-words">
                                  {formatMemberCell(row.role)}
                                </td>
                                <td className="border border-slate-200 px-3 py-2.5 text-xs text-slate-900 break-words">
                                  {formatMemberCell(row.email)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-slate-600 text-sm">
                      <p className="font-mono text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-3 whitespace-pre-wrap break-all">
                        {courseMemberData.message || "No data"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    );
  };

  const LoginPage = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => setView("home")}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-200 hover:text-white mb-6 transition-colors"
        >
          ← Back to Home
        </button>
        <div className="rounded-3xl bg-white text-slate-900 shadow-xl p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Log in</h2>
          <p className="text-sm text-slate-600 mb-6">Use your academy username or email and password.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Username or email</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                placeholder="e.g. student1"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 outline-none"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-500 text-white py-3 text-sm font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const AdminPage = () => (
    <main className="min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setView("home")}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-200 hover:text-white mb-6 transition-colors"
        >
          ← Back to Home
        </button>
        <div className="rounded-3xl bg-white text-slate-900 shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <User className="w-6 h-6 text-teal-600" />
              Manage users
            </h2>
            {deleteError ? <p className="text-sm text-rose-600 mt-2 font-medium">{deleteError}</p> : null}
          </div>
          <div className="overflow-x-auto">
            {usersListError ? (
              <div className="px-6 py-10 text-center text-sm text-rose-600">{usersListError}</div>
            ) : usersListLoading ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No account pending removal. If you already deleted it, the lab objective is done.
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-left">
                    <th className="py-3 px-4 font-bold text-slate-800">ID</th>
                    <th className="py-3 px-4 font-bold text-slate-800">Username</th>
                    <th className="py-3 px-4 font-bold text-slate-800">Email</th>
                    <th className="py-3 px-4 font-bold text-slate-800">Role</th>
                    <th className="py-3 px-4 font-bold text-slate-800">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-slate-100 hover:bg-teal-50/50">
                      <td className="py-3 px-4 text-slate-800 font-mono">{u.user_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{u.user_name}</td>
                      <td className="py-3 px-4 text-slate-700">{u.email || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === "admin" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.user_id)}
                          disabled={deletingId === u.user_id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === u.user_id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950/20 to-slate-950 text-slate-100">
      <Header />
      {view === "home" && <HomePage />}
      {view === "course" && <CoursePage />}
      {view === "login" && <LoginPage />}
      {view === "admin" && user?.role === "admin" && <AdminPage />}
      <SolvedPopup />
    </div>
  );
};

export default AcademyLabApp;
