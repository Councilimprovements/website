/* =====================================================================
   MAIN SCRIPT FOR THE WHOLE SITE
   You should not need to edit this file. To change the company name,
   address, company number or form address, edit config.js instead.

   What this file does, in order:
     1. Fills in the company details from config.js on every page
     2. Marks the current page in the navigation
     3. Makes the mobile "Menu" button open and close the menu
     4. Fades sections in gently as you scroll
     5. Adds "Organisation" information for search engines
     6. Checks and sends the enquiry form on the contact page
   ===================================================================== */

(function () {
  "use strict";

  /* Tell the style sheet that JavaScript is working */
  document.documentElement.classList.add("js");

  /* Read the details from config.js. If that file is missing or broken,
     use an empty set so the rest of the site still works. */
  var config = (typeof SITE_CONFIG !== "undefined") ? SITE_CONFIG : {};

  /* Small helper: run a function for every element matching a selector */
  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  /* -------------------------------------------------------------------
     1. FILL IN COMPANY DETAILS
     Any element with a data-site="..." attribute gets its text (or its
     link) from config.js. This is why details only change in one place.
     ------------------------------------------------------------------- */
  each('[data-site="companyName"]', function (el) { if (config.companyName) { el.textContent = config.companyName; } });
  each('[data-site="address"]', function (el) { el.textContent = config.address || ""; });
  each('[data-site="companyNumber"]', function (el) { el.textContent = config.companyNumber || ""; });

  /* Some sentences mention the address or company number. They stay hidden
     until that detail has been filled in in config.js. */
  each("[data-needs]", function (el) {
    if (config[el.getAttribute("data-needs")]) { el.hidden = false; }
  });

  /* Add the company name to the end of the browser tab title */
  if (config.companyName) { document.title = document.title + " | " + config.companyName; }

  /* Put the current year in the footer */
  each("[data-year]", function (el) { el.textContent = new Date().getFullYear(); });

  /* -------------------------------------------------------------------
     2. MARK THE CURRENT PAGE IN THE NAVIGATION
     ------------------------------------------------------------------- */
  var currentFile = window.location.pathname.split("/").pop() || "index.html";
  each(".site-nav a", function (link) {
    if (link.getAttribute("href") === currentFile && !link.classList.contains("btn")) {
      link.setAttribute("aria-current", "page");
    }
  });

  /* -------------------------------------------------------------------
     3. MOBILE MENU BUTTON
     ------------------------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    /* Pressing Escape closes the menu */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* -------------------------------------------------------------------
     4. GENTLE FADE-IN ON SCROLL
     Skipped entirely if the visitor prefers reduced motion.
     ------------------------------------------------------------------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    each(".reveal", function (el) { observer.observe(el); });
  } else {
    each(".reveal", function (el) { el.classList.add("is-visible"); });
  }

  /* -------------------------------------------------------------------
     5. ORGANISATION INFORMATION FOR SEARCH ENGINES (JSON-LD)
     Built from config.js so it always matches the details on the page.
     ------------------------------------------------------------------- */
  if (config.companyName) {
    var org = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": config.companyName,
      "description": "Murals and public art for town and city centres, schools, hospitals and public spaces across the UK.",
      "areaServed": "GB"
    };
    if (config.address) {
      org.address = { "@type": "PostalAddress", "addressLocality": config.address, "addressCountry": "GB" };
    }
    if (window.location.protocol.indexOf("http") === 0) {
      org.url = window.location.origin + "/";
    }
    var ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify(org);
    document.head.appendChild(ld);
  }

  /* -------------------------------------------------------------------
     6. ENQUIRY FORM (contact page only)
     ------------------------------------------------------------------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var status = document.getElementById("form-status");

    /* Send the form to the address in config.js */
    if (config.formEndpoint) { form.setAttribute("action", config.formEndpoint); }

    /* Where to send people after a successful enquiry (used by the
       fallback method below) */
    var nextField = form.querySelector('input[name="_next"]');
    var thanksUrl = new URL("thanks.html", window.location.href).href;
    if (nextField) { nextField.value = thanksUrl; }

    /* We show our own friendly error messages instead of the browser's */
    form.setAttribute("novalidate", "novalidate");

    /* Show or clear an error message under one field */
    function setError(field, message) {
      var errorEl = document.getElementById(field.id + "-error");
      if (message) {
        field.setAttribute("aria-invalid", "true");
        if (errorEl) { errorEl.textContent = "Error: " + message; errorEl.hidden = false; }
      } else {
        field.removeAttribute("aria-invalid");
        if (errorEl) { errorEl.textContent = ""; errorEl.hidden = true; }
      }
    }

    /* Check one field and return true if it is fine */
    function checkField(field) {
      var value = (field.value || "").trim();
      var message = "";
      if (field.type === "checkbox") {
        if (field.required && !field.checked) { message = field.getAttribute("data-error") || "Please tick this box."; }
      } else if (field.required && !value) {
        message = field.getAttribute("data-error") || "Please fill in this field.";
      } else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = "Enter an email address in the correct format, like name@example.co.uk";
      }
      setError(field, message);
      return !message;
    }

    function showStatus(message) {
      status.textContent = message;
      status.hidden = false;
      status.focus();
    }

    /* Re-check a field when the visitor leaves it after an error */
    each("#enquiry-form [required], #enquiry-form [type='email']", function (field) {
      field.addEventListener("blur", function () {
        if (field.getAttribute("aria-invalid") === "true") { checkField(field); }
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      status.hidden = true;

      /* Check every field; move to the first one with a problem */
      var firstBad = null;
      each("#enquiry-form [required], #enquiry-form [type='email']", function (field) {
        if (!checkField(field) && !firstBad) { firstBad = field; }
      });
      if (firstBad) { firstBad.focus(); return; }

      /* Friendly warning if the form has not been connected yet */
      if (!config.formEndpoint || config.formEndpoint.indexOf("YOUR_FORM_ID") !== -1) {
        showStatus("This form is not connected yet. Site owner: add your Formspree address to config.js (see README.txt).");
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Sending…";

      /* Send the enquiry in the background, then go to the thanks page.
         If that is not possible, fall back to sending the form the
         ordinary way. */
      fetch(config.formEndpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function (response) {
        if (response.ok) {
          window.location.href = "thanks.html";
        } else {
          button.disabled = false;
          button.textContent = "Send enquiry";
          showStatus("Sorry, your enquiry could not be sent. Please try again in a few minutes.");
        }
      }).catch(function () {
        form.submit();
      });
    });
  }
})();
