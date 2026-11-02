/* LAREL customer signup — Supabase anonymous session + in-app confirmation code.
   The in-app code is NOT phone ownership verification. No SMS is sent.
   Enable Anonymous Sign-Ins in Supabase Auth settings before using mobile signup.
*/
(() => {
  "use strict";
  const SUPABASE_URL = "https://gghpenzosdqudtqhpekp.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LgOR6E51qGFLRcIecWqA3w_kHHoGtVa";
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
    !SUPABASE_URL.includes("YOUR_") && !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");
  const $ = id => document.getElementById(id);
  const authPage = !!$("phoneSignupForm") || !!$("authForm");
  let client = null;
  if (configured && window.supabase?.createClient) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  const notify = (message, type="success") => {
    if (typeof window.larelNotify === "function") window.larelNotify(message, type);
    else {
      const node = $("notice");
      if (node) { node.textContent = message; node.className = "message show " + type; }
    }
  };
  function injectHeaderAccount() {
    if (authPage) return;
    const actions = document.querySelector(".nav-actions");
    const target = actions || document.querySelector(".store-header");
    if (!target || target.querySelector("[data-larel-account]")) return;
    const link = document.createElement("a");
    link.href = "auth.html";
    link.className = actions ? "nav-icon-btn" : "back-to-account";
    link.dataset.larelAccount = "";
    link.title = "Sign Up / My Account";
    link.setAttribute("aria-label", "Sign Up or My Account");
    link.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span class="btn-text"> Sign Up</span>';
    if (actions) target.insertBefore(link, target.firstChild);
    else { link.style.cssText = "display:inline-flex;align-items:center;gap:8px;margin-left:16px;padding:9px 13px;border:1px solid rgba(45,212,191,.35);border-radius:22px;color:#fff;font-size:12px;text-decoration:none;background:rgba(45,212,191,.08)"; target.appendChild(link); }
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

  $("year") && ($("year").textContent = new Date().getFullYear());
  const phoneForm = $("phoneSignupForm");
  const verifyForm = $("phoneVerifyForm");
  let pendingPhone = "";
  let pendingCode = "";
  let codeExpiresAt = 0;

  function showAccount(user) {
    $("authPanel").classList.add("hidden");
    $("accountPanel").classList.remove("hidden");
    $("pageHeading").textContent = "Welcome to LAREL";
    $("pageSubheading").textContent = "Your account is ready. Happy shopping!";
    const phone = user.user_metadata?.mobile_number || "";
    $("accountIdentity").textContent = user.email || phone || "LAREL member";
  }
  function configError() {
    notify("Authentication is not configured. Please contact LAREL support.", "error");
    $("sendOtpBtn").disabled = true;

  }
  function createCode() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return String(values[0] % 1000000).padStart(6, "0");
  }
  phoneForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return configError();
    let phone = $("phoneNumber").value.replace(/[\s()-]/g, "");
    if (/^0\d{10}$/.test(phone)) phone = "+91" + phone.slice(1);
    else if (/^\d{10}$/.test(phone)) phone = "+91" + phone;
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return notify("Enter a valid mobile number, e.g. +91 98765 43210.", "error");

    pendingPhone = phone;
    pendingCode = createCode();
    codeExpiresAt = Date.now() + 5 * 60 * 1000;
    phoneForm.classList.add("hidden");
    verifyForm.classList.remove("hidden");
    $("verifyPhoneLabel").textContent = "Confirmation code for " + phone;
    $("phoneOtp").value = "";
    $("phoneOtp").focus();
    notify("Your LAREL in-app OTP is " + pendingCode + ". It expires in 5 minutes. No SMS was sent.", "success");
  });

  verifyForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client || !pendingCode) return notify("Please request a new code first.", "error");
    const entered = $("phoneOtp").value.trim();
    if (Date.now() > codeExpiresAt) {
      pendingCode = "";
      verifyForm.classList.add("hidden");
      phoneForm.classList.remove("hidden");
      return notify("This code has expired. Please generate a new one.", "error");
    }
    if (entered !== pendingCode) return notify("Incorrect code. Please check the in-app notification and try again.", "error");

    const button = $("verifyOtpBtn");
    button.disabled = true;
    button.textContent = "Creating account…";
    try {
      // Anonymous Supabase Auth provides a persistent authenticated session without collecting email/password.
      const { data, error } = await client.auth.signInAnonymously();
      if (error) throw error;
      const { data: updated, error: updateError } = await client.auth.updateUser({
        data: { mobile_number: pendingPhone, phone_verified: false, signup_method: "in_app_code" }
      });
      if (updateError) throw updateError;
      pendingCode = "";
      showAccount(updated?.user || data.user);
      notify("Your LAREL account has been created successfully!", "success");
    } catch (error) {
      const message = /anonymous|disabled/i.test(error.message || "")
        ? "Mobile signup setup needed: enable Anonymous Sign-Ins in Supabase Dashboard → Authentication → Sign In / Providers → Anonymous."
        : (error.message || "Could not create your account. Please try again.");
      notify(message, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Verify & Create Account";
    }
  });

  $("changePhoneBtn").addEventListener("click", () => {
    pendingCode = "";
    pendingPhone = "";
    verifyForm.classList.add("hidden");
    phoneForm.classList.remove("hidden");
  });
  $("resendOtpBtn").addEventListener("click", () => {
    if (!pendingPhone) return;
    pendingCode = createCode();
    codeExpiresAt = Date.now() + 5 * 60 * 1000;
    $("phoneOtp").value = "";
    notify("Your new LAREL in-app OTP is " + pendingCode + ". It expires in 5 minutes. No SMS was sent.", "success");
  });

  $("googleBtn").addEventListener("click", async () => {
    if (!client) return configError();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: location.origin + location.pathname }
    });
    if (error) notify(error.message, "error");
  });
  $("continueBtn").addEventListener("click", () => { location.href = "index.html"; });
  $("logoutBtn").addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    $("accountPanel").classList.add("hidden");
    $("authPanel").classList.remove("hidden");
    phoneForm.classList.remove("hidden");
    verifyForm.classList.add("hidden");
    notify("You have been logged out.", "success");
  });

  if (!client) configError();
  else {
    client.auth.getSession().then(({data, error}) => {
      if (error) notify(error.message, "error");
      if (data?.session?.user) showAccount(data.session.user);
    });
    client.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) showAccount(session.user);
    });
  }
})();