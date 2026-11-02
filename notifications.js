/* LAREL — site-wide premium notifications */
(() => {
  "use strict";
  if (window.__larelNotificationsReady) return;
  window.__larelNotificationsReady = true;

  const style = document.createElement("style");
  style.textContent = `
    #larel-notification-region{position:fixed;right:22px;bottom:22px;z-index:2147483000;display:flex;flex-direction:column;gap:10px;width:min(390px,calc(100vw - 28px));pointer-events:none}
    .larel-notification{display:grid;grid-template-columns:38px minmax(0,1fr) 28px;align-items:center;gap:11px;padding:13px 14px;border:1px solid rgba(0,210,255,.28);border-radius:16px;background:linear-gradient(135deg,rgba(8,20,31,.97),rgba(5,11,20,.97));color:#f8fafc;box-shadow:0 18px 50px rgba(0,0,0,.48),0 0 24px rgba(0,210,255,.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);font:600 13px/1.5 'Plus Jakarta Sans',Arial,sans-serif;opacity:0;transform:translate3d(0,14px,0) scale(.98);transition:opacity .24s ease,transform .24s ease;pointer-events:auto;overflow:hidden}
    .larel-notification::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:0 4px 4px 0;background:#00d2ff}
    .larel-notification.is-visible{opacity:1;transform:translate3d(0,0,0) scale(1)}
    .larel-notification-icon{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:rgba(0,210,255,.12);color:#00d2ff;font-size:16px}
    .larel-notification-message{overflow-wrap:anywhere}
    .larel-notification-close{border:0;background:transparent;color:#8fa4b5;font-size:19px;cursor:pointer;padding:3px;line-height:1}
    .larel-notification-close:hover{color:#fff}
    .larel-notification.success{border-color:rgba(34,211,166,.35)}
    .larel-notification.success::before,.larel-notification.success .larel-notification-icon{background:rgba(34,211,166,.13);color:#34d3a5}
    .larel-notification.error{border-color:rgba(251,113,133,.4)}
    .larel-notification.error::before,.larel-notification.error .larel-notification-icon{background:rgba(251,113,133,.13);color:#fb7185}
    .larel-notification.warning{border-color:rgba(250,204,21,.35)}
    .larel-notification.warning::before,.larel-notification.warning .larel-notification-icon{background:rgba(250,204,21,.13);color:#facc15}
    @media(max-width:600px){#larel-notification-region{right:14px;bottom:14px;width:calc(100vw - 28px)}.larel-notification{padding:12px;font-size:12px}}
    @media(prefers-reduced-motion:reduce){.larel-notification{transition:none}}
  `;
  document.head.appendChild(style);

  function region() {
    let node = document.getElementById("larel-notification-region");
    if (!node) {
      node = document.createElement("div");
      node.id = "larel-notification-region";
      node.setAttribute("aria-live", "polite");
      node.setAttribute("aria-atomic", "false");
      document.body.appendChild(node);
    }
    return node;
  }

  function notify(message, type) {
    const text = String(message == null ? "" : message);
    const inferred = type || (/success|added|saved|updated|placed|complete|submitted|ho gaya|ho gaya!/i.test(text) ? "success" : (/warning|please select|pahle|caution/i.test(text) ? "warning" : "error"));
    const icons = {success:"✓",error:"!",warning:"!"};
    const toast = document.createElement("div");
    toast.className = "larel-notification " + (icons[inferred] ? inferred : "success");
    toast.setAttribute("role", inferred === "error" ? "alert" : "status");
    const icon = document.createElement("span");
    icon.className = "larel-notification-icon";
    icon.textContent = icons[inferred] || "✓";
    const content = document.createElement("span");
    content.className = "larel-notification-message";
    content.textContent = text;
    const close = document.createElement("button");
    close.className = "larel-notification-close";
    close.type = "button";
    close.setAttribute("aria-label","Dismiss notification");
    close.textContent = "×";
    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 260);
    };
    close.addEventListener("click", dismiss);
    toast.append(icon,content,close);
    region().appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-visible"));
    timer = setTimeout(dismiss, /in-app OTP is/i.test(text) ? 300000 : (inferred === "error" ? 5200 : 3800));
    while (region().children.length > 4) region().firstElementChild.remove();
  }

  window.larelNotify = notify;
  window.alert = function(message) { notify(message); };
  window.showLarelAlert = notify;
})();