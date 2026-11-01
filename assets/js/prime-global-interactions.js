(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reading progress and back-to-top controls.
  const progress = document.createElement("div");
  progress.className = "pg-scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  document.body.prepend(progress);

  const topButton = document.createElement("button");
  topButton.className = "pg-scroll-top";
  topButton.type = "button";
  topButton.setAttribute("aria-label", "Back to top");
  topButton.title = "Back to top";
  topButton.textContent = "↑";
  document.body.appendChild(topButton);
  topButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  let scrollPending = false;
  function updateScrollUI() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? Math.min(100, Math.max(0, (window.scrollY / maxScroll) * 100)) : 0;
    progress.style.width = percent + "%";
    topButton.classList.toggle("is-visible", window.scrollY > 560);
    scrollPending = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollPending) {
      scrollPending = true;
      window.requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });
  window.addEventListener("resize", updateScrollUI, { passive: true });
  updateScrollUI();

  // Subtle entrance effects; content remains visible if this feature is unavailable.
  const revealTargets = document.querySelectorAll(
    ".section-head,.card,.step,.job-card,.start-card,.info,.pg-cta-panel,.pg-trust-item,.auth,.dashboard,.pg-live-card"
  );
  if (!reduceMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("pg-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
    revealTargets.forEach(element => {
      element.classList.add("pg-reveal");
      revealObserver.observe(element);
    });
  }

  // Homepage live jobs panel: fetch real published listings from the existing database.
  const board = document.querySelector("[data-pg-live-board]");
  if (!board) return;

  const status = byId("pgLiveStatus");
  const countLabel = byId("pgLiveCount");
  const updatedLabel = byId("pgLiveUpdated");
  const list = byId("pgLiveList");
  const search = byId("pgLiveSearch");
  const category = byId("pgLiveCategory");
  const workType = byId("pgLiveType");
  const country = byId("pgLiveCountry");
  const refresh = byId("pgLiveRefresh");
  const allJobs = [];
  let jobs = [];
  let publishedCount = 0;
  let loading = false;

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = String(text);
    return el;
  }

  function safeHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
    } catch (_) {
      return null;
    }
  }

  function normal(value) {
    return String(value || "").trim().toLowerCase();
  }

  function fillSelect(select, label, values) {
    select.replaceChildren(node("option", "", label));
    values.forEach(value => {
      const option = node("option", "", value);
      option.value = value;
      select.appendChild(option);
    });
  }

  function renderJobs() {
    const term = normal(search.value);
    const selectedCategory = category.value;
    const selectedType = workType.value;
    const selectedCountry = normal(country.value);

    const visible = jobs.filter(job => {
      const locations = Array.isArray(job.country_eligibility) ? job.country_eligibility.map(String) : [];
      const searchable = [
        job.title, job.company_name, job.description, job.category, job.location, ...locations
      ].join(" ").toLowerCase();
      const type = normal(job.job_type);
      const countryMatches = !selectedCountry || locations.some(location => {
        const candidate = normal(location);
        return candidate === selectedCountry ||
          ["worldwide", "global", "all countries", "anywhere", "international"].includes(candidate);
      });
      return (!term || searchable.includes(term)) &&
        (!selectedCategory || job.category === selectedCategory) &&
        (!selectedType || type === selectedType) &&
        countryMatches;
    });

    list.replaceChildren();
    if (!visible.length) {
      list.appendChild(node("div", "pg-live-empty",
        jobs.length ? "No published listings match those filters. Try a different keyword or country."
          : "There are no published listings at the moment. Check the Jobs Board again soon."));
      return;
    }

    visible.slice(0, 6).forEach(job => {
      const card = node("article", "pg-live-card");
      const top = node("div", "pg-live-card-top");
      top.appendChild(node("span", "pg-live-company", job.company_name || "Employer not specified"));
      if (job.published_at) {
        const date = new Date(job.published_at);
        if (!Number.isNaN(date.getTime())) {
          top.appendChild(node("time", "pg-live-date",
            date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })));
        }
      }
      card.appendChild(top);
      card.appendChild(node("h3", "pg-live-title", job.title || "Untitled opportunity"));

      const tags = node("div", "pg-live-tags");
      [job.category, job.job_type ? String(job.job_type).replace(/-/g, " ") : "", job.location || ""]
        .filter(Boolean).forEach(tag => tags.appendChild(node("span", "pg-live-tag", tag)));
      card.appendChild(tags);

      const description = String(job.description || "Open the employer's application page for more information.");
      card.appendChild(node("p", "pg-live-description",
        description.length > 210 ? description.slice(0, 207).trimEnd() + "…" : description));

      const eligible = Array.isArray(job.country_eligibility) ? job.country_eligibility : [];
      card.appendChild(node("p", "pg-live-eligibility",
        eligible.length ? "Eligible: " + eligible.join(", ") : "Confirm country eligibility with the employer."));

      const actions = node("div", "pg-live-actions");
      const url = safeHttpUrl(job.application_url);
      if (url) {
        const apply = node("a", "pg-live-apply", "View opportunity");
        apply.href = url;
        apply.target = "_blank";
        apply.rel = "noopener noreferrer";
        actions.appendChild(apply);
      } else if (job.application_email) {
        const email = node("a", "pg-live-apply", "Email employer");
        email.href = "mailto:" + String(job.application_email).trim();
        actions.appendChild(email);
      } else {
        actions.appendChild(node("span", "pg-live-no-link", "Application link not provided"));
      }
      card.appendChild(actions);
      list.appendChild(card);
    });

    if (visible.length > 6) {
      list.appendChild(node("p", "pg-live-more",
        "Showing 6 of " + visible.length + " matching loaded listings. Open the full Jobs Board to see more."));
    }
  }

  async function loadLiveJobs() {
    const db = window.pgSupabaseClient;
    if (!db) {
      status.textContent = "Live listings could not connect. Please use the full Jobs Board.";
      countLabel.textContent = "Live listings unavailable";
      list.replaceChildren(node("div", "pg-live-empty", "The jobs service is unavailable right now."));
      return;
    }
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    refresh.textContent = "Updating…";
    status.textContent = "Checking published opportunities…";
    try {
      const response = await db.from("jobs")
        .select("id,title,company_name,description,category,job_type,location,country_eligibility,application_url,application_email,published_at", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(60);
      if (response.error) throw response.error;

      jobs = response.data || [];
      publishedCount = Number.isFinite(response.count) ? response.count : jobs.length;

      fillSelect(category, "All categories",
        [...new Set(jobs.map(job => job.category).filter(Boolean))].sort());
      fillSelect(country, "All eligible countries",
        [...new Set(jobs.flatMap(job => Array.isArray(job.country_eligibility) ? job.country_eligibility : []))].filter(Boolean).sort());

      countLabel.textContent = publishedCount + (publishedCount === 1 ? " published opportunity" : " published opportunities");
      updatedLabel.textContent = "Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      status.textContent = "Listings are loaded from the Prime Global jobs database. Confirm each vacancy with its employer.";
      renderJobs();
    } catch (error) {
      console.error("Prime Global live jobs error:", error);
      status.textContent = "We could not refresh the live listings. Please try again or open the full Jobs Board.";
      countLabel.textContent = "Unable to load current listings";
      list.replaceChildren(node("div", "pg-live-empty", "The jobs database did not respond. Your member account is unaffected."));
    } finally {
      loading = false;
      refresh.disabled = false;
      refresh.textContent = "Refresh listings";
    }
  }

  [search, category, workType, country].forEach(control => {
    control.addEventListener(control === search ? "input" : "change", renderJobs);
  });
  refresh.addEventListener("click", loadLiveJobs);
  loadLiveJobs();

  // Realtime refresh is optional: the manual refresh still works if Realtime is disabled.
  try {
    const realtime = window.pgSupabaseClient.channel("pg-home-live-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => loadLiveJobs())
      .subscribe();
    window.addEventListener("pagehide", () => {
      if (realtime && window.pgSupabaseClient) {
        window.pgSupabaseClient.removeChannel(realtime);
      }
    }, { once: true });
  } catch (error) {
    console.info("Prime Global Realtime updates are not available in this session.");
  }
})();