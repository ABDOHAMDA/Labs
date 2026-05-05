import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { User, Shield, UserCog, CheckCircle2, X, Trash2, Lock, Mail, LogIn } from "lucide-react";

const HACKME_API_BASE =
  window.location.protocol + "//" + window.location.hostname + "/HackMe/server/controllers/labs";
/** Must match admin row in DB / fallback users (student copies from admin profile). */
const TARGET_ADMIN_EMAIL = "admin@lab.local";

function isValidEmail(value) {
  const s = String(value ?? "").trim();
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function parseJsonLoginBody(text, httpStatus, sourceLabel) {
  const trimmed = String(text ?? "").replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return {
      ok: false,
      error: `Empty response from ${sourceLabel} (HTTP ${httpStatus}). Start the API container (port 3001) or check the Vite proxy.`,
    };
  }
  try {
    return { ok: true, data: JSON.parse(trimmed) };
  } catch {
    const html = trimmed.startsWith("<");
    const preview = trimmed.slice(0, 200).replace(/\s+/g, " ");
    return {
      ok: false,
      error: html
        ? `${sourceLabel} returned an HTML page (HTTP ${httpStatus}) — wrong API URL or PHP error. Open http://localhost:3001/api/lab2/ping.php in the browser.`
        : `Not JSON from ${sourceLabel} (HTTP ${httpStatus}): ${preview}${trimmed.length > 200 ? "…" : ""}`,
    };
  }
}

/** Shown after the student sets their account email to the real admin email (client-side only). */
const INITIAL_DELEGATED_ADMINS = [
  {
    id: "d1",
    fullName: "Sarah Chen",
    username: "sarah.chen",
    email: "sarah.chen@northgate-security.example",
    role: "admin",
  },
  {
    id: "d2",
    fullName: "James O'Brien",
    username: "james.obrien",
    email: "j.obrien@northgate-security.example",
    role: "admin",
  },
  {
    id: "d3",
    fullName: "Priya Nair",
    username: "priya.nair",
    email: "priya.nair@northgate-security.example",
    role: "admin",
  },
  {
    id: "d4",
    fullName: "Marcus Webb",
    username: "marcus.webb",
    email: "marcus.webb@northgate-security.example",
    role: "admin",
  },
];

// Prefer proxy; fallback to direct port if proxy fails
const API_BASE = '/api/lab2';
const API_FALLBACK = `${window.location.protocol}//${window.location.hostname}:3001/api/lab2`;

const LAB2_SESSION_KEY = "lab2_logged_session_v1";

function searchParamsLabOnly(sourceParams) {
  const sp = new URLSearchParams();
  const lid = sourceParams.get("labId");
  const tok = sourceParams.get("token");
  const bind = sourceParams.get("device_bind");
  const mac = sourceParams.get("mac_address");
  const local = sourceParams.get("client_local_ip");
  if (lid) sp.set("labId", lid);
  if (tok) sp.set("token", tok);
  if (bind) sp.set("device_bind", bind);
  if (mac) sp.set("mac_address", mac);
  if (local) sp.set("client_local_ip", local);
  return sp;
}

function fetchApi(path) {
  const url = `${API_BASE}${path}`;
  return fetch(url).then((r) => r.text()).then((text) => {
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error('Invalid JSON');
    }
  });
}

function fetchApiWithFallback(path) {
  return fetchApi(path).catch(() => fetch(`${API_FALLBACK}${path}`).then((r) => r.text()).then((text) => {
    try {
      return JSON.parse(text);
    } catch (_) {
      throw new Error('Invalid JSON');
    }
  }));
}

const FALLBACK_USERS = [
  { id: 1, username: 'admin', email: 'admin@lab.local', role: 'admin' },
  { id: 2, username: 'alice', email: 'alice@test.com', role: 'user' },
  { id: 3, username: 'bob', email: 'bob@test.com', role: 'user' },
  { id: 4, username: 'charlie', email: 'charlie@test.com', role: 'user' },
  { id: 5, username: 'user', email: 'user@gmail.com', role: 'user' },
  { id: 6, username: 'dave', email: 'dave@test.com', role: 'user' },
  { id: 7, username: 'eve', email: 'eve@test.com', role: 'user' },
  { id: 8, username: 'frank', email: 'frank@test.com', role: 'user' },
  { id: 9, username: 'grace', email: 'grace@test.com', role: 'user' },
  { id: 10, username: 'henry', email: 'henry@test.com', role: 'user' },
];

