(function () {
  const sampleData = {
    Activities: [
      { Date: "2026-07-26", EventName: "PAW Rehearsal", Description: "Full band and vocal preparation for Sunday service.", Location: "Main Sanctuary" },
      { Date: "2026-08-02", EventName: "Worship Workshop", Description: "Training, devotion, and practical worship team coaching.", Location: "Fellowship Hall" }
    ],
    Assignments: [
      { Date: "2026-07-26", Role: "Worship Leader", Name: "Jane Reyes" },
      { Date: "2026-07-26", Role: "APM", Name: "Mark Santos" },
      { Date: "2026-08-02", Role: "Vocals", Name: "Music Team" }
    ],
    YouthFellowship: [
      { Date: "2026-07-26", Topic: "Faith That Stands", Speaker: "Youth Leader", Location: "Youth Room" },
      { Date: "2026-08-09", Topic: "Prayer and Purpose", Speaker: "Pastoral Team", Location: "Prayer Room" }
    ],
    PrayerFasting: [
      { StartDate: "2026-07-20", EndDate: "2026-07-26", Theme: "Consecrated Worship", PrayerPoints: "Unity, purity, families, youth, and Sunday service." },
      { StartDate: "2026-08-03", EndDate: "2026-08-09", Theme: "Faithful Service", PrayerPoints: "Healing, provision, church growth, and ministers." }
    ],
    ServiceInfo: [
      { Date: "2026-07-26", WorshipLeader: "Jane Reyes", APM: "Mark Santos", ColorAssignment: "Red", ColorHex: "#c0392b" }
    ]
  };

  window.DFC = {
    sampleData,
    nextSundayAtEight,
    pad,
    fetchSheet,
    parseCSV,
    renderRecordCards,
    renderMiniCountdown
  };

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navLinks.classList.toggle("is-open", !isOpen);
    });
  }

  const pageName = window.location.pathname.split("/").pop().replace(".html", "") || "index";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === pageName) link.classList.add("active");
  });

  const year = document.getElementById("footerYear");
  if (year) year.textContent = new Date().getFullYear();

  const greetingEl = document.getElementById("timeGreeting");
  if (greetingEl) {
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    if (hour >= 12 && hour < 18) greeting = "Good Afternoon";
    greetingEl.textContent = greeting;
  }

  document.querySelectorAll("[data-sheet]").forEach(async (container) => {
    const sheet = container.dataset.sheet;
    const rows = await fetchSheet(sheet, sampleData[sheet] || []);
    renderRecordCards(container, rows);
  });

  const dashboard = document.getElementById("dashboardCards");
  if (dashboard) renderDashboard(dashboard);

  const mini = document.getElementById("miniCountdown");
  if (mini) {
    renderMiniCountdown(mini);
    setInterval(() => renderMiniCountdown(mini), 1000);
  }

  async function fetchSheet(sheet, fallback) {
    const url = window.SHEET_URLS && window.SHEET_URLS[sheet];
    if (!url || url.includes("PASTE_PUBLISHED_CSV_URL")) return fallback;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${sheet}`);
      return parseCSV(await response.text());
    } catch (error) {
      return fallback;
    }
  }

  function parseCSV(csvText) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
      const char = csvText[index];
      const nextChar = csvText[index + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(field);
        field = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && nextChar === "\n") index += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field !== "" || row.length) {
      row.push(field);
      rows.push(row);
    }

    const headers = (rows.shift() || []).map((header) => header.trim());
    return rows
      .filter((cells) => cells.some((cell) => cell.trim() !== ""))
      .map((cells) => headers.reduce((record, header, index) => {
        if (header) record[header] = (cells[index] || "").trim();
        return record;
      }, {}));
  }

  function renderRecordCards(container, rows) {
    container.innerHTML = "";
    if (!rows.length) {
      container.appendChild(element("p", "empty-state", "No records yet."));
      return;
    }

    rows.forEach((row) => {
      const card = element("article", "record-card");
      Object.entries(row).forEach(([label, value], index) => {
        const field = element("div", index === 0 ? "record-field primary" : "record-field");
        field.append(element("span", "", label), element("strong", "", value || "-"));
        card.appendChild(field);
      });
      container.appendChild(card);
    });
  }

  async function renderDashboard(container) {
    const services = await fetchSheet("ServiceInfo", sampleData.ServiceInfo);
    const assignments = await fetchSheet("Assignments", sampleData.Assignments);
    const activities = await fetchSheet("Activities", sampleData.Activities);
    const prayer = await fetchSheet("PrayerFasting", sampleData.PrayerFasting);
    const nextService = services[0] || {};
    const nextAssignment = assignments[0] || {};
    const nextActivity = activities[0] || {};
    const prayerPeriod = prayer[0] || {};

    container.innerHTML = "";
    [
      ["This Sunday", `${nextService.Date || "TBA"} - ${nextService.WorshipLeader || "Leader TBA"}`],
      ["Next Assignment", `${nextAssignment.Name || "TBA"} - ${nextAssignment.Role || "Role TBA"}`],
      ["Upcoming Activities", `${nextActivity.EventName || "Activity TBA"} - ${nextActivity.Date || "Date TBA"}`],
      ["Prayer & Fasting", formatPrayerPeriod(prayerPeriod)]
    ].forEach(([label, value]) => {
      const card = element("article", "summary-card");
      card.append(element("span", "", label), element("strong", "", value));
      container.appendChild(card);
    });
  }

  function renderMiniCountdown(container) {
    const now = new Date();
    const diff = Math.max(0, nextSundayAtEight(now) - now);
    const totalSeconds = Math.floor(diff / 1000);
    container.textContent = `${pad(Math.floor(totalSeconds / 86400))} : ${pad(Math.floor((totalSeconds % 86400) / 3600))} : ${pad(Math.floor((totalSeconds % 3600) / 60))} : ${pad(totalSeconds % 60)}`;
  }

  function formatPrayerPeriod(row) {
    if (row.StartDate && row.EndDate) return `${row.StartDate} to ${row.EndDate}`;
    return row.StartDate || row.EndDate || "Schedule TBA";
  }

  function nextSundayAtEight(now = new Date()) {
    const hour = window.APP_CONFIG ? window.APP_CONFIG.SUNDAY_SERVICE_HOUR : 8;
    const target = new Date(now);
    const daysUntilSunday = (7 - now.getDay()) % 7;
    target.setDate(now.getDate() + daysUntilSunday);
    target.setHours(hour, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 7);
    return target;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
})();
