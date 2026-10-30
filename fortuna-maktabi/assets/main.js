(function () {
  "use strict";

  var cfg = window.FORTUNA || {};

  // --- Meta Pixel (faqat ID kiritilgan bo'lsa) ---
  if (cfg.metaPixelId) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq("init", cfg.metaPixelId);
    window.fbq("track", "PageView");
    if (document.body.dataset.page === "thanks") window.fbq("track", "Lead");
  }

  // --- Kontaktlarni config.js dan to'ldirish ---
  var phoneDigits = (cfg.phone || "").replace(/[^\d+]/g, "");
  var contacts = {
    phone: cfg.phone ? { href: "tel:" + phoneDigits, text: cfg.phone } : null,
    telegram: cfg.telegram ? { href: "https://t.me/" + cfg.telegram, text: "@" + cfg.telegram } : null,
    instagram: cfg.instagram ? { href: "https://instagram.com/" + cfg.instagram, text: "@" + cfg.instagram } : null,
    address: cfg.address ? { href: cfg.mapUrl || null, text: cfg.address } : null
  };
  document.querySelectorAll("[data-contact]").forEach(function (el) {
    var c = contacts[el.dataset.contact];
    var wrap = el.closest("[data-contact-wrap]") || el;
    if (!c) { wrap.hidden = true; return; }
    if (el.tagName === "A") {
      if (c.href) el.href = c.href; else el.removeAttribute("href");
      if (/^https?:/.test(c.href || "")) { el.target = "_blank"; el.rel = "noopener"; }
    }
    if (!el.hasAttribute("data-keep-text")) el.textContent = c.text;
  });
  // Barcha kontaktlar bo'sh bo'lsa — butun blokni yashirish
  document.querySelectorAll("[data-contact-group]").forEach(function (g) {
    var anyVisible = Array.prototype.some.call(g.querySelectorAll("[data-contact-wrap]"), function (w) { return !w.hidden; });
    if (!anyVisible) g.hidden = true;
  });
  if (cfg.price) document.querySelectorAll("[data-price]").forEach(function (el) { el.textContent = cfg.price; });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // --- Mobil menyu ---
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  // --- Paydo bo'lish animatsiyasi ---
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  // --- UTM belgilarini saqlash (reklama manbasini bilish uchun) ---
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];
  var params = new URLSearchParams(location.search);
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem("fortuna_utm") || "{}"); } catch (e) { utm = {}; }
  UTM_KEYS.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k).slice(0, 200); });
  try { sessionStorage.setItem("fortuna_utm", JSON.stringify(utm)); } catch (e) { /* storage yopiq */ }

  // Sayt ichidagi "ro'yxat" havolalariga UTM ni uzatish
  if (Object.keys(utm).length) {
    document.querySelectorAll('a[href^="/royxat"]').forEach(function (a) {
      var u = new URL(a.getAttribute("href"), location.origin);
      Object.keys(utm).forEach(function (k) { u.searchParams.set(k, utm[k]); });
      a.setAttribute("href", u.pathname + u.search + u.hash);
    });
  }

  // --- Mobil "sticky" tugma: forma ko'rinmayotganda chiqadi ---
  var sticky = document.querySelector(".sticky-cta");
  var formEl = document.querySelector(".lead-form");
  if (sticky && formEl && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      sticky.classList.toggle("is-visible", !entries[0].isIntersecting && window.scrollY > 300);
    }).observe(formEl);
  }

  // --- Telefon raqami maskasi: +998 XX XXX XX XX ---
  function formatPhone(value) {
    var d = value.replace(/\D/g, "");
    if (d.indexOf("998") === 0) d = d.slice(3);
    d = d.slice(0, 9);
    var out = "+998";
    if (d.length) out += " " + d.slice(0, 2);
    if (d.length > 2) out += " " + d.slice(2, 5);
    if (d.length > 5) out += " " + d.slice(5, 7);
    if (d.length > 7) out += " " + d.slice(7, 9);
    return out;
  }

  document.querySelectorAll(".lead-form").forEach(function (form) {
    var phone = form.querySelector('[name="phone"]');
    if (phone) {
      phone.addEventListener("focus", function () { if (!phone.value) phone.value = "+998 "; });
      phone.addEventListener("input", function () { phone.value = formatPhone(phone.value); });
      phone.addEventListener("blur", function () { if (phone.value.replace(/\D/g, "") === "998") phone.value = ""; });
    }

    form.querySelectorAll("input, select").forEach(function (inp) {
      inp.addEventListener("input", function () { var f = inp.closest(".field"); if (f) f.classList.remove("is-invalid"); });
      inp.addEventListener("change", function () { var f = inp.closest(".field"); if (f) f.classList.remove("is-invalid"); });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var alertBox = form.querySelector(".form-alert");
      alertBox.classList.remove("is-visible");

      var el = form.elements;
      var data = {
        name: (el.namedItem("name").value || "").trim(),
        phone: (el.namedItem("phone").value || "").trim(),
        role: (form.querySelector('[name="role"]:checked') || {}).value || "",
        grade: el.namedItem("grade").value,
        website: el.namedItem("website").value, // honeypot
        page: location.pathname,
        utm: utm
      };

      var ok = true;
      function invalid(n) { var f = form.querySelector('[name="' + n + '"]').closest(".field"); f.classList.add("is-invalid"); ok = false; }
      if (data.name.length < 2) invalid("name");
      if (data.phone.replace(/\D/g, "").length !== 12) invalid("phone");
      if (!data.role) invalid("role");
      if (!data.grade) invalid("grade");
      if (!ok) {
        var first = form.querySelector(".is-invalid input, .is-invalid select");
        if (first) first.focus();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Yuborilmoqda…";

      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || "server"); }); })
        .then(function () {
          try { sessionStorage.setItem("fortuna_lead_name", data.name); } catch (e) { /* storage yopiq */ }
          location.href = "/rahmat/";
        })
        .catch(function () {
          alertBox.textContent = "Arizani yuborib bo'lmadi. Internetni tekshirib, qaytadan urinib ko'ring" +
            (cfg.phone ? " yoki " + cfg.phone + " raqamiga qo'ng'iroq qiling." : ".");
          alertBox.classList.add("is-visible");
          btn.disabled = false;
          btn.textContent = label;
        });
    });
  });

  // Rahmat sahifasida ismni ko'rsatish
  var thanksName = document.querySelector("[data-lead-name]");
  if (thanksName) {
    try {
      var n = sessionStorage.getItem("fortuna_lead_name");
      if (n) thanksName.textContent = ", " + n;
    } catch (e) { /* storage yopiq */ }
  }
})();