const FALLBACK_PROFILES = Object.fromEntries(FALLBACK_USERS.map((u) => [u.id, { ...u }]));

const BLOGS = [
  { id: 1, title: "Red Team Operations", category: "Red Team", date: "Mar 12, 2025", minRead: 8, excerpt: "Offensive security and adversary simulation to test defenses.", content: `Red team operations simulate real-world attacks to identify gaps in security controls. Teams use the same tactics, techniques, and procedures (TTPs) as threat actors to test detection and response capabilities.

A red team engages in authorized offensive security testing. Unlike penetration testing, which often focuses on finding technical vulnerabilities, red teaming is scenario-based and may include social engineering, physical security, and long-term operations. The goal is to answer: "Can we detect and stop a determined adversary?"

Red team exercises help organizations validate their security posture, improve incident response, and prioritize investments. Findings are reported to leadership with clear business impact. Best practices include defining scope and rules of engagement, using dedicated red team personnel (not the same people who build defenses), and conducting purple team sessions where red and blue teams collaborate on findings.` },
  { id: 2, title: "Blue Team Defense", category: "Blue Team", date: "Mar 11, 2025", minRead: 9, excerpt: "Defensive security, monitoring, and incident response.", content: `Blue teams defend, detect, and respond to threats. They build and tune SIEM, run threat hunting, and improve resilience through tabletop exercises and playbooks.

The blue team is responsible for defending the organization's assets. Key activities include security monitoring (SIEM, EDR, network traffic analysis), vulnerability management, incident response, and security hardening. Blue teamers must understand both the infrastructure and how attackers operate to design effective defenses.

Threat hunting is a proactive blue team activity: hypothesizing about attacker behavior and searching for indicators in logs and endpoints. Effective blue teams document playbooks for common incidents, practice regularly with tabletop exercises, and integrate with red team findings to close gaps. Metrics such as mean time to detect (MTTD) and mean time to respond (MTTR) help measure improvement.` },
  { id: 3, title: "Black Box Testing", category: "Black Box", date: "Mar 10, 2025", minRead: 7, excerpt: "Testing with no prior knowledge of internal structure.", content: `Black box testing assumes zero knowledge of the target. Testers probe from the outside like real attackers, finding exposed services and business logic flaws.

In black box security testing, the assessor has no access to source code, architecture diagrams, or credentials. They discover the attack surface through reconnaissance (e.g. OSINT, DNS, subdomain enumeration) and then test for vulnerabilities. This approach mimics an external attacker and often finds misconfigurations, exposed admin panels, and weak authentication.

Black box testing is valuable for validating perimeter security and understanding the view from the internet. Limitations include limited coverage (only what is reachable) and higher time cost for discovery. It is commonly used for external penetration tests and bug bounty programs. Results should be combined with other testing types for full coverage.` },
  { id: 4, title: "White Box Testing", category: "White Box", date: "Mar 9, 2025", minRead: 8, excerpt: "Full access to source code and architecture.", content: `White box testing uses full visibility into code and design. SAST, code review, and architecture review help find vulnerabilities before deployment.

With white box (or "clear box") testing, assessors have access to source code, design documents, and often credentials or staging environments. This allows deep analysis: static application security testing (SAST), dependency scanning, code review, and architecture threat modeling. Issues such as SQL injection, hardcoded secrets, and logic flaws can be found early in the development lifecycle.

White box testing is efficient for finding many vulnerabilities quickly and is often integrated into CI/CD. It does not replace black box testing, as runtime behavior and environment-specific issues may still be missed. Combining white box with dynamic and penetration testing provides the most thorough coverage.` },
  { id: 5, title: "Gray Box Testing", category: "Gray Box", date: "Mar 8, 2025", minRead: 6, excerpt: "Partial knowledge for efficient testing.", content: `Gray box testing combines external probing with limited internal knowledge—e.g. credentials or docs—to focus testing and improve coverage efficiently.

Gray box testing sits between black and white box: the tester has some information (e.g. user accounts, API docs, or architecture overview) but not full source code or full internal access. This allows more targeted testing and often finds issues that pure black box would miss due to time constraints, while still reflecting a partially informed attacker.

Use cases include testing web applications with a few user roles, API security with documentation, and internal network testing with standard user credentials. Gray box can reduce testing time and cost while still providing realistic results. Scope and level of access should be documented in the statement of work.` },
  { id: 6, title: "Purple Team: Red and Blue Together", category: "Red Team", date: "Mar 7, 2025", minRead: 7, excerpt: "Collaborative exercises where red and blue teams work side by side.", content: `Purple teaming is a collaborative approach where red and blue teams work together during exercises. The red team demonstrates attacks while the blue team tests detection and response in real time.

Instead of a separate red team engagement followed by a report, purple team sessions are interactive: the red team runs an attack technique, and the blue team validates whether their tools and processes would catch it. Gaps are identified and sometimes remediated on the spot. This accelerates learning and improves defensive capabilities without the adversarial dynamic of a full red team exercise.

Purple teaming is ideal for maturing detection capabilities, tuning SIEM rules, and training analysts. It requires coordination, clear scope, and a culture that supports collaboration. Many organizations run purple team exercises after or alongside red team engagements to maximize the value of findings.` },
  { id: 7, title: "Threat Hunting Basics", category: "Blue Team", date: "Mar 6, 2025", minRead: 8, excerpt: "Proactive search for threats that evade existing detection.", content: `Threat hunting is the proactive search for indicators of compromise (IOCs) and attacker behavior that may have evaded existing security controls. Unlike alert-driven detection, hunting starts with a hypothesis and uses data to validate or refute it.

Hunters use SIEM, EDR, and network data to look for anomalies: unusual processes, lateral movement, data exfiltration patterns, or living-off-the-land techniques. Hypotheses can come from threat intelligence, red team findings, or known adversary TTPs (e.g. MITRE ATT&CK). Effective hunting requires good data quality, retention, and analyst skill.

Threat hunting programs often start with hypothesis-driven hunts (e.g. "Do we see PowerShell being used to download payloads?") and evolve to more open-ended exploration. Results feed back into detection rules and playbooks, creating a continuous improvement loop for the blue team.` },
  { id: 8, title: "Secure Code Review", category: "White Box", date: "Mar 5, 2025", minRead: 9, excerpt: "Manual and automated review of code for security defects.", content: `Secure code review is the process of examining source code for security vulnerabilities, logic errors, and compliance with secure coding standards. It can be performed manually by experienced developers or security engineers, or supported by automated static analysis (SAST) tools.

Key areas to review include input validation, authentication and authorization, cryptographic usage, error handling, and dependency management. OWASP guidelines and CWE/SANS Top 25 provide checklists. Manual review catches design flaws and business logic issues that tools often miss; SAST scales and catches common patterns like SQL injection and XSS.

Integrating security review into the development workflow (e.g. in pull requests) and training developers on secure coding reduces the number of defects that reach production. Findings should be triaged and fixed before release, with critical issues blocking deployment.` },
  { id: 9, title: "Incident Response Playbooks", category: "Blue Team", date: "Mar 4, 2025", minRead: 6, excerpt: "Documented procedures for handling security incidents.", content: `Incident response playbooks are step-by-step procedures for handling common security incidents such as malware infection, phishing, data breach, or ransomware. They ensure consistent, fast response and reduce the chance of missed steps under pressure.

A typical playbook includes: detection criteria, containment steps (e.g. isolate host, disable account), evidence collection, eradication and recovery, and post-incident review. Roles and responsibilities (incident commander, technical lead, communications) should be clear. Playbooks are often built from past incidents and updated after tabletop exercises.

Playbooks should be accessible during an incident (e.g. in a runbook system or wiki), tested regularly, and aligned with the organization's incident response plan. Automation can execute certain steps (e.g. isolate endpoint via EDR) to speed up response.` },
  { id: 10, title: "Building a Red Team Lab", category: "Red Team", date: "Mar 3, 2025", minRead: 10, excerpt: "How to set up a safe environment for offensive security practice.", content: `A red team lab is an isolated environment where security professionals can practice offensive techniques, test tools, and develop skills without affecting production. Labs can be local (VMware, VirtualBox), cloud-based (AWS, Azure, or dedicated lab platforms), or hybrid.

Essential components include attack machines (Kali, custom tooling), target systems (intentionally vulnerable VMs like Metasploitable, or custom apps), and network segmentation so lab traffic never reaches production. Documentation and snapshots help reset the lab after exercises. Some organizations use red team labs to validate detection before running exercises against production-like staging.

Legal and policy considerations: ensure lab use is authorized, data is synthetic or approved, and scope is clearly defined. A well-maintained lab supports continuous learning, tool evaluation, and preparation for real red team engagements.` },
];

