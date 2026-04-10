import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Lock,
  User,
  Shield,
  LogOut,
  UserCog,
  CheckCircle2,
  X,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";

const LAB_FLAG = "FLAG{UNPROTECTED_ADMIN_PANEL}";
const HACKME_API_BASE =
  window.location.protocol + "//" + window.location.hostname + "/HackMe/server/api";


function sameUsername(a, b) {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}

const API_URL = "/api/lab1";

const BLOGS = [
  {
    id: 1,
    title: "Introduction to Penetration Testing",
    excerpt: "Learn how authorized security testing helps organizations find and fix vulnerabilities before attackers do.",
    category: "Security",
    date: "Mar 10, 2025",
    minRead: 8,
    content: `Penetration testing (pen testing) is an authorized simulated cyber attack on a computer system, performed to evaluate the security of the system. The test is performed to identify weaknesses, including the potential for unauthorized parties to gain access to the system's features and data.

Unlike malicious hackers, penetration testers operate with explicit permission from the organization. They use the same tools, techniques, and processes as real attackers to find and demonstrate the business impact of weaknesses. This approach helps organizations understand their real-world exposure before an actual breach occurs.

Organizations use penetration testing to identify and fix vulnerabilities before they can be exploited. Regular testing is especially important after major system changes, new deployments, or when new threat intelligence emerges. Many compliance frameworks, including PCI DSS and ISO 27001, recommend or require periodic penetration testing.

Common phases include reconnaissance (gathering information about the target), scanning (identifying open ports and services), gaining access (exploiting vulnerabilities), maintaining access (persistence), and analysis. Results are documented in a detailed report and used to improve the organization's security posture. Remediation is typically tracked until all critical and high findings are addressed.`
  },
  {
    id: 2,
    title: "Understanding SQL Injection Attacks",
    excerpt: "How attackers exploit poorly sanitized inputs to manipulate database queries and steal or corrupt data.",
    category: "Web Security",
    date: "Mar 8, 2025",
    minRead: 7,
    content: `SQL injection is one of the most critical and persistent web application vulnerabilities. It occurs when user input is concatenated directly into SQL queries without proper sanitization or parameterization. The OWASP Top 10 has listed it for years because it remains common and highly impactful.

Attackers can inject malicious SQL code through login forms, search boxes, cookies, or any user-supplied data. Classic examples include entering a single quote to break out of a string, or using constructs like ' OR '1'='1' to bypass authentication. Union-based injection can extract data from other tables; blind injection can infer information through true/false responses.

This can lead to unauthorized data access (including sensitive or personal data), data deletion, or even full system compromise if the database runs with elevated privileges. In some cases, attackers can use the database to read files or execute commands on the underlying server.

The best defense is using prepared statements and parameterized queries so that user input is never interpreted as SQL. Input validation and least-privilege database accounts also reduce the impact of successful attacks. Web application firewalls (WAFs) can help detect and block some injection patterns but should not replace secure coding.`
  },
  {
    id: 3,
    title: "Secure Authentication Best Practices",
    excerpt: "Multi-factor authentication, password policies, and session management for modern applications.",
    category: "Authentication",
    date: "Mar 5, 2025",
    minRead: 9,
    content: `Strong authentication is the first line of defense for any application. Passwords alone are often insufficient; users choose weak passwords, reuse them across sites, and fall victim to phishing. Multi-factor authentication (MFA) significantly reduces the risk of account takeover by requiring a second factor (e.g. SMS, authenticator app, or hardware key).

Best practices include: enforcing strong password policies (length, complexity, and checking against known breached password lists), using secure password hashing (e.g. bcrypt, Argon2, or scrypt with appropriate cost factors), implementing account lockout or rate limiting after failed attempts, and using HTTPS everywhere so credentials are never sent in cleartext.

Session tokens should be random, long, and stored securely (e.g. in httpOnly, secure cookies). They must be invalidated on logout and ideally rotated after privilege changes. Short session timeouts and re-authentication for sensitive actions improve security.

Role-based access control (RBAC) ensures users only access resources they are authorized to use. Always verify permissions on the server for every request; never rely on client-side checks or hidden UI elements alone. Broken access control is a leading cause of data breaches.`
  },
  {
    id: 4,
    title: "Cross-Site Scripting (XSS) Explained",
    excerpt: "How XSS works, common attack vectors, and how to prevent it with proper encoding and Content Security Policy.",
    category: "Web Security",
    date: "Mar 2, 2025",
    minRead: 8,
    content: `XSS (Cross-Site Scripting) allows attackers to inject malicious scripts into web pages viewed by other users. The script runs in the victim's browser with the same origin as the vulnerable site, so it can access cookies, session tokens, and DOM content. There are three main types: stored XSS (script saved in the database and served to all visitors), reflected XSS (script in URL or form response, often via a crafted link), and DOM-based XSS (vulnerability entirely in client-side code).

Attackers can steal session cookies to hijack accounts, redirect users to phishing sites, keylog user input, or deface pages. In combination with other flaws, XSS can be used for privilege escalation or spreading malware.

Prevention requires context-aware output encoding: escape HTML when inserting into HTML, escape JavaScript when inserting into script or attributes, and encode for URL context when building links. Use a well-tested encoding library rather than ad-hoc replacements. Content-Security-Policy (CSP) headers can restrict where scripts load from and reduce the impact of injection. Avoid dangerous APIs like innerHTML or eval with user-controlled data.

Frameworks like React escape by default, but you must still avoid dangerouslySetInnerHTML with unsanitized input. When you need to render HTML from users, use a sanitization library that allows only a safe subset of tags and attributes.`
  },
  {
    id: 5,
    title: "Network Security Fundamentals",
    excerpt: "Firewalls, intrusion detection, and secure network design for defenders.",
    category: "Network Security",
    date: "Feb 28, 2025",
    minRead: 10,
    content: `Network security involves protecting the integrity, confidentiality, and availability of data as it travels across networks. As more services move to the cloud and remote work grows, the network perimeter has expanded, making defense-in-depth essential.

Firewalls control traffic between zones (e.g. internet, DMZ, internal). Next-generation firewalls add application awareness, intrusion prevention, and often SSL inspection. Rules should follow least privilege: allow only what is needed and deny by default. IDS/IPS systems detect and optionally block malicious activity by matching signatures or behavioral patterns. Tuning is important to reduce false positives while catching real threats.

Segmenting networks limits lateral movement after a breach. Critical assets should be in isolated segments with strict access controls. Encrypting traffic with TLS and using VPNs for remote access protects data in transit. Regular vulnerability scans and patch management keep systems up to date; unpatched systems are a top entry point for attackers.

Zero-trust architecture assumes the network is already compromised and verifies every request, regardless of origin. Identity and device health are checked continuously; access is granted per-session and per-resource. This model is increasingly adopted for modern and hybrid environments.`
  },
  {
    id: 6,
    title: "Incident Response and Digital Forensics",
    excerpt: "How to prepare for and respond to security incidents, from detection to recovery.",
    category: "Incident Response",
    date: "Feb 25, 2025",
    minRead: 9,
    content: `When a security incident occurs, a structured response reduces damage and recovery time. Panic and ad-hoc actions can destroy evidence or worsen the situation. The typical phases are: preparation (plans, team, tools), identification (detection and initial assessment), containment (limiting spread), eradication (removing the threat), recovery (restoring services safely), and lessons learned (post-incident review and improvement).

Forensics involves preserving evidence in a way that is admissible and defensible. This includes imaging disks and memory, capturing network traffic and logs, and maintaining a strict chain of custody. Analysis aims to build a timeline of events, determine root cause, and identify scope of compromise. Specialized tools and trained analysts are often required for complex cases.

Having an incident response plan, a trained team with clear roles, and communication templates before an incident is essential. Regular tabletop exercises help teams stay ready and reveal gaps in plans. Integration with legal, PR, and management ensures that response decisions consider business and regulatory requirements.`
  },
  {
    id: 7,
    title: "Phishing and Social Engineering Defense",
    excerpt: "How attackers manipulate people and how to build a security-aware culture.",
    category: "Security Awareness",
    date: "Feb 22, 2025",
    minRead: 7,
    content: `Phishing remains one of the most effective attack vectors because it targets people rather than technology. Attackers send emails or messages that appear to come from trusted sources, urging the victim to click a link, open an attachment, or reveal credentials. Spear phishing targets specific individuals or organizations with tailored content; business email compromise (BEC) often impersonates executives to trigger wire transfers or data disclosure.

Social engineering extends beyond email: vishing (voice), smishing (SMS), and in-person pretexting can be used to gain access or information. Defenders should assume that some phishing will get through and focus on detection, response, and limiting what a single compromise can do (e.g. MFA, least privilege, segmenting sensitive data).

Security awareness training helps users recognize red flags: urgency, requests for credentials or money, mismatched URLs, and unusual sender behavior. Simulated phishing campaigns measure and improve resilience. Reporting mechanisms (e.g. "Report Phish" button) encourage users to escalate suspicious messages so security teams can act quickly.`
  },
  {
    id: 8,
    title: "Secure Software Development Lifecycle",
    excerpt: "Integrating security into design, development, and deployment.",
    category: "DevSecOps",
    date: "Feb 20, 2025",
    minRead: 8,
    content: `Security cannot be bolted on at the end of a project. The Secure SDLC (SSDLC) integrates security activities throughout the development lifecycle: requirements (security and privacy requirements), design (threat modeling, secure architecture), implementation (secure coding, static analysis), testing (SAST, DAST, penetration testing), deployment (hardened config, secrets management), and operations (monitoring, incident response, patching).

Threat modeling identifies potential attackers, assets, and threats so that mitigations can be designed early. Secure coding guidelines and code review catch common vulnerabilities before they reach production. Automated tools (SAST, dependency checkers, container scanners) scale security feedback. In CI/CD pipelines, security gates can block builds that fail policy or have known vulnerable dependencies.

DevSecOps culture encourages developers and security teams to collaborate. Shifting left—finding and fixing issues earlier—reduces cost and risk. Training developers on secure coding and providing clear, actionable guidance improves outcomes. Metrics such as time to remediate and vulnerability trend help track progress.`
  },
  {
    id: 9,
    title: "Cryptography Basics for Security Practitioners",
    excerpt: "Symmetric and asymmetric crypto, hashing, and when to use what.",
    category: "Cryptography",
    date: "Feb 18, 2025",
    minRead: 9,
    content: `Cryptography underpins confidentiality, integrity, and authenticity in digital systems. Symmetric encryption (e.g. AES) uses one key for encryption and decryption; it is fast and suitable for bulk data. Asymmetric encryption (e.g. RSA, ECC) uses a key pair: a public key for encryption or verification and a private key for decryption or signing. It enables key exchange and digital signatures without sharing secrets.

Hashing (e.g. SHA-256) produces a fixed-size fingerprint of data. It is one-way and used for integrity checks, password storage (with a salt and slow hash like bcrypt), and deduplication. Never use MD5 or SHA-1 for security-sensitive purposes; they are cryptographically broken.

Use TLS for data in transit and standard algorithms with appropriate key sizes. Store keys in a dedicated system (HSM or key management service) and rotate them according to policy. Avoid inventing your own crypto; use well-reviewed libraries and follow best practices for mode (e.g. GCM for AES) and padding.`
  },
  {
    id: 10,
    title: "Cloud Security Shared Responsibility",
    excerpt: "What you secure vs. what the cloud provider secures, and how to harden your workloads.",
    category: "Cloud Security",
    date: "Feb 15, 2025",
    minRead: 8,
    content: `In the cloud, security is shared between the provider and the customer. The provider secures the underlying infrastructure (physical security, hypervisor, network). The customer is responsible for securing their data, identity and access, application configuration, and often network and host-level controls within the service.

Misconfiguration is a leading cause of cloud breaches: exposed storage buckets, overly permissive IAM roles, and unencrypted data. Use identity-based access with least privilege; avoid long-lived access keys where possible. Enable logging and monitoring (e.g. CloudTrail, VPC flow logs) and set up alerts for suspicious activity. Apply encryption at rest and in transit; manage keys through the provider's KMS or your own HSM.

Adopt a cloud security framework (e.g. CIS benchmarks, cloud provider best practices) and automate compliance checks. Infrastructure as code allows security to be reviewed and versioned. Regular assessments and penetration testing that include cloud assets help validate your posture.`
  }
];

