import React, { useState, useEffect } from "react";
import {
  Lock,
  User,
  Shield,
  LogOut,
  UserCog,
} from "lucide-react";
import { reportLabObjective } from "./src/labProgress";

const LAB_FLAG = "FLAG{UNPROTECTED_ADMIN_PANEL}";

const API_URL = "http://localhost:3001";

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
  if (raw.startsWith("blog/")) {
    const id = raw.slice(5).split("/")[0];
    return { route: "post", postId: id };
  }
  return { route: "home" };
}

const AccessControlLabApp = () => {
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
          reportLabObjective("access_control_admin", { username: username || "guest" });
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
    if (username && userRole === "admin") {
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
          prev.map((u) => (u.username === targetUsername ? { ...u, role: newRole } : u))
        );
        if (targetUsername === username) {
          setUserRole(newRole);
          if (newRole === "admin") {
            setSuccess("You are now an admin.");
            reportLabObjective("access_control_admin", { username: targetUsername });
          }
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

  const currentPost = postId ? BLOGS.find((b) => String(b.id) === String(postId)) : null;

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
          <nav className="flex items-center gap-3">
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
            {BLOGS.map((blog) => (
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
            <p className="font-semibold text-blue-800">{userRole}</p>
          </div>
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

          {userRole === "admin" && (
            <div className="rounded-xl border-2 border-green-500 bg-green-100 p-5 mt-6">
              <p className="text-xs font-semibold text-green-900 uppercase tracking-wider mb-2">Flag</p>
              <code className="text-lg font-bold text-green-900 select-all">{LAB_FLAG}</code>
            </div>
          )}
        </main>
      )}
    </div>
  );
};

export default AccessControlLabApp;
