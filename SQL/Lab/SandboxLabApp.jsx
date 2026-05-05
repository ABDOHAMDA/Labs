import React, { useState, useEffect, useRef } from "react";
import { User, LogOut, X, CheckCircle2, ArrowLeft } from "lucide-react";

const LAB_FLAG = "FLAG{AUTH_BYPASS_123}";
const HACKME_API_BASE =
  window.location.protocol + "//" + window.location.hostname + "/HackMe/server/controllers/labs";
const API_URL = "http://localhost:3000";

// Luxury watch store products with high-quality images
const WATCHES = [
  {
    id: 1,
    name: "Chronos Elite",
    price: "$2,450",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    name: "Apex Heritage",
    price: "$3,200",
    image: "https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    name: "Onyx Classic",
    price: "$1,890",
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "Nova Sport",
    price: "$2,100",
    image: "https://images.unsplash.com/photo-1614164185126-3b2c94b43b92?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "Royal Sapphire",
    price: "$4,500",
    image: "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    name: "Eclipse Minimal",
    price: "$1,650",
    image: "https://images.unsplash.com/photo-1585123334904-845d60e97b29?w=400&h=400&fit=crop",
  },
];

const SandboxLabApp = () => {
  const [accessStatus, setAccessStatus] = useState("checking");
  const [labParams, setLabParams] = useState({
    labId: null,
    token: null,
    userId: null,
    deviceBind: "",
    machineMac: "",
    clientLocalIp: "",
  });
  const [view, setView] = useState("home"); // 'home' | 'signin' | 'profile' (when logged in)
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [popup, setPopup] = useState(null); // { type: 'solved' | 'already_solved' }

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

  const submitLabSolved = async () => {
    const { labId, userId, token, deviceBind, machineMac, clientLocalIp } = labParams;
    if (!labId || !userId) return;
    try {
      const res = await fetch(`${HACKME_API_BASE}/labs_api/lab_solved.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lab_id: Number(labId),
          token: token || "",
          device_bind: deviceBind || "",
          mac_address: machineMac || "",
          client_local_ip: clientLocalIp || "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      const msg = String(data?.message || "");
      if (data.success || msg === "LAB_ALREADY_SOLVED") {
        const isFirstTime = msg === "LAB_SOLVED";
        setPopup({ type: isFirstTime ? "solved" : "already_solved" });
        if (window.opener) {
          window.opener.postMessage({ type: "LAB_SOLVED", labId }, "*");
        }
      }
    } catch (_) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const un = usernameRef.current?.value ?? username;
    const pw = passwordRef.current?.value ?? password;
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: un, password: pw }),
      });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError("Invalid response from server.");
        setLoading(false);
        return;
      }
      if (data.success) {
        setUsername(un);
        setPassword("");
        if (usernameRef.current) usernameRef.current.value = "";
        if (passwordRef.current) passwordRef.current.value = "";
        setView("home");
        setIsLoggedIn(true);
        submitLabSolved();
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setView("home");
    setIsLoggedIn(false);
    setUsername("");
    setPassword("");
  };

  const closePopup = () => setPopup(null);

  // Loading state
  if (accessStatus === "checking") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-stone-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (accessStatus === "denied") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xl">
          <div className="h-14 w-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-xl font-semibold text-stone-800 mb-2">Access Denied</h1>
          <p className="text-sm text-stone-500">
            This lab can only be opened from the Start Lab button in HackMe.
          </p>
        </div>
      </div>
    );
  }

  // Header component (shown when logged in)
  const Header = () => (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-serif font-semibold text-stone-800 tracking-wide">
          Luxe Horology
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("profile")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors"
          >
            <User className="w-4 h-4" />
            My Account
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </div>
    </header>
  );

  // Solved popup modal
  const SolvedPopup = () => {
    if (!popup) return null;
    const isFirstTime = popup.type === "solved";
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-8 text-center animate-popup-in">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isFirstTime ? "bg-emerald-100" : "bg-amber-100"
          }`}>
            <CheckCircle2 className={`w-10 h-10 ${
              isFirstTime ? "text-emerald-600" : "text-amber-600"
            }`} />
          </div>
          <h3 className="text-xl font-semibold text-stone-800 mb-2">
            {isFirstTime ? "You solved the lab!" : "Already solved"}
          </h3>
          <p className="text-sm text-stone-500 mb-6">
            {isFirstTime
              ? "Congratulations! You've successfully completed this lab."
              : "You've solved this lab before. No additional points awarded."}
          </p>
          <button
            onClick={closePopup}
            className="w-full rounded-lg bg-stone-900 hover:bg-stone-800 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    );
  };

  // Home page - watch store
  const HomePage = () => (
    <main className="min-h-screen bg-stone-50">
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <p className="text-sm font-medium text-amber-600 tracking-widest uppercase mb-2">
            Luxury Timepieces
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-stone-800 mb-4">
            Crafted for Excellence
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto">
            Discover our collection of precision-crafted watches, designed for those who appreciate timeless elegance.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {WATCHES.map((watch) => (
            <div
              key={watch.id}
              className="group rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-square overflow-hidden bg-stone-100">
                <img
                  src={watch.image}
                  alt={watch.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-800">{watch.name}</h3>
                <p className="text-amber-600 font-medium mt-1">{watch.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );

  // Profile page
  const ProfilePage = () => (
    <main className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-stone-100 to-stone-50" />
          <div className="px-6 pb-8 -mt-12">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-amber-100 flex items-center justify-center mx-auto shadow-lg">
              <User className="w-12 h-12 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-stone-800 text-center mt-4">
              {username || "User"}
            </h2>
            <p className="text-sm text-stone-500 text-center">Member</p>
            <div className="mt-8 space-y-4">
              <div className="flex justify-between py-3 border-b border-stone-100">
                <span className="text-stone-500">Username</span>
                <span className="font-medium text-stone-800">{username || "—"}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-stone-100">
                <span className="text-stone-500">Account type</span>
                <span className="font-medium text-stone-800">Standard</span>
              </div>
            </div>
            <button
              onClick={() => setView("home")}
              className="mt-6 w-full rounded-lg border border-stone-200 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Back to Store
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  // Sign In page - inline to avoid focus loss (no inner component re-creation)
  if (!isLoggedIn && view === "signin") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => setView("home")}
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="rounded-2xl border border-stone-200 bg-white shadow-xl p-8">
            <h2 className="text-xl font-semibold text-stone-800 mb-6">Sign In</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Username</label>
                <input
                  ref={usernameRef}
                  type="text"
                  autoComplete="username"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  defaultValue={username}
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Password</label>
                <input
                  ref={passwordRef}
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  defaultValue=""
                  placeholder="Enter your password"
                />
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-stone-900 hover:bg-stone-800 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Home when not logged in - store with Sign In button
  if (!isLoggedIn && view === "home") {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="border-b border-stone-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-serif font-semibold text-stone-800 tracking-wide">
              Luxe Horology
            </h1>
            <button
              onClick={() => setView("signin")}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-colors"
            >
              <User className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
        <main className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto text-center mb-12">
            <p className="text-sm font-medium text-amber-600 tracking-widest uppercase mb-2">
              Luxury Timepieces
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-stone-800 mb-4">
              Crafted for Excellence
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto mb-6">
              Discover our collection of precision-crafted watches. Sign in to explore exclusive offers.
            </p>
            <button
              onClick={() => setView("signin")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors"
            >
              <User className="w-4 h-4" />
              Sign In to Continue
            </button>
          </div>
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {WATCHES.map((watch) => (
              <div
                key={watch.id}
                className="group rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden bg-stone-100">
                  <img
                    src={watch.image}
                    alt={watch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-800">{watch.name}</h3>
                  <p className="text-amber-600 font-medium mt-1">{watch.price}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Logged in: home or profile
  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      {view === "home" && <HomePage />}
      {view === "profile" && <ProfilePage />}
      <SolvedPopup />
    </div>
  );
};

export default SandboxLabApp;