function getViewFromHash() {
  const raw = (window.location.hash || "#/").replace(/^#\/?/, "") || "blog";
  if (raw === "admin-panel") return { route: "admin" };
  if (raw === "my-account") return { route: "account" };
  if (raw === "blog-manage") return { route: "blog_manage" };
  if (raw.startsWith("blog/")) {
    const id = raw.slice(5).split("/")[0];
    return { route: "post", postId: id };
  }
  return { route: "home" };
}

const Lab1App = () => {
  const location = useLocation();
  const rrNavigate = useNavigate();

  /** If user opens /lab/1/blog-manage (path) instead of #/blog-manage, normalize to /lab/1 + hash. */
  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "");
    if (!path.endsWith("/blog-manage")) return;
    const base = path.replace(/\/blog-manage$/, "") || "/lab/1";
    rrNavigate(`${base}${location.search || ""}`, { replace: true });
    window.setTimeout(() => {
      window.location.hash = "blog-manage";
    }, 0);
  }, [location.pathname, location.search, rrNavigate]);

  const [accessStatus, setAccessStatus] = useState("checking");
  const [labParams, setLabParams] = useState({ labId: null, token: null, userId: null });
  const [popup, setPopup] = useState(null);
  const [blogs, setBlogs] = useState(() => BLOGS.map((b) => ({ ...b })));
  const [blogModal, setBlogModal] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formExcerpt, setFormExcerpt] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formMinRead, setFormMinRead] = useState(8);
  const [formContent, setFormContent] = useState("");

  const [view, setView] = useState("login");
  const [route, setRoute] = useState("home");
  const [postId, setPostId] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(null);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const labId = params.get("labId");
    const token = params.get("token");
    if (!labId || !token) {
      setAccessStatus("denied");
      return;
    }
    (async () => {
      try {
        const url = `${HACKME_API_BASE}/verify_lab_token.php?token=${encodeURIComponent(token)}&lab_id=${encodeURIComponent(labId)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        setAccessStatus(data.valid ? "granted" : "denied");
        if (data.valid) {
          setLabParams({
            labId,
            token,
            userId: data.user_id > 0 ? data.user_id : null,
          });
        }
      } catch {
        setAccessStatus("denied");
      }
    })();
  }, []);

  const submitLabSolved = async () => {
    const { labId, userId, token } = labParams;
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
      flag: LAB_FLAG,
      user_id: userId > 0 ? userId : 0,
      access_token: token,
    };
    try {
      const res = await fetch(`${HACKME_API_BASE}/submit_flag.php`, {
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
      if (data.success || data.message === "LAB_ALREADY_SOLVED" || data.message === "FLAG_ALREADY_SUBMITTED") {
        const isFirstTime = data.message === "FLAG_CAPTURED";
        const ptsForParent =
          data.message === "FLAG_CAPTURED"
            ? typeof data.points === "number"
              ? data.points
              : 150
            : 0;
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
      const errMsg = data.detail || data.message || `HackMe error (HTTP ${res.status})`;
      setPopup({ type: "flag_error", message: errMsg, detail: data.message || "" });
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

  const resetBlogForm = () => {
    setFormTitle("");
    setFormExcerpt("");
    setFormCategory("");
    setFormDate("");
    setFormMinRead(8);
    setFormContent("");
  };

  const openAddBlogModal = () => {
    resetBlogForm();
    setBlogModal({ mode: "add" });
  };

  const openEditBlogModal = (id) => {
    const b = blogs.find((x) => x.id === id);
    if (!b) return;
    setFormTitle(b.title);
    setFormExcerpt(b.excerpt);
    setFormCategory(b.category);
    setFormDate(b.date);
    setFormMinRead(b.minRead);
    setFormContent(b.content);
    setBlogModal({ mode: "edit", id });
  };

  const saveBlogModal = (e) => {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title) return;
    const excerpt = formExcerpt.trim() || "—";
    const category = formCategory.trim() || "General";
    const date = formDate.trim() || "—";
    const minRead = Number(formMinRead) > 0 ? Number(formMinRead) : 8;
    const content = formContent;

    if (blogModal?.mode === "add") {
      const newId = Math.max(0, ...blogs.map((b) => b.id)) + 1;
      setBlogs((prev) => [...prev, { id: newId, title, excerpt, category, date, minRead, content }]);
    } else if (blogModal?.mode === "edit" && blogModal.id != null) {
      const id = blogModal.id;
      setBlogs((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, title, excerpt, category, date, minRead, content } : b
        )
      );
    }
    setBlogModal(null);
    resetBlogForm();
  };

  const handleDeleteBlog = async (id) => {
    const blog = blogs.find((b) => b.id === id);
    if (!blog) return;
    if (!window.confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    setBlogs((prev) => prev.filter((b) => b.id !== id));
    if (route === "post" && String(postId) === String(id)) {
      navigate("blog");
    }
  };

  const handleDeleteAllBlogs = async () => {
    if (!blogs.length) return;
    setDeleteAllLoading(true);
    try {
      const ok = await submitLabSolved();
      if (!ok) return;
      setBlogs([]);
      if (route === "post" || route === "blog_manage") {
        navigate("blog");
      }
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const navigate = (path) => {
    const clean = (path || "").replace(/^#\/?/, "").replace(/\/$/, "") || "blog";
    window.location.hash = clean === "blog" ? "" : clean;
    const next = getViewFromHash();
    setRoute(next.route);
    setPostId(next.postId ?? null);
  };

  useEffect(() => {
    const handler = () => {
      const next = getViewFromHash();
      setRoute(next.route);
      setPostId(next.postId ?? null);
    };
    handler();
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    if (view !== "logged" || route !== "admin") return;
    setAdminLoading(true);
    fetch(`${API_URL}/admin_users.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          setAdminUsers(data.users);
        }
      })
      .catch(console.error)
      .finally(() => setAdminLoading(false));
  }, [view, route, username]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError("Invalid response from server");
        return;
      }

      if (data.success) {
        setSuccess(data.message);
        setUserRole(data.user?.role || "user");
        setUserId(data.user?.id ?? null);
        setTimeout(() => {
          setView("logged");
          window.location.hash = "";
          setRoute("home");
          setPostId(null);
        }, 600);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Connection error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (username && isAdmin) {
      try {
        await fetch(`${API_URL}/update_role.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, role: "user" }),
        });
      } catch (_) {}
    }
    setView("login");
    setUsername("");
    setPassword("");
    setUserRole("");
    setUserId(null);
    window.location.hash = "";
    setRoute("home");
    setPostId(null);
  };

  const handleChangeRole = async (targetUsername, newRole) => {
    setRoleUpdating(targetUsername);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/update_role.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminUsers((prev) =>
          prev.map((u) => (sameUsername(u.username, targetUsername) ? { ...u, role: newRole } : u))
        );
        if (sameUsername(targetUsername, username)) {
          setUserRole(newRole);
        } else {
          setSuccess(`Role updated for ${targetUsername}.`);
        }
      } else {
        setError(data.message || "Update failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRoleUpdating(null);
    }
  };

  if (accessStatus === "checking") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
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

  if (view === "login") {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-300 bg-white p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-100 border-2 border-blue-400 flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-blue-700 tracking-[0.18em] uppercase">
                  CyberSec Blog
                </p>
                <h1 className="text-xl font-bold text-gray-900">
                  Login
                </h1>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    className="w-full rounded-lg bg-gray-100 border-2 border-gray-400 pl-9 pr-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 mb-1.5">Password</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    className="w-full rounded-lg bg-gray-100 border-2 border-gray-400 pl-9 pr-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 rounded-lg bg-green-100 border-2 border-green-500 text-green-900 text-sm font-semibold">
                {success}
              </div>
            )}

            <p className="mt-4 text-xs text-gray-700 font-medium text-center">
              Use your account to read the blog. (user / password)
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentPost = postId ? blogs.find((b) => String(b.id) === String(postId)) : null;

  /** Session role or row from admin list (covers trim/case mismatches). */
  const isAdmin =
    String(userRole).toLowerCase() === "admin" ||
    adminUsers.some(
      (u) => sameUsername(u.username, username) && String(u.role).toLowerCase() === "admin"
    );

  const blogAdminSection = isAdmin ? (
    <section className="mb-10 rounded-xl border-2 border-blue-400 bg-blue-50/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            Blog management
          </h2>
          <p className="text-sm text-gray-700 mt-1">
            Add, edit, or remove individual posts. To complete the lab and earn points (same flow as SQL lab id 1), use{" "}
            <strong>Delete all</strong> — it submits your solve to HackMe, then clears the list.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteAllBlogs}
            disabled={deleteAllLoading || !blogs.length}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 hover:bg-red-100 px-4 py-2 text-sm font-bold text-red-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {deleteAllLoading ? "Submitting…" : "Delete all"}
          </button>
          <button
            type="button"
            onClick={openAddBlogModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow"
          >
            <Plus className="w-4 h-4" />
            New post
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3">Category</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map((blog) => (
              <tr key={blog.id} className="border-b border-gray-100 last:border-0">
                <td className="py-2 px-3 font-mono text-gray-600">{blog.id}</td>
                <td className="py-2 px-3 font-medium text-gray-900">{blog.title}</td>
                <td className="py-2 px-3 text-gray-600">{blog.category}</td>
                <td className="py-2 px-3 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openEditBlogModal(blog.id)}
                    className="inline-flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50 mr-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlog(blog.id)}
                    className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ) : null;

  const blogManageLinkCard = isAdmin ? (
    <div className="mb-8 rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-white p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-base font-bold text-gray-900">Blog management</p>
          <p className="text-sm text-gray-600 mt-1">
            Opens a dedicated page where you can add, edit, or delete posts. Complete the lab using <strong>Delete all</strong> on that page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("blog-manage")}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Open blog management
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b-2 border-gray-300 bg-white sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <a
            href="#/"
            onClick={(e) => { e.preventDefault(); navigate("blog"); }}
            className="text-lg font-bold text-gray-900 hover:text-blue-700 transition-colors"
          >
            CyberSec Blog
          </a>
          <nav className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <a
              href="#/my-account"
              onClick={(e) => { e.preventDefault(); navigate("my-account"); }}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 hover:border-blue-500 transition-colors"
            >
              <User className="w-4 h-4" />
              My Account
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 hover:border-red-500 transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {route === "home" && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cyber Security Blog</h1>
          <p className="text-gray-800 mb-10 font-medium">Articles on penetration testing, web security, and defense.</p>

          <div className="grid gap-8 md:grid-cols-2">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="rounded-xl border-2 border-gray-300 bg-gray-50 p-6 hover:border-blue-400 hover:shadow-lg transition-all"
              >
                <a
                  href={`#/blog/${blog.id}`}
                  onClick={(e) => { e.preventDefault(); navigate(`blog/${blog.id}`); }}
                  className="block"
                >
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{blog.category}</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1 mb-2 hover:text-blue-700 transition-colors">
                    {blog.title}
                  </h2>
                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-2 font-medium">{blog.excerpt}</p>
                  <p className="text-xs text-gray-700 mt-3 font-medium">{blog.date} · {blog.minRead} min read</p>
                </a>
              </article>
            ))}
          </div>
        </main>
      )}

      {route === "post" && currentPost && (
        <main className="max-w-3xl mx-auto px-6 py-10">
          <a
            href="#/"
            onClick={(e) => { e.preventDefault(); navigate("blog"); }}
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 mb-6 inline-block"
          >
            ← Back to blog
          </a>
          {isAdmin && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => openEditBlogModal(currentPost.id)}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
              >
                <Pencil className="w-4 h-4" />
                Edit post
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBlog(currentPost.id)}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Delete post
              </button>
            </div>
          )}
          <article className="max-w-none">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">{currentPost.category}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1 mb-3 tracking-tight">
              {currentPost.title}
            </h1>
            <p className="text-sm text-gray-700 font-medium mb-8">
              {currentPost.date} · {currentPost.minRead} min read
            </p>
            <div className="text-gray-900 text-lg leading-relaxed whitespace-pre-line font-medium">
              {currentPost.content}
            </div>
          </article>
        </main>
      )}

      {route === "post" && !currentPost && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-gray-800 font-medium">Post not found.</p>
          <a href="#/" onClick={(e) => { e.preventDefault(); navigate("blog"); }} className="text-blue-700 font-semibold hover:underline mt-2 inline-block">Back to blog</a>
        </main>
      )}

      {route === "account" && (
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">My Account</h2>
          <div className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5 max-w-md">
            <p className="text-xs font-semibold text-gray-700 mb-1">Username</p>
            <p className="font-semibold text-gray-900">{username}</p>
            <p className="text-xs font-semibold text-gray-700 mt-3 mb-1">Role</p>
            <p className="font-semibold text-blue-800">{isAdmin ? "admin" : userRole || "user"}</p>
          </div>
        </main>
      )}

      {route === "blog_manage" && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          <a
            href="#/"
            onClick={(e) => {
              e.preventDefault();
              navigate("blog");
            }}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900 mb-6 inline-block"
          >
            ← Back to blog home
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Blog management</h1>
          <p className="text-gray-600 text-sm mb-8">
            Manage all posts here. Use <strong>Delete all</strong> to submit your lab completion to HackMe (same points as SQL lab id 1).
          </p>
          {isAdmin ? (
            blogAdminSection
          ) : (
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-6 text-amber-950">
              <p className="font-semibold mb-2">Admin access required.</p>
              <p className="text-sm mb-4">Open the admin panel, promote your account to admin, then return here.</p>
              <a
                href="#/admin-panel"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("admin-panel");
                }}
                className="inline-flex items-center gap-2 font-bold text-blue-700 hover:underline"
              >
                → Open admin panel
              </a>
            </div>
          )}
        </main>
      )}

      {route === "admin" && (
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-blue-600" />
            Admin Panel
          </h2>

          {success && (
            <div className="p-3 rounded-lg bg-green-100 border-2 border-green-500 text-green-900 text-sm font-semibold">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold">
              {error}
            </div>
          )}

          <section className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5 overflow-x-auto">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Users &amp; roles — set role next to each user</h3>
            {adminLoading ? (
              <p className="text-sm text-gray-700">Loading...</p>
            ) : (
              <table className="min-w-full text-sm text-gray-900">
                <thead>
                  <tr className="border-b-2 border-gray-400 text-xs font-semibold text-gray-800">
                    <th className="py-3 pr-4 text-left">ID</th>
                    <th className="py-3 px-4 text-left">Username</th>
                    <th className="py-3 px-4 text-left">Role</th>
                    <th className="py-3 pl-4 text-left">Upgrade / Set role</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-300 last:border-b-0">
                      <td className="py-3 pr-4 font-medium">{u.id}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{u.username}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex rounded-full border-2 border-blue-400 bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleChangeRole(u.username, "user")}
                            disabled={roleUpdating === u.username || u.role === "user"}
                            className="rounded border-2 border-gray-400 bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            User
                          </button>
                          <button
                            onClick={() => handleChangeRole(u.username, "admin")}
                            disabled={roleUpdating === u.username || u.role === "admin"}
                            className="rounded border-2 border-blue-500 bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {roleUpdating === u.username ? "..." : "Admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {blogManageLinkCard}
        </main>
      )}

      {blogModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white border-2 border-gray-300 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {blogModal.mode === "add" ? "New blog post" : "Edit blog post"}
            </h3>
            <form onSubmit={saveBlogModal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
                <input
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <input
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min read</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm"
                    value={formMinRead}
                    onChange={(e) => setFormMinRead(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Excerpt</label>
                <textarea
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm min-h-[60px]"
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Content</label>
                <textarea
                  className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm min-h-[160px] font-mono"
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBlogModal(null);
                    resetBlogForm();
                  }}
                  className="rounded-lg border-2 border-gray-400 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
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
                ? "Congratulations — the target post was removed. Points are recorded in HackMe."
                : "You already completed this lab. No additional points."}
            </p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-bold text-white"
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
};

export default Lab1App;