function Lab2App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accessStatus, setAccessStatus] = useState("checking");
  const [labParams, setLabParams] = useState({
    labId: null,
    token: null,
    userId: null,
    deviceBind: "",
    machineMac: "",
    clientLocalIp: "",
  });
  const [popup, setPopup] = useState(null);
  const [delegatedAdmins, setDelegatedAdmins] = useState(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const labSolveSentRef = useRef(false);

  const [view, setView] = useState("guest");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const urlUserid = searchParams.get("userid");
  const urlEmail = searchParams.get("email");
  const profileUserid = searchParams.get("profile");

  const [accountUserid, setAccountUserid] = useState(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [updateEmailInput, setUpdateEmailInput] = useState("");
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState(false);
  const [profile, setProfile] = useState(null);
  const [route, setRoute] = useState("home");
  const { postId: urlPostId } = useParams();
  const currentPost = urlPostId ? BLOGS.find((b) => String(b.id) === String(urlPostId)) : null;

  const labOnlySearch = () => searchParamsLabOnly(searchParams);

  const toLabPath = (extra = {}) => {
    const sp = labOnlySearch();
    Object.entries(extra).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") sp.delete(k);
      else sp.set(k, String(v));
    });
    const q = sp.toString();
    return q ? `/lab/2?${q}` : "/lab/2";
  };

  const postPath = (postId) => {
    const q = labOnlySearch().toString();
    return q ? `/lab/2/post/${postId}?${q}` : `/lab/2/post/${postId}`;
  };

  const mergeSearchParams = (updates) => {
    const sp = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined) sp.delete(k);
      else sp.set(k, String(v));
    });
    setSearchParams(sp);
  };

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

  /** Restore login after full page reload (e.g. student edits userid in the address bar). */
  useLayoutEffect(() => {
    if (accessStatus !== "granted") return;
    const raw = sessionStorage.getItem(LAB2_SESSION_KEY);
    if (!raw) {
      setView("guest");
      return;
    }
    try {
      const s = JSON.parse(raw);
      if (s.userId == null) throw new Error("invalid");
      setUserId(s.userId);
      setUsername(s.username ?? "");
      setEmail(s.email ?? "");
      setUserRole(s.role ?? "user");
      setView("logged");
      const params = new URLSearchParams(window.location.search);
      const pUser = params.get("userid");
      const pEmail = params.get("email");
      const pProf = params.get("profile");
      if (pProf) {
        setRoute("profile");
        setAccountUserid(pUser ? parseInt(pUser, 10) : s.userId);
        setAccountEmail(pEmail ?? s.email ?? "");
      } else if (pUser) {
        setRoute("account");
        setAccountUserid(parseInt(pUser, 10));
        setAccountEmail(pEmail ?? "");
      } else {
        setRoute("home");
        setAccountUserid(s.userId);
        setAccountEmail(s.email ?? "");
      }
    } catch {
      try {
        sessionStorage.removeItem(LAB2_SESSION_KEY);
      } catch (_) {}
      setView("guest");
    }
  }, [accessStatus]);

  const submitLabSolved = async () => {
    const { labId, token, deviceBind, machineMac, clientLocalIp } = labParams;
    if (!labId || !token) {
      setPopup({
        type: "flag_error",
        message: "Missing lab session. Open this lab from HackMe (Start Lab).",
        detail: "",
      });
      return false;
    }
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
        return false;
      }
      const msg = String(data?.message || "");
      if (data.success || msg === "LAB_ALREADY_SOLVED") {
        const isFirstTime = msg === "LAB_SOLVED";
        const ptsForParent = isFirstTime ? (data.data?.points_earned || 150) : 0;
        setPopup({ type: isFirstTime ? "solved" : "already_solved" });
        if (window.opener) {
          window.opener.postMessage(
            { type: "HACKME_LAB_SOLVED", labId: Number(labId), lab_id: Number(labId), points: ptsForParent },
            "*"
          );
          window.opener.postMessage({ type: "LAB_SOLVED", labId: Number(labId) }, "*");
        }
        return true;
      }
      const errMsg = data.detail || msg || `HackMe error (HTTP ${res.status})`;
      setPopup({ type: "flag_error", message: errMsg, detail: msg });
      return false;
    } catch (e) {
      setPopup({
        type: "flag_error",
        message: e instanceof Error ? e.message : "Network error — is HackMe running?",
        detail: "",
      });
      return false;
    }
  };

  const applyLoginSuccess = (data) => {
    const uid = data.user.id;
    const uEmail = data.user.email || "";
    const uname = data.user.username || "";
    const role = data.user.role || "user";
    setUserId(uid);
    setUsername(uname);
    setEmail(uEmail);
    setUserRole(role);
    setPassword("");

    try {
      sessionStorage.setItem(
        LAB2_SESSION_KEY,
        JSON.stringify({ userId: uid, username: uname, email: uEmail, role })
      );
    } catch (_) {}

    const params = new URLSearchParams(window.location.search);
    const hasUserid = params.has("userid");
    const hasProfile = params.has("profile");
    if (hasUserid || hasProfile) {
      setAccountUserid(hasUserid ? parseInt(params.get("userid"), 10) : uid);
      setAccountEmail(params.get("email") || uEmail);
      setRoute(hasProfile ? "profile" : "account");
      setUpdateEmailInput(params.get("email") || "");
    } else {
      setAccountUserid(uid);
      setAccountEmail(uEmail);
      setRoute("home");
      setUpdateEmailInput("");
      setSearchParams(searchParamsLabOnly(params));
    }
    setView("logged");
    setSignInOpen(false);
    setError("");
    setSuccess("Signed in. You can use My Account or browse the blog.");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const u = String(username).trim();
    const p = String(password);
    const em = String(email).trim();
    if (!u || !p) {
      setError("Username and password are required.");
      return;
    }
    if (!isValidEmail(em)) {
      setError("Enter a valid email address (e.g. you@example.com).");
      return;
    }
    const opts = {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: u, password: p, email: em }),
    };
    const bases = [
      [API_BASE, "Vite proxy → /api/lab2"],
      [API_FALLBACK, "direct http://host:3001/api/lab2"],
    ];
    setLoading(true);
    let lastError = "Could not reach the lab API.";
    try {
      for (let i = 0; i < bases.length; i++) {
        const [base, label] = bases[i];
        try {
          const res = await fetch(`${base}/login.php`, opts);
          const text = await res.text();
          const parsed = parseJsonLoginBody(text, res.status, label);
          if (!parsed.ok) {
            lastError = parsed.error;
            continue;
          }
          const data = parsed.data;
          if (data.success && data.user) {
            applyLoginSuccess(data);
            return;
          }
          const dbMsg = [data.message, data.detail].filter(Boolean).join(" — ");
          setError(dbMsg || data.error || "Invalid username or password.");
          return;
        } catch (err) {
          lastError = err instanceof Error ? err.message : "Network error";
        }
      }
      setError(lastError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllDelegated = async () => {
    if (!delegatedAdmins?.length || labSolveSentRef.current) return;
    setDeleteAllLoading(true);
    try {
      labSolveSentRef.current = true;
      const ok = await submitLabSolved();
      if (ok) {
        setDelegatedAdmins(null);
      } else {
        labSolveSentRef.current = false;
      }
    } finally {
      setDeleteAllLoading(false);
    }
  };

  useEffect(() => {
    if (view !== "logged" || userId == null) return;
    if (urlUserid) {
      const id = parseInt(urlUserid, 10);
      if (!Number.isNaN(id)) setAccountUserid(id);
    } else {
      setAccountUserid(userId);
    }
    if (urlEmail != null && urlEmail !== "") {
      setAccountEmail(urlEmail);
    } else {
      setAccountEmail(email);
    }
  }, [urlUserid, urlEmail, view, userId, email]);

  useEffect(() => {
    if (view !== "logged") return;
    if (profileUserid) setRoute("profile");
    else if (urlUserid) setRoute("account");
  }, [profileUserid, urlUserid, view]);

  useEffect(() => {
    if (view !== "logged" || !accountUserid || route !== "account") return;
    fetch(`${API_BASE}/get_profile.php?userid=${accountUserid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setProfile(d.user);
        }
      })
      .catch(console.error);
  }, [view, accountUserid, route]);

  /** Update-email field: empty until you submit Update; then mirror `email` from URL only. */
  useEffect(() => {
    if (view !== "logged") return;
    if (urlEmail != null && urlEmail !== "") {
      setUpdateEmailInput(urlEmail);
    } else if (!urlUserid && route === "account") {
      setUpdateEmailInput("");
    }
  }, [urlEmail, urlUserid, view, route]);

  useEffect(() => {
    if (view === "logged" && route === "account" && accountUserid === 1) {
      setUsersError(false);
      fetchApiWithFallback('/get_users.php')
        .then((d) => {
          if (d.success && Array.isArray(d.users) && d.users.length > 0) {
            setUsers(d.users);
          } else {
            setUsers(FALLBACK_USERS);
          }
        })
        .catch(() => {
          setUsers(FALLBACK_USERS);
        });
    } else {
      setUsers([]);
    }
  }, [view, route, accountUserid]);

  const displayUsers = useMemo(() => {
    const base = users.length ? [...users] : [];
    if (userId != null && !base.some((u) => u.id === userId)) {
      base.push({
        id: userId,
        username: username || "—",
        email: email || "",
        role: userRole || "user",
      });
    }
    return base.sort((a, b) => a.id - b.id);
  }, [users, userId, username, email, userRole]);

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    if (view !== "logged") return;
    const uid = accountUserid ?? userId;
    if (!uid) return;
    const emailRaw = (updateEmailInput || "").trim();
    if (!isValidEmail(emailRaw)) {
      setError("Enter a valid email address (must look like name@domain.com).");
      return;
    }
    setError("");
    setSuccess("");
    setAccountEmail(emailRaw);
    mergeSearchParams({ userid: String(uid), email: emailRaw });
    setSuccess("Email updated.");

    const adminRow = users.find((u) => u.id === 1);
    const adminEmailFromApi =
      adminRow && adminRow.email ? String(adminRow.email).trim().toLowerCase() : TARGET_ADMIN_EMAIL.toLowerCase();
    const matchesAdmin =
      emailRaw.toLowerCase() === adminEmailFromApi || emailRaw.toLowerCase() === TARGET_ADMIN_EMAIL.toLowerCase();

    if (matchesAdmin && uid !== 1) {
      labSolveSentRef.current = false;
      setDelegatedAdmins(INITIAL_DELEGATED_ADMINS.map((r) => ({ ...r })));
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(LAB2_SESSION_KEY);
    } catch (_) {}
    labSolveSentRef.current = false;
    setDelegatedAdmins(null);
    setView("guest");
    setUsername("");
    setPassword("");
    setEmail("");
    setUserId(null);
    setUserRole("user");
    setAccountUserid(null);
    setAccountEmail("");
    setProfile(null);
    setUpdateEmailInput("");
    setError("");
    setSuccess("");
    setSearchParams(labOnlySearch());
    setRoute("home");
  };

  const showDelegatedPanel =
    view === "logged" &&
    route === "account" &&
    !profileUserid &&
    Array.isArray(delegatedAdmins) &&
    delegatedAdmins.length > 0;
  const showAdminView =
    view === "logged" && route === "account" && accountUserid === 1 && !showDelegatedPanel;
  const isAccountPage = route === "account" || route === "profile";
  const hasSubmittedEmail = Boolean(
    urlUserid && urlEmail != null && String(urlEmail).trim() !== ""
  );

  if (accessStatus === "checking") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (accessStatus === "denied") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border-2 border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-600">
            Open this lab from HackMe using <strong>Start Lab</strong> so the URL includes{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">labId</code> and{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">token</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b-2 border-gray-300 bg-white sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to={toLabPath()}
            onClick={() => {
              setRoute("home");
              if (view === "logged") setSearchParams(labOnlySearch());
            }}
            className="text-lg font-bold text-gray-900 hover:text-emerald-700"
          >
            Red & Blue Blog
          </Link>
          <nav className="flex items-center gap-3">
            {view === "guest" ? (
              <button
                type="button"
                onClick={() => {
                  setSignInOpen(true);
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
              >
                <LogIn className="w-4 h-4" /> Sign in
              </button>
            ) : (
              <>
                <Link
                  to={toLabPath()}
                  onClick={() => {
                    setRoute("account");
                    setAccountUserid(userId);
                    setAccountEmail(email);
                    setUpdateEmailInput("");
                    setError("");
                    setSuccess("");
                    setSearchParams(labOnlySearch());
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
                >
                  <User className="w-4 h-4" /> My Account
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:border-red-500"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {signInOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-300 bg-white shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 tracking-[0.18em] uppercase">Red & Blue Blog</p>
                <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
              </div>
            </div>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full rounded-lg bg-gray-100 border-2 border-gray-400 pl-9 pr-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-emerald-600"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">Password</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    className="w-full rounded-lg bg-gray-100 border-2 border-gray-400 pl-9 pr-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-emerald-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="password"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    className="w-full rounded-lg bg-gray-100 border-2 border-gray-400 pl-9 pr-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-emerald-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@gmail.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold">{error}</div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSignInOpen(false);
                    setError("");
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-400 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </div>
            </form>
            <p className="mt-4 text-xs text-gray-600">Default lab account: <span className="font-mono">user</span> / <span className="font-mono">password</span> / <span className="font-mono">user@gmail.com</span></p>
          </div>
        </div>
      )}

      {!urlPostId && showDelegatedPanel && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-600" /> Administrator accounts
          </h2>
          <div className="rounded-xl border-2 border-gray-300 bg-gray-50 overflow-hidden mt-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-400 bg-gray-200 text-left">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody>
                {delegatedAdmins.map((row) => (
                  <tr key={row.id} className="border-b border-gray-300 hover:bg-gray-100">
                    <td className="py-3 px-4 font-semibold">{row.fullName}</td>
                    <td className="py-3 px-4">{row.username}</td>
                    <td className="py-3 px-4">{row.email}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full border-2 border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                        {row.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <button
              type="button"
              disabled={deleteAllLoading}
              onClick={handleDeleteAllDelegated}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-red-500 bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleteAllLoading ? "Submitting…" : "Delete all"}
            </button>
          </div>
        </main>
      )}

      {!urlPostId && showAdminView && isAccountPage && !profileUserid && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><UserCog className="w-6 h-6 text-emerald-600" /> Users</h2>
          <p className="text-sm text-gray-600 mb-4">Click a user to view their profile.</p>
          {usersError ? (
            <p className="text-red-600 py-4">Failed to load users. Ensure userid=1 is in the URL and the API is running.</p>
          ) : displayUsers.length === 0 ? (
            <p className="text-gray-600 py-4">Loading users...</p>
          ) : (
            <div className="rounded-xl border-2 border-gray-300 bg-gray-50 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-400 bg-gray-200 text-left">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-300 hover:bg-gray-100 ${
                        userId != null && u.id === userId ? "bg-amber-50/80" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-medium">{u.id}</td>
                      <td className="py-3 px-4 font-semibold">{u.username}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4"><span className="rounded-full border-2 border-emerald-400 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{u.role}</span></td>
                      <td className="py-3 px-4">
                        <Link
                          to={toLabPath({
                            userid: "1",
                            email: accountEmail || "",
                            profile: String(u.id),
                          })}
                          onClick={() => setRoute("profile")}
                          className="text-emerald-700 font-semibold hover:underline"
                        >
                          View profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      )}

      {!urlPostId &&
        view === "logged" &&
        isAccountPage &&
        !profileUserid &&
        !showAdminView &&
        !showDelegatedPanel && (
        <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">My Account</h2>
          <form onSubmit={handleUpdateEmail} className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Update email</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                autoComplete="email"
                className="flex-1 rounded-lg bg-gray-100 border-2 border-gray-400 px-3 py-2 text-sm"
                value={updateEmailInput}
                onChange={(e) => setUpdateEmailInput(e.target.value)}
                placeholder="you@example.com"
              />
              <button type="submit" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold text-white shrink-0">
                Update
              </button>
            </div>
          </form>
          {error && <div className="p-3 rounded-lg bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold">{error}</div>}
          {success && (
            <div className="p-3 rounded-lg bg-green-100 border-2 border-green-500 text-green-900 text-sm font-semibold">{success}</div>
          )}
          {hasSubmittedEmail && profile && (
            <>
              <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5 space-y-2">
                <p className="text-xs font-semibold text-gray-700">User ID (from URL)</p>
                <p className="font-mono font-semibold">{profile.id}</p>
                <p className="text-xs font-semibold text-gray-700 mt-2">Username</p>
                <p className="font-semibold">{profile.username}</p>
                <p className="text-xs font-semibold text-gray-700 mt-2">Email</p>
                <p className="font-semibold">{profile.email || "—"}</p>
              </div>
            </>
          )}
        </main>
      )}

      {!urlPostId && view === "logged" && profileUserid && route === "profile" && (
        <ProfileView
          userid={profileUserid}
          onBack={() => {
            setRoute("account");
            const sp = new URLSearchParams(searchParams);
            sp.delete("profile");
            sp.set("userid", String(accountUserid ?? userId));
            sp.set("email", accountEmail);
            setSearchParams(sp);
          }}
        />
      )}

      {urlPostId && (
        <main className="max-w-3xl mx-auto px-6 py-10">
          <Link to={toLabPath()} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 mb-6 inline-block">← Back to blog</Link>
          {currentPost ? (
            <article>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{currentPost.category}</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1 mb-3">{currentPost.title}</h1>
              <p className="text-sm text-gray-700 font-medium mb-8">{currentPost.date} · {currentPost.minRead} min read</p>
              <div className="text-gray-900 text-lg leading-relaxed whitespace-pre-line font-medium">{currentPost.content}</div>
            </article>
          ) : (
            <p className="text-gray-600">Post not found.</p>
          )}
        </main>
      )}

      {route === "home" && !urlPostId && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          {view === "logged" && success ? (
            <div className="mb-6 p-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 text-emerald-900 text-sm font-semibold">
              {success}
            </div>
          ) : null}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Red Team & Blue Team Blog</h1>
          <p className="text-gray-800 mb-10 font-medium">Blackbox, Whitebox, Graybox and more.</p>
          <div className="grid gap-8 md:grid-cols-2">
            {BLOGS.map((blog) => (
              <article key={blog.id} className="rounded-xl border-2 border-gray-300 bg-gray-50 p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{blog.category}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-1 mb-2">{blog.title}</h2>
                <p className="text-gray-800 text-sm leading-relaxed line-clamp-2 font-medium">{blog.excerpt}</p>
                <p className="text-xs text-gray-700 mt-3 font-medium">{blog.date} · {blog.minRead} min read</p>
                <Link to={postPath(blog.id)} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
                  Read more
                </Link>
              </article>
            ))}
          </div>
        </main>
      )}

      {popup?.type === "solved" || popup?.type === "already_solved" ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                popup.type === "solved" ? "bg-emerald-100" : "bg-amber-100"
              }`}
            >
              <CheckCircle2
                className={`w-10 h-10 ${
                  popup.type === "solved" ? "text-emerald-600" : "text-amber-600"
                }`}
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {popup.type === "solved" ? "Lab solved!" : "Already solved"}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {popup.type === "solved"
                ? "Congratulations — the administrator list was cleared. Points are recorded in HackMe."
                : "You already completed this lab. No additional points."}
            </p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}

      {popup?.type === "flag_error" ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Could not record solve</h3>
            <p className="text-sm text-red-700 mb-4">{popup.message}</p>
            {popup.detail ? <p className="text-xs text-gray-500 mb-4">{popup.detail}</p> : null}
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="w-full rounded-lg border-2 border-gray-300 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileView({ userid, onBack }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!userid) return;
    setError(false);
    setProfile(null);
    const tryLoad = (url) =>
      fetch(url)
        .then((r) => r.text())
        .then((text) => {
          try {
            const d = JSON.parse(text);
            if (d.success && d.user) {
              setProfile(d.user);
              return;
            }
          } catch (_) {}
          throw new Error('no profile');
        });
    const id = parseInt(userid, 10);
    const fallback = FALLBACK_PROFILES[id];
    tryLoad(`${API_BASE}/get_profile.php?userid=${userid}`)
      .catch(() => tryLoad(`${API_FALLBACK}/get_profile.php?userid=${userid}`))
      .catch(() => {
        if (fallback) {
          setProfile(fallback);
        } else {
          setError(true);
        }
      });
  }, [userid]);

  if (error) return <main className="max-w-2xl mx-auto px-6 py-10"><p className="text-red-600 font-medium">Failed to load profile.</p><button type="button" onClick={onBack} className="mt-4 text-sm font-semibold text-emerald-700 hover:underline">← Back</button></main>;
  if (!profile) return <main className="max-w-2xl mx-auto px-6 py-10"><p className="text-gray-700">Loading profile...</p></main>;
  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-emerald-700 hover:underline">← Back</button>
      <h2 className="text-xl font-bold text-gray-900">Profile — {profile.username}</h2>
      <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5 space-y-2">
        <p className="text-xs font-semibold text-gray-700">User ID</p>
        <p className="font-mono font-semibold">{profile.id}</p>
        <p className="text-xs font-semibold text-gray-700 mt-2">Username</p>
        <p className="font-semibold">{profile.username}</p>
        <p className="text-xs font-semibold text-gray-700 mt-2">Email</p>
        <p className="font-semibold">{profile.email || "—"}</p>
      </div>
    </main>
  );
}

export default Lab2App;
