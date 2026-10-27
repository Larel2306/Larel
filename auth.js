/*
 LAREL customer authentication — Supabase JS v2
 SETUP: Replace the two placeholder values below with your project's Project URL
 and publishable/anon key from Supabase Dashboard -> Project Settings -> API Keys.
 NEVER put a service_role/secret key in browser code.
*/
(() => {
  "use strict";
  const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
  const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
    !SUPABASE_URL.includes("YOUR_") && !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");

  const $ = (id) => document.getElementById(id);
  const authPage = !!$("authForm");
  let client = null;
  if (configured && window.supabase?.createClient) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  // Add a consistent account entry to existing LAREL headers without redesigning them.
  function injectHeaderAccount() {
    if (authPage) return;
    const actions = document.querySelector(".nav-actions");
    const fallbackHeader = document.querySelector(".store-header");
    const target = actions || fallbackHeader;
    if (!target || target.querySelector("[data-larel-account]")) return;
    const link = document.createElement("a");
    link.href = "auth.html";
    link.className = actions ? "nav-icon-btn" : "back-to-account";
    link.setAttribute("data-larel-account", "");
    link.title = "Login / My Account";
    link.setAttribute("aria-label", "Login or My Account");
    link.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span class="btn-text"> Login / Sign Up</span>';
    if (actions) target.insertBefore(link, target.firstChild);
    else {
      link.style.cssText = "display:inline-flex;align-items:center;gap:8px;margin-left:16px;padding:9px 13px;border:1px solid rgba(45,212,191,.35);border-radius:22px;color:#fff;font-size:12px;text-decoration:none;background:rgba(45,212,191,.08)";
      target.appendChild(link);
    }
    if (client) client.auth.getSession().then(({data}) => {
      if (data?.session) {
        link.title = "My Account";
        link.setAttribute("aria-label", "My Account");
        link.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span class="btn-text"> My Account</span>';
      }
    });
  }

  if (!authPage) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectHeaderAccount);
    else injectHeaderAccount();
    return;
  }

  $("year").textContent = new Date().getFullYear();
  const notice = $("notice");
  let mode = "signup";
  let resetMode = new URLSearchParams(location.search).get("mode") === "reset";

  function showMessage(message, kind = "error") {
    notice.textContent = message;
    notice.className = "message show " + kind;
  }
  function clearMessage() { notice.className = "message"; notice.textContent = ""; }
  function setBusy(busy, label) {
    const button = $("submitBtn");
    button.disabled = busy;
    button.innerHTML = busy ? '<i class="fa-solid fa-spinner fa-spin"></i> Please wait…' : label;
    $("googleBtn").disabled = busy;
  }
  function setMode(next) {
    mode = next;
    resetMode = false;
    clearMessage();
    $("authPanel").classList.remove("hidden");
    $("resetPanel").classList.add("hidden");
    $("signupTab").classList.toggle("active", mode === "signup");
    $("loginTab").classList.toggle("active", mode === "login");
    $("nameField").classList.toggle("hidden", mode !== "signup");
    $("confirmField").classList.toggle("hidden", mode !== "signup");
    $("termsRow").classList.toggle("hidden", mode !== "signup");
    $("loginExtras").classList.toggle("hidden", mode !== "login");
    $("confirmPassword").required = mode === "signup";
    $("fullName").required = mode === "signup";
    $("terms").required = mode === "signup";
    $("password").autocomplete = mode === "signup" ? "new-password" : "current-password";
    $("pageHeading").textContent = mode === "signup" ? "Create your account" : "Welcome back";
    $("pageSubheading").textContent = mode === "signup" ? "Join LAREL for a smoother checkout and a place to keep your orders together." : "Log in to continue shopping and access your account.";
    $("submitBtn").innerHTML = mode === "signup" ? 'Create account <i class="fa-solid fa-arrow-right"></i>' : 'Log in <i class="fa-solid fa-arrow-right"></i>';
    $("googleBtn").classList.remove("hidden");
    $("authForm").classList.remove("hidden");
    document.querySelector(".divider").classList.remove("hidden");
  }
  function showReset() {
    resetMode = true;
    clearMessage();
    $("signupTab").classList.remove("active");
    $("loginTab").classList.add("active");
    $("nameField").classList.add("hidden");
    $("confirmField").classList.add("hidden");
    $("termsRow").classList.add("hidden");
    $("loginExtras").classList.add("hidden");
    $("authForm").classList.add("hidden");
    $("googleBtn").classList.add("hidden");
    document.querySelector(".divider").classList.add("hidden");
    $("resetPanel").classList.remove("hidden");
    $("pageHeading").textContent = "Choose a new password";
    $("pageSubheading").textContent = "Set a new password for your LAREL account.";
  }
  function showAccount(user) {
    $("authPanel").classList.add("hidden");
    $("accountPanel").classList.remove("hidden");
    $("pageHeading").textContent = "Welcome to LAREL";
    $("pageSubheading").textContent = "You're signed in and ready to shop.";
    $("accountName").textContent = user.user_metadata?.full_name || user.user_metadata?.name || "You're signed in";
    $("accountEmail").textContent = user.email || "";
  }
  function showConfigError() {
    showMessage("Setup needed: open auth.js in your GitHub repository and add your Supabase Project URL and publishable (or anon) key. Then configure the Supabase redirect URLs. See the setup guide.", "error");
    $("googleBtn").disabled = true;
    $("submitBtn").disabled = true;
  }

  $("signupTab").addEventListener("click", () => setMode("signup"));
  $("loginTab").addEventListener("click", () => setMode("login"));
  $("forgotLink").addEventListener("click", async (event) => {
    event.preventDefault();
    clearMessage();
    if (!client) return showConfigError();
    const email = $("email").value.trim();
    if (!email) return showMessage("Enter your email address first, then select Forgot password.");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname + "?mode=reset"
    });
    if (error) return showMessage(error.message);
    showMessage("If an account exists for that email, a password reset link has been sent. Check your inbox.", "success");
  });

  $("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    if (!client) return showConfigError();
    const email = $("email").value.trim();
    const password = $("password").value;
    setBusy(true, "");
    try {
      if (mode === "signup") {
        if ($("fullName").value.trim().length < 2) return showMessage("Please enter your name (at least 2 characters).");
        if (password !== $("confirmPassword").value) return showMessage("Passwords do not match.");
        if (!$("terms").checked) return showMessage("Please agree to the Terms and Privacy Policy.");
        const { data, error } = await client.auth.signUp({
          email, password,
          options: {
            data: { full_name: $("fullName").value.trim() },
            emailRedirectTo: location.origin + location.pathname
          }
        });
        if (error) return showMessage(error.message);
        if (data.session && data.user) {
          showAccount(data.user);
        } else {
          setMode("login");
          showMessage("Account created. Check your email and click the confirmation link before logging in.", "success");
        }
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) return showMessage(error.message);
        if (data.user) showAccount(data.user);
      }
    } catch (error) {
      showMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false, mode === "signup" ? 'Create account <i class="fa-solid fa-arrow-right"></i>' : 'Log in <i class="fa-solid fa-arrow-right"></i>');
    }
  });

  $("googleBtn").addEventListener("click", async () => {
    clearMessage();
    if (!client) return showConfigError();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) showMessage(error.message);
  });

  $("resetForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();
    if (!client) return showConfigError();
    const password = $("newPassword").value;
    if (password.length < 8) return showMessage("Use at least 8 characters for your password.");
    const { error } = await client.auth.updateUser({ password });
    if (error) return showMessage(error.message);
    showMessage("Password updated successfully. You can now continue shopping.", "success");
    $("resetPanel").classList.add("hidden");
    $("authForm").classList.remove("hidden");
    $("googleBtn").classList.remove("hidden");
    document.querySelector(".divider").classList.remove("hidden");
    setMode("login");
  });

  $("continueBtn").addEventListener("click", () => { location.href = "Home.html"; });
  $("logoutBtn").addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    $("accountPanel").classList.add("hidden");
    $("authPanel").classList.remove("hidden");
    setMode("login");
    showMessage("You have been logged out.", "success");
  });

  if (!client) {
    setMode("signup");
    showConfigError();
  } else if (resetMode) {
    showReset();
  } else {
    setMode("signup");
    client.auth.getSession().then(({data, error}) => {
      if (error) showMessage(error.message);
      if (data?.session?.user) showAccount(data.session.user);
    });
    client.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY")) {
        if (event === "PASSWORD_RECOVERY" || resetMode) showReset();
        else showAccount(session.user);
      }
    });
  }
})();