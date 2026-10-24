/* MOVELINK LOGISTICS — shared script */
(function () {
  "use strict";

  /* ============ CONFIGURATION (edit here) ============ */
  var CONFIG = {
    // Paste your form-handling endpoint here (e.g. a Formspree URL: "https://formspree.io/f/xxxxxxx").
    // While empty, the form shows a "not connected" notice and does NOT pretend to send.
    FORM_ENDPOINT: "",
    WHATSAPP_NUMBER: "2348165359655",
    PHONE_DISPLAY: "+2348165359655",
    EMAIL: "movelinklogisticsng@gmail.com",
    // Routing: service key -> internal destination label. Leave null to use the central enquiry inbox.
    // The label is sent as "route_to" so the backend/form provider can route it. Do not add emails you do not control.
    ROUTING: {
      transportation: null,
      warehousing: null,
      industrial: null,
      procurement: null,
      relocation: null,
      project: null,
      "import-export": null,
      other: null,
      general: null,
    },
  };

  var SERVICES = {
    transportation: "Transportation and Distribution",
    warehousing: "Warehousing and Inventory Support",
    industrial: "Industrial and Oil and Gas Logistics",
    procurement: "Procurement and Vendor Sourcing",
    relocation: "Corporate and Household Relocation",
    project: "Project Logistics and Coordination",
    "import-export": "Import and Export Coordination",
    other: "Other",
  };
  var NEEDS_ROUTE = ["transportation", "relocation"];

  function waLink(msg) {
    return "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
  }

  /* ============ Mobile navigation ============ */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("open"));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  /* ============ WhatsApp links ============ */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var key = a.getAttribute("data-wa");
    var msg = SERVICES[key]
      ? "Hello Movelink Logistics, I would like to enquire about " + SERVICES[key] + "."
      : "Hello Movelink Logistics, I would like to enquire about your services.";
    a.href = waLink(msg);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });

  /* ============ Dynamic year ============ */
  document.querySelectorAll(".js-year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ============ Scroll reveal ============ */
  var reveals = document.querySelectorAll(".reveal");
  if (
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("in");
    });
  }

  /* ============ Forms (quote form + simple contact form) ============ */
  function initForm(form, kind) {
    var msgBox = form.querySelector(".form-msg");
    var submitBtn = form.querySelector("button[type=submit]");
    var serviceSel = form.elements["service"] || null;
    var submitting = false;

    if (serviceSel) {
      // Preselect service from ?service=key (validated against whitelist)
      var param = new URLSearchParams(window.location.search).get("service");
      if (param && Object.prototype.hasOwnProperty.call(SERVICES, param)) serviceSel.value = param;
    }
    function needsRoute() {
      return !!serviceSel && NEEDS_ROUTE.indexOf(serviceSel.value) > -1;
    }
    function showMsg(type, html) {
      msgBox.className = "form-msg show " + type;
      msgBox.innerHTML = html;
      msgBox.setAttribute("tabindex", "-1");
      msgBox.focus();
      msgBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function setError(input, text) {
      var f = input.closest(".field");
      f.classList.toggle("invalid", !!text);
      input.setAttribute("aria-invalid", text ? "true" : "false");
      f.querySelector(".err").textContent = text || "";
    }
    function validateField(el) {
      var v = el.value.trim(),
        name = el.name,
        err = "";
      var required = el.required || (el.dataset.routeField && needsRoute());
      if (required && !v) err = "This field is required.";
      else if (name === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
        err = "Enter a valid email address.";
      else if (name === "phone" && v && !/^\+?[0-9\s()-]{7,20}$/.test(v))
        err = "Enter a valid phone number, e.g. 08012345678.";
      else if ((name === "details" || name === "message") && v && v.length < 10)
        err = "Please write a little more (at least 10 characters).";
      setError(el, err);
      return !err;
    }
    function updateRouteFields() {
      var need = needsRoute();
      form.querySelectorAll("[data-route-field]").forEach(function (el) {
        var star = el.closest(".field").querySelector(".req");
        if (star) star.style.display = need ? "inline" : "none";
        if (!need) setError(el, "");
      });
    }
    if (serviceSel) {
      serviceSel.addEventListener("change", updateRouteFields);
      updateRouteFields();
    }

    var fields = Array.prototype.filter.call(
      form.querySelectorAll("input,select,textarea"),
      function (el) {
        return el.name !== "website_url";
      },
    );
    fields.forEach(function (el) {
      el.addEventListener("blur", function () {
        if (el.value || el.closest(".invalid")) validateField(el);
      });
      el.addEventListener("input", function () {
        if (el.closest(".invalid")) validateField(el);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;
      if (form.elements["website_url"].value) return; // honeypot

      var firstBad = null;
      fields.forEach(function (el) {
        if (!validateField(el) && !firstBad) firstBad = el;
      });
      if (firstBad) {
        firstBad.focus();
        return;
      }

      var key = serviceSel ? serviceSel.value : "general";
      var waMsg =
        "Hello Movelink Logistics, I would like to enquire about " +
        (SERVICES[key] ? SERVICES[key] : "your services") +
        ".";
      var fallback =
        'You can also reach us on WhatsApp (<a href="' +
        waLink(waMsg) +
        '" target="_blank" rel="noopener noreferrer">chat now</a>), call <a href="tel:' +
        CONFIG.PHONE_DISPLAY +
        '">' +
        CONFIG.PHONE_DISPLAY +
        '</a> or email <a href="mailto:' +
        CONFIG.EMAIL +
        '">' +
        CONFIG.EMAIL +
        "</a>.";

      if (!CONFIG.FORM_ENDPOINT) {
        showMsg(
          "warn",
          "The online form is not connected to an email service yet, so your message has not been sent. " +
            fallback,
        );
        return;
      }

      var val = function (n) {
        return form.elements[n] ? form.elements[n].value.trim() : "";
      };
      var data;
      if (kind === "quote") {
        data = {
          form_type: "quote_request",
          full_name: val("name"),
          company: val("company"),
          phone: val("phone"),
          email: val("email"),
          service_key: key,
          service: SERVICES[key],
          route_to: CONFIG.ROUTING[key] || "central-enquiries",
          origin: val("origin"),
          destination: val("destination"),
          preferred_date: val("date"),
          cargo_or_scope: val("scope"),
          additional_requirements: val("details"),
          _subject: "New quote request: " + SERVICES[key] + " — Movelink Logistics website",
        };
      } else {
        data = {
          form_type: "contact_message",
          full_name: val("name"),
          phone: val("phone"),
          email: val("email"),
          service_key: "general",
          service: "General contact enquiry",
          route_to: CONFIG.ROUTING.general || "central-enquiries",
          message: val("message"),
          _subject: "New contact message — Movelink Logistics website",
        };
      }

      submitting = true;
      submitBtn.disabled = true;
      var label = submitBtn.textContent;
      submitBtn.textContent = "Sending…";
      msgBox.className = "form-msg";

      fetch(CONFIG.FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          if (serviceSel) updateRouteFields();
          showMsg(
            "ok",
            kind === "quote"
              ? "Thank you for contacting Movelink Logistics. Your enquiry has been submitted successfully. Our team will review your requirements and contact you regarding the next steps."
              : "Thank you for contacting Movelink Logistics. Your message has been sent successfully. Our team will get back to you shortly.",
          );
        })
        .catch(function () {
          showMsg(
            "bad",
            "Sorry, your submission could not be sent. Please try again, or contact us directly. " +
              fallback,
          );
        })
        .then(function () {
          submitting = false;
          submitBtn.disabled = false;
          submitBtn.textContent = label;
        });
    });
  }

  var qf = document.getElementById("quote-form");
  if (qf) initForm(qf, "quote");
  var cf = document.getElementById("contact-form");
  if (cf) initForm(cf, "contact");
})();
