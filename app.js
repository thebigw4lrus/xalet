(function () {
  "use strict";

  const FORM_ENDPOINT = "https://script.google.com/macros/s/AKfycbxX0dqbYwEMjxNFf0gDGpAxu4U7Z-ZJ4lecOwaFLbG0-62EQnhCr_uJqeKdpqiUQZcxfA/exec";
  const META_PIXEL_ID = "1704782534399253";
  const BRAND_NAME = "Xalet";
  const BRAND_TAGLINE = "Tu chalet al día";
  const COOKIE_KEY = "xalet_cookie_consent";
  const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 12 months
  const PRIVACY_VERSION = "21 de noviembre de 2026";
  const PRECIO_SI_INCLUYE = "Sí, si incluye…";
  const ERR_REQUIRED = "Te falta este dato para poder avisarte.";
  const ERR_CONSENT = "Necesitamos tu permiso para poder avisarte.";

  const brandLockup = BRAND_NAME + " · " + BRAND_TAGLINE;

  function isPlaceholder(value, placeholder) {
    return !value || value === placeholder;
  }

  /* —— Brand lockup (header / title) —— */
  document.querySelectorAll(".brand-tagline").forEach(function (el) {
    el.textContent = BRAND_TAGLINE;
  });
  if (!document.title || document.title.indexOf(BRAND_NAME) === 0) {
    const page = document.body.getAttribute("data-page");
    if (page === "privacidad") {
      document.title = "Política de privacidad · " + brandLockup;
    } else if (page === "cookies") {
      document.title = "Política de cookies · " + brandLockup;
    } else if (page === "aviso-legal") {
      document.title = "Aviso legal · " + brandLockup;
    } else {
      document.title = brandLockup;
    }
  }

  /* —— Cookie consent + Meta Pixel —— */
  const banner = document.getElementById("cookie-banner");

  function pixelConfigured() {
    return !isPlaceholder(META_PIXEL_ID, "REPLACE_WITH_PIXEL_ID");
  }

  function loadPixel() {
    if (!pixelConfigured() || window.fbq) return;
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    // No Advanced Matching: init with the pixel ID only, no email/phone or user data.
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  function trackLead() {
    if (window.fbq) window.fbq("track", "Lead");
  }

  function readCookie(name) {
    const prefix = name + "=";
    const parts = document.cookie.split(";");
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i].trim();
      if (part.indexOf(prefix) === 0) {
        return decodeURIComponent(part.slice(prefix.length));
      }
    }
    return null;
  }

  function writeCookie(name, value, maxAge) {
    document.cookie =
      name +
      "=" +
      encodeURIComponent(value) +
      "; Max-Age=" +
      maxAge +
      "; Path=/; SameSite=Lax";
  }

  function expireCookie(name) {
    document.cookie = name + "=; Max-Age=0; Path=/; SameSite=Lax";
  }

  function consentValue() {
    try {
      const fromStorage = localStorage.getItem(COOKIE_KEY);
      if (fromStorage) return fromStorage;
    } catch (err) {
      /* private mode */
    }
    return readCookie(COOKIE_KEY);
  }

  function clearMarketingCookies() {
    expireCookie("_fbp");
    expireCookie("_fbc");
  }

  function updateCookieConfigUI(value) {
    const status = document.getElementById("cookie-choice-status");
    if (!status) return;
    if (value === "accepted") {
      status.hidden = false;
      status.textContent = "Tu elección actual: cookies de marketing aceptadas.";
    } else if (value === "rejected") {
      status.hidden = false;
      status.textContent = "Tu elección actual: cookies de marketing rechazadas.";
    } else {
      status.hidden = true;
      status.textContent = "";
    }
  }

  function setConsent(value) {
    try {
      localStorage.setItem(COOKIE_KEY, value);
    } catch (err) {
      /* private mode, ignore */
    }
    try {
      writeCookie(COOKIE_KEY, value, COOKIE_MAX_AGE);
    } catch (err) {
      /* ignore */
    }
    if (banner) banner.hidden = true;
    if (value === "accepted") {
      loadPixel();
    } else {
      clearMarketingCookies();
    }
    updateCookieConfigUI(value);
  }

  const stored = consentValue();
  if (stored === "accepted") {
    loadPixel();
    if (banner) banner.hidden = true;
  } else if (stored === "rejected") {
    if (banner) banner.hidden = true;
  } else if (banner) {
    banner.hidden = false;
  }
  updateCookieConfigUI(stored);

  document.querySelectorAll("[data-cookie]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setConsent(btn.getAttribute("data-cookie"));
    });
  });

  /* —— Header shadow on scroll —— */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* —— Form —— */
  const form = document.getElementById("lista-espera");
  if (!form) return;

  const confirmation = document.getElementById("confirmacion");
  const incluyeWrap = document.getElementById("precio-incluye-wrap");
  const incluyeInput = document.getElementById("precio_si_incluye");
  const consentBox = form.elements.consentimiento;
  const consentTimeInput = form.elements.consentimiento_fecha_hora;
  const privacyUrlInput = form.elements.privacidad_url;

  function formatMadrid(date) {
    const parts = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const get = function (type) {
      return parts.find(function (part) {
        return part.type === type;
      }).value;
    };
    return (
      get("year") +
      "-" +
      get("month") +
      "-" +
      get("day") +
      " " +
      get("hour") +
      ":" +
      get("minute") +
      ":" +
      get("second")
    );
  }

  function privacyPolicyUrl() {
    return "https://thebigw4lrus.github.io/xalet/privacidad · " + PRIVACY_VERSION;
  }

  if (privacyUrlInput) privacyUrlInput.value = privacyPolicyUrl();

  if (consentBox) {
    consentBox.addEventListener("change", function () {
      if (!consentTimeInput) return;
      consentTimeInput.value = consentBox.checked ? formatMadrid(new Date()) : "";
    });
  }

  function fillUtms() {
    const params = new URLSearchParams(window.location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (key) {
      const input = form.elements[key];
      if (input) input.value = params.get(key) || "";
    });
    const pagina = form.elements.pagina;
    if (pagina) pagina.value = window.location.href;
  }
  fillUtms();

  function selectedValue(name) {
    const el = form.elements[name];
    if (!el) return "";
    if (el.length && el[0] && el[0].type === "radio") {
      for (let i = 0; i < el.length; i += 1) {
        if (el[i].checked) return el[i].value;
      }
      return "";
    }
    if (el.type === "checkbox") return el.checked ? el.value : "";
    return (el.value || "").trim();
  }

  function toggleIncluye() {
    const show = selectedValue("precio_59") === PRECIO_SI_INCLUYE;
    if (!incluyeWrap || !incluyeInput) return;
    incluyeWrap.hidden = !show;
    incluyeInput.required = false;
    if (!show) {
      incluyeInput.value = "";
      clearError(incluyeInput.closest("[data-field]"));
    }
  }

  form.querySelectorAll('input[name="precio_59"]').forEach(function (radio) {
    radio.addEventListener("change", toggleIncluye);
  });
  toggleIncluye();

  function fieldRoot(name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function clearError(root) {
    if (!root) return;
    root.classList.remove("is-invalid");
    const err = root.querySelector(":scope > .error");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    const control = root.querySelector("input, textarea");
    if (control) {
      control.removeAttribute("aria-invalid");
      control.removeAttribute("aria-describedby");
    }
  }

  function showError(name, message) {
    const root = fieldRoot(name);
    if (!root) return null;
    root.classList.add("is-invalid");
    const err = root.querySelector(":scope > .error");
    if (err) {
      if (!err.id) err.id = "error-" + name;
      err.textContent = message;
      err.hidden = false;
    }
    const control =
      root.querySelector("input[type='text'], input[type='checkbox']") ||
      root.querySelector("input");
    if (control && err) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", err.id);
    }
    return control;
  }

  const requiredFields = ["nombre", "contacto", "municipio"];

  form.addEventListener("input", function (ev) {
    const root = ev.target.closest("[data-field]");
    if (root) clearError(root);
  });
  form.addEventListener("change", function (ev) {
    const root = ev.target.closest("[data-field]");
    if (root) clearError(root);
    if (ev.target.name === "precio_59") toggleIncluye();
  });

  function validate() {
    let firstInvalid = null;
    requiredFields.forEach(function (name) {
      clearError(fieldRoot(name));
      if (!selectedValue(name)) {
        const control = showError(name, ERR_REQUIRED);
        if (!firstInvalid) firstInvalid = control;
      }
    });

    clearError(fieldRoot("consentimiento"));
    if (!consentBox || !consentBox.checked) {
      const control = showError("consentimiento", ERR_CONSENT);
      if (!firstInvalid) firstInvalid = control;
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function payloadFromForm() {
    if (consentBox && consentBox.checked && consentTimeInput && !consentTimeInput.value) {
      consentTimeInput.value = formatMadrid(new Date());
    }
    if (privacyUrlInput && !privacyUrlInput.value) {
      privacyUrlInput.value = privacyPolicyUrl();
    }
    return {
      nombre: selectedValue("nombre"),
      contacto: selectedValue("contacto"),
      municipio: selectedValue("municipio"),
      piscina: selectedValue("piscina"),
      jardin: selectedValue("jardin"),
      mantenimiento_actual: selectedValue("mantenimiento_actual"),
      pago_mensual_actual: selectedValue("pago_mensual_actual"),
      preocupacion_principal: selectedValue("preocupacion_principal"),
      precio_59: selectedValue("precio_59"),
      precio_si_incluye: selectedValue("precio_si_incluye"),
      consentimiento: consentBox && consentBox.checked ? "sí" : "",
      consentimiento_fecha_hora: (consentTimeInput && consentTimeInput.value) || "",
      privacidad_url: (privacyUrlInput && privacyUrlInput.value) || "",
      utm_source: form.elements.utm_source.value,
      utm_medium: form.elements.utm_medium.value,
      utm_campaign: form.elements.utm_campaign.value,
      utm_content: form.elements.utm_content.value,
      pagina: form.elements.pagina.value,
      website: (form.elements.website && form.elements.website.value) || "",
    };
  }

  function showConfirmation() {
    if (confirmation) {
      confirmation.hidden = false;
      confirmation.focus();
      confirmation.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    form.hidden = true;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validate()) return;

    const payload = payloadFromForm();
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) submitBtn.disabled = true;

    const finish = function () {
      trackLead();
      showConfirmation();
    };

    if (isPlaceholder(FORM_ENDPOINT, "REPLACE_WITH_APPS_SCRIPT_URL")) {
      console.log("[Xalet demo] payload", JSON.stringify(payload));
      finish();
      return;
    }

    const body = new URLSearchParams();
    Object.keys(payload).forEach(function (key) {
      if (key === "website") return;
      body.append(key, payload[key]);
    });
    body.append("website", payload.website);

    fetch(FORM_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: body.toString(),
    })
      .then(finish)
      .catch(function (err) {
        console.error("No se ha podido enviar el formulario", err);
        if (submitBtn) submitBtn.disabled = false;
      });
  });
})();
