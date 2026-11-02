/* LAREL customer accounts — Supabase persistent session + in-app confirmation code.
   The in-app code is not phone ownership verification. No SMS is sent.
   Enable Anonymous Sign-Ins in Supabase Auth settings.
*/
(() => {
  "use strict";
  const SUPABASE_URL = "https://gghpenzosdqudtqhpekp.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_LgOR6E51qGFLRcIecWqA3w_kHHoGtVa";
  const $ = id => document.getElementById(id);
  const authPage = !!$("phoneSignupForm");
  const accountPage = !!$("larelAccountPage");
  let client = null;

  if (window.supabase?.createClient) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  const notify = (message, type = "success") => {
    if (typeof window.larelNotify === "function") window.larelNotify(message, type);
    else {
      const node = $("notice");
      if (node) { node.textContent = message; node.className = "message show " + type; }
      else console[type === "error" ? "error" : "log"](message);
    }
  };

  const customerName = user => user?.user_metadata?.full_name ||
    user?.user_metadata?.name || "Customer";
  const customerPhone = user => user?.user_metadata?.mobile_number || "";

  async function updateAccountLink() {
    const link = document.querySelector("[data-larel-account]");
    let user = null;
    if (client) {
      const { data } = await client.auth.getSession();
      user = data?.session?.user || null;
    }
    window.larelCustomerProfile = user ? {
      id: user.id,
      name: customerName(user),
      phone: customerPhone(user)
    } : null;
    window.dispatchEvent(new CustomEvent("larel:profile", { detail: window.larelCustomerProfile }));
    if (!link) return;
    link.href = user ? "Account.html" : "auth.html";
    link.title = user ? "My Account" : "Create Account";
    link.setAttribute("aria-label", user ? "My Account" : "Create Account");
    const label = user ? customerName(user) : "Account";
    link.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span class="btn-text"></span>';
    const span = link.querySelector(".btn-text");
    if (span) span.textContent = " " + label;
  }

  function injectHeaderAccount() {
    if (authPage || accountPage) return;
    if (document.querySelector("[data-larel-account]")) return;
    const actions = document.querySelector(".nav-actions");
    const storeHeader = document.querySelector(".store-header");
    const target = actions || storeHeader;
    if (!target) {
      const floating = document.createElement("a");
      floating.href = "auth.html";
      floating.dataset.larelAccount = "";
      floating.style.cssText = "position:fixed;top:18px;right:18px;z-index:9999;display:inline-flex;align-items:center;gap:8px;padding:10px 15px;border:1px solid rgba(0,210,255,.4);border-radius:24px;background:rgba(4,13,23,.94);color:#fff;text-decoration:none;font:700 12px Plus Jakarta Sans,Arial,sans-serif;box-shadow:0 6px 24px #0006";
      floating.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span class="btn-text"> Account</span>';
      document.body.appendChild(floating);
      updateAccountLink();
      return;
    }
    const link = document.createElement("a");
    link.href = "auth.html";
    link.dataset.larelAccount = "";
    link.title = "Create Account";
    link.setAttribute("aria-label", "Create Account");
    link.innerHTML = '<i class="fa-regular fa-user" aria-hidden="true"></i><span class="btn-text"> Account</span>';
    if (actions) {
      link.className = "nav-icon-btn";
      target.appendChild(link); // Last item: far right of the header actions.
    } else {
      link.className = "back-to-account";
      link.style.cssText = "display:inline-flex;align-items:center;gap:8px;margin-left:auto;padding:9px 13px;border:1px solid rgba(0,210,255,.35);border-radius:22px;color:#fff;font-size:12px;text-decoration:none;background:rgba(0,210,255,.08)";
      target.appendChild(link);
    }
    updateAccountLink();
  }

  if (!authPage && !accountPage) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", injectHeaderAccount);
    else injectHeaderAccount();
    if (client) client.auth.onAuthStateChange(() => updateAccountLink());
    return;
  }

  if (!client) {
    notify("Account service could not load. Please refresh the page.", "error");
    return;
  }

  if (authPage) {
    const phoneForm = $("phoneSignupForm");
    const verifyForm = $("phoneVerifyForm");
    let pendingPhone = "";
    let pendingName = "";
    let pendingCode = "";
    let codeExpiresAt = 0;

    function showAccount(user) {
      $("authPanel").classList.add("hidden");
      $("accountPanel").classList.remove("hidden");
      $("pageHeading").textContent = "Welcome to LAREL";
      $("pageSubheading").textContent = "Your account is ready. Happy shopping!";
      $("accountIdentity").textContent = customerName(user) + (customerPhone(user) ? " • " + customerPhone(user) : "");
    }

    function createCode() {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      return String(values[0] % 1000000).padStart(6, "0");
    }

    phoneForm.addEventListener("submit", event => {
      event.preventDefault();
      pendingName = $("customerName").value.trim().replace(/\s+/g, " ");
      let phone = $("phoneNumber").value.replace(/[\s()-]/g, "");
      if (!pendingName || pendingName.length < 2) return notify("Please enter your name.", "error");
      if (/^0\d{10}$/.test(phone)) phone = "+91" + phone.slice(1);
      else if (/^\d{10}$/.test(phone)) phone = "+91" + phone;
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) return notify("Enter a valid mobile number, e.g. +91 98765 43210.", "error");

      pendingPhone = phone;
      pendingCode = createCode();
      codeExpiresAt = Date.now() + 5 * 60 * 1000;
      phoneForm.classList.add("hidden");
      verifyForm.classList.remove("hidden");
      $("verifyPhoneLabel").textContent = "In-app confirmation code for " + phone;
      $("phoneOtp").value = "";
      $("phoneOtp").focus();
      notify("Your LAREL in-app OTP is " + pendingCode + ". It expires in 5 minutes. No SMS was sent.", "success");
    });

    verifyForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (!pendingCode) return notify("Please request a new code first.", "error");
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
        const { data, error } = await client.auth.signInAnonymously();
        if (error) throw error;
        const { data: updated, error: updateError } = await client.auth.updateUser({
          data: {
            full_name: pendingName,
            name: pendingName,
            mobile_number: pendingPhone,
            phone_verified: false,
            signup_method: "in_app_code"
          }
        });
        if (updateError) throw updateError;
        try {
          await client.from("profiles").upsert({
            id: (updated?.user || data.user).id,
            full_name: pendingName,
            phone: pendingPhone
          }, { onConflict: "id" });
        } catch (profileError) {
          console.warn("LAREL profile sync skipped:", profileError.message);
        }
        pendingCode = "";
        showAccount(updated?.user || data.user);
        notify("Welcome to LAREL, " + pendingName + "! Your account has been created.", "success");
      } catch (error) {
        const message = /anonymous|disabled/i.test(error.message || "")
          ? "Enable Anonymous Sign-Ins in Supabase Dashboard → Authentication → Sign In / Providers → Anonymous."
          : (error.message || "Could not create your account. Please try again.");
        notify(message, "error");
      } finally {
        button.disabled = false;
        button.textContent = "Verify & Create Account";
      }
    });

    $("changePhoneBtn").addEventListener("click", () => {
      pendingCode = "";
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
    $("continueBtn").addEventListener("click", () => { location.href = "index.html"; });
    $("logoutBtn").addEventListener("click", async () => {
      await client.auth.signOut();
      $("accountPanel").classList.add("hidden");
      $("authPanel").classList.remove("hidden");
      phoneForm.classList.remove("hidden");
      verifyForm.classList.add("hidden");
      notify("You have been logged out.", "success");
    });

    client.auth.getSession().then(({ data, error }) => {
      if (error) notify(error.message, "error");
      if (data?.session?.user) showAccount(data.session.user);
    });
    client.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED")) {
        showAccount(session.user);
      }
    });
    return;
  }

  // Signed-in customer dashboard.
  async function loadCustomerAccount() {
    const { data, error } = await client.auth.getSession();
    const user = data?.session?.user;
    if (error || !user) {
      location.replace("auth.html");
      return;
    }
    const name = customerName(user);
    $("customerWelcome").textContent = "Hello, " + name;
    $("profileName").textContent = name;
    $("profilePhone").textContent = customerPhone(user) || "Not added";
    $("profileMethod").textContent = user.user_metadata?.signup_method === "in_app_code" ? "Mobile number signup" : "LAREL account";
    if ($("sidebarCustomerName")) $("sidebarCustomerName").textContent = name;
    if ($("sidebarCustomerPhone")) $("sidebarCustomerPhone").textContent = customerPhone(user) || "Mobile number not added";
    if ($("overviewName")) $("overviewName").textContent = name;
    if ($("overviewPhone")) $("overviewPhone").textContent = customerPhone(user) || "Not added";
    if ($("memberSince")) $("memberSince").textContent = user.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", {month:"short",year:"numeric"}) : "—";
    try {
      const { data: orders, error: ordersError } = await client.from("orders").select("*").eq("phone", customerPhone(user).replace(/\D/g, "").slice(-10));
      if (ordersError) throw ordersError;
      const list = $("ordersList");
      if (!orders || !orders.length) {
        list.innerHTML = '<div class="empty-orders"><i class="fa-solid fa-box-open"></i><h3>No orders yet</h3><p>Your orders will appear here after you place an order.</p><a href="Shop.html">Explore Shop</a></div>';
        return;
      }
      list.replaceChildren();
      orders.forEach(order => {
        const card = document.createElement("article");
        card.className = "order-card";
        const id = order.order_number || order.order_id || order.id || "Order";
        const status = order.status || order.order_status || "Processing";
        const amount = order.total_amount ?? order.total ?? order.amount;
        const date = order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN") : "";
        const heading = document.createElement("h3");
        heading.textContent = "Order #" + id;
        const details = document.createElement("p");
        details.textContent = [date, status, amount != null ? "₹" + amount : ""].filter(Boolean).join(" • ");
        card.append(heading, details);
        list.append(card);
      });
    } catch (err) {
      $("ordersList").innerHTML = '<div class="empty-orders"><i class="fa-solid fa-box-open"></i><h3>Orders will appear here</h3><p>Your account is ready. Order history will show here once order records are linked to your customer account.</p><a href="Shop.html">Explore Shop</a></div>';
      console.warn("LAREL order history could not be loaded:", err.message);
    }
  }

  $("accountLogoutBtn").addEventListener("click", async () => {
    await client.auth.signOut();
    location.href = "auth.html";
  });
  loadCustomerAccount();
})();