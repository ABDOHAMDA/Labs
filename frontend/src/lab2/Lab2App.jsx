import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { Lock, User, Shield, Mail, UserCog, LogOut } from "lucide-react";

// Prefer proxy; fallback to direct port if proxy fails
const API_BASE = '/api/lab2';
const API_FALLBACK = `${window.location.protocol}//${window.location.hostname}:3001/api/lab2`;

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

const FALLBACK_FLAG = 'FLAG{IDOR_ACCESS_CONTROL_BYPASS}';

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

const FALLBACK_PROFILES = Object.fromEntries(
  FALLBACK_USERS.map((u) => [u.id, { ...u, flag: u.id === 10 ? FALLBACK_FLAG : null }])
);

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
  const [view, setView] = useState("loading");
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("user@gmail.com");
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const urlUserid = searchParams.get("userid");
  const urlEmail = searchParams.get("email");
  const profileUserid = searchParams.get("profile");

  const [accountUserid, setAccountUserid] = useState(urlUserid ? parseInt(urlUserid, 10) : null);
  const [accountEmail, setAccountEmail] = useState(urlEmail || "");
  const [updateEmailInput, setUpdateEmailInput] = useState("");
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState(false);
  const [profile, setProfile] = useState(null);
  const [route, setRoute] = useState(profileUserid ? "profile" : urlUserid ? "account" : "home");
  const { postId: urlPostId } = useParams();
  const currentPost = urlPostId ? BLOGS.find((b) => String(b.id) === String(urlPostId)) : null;

  // Auto-login and go straight to blog (no login page). لو الـ URL فيه userid أو profile من قبل، متغيّرش الرابط عشان الصفحة الجديدة تفتح صح.
  useEffect(() => {
    if (view !== "loading") return;
    fetch(`${API_BASE}/login.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username: "user", password: "password", email: "user@gmail.com" }),
    })
      .then((r) => r.text())
      .then((text) => {
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (_) {}
        const uid = data.success && data.user ? data.user.id : 5;
        const uEmail = data.success && data.user ? (data.user.email || "user@gmail.com") : "user@gmail.com";
        setUserId(uid);
        setUserRole(data.success && data.user ? (data.user.role || "user") : "user");
        setEmail(uEmail);

        const params = new URLSearchParams(window.location.search);
        const hasUserid = params.has("userid");
        const hasProfile = params.has("profile");
        if (hasUserid || hasProfile) {
          setAccountUserid(hasUserid ? parseInt(params.get("userid"), 10) : uid);
          setAccountEmail(params.get("email") || uEmail);
          setView("logged");
          setRoute(hasProfile ? "profile" : "account");
        } else {
          setAccountUserid(uid);
          setAccountEmail(uEmail);
          setView("logged");
          setRoute("home");
        }
      })
      .catch(() => {
        const params = new URLSearchParams(window.location.search);
        const hasUserid = params.has("userid");
        const hasProfile = params.has("profile");
        setUserId(5);
        setAccountUserid(hasUserid ? parseInt(params.get("userid"), 10) : 5);
        setAccountEmail(params.get("email") || "user@gmail.com");
        setView("logged");
        if (hasUserid || hasProfile) {
          setRoute(hasProfile ? "profile" : "account");
        } else {
          setRoute("home");
        }
      });
  }, [view]);

  useEffect(() => {
    if (urlUserid) setAccountUserid(parseInt(urlUserid, 10));
    if (urlEmail !== null) setAccountEmail(urlEmail || "");
  }, [urlUserid, urlEmail]);

  useEffect(() => {
    if (profileUserid) setRoute("profile");
    else if (urlUserid && view === "logged") setRoute("account");
  }, [profileUserid, urlUserid, view]);

  useEffect(() => {
    if (view !== "logged" || !accountUserid || route !== "account") return;
    fetch(`${API_BASE}/get_profile.php?userid=${accountUserid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          setProfile(d.user);
          setUpdateEmailInput(d.user.email || "");
        }
      })
      .catch(console.error);
  }, [view, accountUserid, route]);

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

  const handleUpdateEmail = (e) => {
    e.preventDefault();
    const uid = accountUserid ?? userId;
    if (!uid) return;
    const emailVal = (updateEmailInput || "").trim() || "user@gmail.com";
    setError("");
    setAccountEmail(emailVal);
    setSearchParams({ userid: String(uid), email: emailVal });
  };

  const handleLogout = () => {
    setView("loading");
    setUsername("user");
    setPassword("");
    setEmail("user@gmail.com");
    setUserId(null);
    setUserRole("user");
    setAccountUserid(null);
    setAccountEmail("");
    setProfile(null);
    setSearchParams({});
    setRoute("home");
  };

  const showAdminView = view === "logged" && route === "account" && accountUserid === 1;
  const isAccountPage = route === "account" || route === "profile";
  const hasSubmittedEmail = !!urlUserid && urlEmail !== null;

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b-2 border-gray-300 bg-white sticky top-0 z-10 shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/lab/2" onClick={() => setRoute("home")} className="text-lg font-bold text-gray-900 hover:text-emerald-700">
            Red & Blue Blog
          </Link>
          <nav className="flex items-center gap-3">
            <Link to="/lab/2" onClick={() => { setRoute("account"); setSearchParams({}); }} className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200">
              <User className="w-4 h-4" /> My Account
            </Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-1 rounded-lg border-2 border-gray-400 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:border-red-500">
              Logout
            </button>
          </nav>
        </div>
      </header>

      {!urlPostId && showAdminView && isAccountPage && !profileUserid && (
        <main className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><UserCog className="w-6 h-6 text-emerald-600" /> Users</h2>
          <p className="text-sm text-gray-600 mb-4">Click a user to view their profile.</p>
          {usersError ? (
            <p className="text-red-600 py-4">Failed to load users. Ensure userid=1 is in the URL and the API is running.</p>
          ) : users.length === 0 ? (
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
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-300 hover:bg-gray-100">
                      <td className="py-3 px-4 font-medium">{u.id}</td>
                      <td className="py-3 px-4 font-semibold">{u.username}</td>
                      <td className="py-3 px-4">{u.email}</td>
                      <td className="py-3 px-4"><span className="rounded-full border-2 border-emerald-400 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">{u.role}</span></td>
                      <td className="py-3 px-4">
                        <Link to={`/lab/2?userid=1&email=${encodeURIComponent(accountEmail)}&profile=${u.id}`} onClick={() => setRoute("profile")} className="text-emerald-700 font-semibold hover:underline">
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

      {!urlPostId && isAccountPage && !profileUserid && !showAdminView && (
        <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">My Account</h2>
          {!hasSubmittedEmail ? (
            <p className="text-sm text-gray-600">Enter your email and click Update. Your <strong>userid</strong> and <strong>email</strong> will then appear in the URL.</p>
          ) : (
            <p className="text-xs text-gray-600">userid and email are in the URL. You can change the userid in the address bar to view other accounts.</p>
          )}
          <form onSubmit={handleUpdateEmail} className="rounded-xl border-2 border-gray-300 bg-gray-50 p-5">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Update email</label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 rounded-lg bg-gray-100 border-2 border-gray-400 px-3 py-2 text-sm" value={updateEmailInput} onChange={(e) => setUpdateEmailInput(e.target.value)} placeholder="Enter your email" required />
              <button type="submit" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold text-white">
                Update
              </button>
            </div>
          </form>
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
              {profile.flag && (
                <div className="rounded-xl border-2 border-green-500 bg-green-100 p-5">
                  <p className="text-xs font-semibold text-green-900 uppercase tracking-wider mb-2">Flag</p>
                  <code className="text-lg font-bold text-green-900 select-all">{profile.flag}</code>
                </div>
              )}
            </>
          )}
          {error && <div className="p-3 rounded-lg bg-red-100 border-2 border-red-500 text-red-900 text-sm font-semibold">{error}</div>}
          {success && <div className="p-3 rounded-lg bg-green-100 border-2 border-green-500 text-green-900 text-sm font-semibold">{success}</div>}
        </main>
      )}

      {!urlPostId && profileUserid && route === "profile" && (
        <ProfileView userid={profileUserid} onBack={() => { setRoute("account"); setSearchParams({ userid: String(accountUserid ?? userId), email: accountEmail }); }} />
      )}

      {urlPostId && (
        <main className="max-w-3xl mx-auto px-6 py-10">
          <Link to="/lab/2" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 mb-6 inline-block">← Back to blog</Link>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Red Team & Blue Team Blog</h1>
          <p className="text-gray-800 mb-10 font-medium">Blackbox, Whitebox, Graybox and more.</p>
          <div className="grid gap-8 md:grid-cols-2">
            {BLOGS.map((blog) => (
              <article key={blog.id} className="rounded-xl border-2 border-gray-300 bg-gray-50 p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">{blog.category}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-1 mb-2">{blog.title}</h2>
                <p className="text-gray-800 text-sm leading-relaxed line-clamp-2 font-medium">{blog.excerpt}</p>
                <p className="text-xs text-gray-700 mt-3 font-medium">{blog.date} · {blog.minRead} min read</p>
                <Link to={`/lab/2/post/${blog.id}`} className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline">
                  Read more
                </Link>
              </article>
            ))}
          </div>
        </main>
      )}
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
      {profile.flag && (
        <div className="rounded-xl border-2 border-green-500 bg-green-100 p-5">
          <p className="text-xs font-semibold text-green-900 uppercase tracking-wider mb-2">Flag</p>
          <code className="text-lg font-bold text-green-900 select-all">{profile.flag}</code>
        </div>
      )}
    </main>
  );
}

export default Lab2App;
