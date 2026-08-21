(function () {
  const sampleData = {
    Activities: [
      { Date: "2026-08-29", Time: "09:00", EventName: "PAW Rehearsal", Description: "Full band and vocal preparation for Sunday service.", Location: "Main Sanctuary", Photos: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80", Status: "Approved", confirmed_count: "12", rsvp_user_ids: "" },
      { Date: "2026-09-06", Time: "14:00", EventName: "Worship Workshop", Description: "Training, devotion, and practical worship team coaching.", Location: "Fellowship Hall", Photos: "", Status: "Approved", confirmed_count: "8", rsvp_user_ids: "" },
      { Date: "2026-08-02", Time: "16:00", EventName: "Youth Praise Night", Description: "Youth-led worship, testimony, and fellowship gathering.", Location: "Youth Room", Photos: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=900&q=80", Status: "Approved", confirmed_count: "24", rsvp_user_ids: "" }
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
    ],
    Birthdays: [
      { Name: "Jane Reyes", Birthdate: "1998-08-24", Ministry: "Vocals" },
      { Name: "Mark Santos", Birthdate: "1995-09-02", Ministry: "Guitar" },
      { Name: "Pearl Dela Cruz", Birthdate: "2001-09-05", Ministry: "Keys" },
      { Name: "Angel Santos", Birthdate: "1999-09-18", Ministry: "Prayer Team" }
    ]
  };

  const churchAddress = "Door of Faith Church, Tanauan, Leyte";
  const churchDirectionsUrl = "https://www.google.com/maps/search/?api=1&query=Door+of+Faith+Church+Tanauan+Leyte";
  const dailyVerses = [
    { text: "Let everything that has breath praise the Lord.", reference: "Psalm 150:6" },
    { text: "Serve the Lord with gladness; come before his presence with singing.", reference: "Psalm 100:2" },
    { text: "God is spirit, and those who worship him must worship in spirit and truth.", reference: "John 4:24" },
    { text: "Sing to him a new song; play skillfully, and shout for joy.", reference: "Psalm 33:3" },
    { text: "Whatever you do, work at it with all your heart, as working for the Lord.", reference: "Colossians 3:23" }
  ];

  const quickAccessCards = [
    { href: "activities.html", icon: "calendar", title: "Church Activities", copy: "Upcoming events, locations, and fellowship notes.", isNew: false },
    { href: "dashboard.html", icon: "chart", title: "Dashboard", copy: "At-a-glance Sunday, assignment, activity, and prayer summaries.", isNew: false },
    { href: "assignment.html", icon: "microphone", title: "Assignment", copy: "Serving rotations for worship leaders, APM, vocals, and musicians.", isNew: false },
    { href: "sunday-service.html", icon: "church", title: "Sunday Service", copy: "Countdown, service colors, song keys, lyrics, and YouTube links.", isNew: false },
    { href: "assignment.html#teens-youth", icon: "heart", title: "Teens & Youth", copy: "Fellowship with prayer schedules, topics, speakers, and locations.", isNew: false },
    { href: "assignment.html#prayer-fasting", icon: "flame", title: "Prayer & Fasting", copy: "Guidelines, schedules, and prayer points for the church family.", isNew: false }
  ];

  window.DFC = {
    sampleData,
    nextSundayAtEight,
    pad,
    fetchSheet,
    parseCSV,
    renderRecordCards,
    renderActivityPhotoGallery,
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

  document.querySelectorAll("[data-photo-gallery]").forEach(async (container) => {
    const rows = await fetchSheet("Activities", sampleData.Activities);
    renderActivityPhotoGallery(container, rows);
  });

  const dashboard = document.getElementById("dashboardCards");
  if (dashboard) renderDashboard(dashboard);

  const mini = document.getElementById("miniCountdown");
  if (mini) {
    renderMiniCountdown(mini);
    setInterval(() => renderMiniCountdown(mini), 1000);
  }

  initHomePage();
  initActivityTabs();
  initActivitiesPage();
  initBirthdayCalendar();
  initAssignmentTabs();
  initActivityAlbums();
  initAddActivityForm();

  async function fetchSheet(sheet, fallback) {
    const url = window.SHEET_URLS && window.SHEET_URLS[sheet];
    if (!url || url.includes("PASTE_PUBLISHED_CSV_URL")) return fallback;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${sheet}`);
      return filterRows(sheet, parseCSV(await response.text()));
    } catch (error) {
      return fallback;
    }
  }

  function filterRows(sheet, rows) {
    if (sheet !== "Activities") return rows;
    return rows.filter((row) => String(row.Status || "").trim().toLowerCase() !== "pending");
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

    const sheet = container.dataset.sheet;
    rows.forEach((row) => {
      const card = element("article", "record-card");
      const fields = Object.entries(row).filter(([label, value]) => {
        if (sheet === "Activities" && label === "Status") return false;
        if (sheet === "Activities" && label === "Photos" && !String(value || "").trim()) return false;
        return true;
      });

      fields.forEach(([label, value], index) => {
        const field = element("div", index === 0 ? "record-field primary" : "record-field");
        field.appendChild(element("span", "", label));
        if (sheet === "Activities" && label === "Photos") {
          field.appendChild(renderPhotoLinks(value));
        } else {
          field.appendChild(element("strong", "", value || "-"));
        }
        card.appendChild(field);
      });
      container.appendChild(card);
    });
  }

  function initHomePage() {
    const quickGrid = document.getElementById("quickAccessGrid");
    const verseText = document.getElementById("dailyVerseText");
    const addCalendarButton = document.getElementById("addCalendarButton");
    const directionsLink = document.getElementById("directionsLink");
    const weekGrid = document.getElementById("homeWeekGrid");
    const photoStrip = document.getElementById("homePhotoStrip");

    if (!quickGrid && !verseText && !weekGrid && !photoStrip) return;

    if (quickGrid) renderQuickAccessCards(quickGrid);
    if (verseText) renderDailyVerse();
    if (directionsLink) {
      directionsLink.href = churchDirectionsUrl;
    }
    if (addCalendarButton) {
      addCalendarButton.addEventListener("click", downloadServiceCalendarEvent);
    }
    if (weekGrid) renderHomeWeek(weekGrid);
    if (photoStrip) renderHomePhotoStrip(photoStrip);
  }

  function renderQuickAccessCards(container) {
    container.innerHTML = "";
    quickAccessCards.forEach((card) => {
      const link = element("a", "quick-card upgraded");
      link.href = card.href;
      link.appendChild(quickAccessIcon(card.icon));
      if (card.isNew) link.appendChild(element("b", "quick-new-badge", "New"));
      link.append(
        element("h2", "", card.title),
        element("p", "", card.copy)
      );
      container.appendChild(link);
    });
  }

  function quickAccessIcon(name) {
    const icons = {
      calendar: '<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
      chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-7"/></svg>',
      microphone: '<svg viewBox="0 0 24 24"><path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Z"/><path d="M19 10a7 7 0 0 1-14 0M12 17v5M8 22h8"/></svg>',
      church: '<svg viewBox="0 0 24 24"><path d="M12 2v5M9.5 4.5h5"/><path d="m4 11 8-6 8 6"/><path d="M6 10v11h12V10"/><path d="M10 21v-6a2 2 0 1 1 4 0v6"/></svg>',
      heart: '<svg viewBox="0 0 24 24"><path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-8a5.2 5.2 0 0 0 0-7.4Z"/></svg>',
      flame: '<svg viewBox="0 0 24 24"><path d="M12 22a7 7 0 0 0 7-7c0-4-3-6.5-5-9-.5 2-1.5 3.2-3 4.5C9.4 8.3 9 6.2 9.2 3 6.7 5.2 5 8.5 5 12.5 5 18 8 22 12 22Z"/></svg>'
    };
    const wrapper = element("span", "quick-icon");
    wrapper.innerHTML = icons[name] || icons.calendar;
    return wrapper;
  }

  function renderDailyVerse() {
    const text = document.getElementById("dailyVerseText");
    const reference = document.getElementById("dailyVerseReference");
    if (!text || !reference || !dailyVerses.length) return;

    const dayIndex = Math.floor(todayMidnight().getTime() / 86400000) % dailyVerses.length;
    const verse = dailyVerses[dayIndex];
    text.textContent = `"${verse.text}"`;
    reference.textContent = verse.reference;
  }

  async function renderHomeWeek(container) {
    container.innerHTML = "";
    const [assignments, activities] = await Promise.all([
      fetchSheet("Assignments", sampleData.Assignments),
      fetchSheet("Activities", sampleData.Activities)
    ]);

    container.appendChild(homeWeekItem({
      label: "Serving this Sunday",
      title: servingThisSundayText(assignments),
      meta: "View full team assignments",
      href: "assignment.html"
    }));

    const nextActivity = nextUpcomingActivity(activities);
    container.appendChild(homeWeekItem({
      label: "Next activity",
      title: nextActivity ? nextActivity.eventName : "Activity schedule coming soon",
      meta: nextActivity ? `${nextActivity.date}${nextActivity.location ? ` - ${nextActivity.location}` : ""}` : "Add activities in the Activities sheet",
      href: "activities.html"
    }));

  }

  function homeWeekItem(item) {
    const link = element("a", "week-item");
    link.href = item.href;
    link.append(
      element("span", "card-kicker", item.label),
      element("strong", "", item.title),
      element("p", "", item.meta)
    );
    return link;
  }

  function servingThisSundayText(rows) {
    const nextServiceDate = dateKey(nextSundayAtEight(new Date()));
    const exactRows = rows.filter((row) => row.Date === nextServiceDate);
    const candidateRows = exactRows.length ? exactRows : rows.filter((row) => parseDateOnly(row.Date) >= todayMidnight());
    const names = (candidateRows.length ? candidateRows : rows)
      .map((row) => String(row.Name || "").trim())
      .filter(Boolean)
      .slice(0, 4);
    return names.length ? names.join(", ") : "Assignments coming soon";
  }

  function nextUpcomingActivity(rows) {
    return rows
      .map(normalizeActivity)
      .filter((activity) => activity.dateObject && activity.dateObject >= todayMidnight())
      .sort((a, b) => a.dateObject - b.dateObject)[0] || null;
  }

  function birthdaysThisWeek(rows) {
    return rows
      .map(normalizeBirthday)
      .filter((birthday) => birthday.name && birthday.month >= 0)
      .map((birthday) => {
        const nextDate = new Date(todayMidnight().getFullYear(), birthday.month, birthday.day);
        if (nextDate < todayMidnight()) nextDate.setFullYear(nextDate.getFullYear() + 1);
        return { ...birthday, nextDate, daysAway: Math.round((nextDate - todayMidnight()) / 86400000) };
      })
      .filter((birthday) => birthday.daysAway <= 7)
      .sort((a, b) => a.daysAway - b.daysAway);
  }

  async function renderHomePhotoStrip(container) {
    const photos = await featuredJiosPhotos();
    container.innerHTML = "";

    if (!photos.length) {
      for (let index = 0; index < 4; index += 1) {
        const placeholder = element("div", "featured-photo-placeholder");
        placeholder.append(
          element("span", "card-kicker", "Photo"),
          element("strong", "", "Placeholder image")
        );
        container.appendChild(placeholder);
      }
      return;
    }

    photos.forEach((photo) => {
      const link = element("a", "featured-photo");
      link.href = photo.url || photo.src;
      link.target = "_blank";
      link.rel = "noopener";

      const image = document.createElement("img");
      image.src = photo.displaySrc || driveImageDisplayUrl(photo.url || photo.src, photo.fileId);
      image.alt = `${photo.albumName || photo.eventName || "JIOS Thanksgiving Day"} photo`;
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        if (image.dataset.fallbackTried) return;
        image.dataset.fallbackTried = "true";
        image.src = photo.url || photo.src;
      });

      const label = element("span", "", photo.albumName || photo.eventName || "JIOS Thanksgiving Day");
      link.append(image, label);
      container.appendChild(link);
    });
  }

  async function featuredJiosPhotos() {
    if (isPhotoAlbumsCloudConfigured()) {
      try {
        const result = await fetchPhotoAlbumsJson(window.PHOTO_ALBUMS_SCRIPT_URL);
        const albums = normalizeCloudAlbums(result.albums);
        const jiosAlbum = albums.find((album) => {
          const name = album.name.toLowerCase();
          return name.includes("jios") && name.includes("thanksgiving") && name.includes("august 10");
        });
        if (jiosAlbum && jiosAlbum.photos.length) {
          return jiosAlbum.photos.slice(0, 4).map((photo) => ({
            ...photo,
            albumName: "JIOS Thanksgiving Day"
          }));
        }
      } catch (error) {
        // Keep the homepage usable if cloud albums are temporarily unavailable.
      }
    }

    return [];
  }

  function isSheetConfigured(sheet) {
    const url = window.SHEET_URLS && window.SHEET_URLS[sheet];
    return Boolean(url) && !String(url).includes("PASTE_PUBLISHED_CSV_URL");
  }

  function downloadServiceCalendarEvent() {
    const start = nextSundayAtEight(new Date());
    const end = new Date(start.getTime() + 90 * 60000);
    const title = "Door of Faith Church Sunday Service";
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Door of Faith Church//Worship Team Hub//EN",
      "BEGIN:VEVENT",
      `UID:${start.getTime()}@dooroffaith.church`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `LOCATION:${escapeIcs(churchAddress)}`,
      `DESCRIPTION:${escapeIcs("Sunday worship service at Door of Faith Church.")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dfc-sunday-service-${dateKey(start)}.ics`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    link.remove();
  }

  function formatIcsDate(date) {
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  }

  function escapeIcs(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  }

  function initAssignmentTabs() {
    const tabs = Array.from(document.querySelectorAll("[data-assignment-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-assignment-panel]"));
    const containers = Array.from(document.querySelectorAll("[data-assignment-sheet]"));
    if (!tabs.length || !panels.length || !containers.length) return;

    const showTab = (name) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.assignmentTab === name;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.assignmentPanel === name;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      if (window.location.hash !== `#${name}`) {
        history.replaceState(null, "", `#${name}`);
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => showTab(tab.dataset.assignmentTab));
    });

    containers.forEach(async (container) => {
      const sheet = container.dataset.assignmentSheet;
      const rows = await fetchSheet(sheet, sampleData[sheet] || []);
      renderAssignmentCards(container, rows, container.dataset.assignmentKind);
    });

    const requestedTab = window.location.hash.replace("#", "");
    if (tabs.some((tab) => tab.dataset.assignmentTab === requestedTab)) {
      showTab(requestedTab);
    }
  }

  function renderAssignmentCards(container, rows, kind) {
    container.innerHTML = "";
    if (!rows.length) {
      container.appendChild(element("p", "empty-state", "No records yet."));
      return;
    }

    rows.forEach((row) => {
      const card = element("article", `record-card assignment-card assignment-card-${kind || "main"}`);
      assignmentFields(row, kind).forEach(([label, value], index) => {
        const field = element("div", index === 0 ? "record-field primary" : "record-field");
        field.append(element("span", "", label), element("strong", "", value || "-"));
        card.appendChild(field);
      });
      container.appendChild(card);
    });
  }

  function assignmentFields(row, kind) {
    if (kind === "youth") {
      return [
        ["Date", row.Date],
        ["Role", row.Topic || "Youth Fellowship"],
        ["Name", row.Speaker || "Speaker TBA"],
        ["Location", row.Location]
      ];
    }

    if (kind === "prayer") {
      return [
        ["Date Range", formatPrayerPeriod(row)],
        ["Theme", row.Theme],
        ["Prayer Points", row.PrayerPoints]
      ];
    }

    return [
      ["Date", row.Date],
      ["Role", row.Role],
      ["Name", row.Name]
    ];
  }

  function renderPhotoLinks(value) {
    const links = element("div", "photo-links");
    String(value || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
      .forEach((url, index) => {
        const link = element("a", "", `Photo ${index + 1}`);
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        links.appendChild(link);
      });
    return links;
  }

  function renderActivityPhotoGallery(container, rows) {
    container.innerHTML = "";
    const photos = rows.flatMap((row) => photoRecordsFromActivity(row));

    if (!photos.length) {
      const empty = element("div", "photo-empty");
      empty.append(
        element("span", "card-kicker", "No photos yet"),
        element("h2", "", "Activity photos will appear here after approval."),
        element("p", "", "Use the upload button above to submit pictures from worship team gatherings, rehearsals, and fellowship events.")
      );
      container.appendChild(empty);
      return;
    }

    photos.forEach((photo) => {
      const card = element("article", "photo-card");
      const link = element("a", "photo-frame");
      link.href = photo.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", `Open photo from ${photo.eventName}`);

      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = `${photo.eventName} activity photo`;
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.remove();
        link.classList.add("photo-frame-placeholder");
        link.textContent = photo.eventName || "Activity photo";
      });
      link.appendChild(image);

      const body = element("div", "photo-card-body");
      body.append(
        element("span", "", photo.date || "Activity"),
        element("h2", "", photo.eventName || "Church activity")
      );
      if (photo.location) body.appendChild(element("p", "", photo.location));

      card.append(link, body);
      container.appendChild(card);
    });
  }

  async function initActivitiesPage() {
    const container = document.querySelector("[data-activity-list]");
    if (!container) return;

    const monthFilter = document.getElementById("activityMonthFilter");
    const locationFilter = document.getElementById("activityLocationFilter");
    const sortSelect = document.getElementById("activitySortSelect");
    const rows = await fetchSheet("Activities", sampleData.Activities);
    const activities = rows.map(normalizeActivity).filter((activity) => activity.eventName || activity.date);

    populateActivityFilters(activities, monthFilter, locationFilter);

    const render = () => {
      let visible = [...activities];
      if (monthFilter && monthFilter.value) {
        visible = visible.filter((activity) => activity.monthKey === monthFilter.value);
      }
      if (locationFilter && locationFilter.value) {
        visible = visible.filter((activity) => activity.location === locationFilter.value);
      }

      visible.sort((a, b) => {
        const aTime = a.dateObject ? a.dateObject.getTime() : 0;
        const bTime = b.dateObject ? b.dateObject.getTime() : 0;
        return sortSelect && sortSelect.value === "latest" ? bTime - aTime : aTime - bTime;
      });

      renderActivityCards(container, visible);
    };

    [monthFilter, locationFilter, sortSelect].filter(Boolean).forEach((control) => {
      control.addEventListener("change", render);
    });
    render();
  }

  function populateActivityFilters(activities, monthFilter, locationFilter) {
    if (monthFilter) {
      const months = [...new Map(activities
        .filter((activity) => activity.monthKey)
        .sort((a, b) => a.dateObject - b.dateObject)
        .map((activity) => [activity.monthKey, activity.monthLabel])).entries()];
      monthFilter.innerHTML = "";
      monthFilter.appendChild(selectOption("", "All months"));
      months.forEach(([value, label]) => monthFilter.appendChild(selectOption(value, label)));
    }

    if (locationFilter) {
      const locations = [...new Set(activities.map((activity) => activity.location).filter(Boolean))].sort();
      locationFilter.innerHTML = "";
      locationFilter.appendChild(selectOption("", "All locations"));
      locations.forEach((location) => locationFilter.appendChild(selectOption(location, location)));
    }
  }

  function renderActivityCards(container, activities) {
    container.innerHTML = "";
    if (!activities.length) {
      container.appendChild(element("p", "empty-state", "No activities match these filters."));
      return;
    }

    activities.forEach((activity) => {
      const status = activityStatus(activity.dateObject);
      const rsvp = activityRsvpState(activity);
      const card = element("article", `record-card activity-card status-${status.kind}${status.kind === "past" ? " is-past" : ""}`);
      const top = element("div", "activity-card-top");
      top.appendChild(element("span", `activity-status-badge ${status.kind}`, status.label));
      card.appendChild(top);

      [
        ["Date", activity.date || "Date TBA", "calendar", true],
        ["Time", formatActivityTime(activity.time) || "Time TBA", "clock", false],
        ["Event Name", activity.eventName || "Activity TBA", "event", false],
        ["Description", activity.description || "Details TBA", "description", false],
        ["Location", activity.location || "Location TBA", "location", false]
      ].forEach(([label, value, icon, primary]) => {
        card.appendChild(activityField(label, value, icon, primary));
      });

      const photoField = element("div", "record-field activity-photo-field");
      photoField.appendChild(activityLabel("Photo", "photo"));
      if (activity.photos.length) {
        photoField.appendChild(renderPhotoLinks(activity.photos.join(",")));
      } else {
        const placeholder = element("div", "activity-photo-placeholder");
        placeholder.innerHTML = '<span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/><path d="m4 15 4-4 4 4 2-2 6 5"/><circle cx="15" cy="10" r="1.5"/></svg></span><strong>No photo yet</strong>';
        photoField.appendChild(placeholder);
      }
      card.appendChild(photoField);

      const footer = element("div", "activity-rsvp");
      const countLabel = status.kind === "past" ? "attended" : "confirmed";
      footer.appendChild(element("span", "rsvp-count", `${rsvp.count} ${countLabel}`));
      if (status.kind === "past") {
        const ended = element("span", "rsvp-ended", "Event ended");
        footer.appendChild(ended);
      } else {
        const button = element("button", rsvp.going ? "rsvp-button is-going" : "rsvp-button", rsvp.going ? "✓ Going" : "I'll be there");
        button.type = "button";
        button.disabled = rsvp.going;
        button.addEventListener("click", () => {
          saveActivityRsvp(activity.id);
          renderActivityCards(container, activities);
        });
        footer.appendChild(button);
      }
      card.appendChild(footer);
      container.appendChild(card);
    });
  }

  function activityField(label, value, icon, primary) {
    const field = element("div", primary ? "record-field primary" : "record-field");
    field.append(activityLabel(label, icon), element("strong", "", value || "-"));
    return field;
  }

  function activityLabel(label, icon) {
    const node = element("span", "activity-field-label");
    node.append(activityIcon(icon), document.createTextNode(label));
    return node;
  }

  function activityIcon(name) {
    const icons = {
      calendar: '<svg viewBox="0 0 24 24"><path d="M8 2v4M16 2v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
      clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      event: '<svg viewBox="0 0 24 24"><path d="M12 3 4 8l8 5 8-5-8-5Z"/><path d="m4 13 8 5 8-5"/></svg>',
      description: '<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
      location: '<svg viewBox="0 0 24 24"><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2"/></svg>',
      photo: '<svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z"/><path d="m4 15 4-4 4 4 2-2 6 5"/><circle cx="15" cy="10" r="1.5"/></svg>'
    };
    const wrapper = element("i", "activity-field-icon");
    wrapper.innerHTML = icons[name] || icons.event;
    return wrapper;
  }

  function normalizeActivity(row) {
    const date = String(row.Date || "").trim();
    const dateObject = parseDateOnly(date);
    const location = String(row.Location || "").trim();
    return {
      id: activityId(row),
      date,
      dateObject,
      monthKey: dateObject ? `${dateObject.getFullYear()}-${pad(dateObject.getMonth() + 1)}` : "",
      monthLabel: dateObject ? dateObject.toLocaleDateString([], { month: "long", year: "numeric" }) : "",
      time: String(row.Time || row.StartTime || row.EventTime || "").trim(),
      eventName: String(row.EventName || "").trim(),
      description: String(row.Description || "").trim(),
      location,
      photos: String(row.Photos || row.Photo || row.PhotoURL || "").split(",").map((url) => url.trim()).filter(Boolean),
      confirmedCount: Number.parseInt(row.confirmed_count || row.ConfirmedCount || row.Confirmed || "0", 10) || 0,
      rsvpUserIds: String(row.rsvp_user_ids || row.RSVPUserIds || row.RsvpUserIds || "").split(/[,\s]+/).map((id) => id.trim()).filter(Boolean)
    };
  }

  function activityId(row) {
    return [row.Date, row.Time, row.EventName, row.Location]
      .map((value) => String(value || "").trim().toLowerCase())
      .join("|") || `activity-${Math.random().toString(16).slice(2)}`;
  }

  function activityStatus(dateObject) {
    const diff = daysUntil(dateObject);
    if (diff === null) return { kind: "upcoming", label: "Upcoming" };
    if (diff < 0) return { kind: "past", label: "Past" };
    if (diff === 0) return { kind: "soon", label: "Today" };
    if (diff <= 7) return { kind: "soon", label: `In ${diff} day${diff === 1 ? "" : "s"}` };
    return { kind: "upcoming", label: "Upcoming" };
  }

  function activityRsvpState(activity) {
    const userId = getRsvpUserId();
    const saved = getSavedActivityRsvps();
    const inBackend = activity.rsvpUserIds.includes(userId);
    const going = inBackend || Boolean(saved[activity.id]);
    return {
      going,
      count: activity.confirmedCount + (saved[activity.id] && !inBackend ? 1 : 0)
    };
  }

  function getRsvpUserId() {
    const key = "dfcRsvpUserId";
    let userId = localStorage.getItem(key);
    if (!userId) {
      userId = `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(key, userId);
    }
    return userId;
  }

  function getSavedActivityRsvps() {
    try {
      const value = JSON.parse(localStorage.getItem("dfcActivityRsvps") || "{}");
      return value && typeof value === "object" ? value : {};
    } catch (error) {
      return {};
    }
  }

  function saveActivityRsvp(activityIdValue) {
    const saved = getSavedActivityRsvps();
    saved[activityIdValue] = true;
    localStorage.setItem("dfcActivityRsvps", JSON.stringify(saved));
  }

  async function initBirthdayCalendar() {
    const grid = document.getElementById("birthdayCalendarGrid");
    const heading = document.getElementById("birthdayCurrentMonth");
    const upcomingList = document.getElementById("birthdayUpcomingList");
    const prev = document.getElementById("birthdayPrevMonth");
    const next = document.getElementById("birthdayNextMonth");
    if (!grid || !heading || !upcomingList) return;

    const rows = await fetchSheet("Birthdays", sampleData.Birthdays);
    const birthdays = rows.map(normalizeBirthday).filter((birthday) => birthday.name && birthday.birthdate);
    const state = { month: new Date() };
    state.month.setDate(1);

    const render = () => {
      renderBirthdayCalendar(grid, heading, state.month, birthdays);
      renderUpcomingBirthdays(upcomingList, birthdays);
    };

    if (prev) prev.addEventListener("click", () => {
      state.month.setMonth(state.month.getMonth() - 1);
      render();
    });
    if (next) next.addEventListener("click", () => {
      state.month.setMonth(state.month.getMonth() + 1);
      render();
    });

    render();
  }

  function renderBirthdayCalendar(grid, heading, monthDate, birthdays) {
    grid.innerHTML = "";
    heading.textContent = monthDate.toLocaleDateString([], { month: "long", year: "numeric" });
    ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((day) => {
      grid.appendChild(element("div", "birthday-weekday", day));
    });

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let index = 0; index < firstDay; index += 1) {
      grid.appendChild(element("div", "birthday-day is-muted", ""));
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const matches = birthdays.filter((birthday) => birthday.month === month && birthday.day === day);
      const cell = element("div", matches.length ? "birthday-day has-birthday" : "birthday-day");
      cell.appendChild(element("strong", "birthday-day-number", String(day)));
      if (matches.length) {
        cell.appendChild(element("span", "birthday-cake", "🎂"));
        const names = element("small", "birthday-names", matches.map((birthday) => birthday.name).join(", "));
        cell.appendChild(names);
      }
      grid.appendChild(cell);
    }
  }

  function renderUpcomingBirthdays(container, birthdays) {
    container.innerHTML = "";
    if (!birthdays.length) {
      container.appendChild(element("p", "empty-state", "No birthday records yet."));
      return;
    }

    upcomingBirthdays(birthdays).slice(0, 8).forEach((birthday) => {
      const item = element("article", "birthday-item");
      const copy = element("div", "");
      copy.append(
        element("strong", "", birthday.name),
        element("span", "", `${birthday.nextDate.toLocaleDateString([], { month: "short", day: "numeric" })} - ${birthday.ministry || "Ministry TBA"}`)
      );
      item.append(copy, element("b", "birthday-countdown", birthdayCountdownText(birthday.daysAway)));
      container.appendChild(item);
    });
  }

  function upcomingBirthdays(birthdays) {
    const today = todayMidnight();
    return birthdays.map((birthday) => {
      const nextDate = new Date(today.getFullYear(), birthday.month, birthday.day);
      if (nextDate < today) nextDate.setFullYear(nextDate.getFullYear() + 1);
      return {
        ...birthday,
        nextDate,
        daysAway: Math.round((nextDate - today) / 86400000)
      };
    }).sort((a, b) => a.daysAway - b.daysAway);
  }

  function normalizeBirthday(row) {
    const birthdate = String(row.Birthdate || row.Birthday || row.DateOfBirth || "").trim();
    const date = parseDateOnly(birthdate);
    return {
      name: String(row.Name || row.MemberName || "").trim(),
      birthdate,
      ministry: String(row.Ministry || row.Role || row.Team || "").trim(),
      month: date ? date.getMonth() : -1,
      day: date ? date.getDate() : -1
    };
  }

  function birthdayCountdownText(daysAway) {
    if (daysAway === 0) return "Today";
    if (daysAway === 1) return "Tomorrow";
    return `In ${daysAway} days`;
  }

  function parseDateOnly(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    const parts = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = parts
      ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
      : new Date(text);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function daysUntil(dateObject) {
    if (!dateObject) return null;
    return Math.round((dateObject - todayMidnight()) / 86400000);
  }

  function todayMidnight() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function formatActivityTime(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const match = text.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return text;
    const date = new Date();
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function selectOption(value, text) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    return option;
  }

  function initActivityTabs() {
    const tabs = Array.from(document.querySelectorAll("[data-activity-tab]"));
    const panels = Array.from(document.querySelectorAll("[data-activity-panel]"));
    if (!tabs.length || !panels.length) return;

    const showTab = (name) => {
      tabs.forEach((tab) => {
        const isActive = tab.dataset.activityTab === name;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.activityPanel === name;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      if (window.location.hash !== `#${name}`) {
        history.replaceState(null, "", `#${name}`);
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => showTab(tab.dataset.activityTab));
    });

    const requestedTab = window.location.hash.replace("#", "");
    if (tabs.some((tab) => tab.dataset.activityTab === requestedTab)) showTab(requestedTab);
  }

  function initActivityAlbums() {
    const form = document.getElementById("albumCreateForm");
    const nameInput = document.getElementById("albumName");
    const list = document.getElementById("albumList");
    const detail = document.getElementById("albumDetail");
    const count = document.getElementById("albumCount");
    const status = document.getElementById("albumStorageStatus");
    if (!form || !nameInput || !list || !detail || !count) return;

    const storageKey = "dfcActivityPhotoAlbums";
    let cloudAlbumsEnabled = isPhotoAlbumsCloudConfigured();
    let albums = [];
    let selectedAlbumId = "";
    let isBusy = false;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = nameInput.value.trim();
      if (!name || isBusy) return;

      if (cloudAlbumsEnabled) {
        await runCloudMutation("Creating album...", async () => {
          const result = await photoAlbumRequest({ action: "createAlbum", name });
          albums = normalizeCloudAlbums(result.albums);
          selectedAlbumId = result.album && result.album.id ? result.album.id : albums[0]?.id || "";
          nameInput.value = "";
        });
      } else {
        const album = {
          id: `album-${Date.now()}`,
          name,
          createdAt: new Date().toISOString(),
          photos: []
        };
        albums.unshift(album);
        selectedAlbumId = album.id;
        saveAlbums(storageKey, albums);
        nameInput.value = "";
        renderAlbums();
      }
    });

    loadInitialAlbums();

    async function loadInitialAlbums() {
      list.innerHTML = "";
      list.appendChild(element("p", "album-note", "Loading albums..."));
      if (cloudAlbumsEnabled) {
        try {
          albums = normalizeCloudAlbums(await loadCloudAlbums());
          selectedAlbumId = albums[0]?.id || "";
          setAlbumStatus("Cloud album storage is connected. Albums and photos are shared online.", "success");
        } catch (error) {
          cloudAlbumsEnabled = false;
          albums = loadAlbums(storageKey);
          selectedAlbumId = albums[0]?.id || "";
          setAlbumStatus(`Cloud album storage could not load, so this browser is using device-only fallback. ${friendlyCloudAlbumError(error)}`, "error");
        }
      } else {
        albums = loadAlbums(storageKey);
        selectedAlbumId = albums[0]?.id || "";
        setAlbumStatus("Cloud album storage is not configured yet. Albums are saved on this device only.", "error");
      }
      renderAlbums();
    }

    function renderAlbums() {
      count.textContent = String(albums.length);
      list.innerHTML = "";

      if (!albums.length) {
        list.appendChild(element("p", "album-note", "No albums yet."));
        renderAlbumDetail(null);
        return;
      }

      albums.forEach((album) => {
        const button = element("button", album.id === selectedAlbumId ? "album-item is-active" : "album-item");
        button.type = "button";
        button.append(
          element("strong", "", album.name),
          element("span", "", `${album.photos.length} photo${album.photos.length === 1 ? "" : "s"}`)
        );
        button.addEventListener("click", () => {
          selectedAlbumId = album.id;
          renderAlbums();
        });
        list.appendChild(button);
      });

      renderAlbumDetail(albums.find((album) => album.id === selectedAlbumId) || albums[0]);
    }

    function renderAlbumDetail(album) {
      detail.innerHTML = "";

      if (!album) {
        const empty = element("div", "album-empty");
        empty.append(
          element("span", "card-kicker", "Activity Photos"),
          element("h2", "", "Create an album to start adding photos."),
          element("p", "", "Albums keep your church activity memories organized and easy to browse.")
        );
        detail.appendChild(empty);
        return;
      }

      selectedAlbumId = album.id;
      const header = element("div", "album-detail-head");
      const copy = element("div", "");
      copy.append(
        element("span", "card-kicker", "Selected Album"),
        element("h2", "", album.name),
        element("p", "", `${album.photos.length} photo${album.photos.length === 1 ? "" : "s"} saved in this album.`)
      );

      const uploadLabel = element("label", "gold-action upload-label", "Upload Photos");
      uploadLabel.htmlFor = "albumPhotoUpload";
      const uploadInput = document.createElement("input");
      uploadInput.type = "file";
      uploadInput.id = "albumPhotoUpload";
      uploadInput.accept = "image/*";
      uploadInput.multiple = true;
      uploadInput.hidden = true;
      uploadInput.addEventListener("change", async () => {
        await addPhotosToAlbum(album.id, uploadInput.files);
        uploadInput.value = "";
      });

      const actions = element("div", "album-actions");
      const editButton = element("button", "ghost-action", "Edit Title");
      editButton.type = "button";
      editButton.disabled = isBusy;
      editButton.addEventListener("click", () => renameAlbum(album.id));

      const deleteButton = element("button", "danger-action", "Delete Album");
      deleteButton.type = "button";
      deleteButton.disabled = isBusy;
      deleteButton.addEventListener("click", () => deleteAlbum(album.id));

      actions.append(uploadLabel, editButton, deleteButton, uploadInput);
      header.append(copy, actions);
      detail.appendChild(header);

      if (!album.photos.length) {
        const empty = element("div", "album-empty compact");
        empty.append(
          element("span", "card-kicker", "No Photos Yet"),
          element("h2", "", "Use the upload button to add pictures."),
          element("p", "", "You can select multiple image files at once.")
        );
        detail.appendChild(empty);
        return;
      }

      const grid = element("div", "album-photo-grid");
      album.photos.forEach((photo) => {
        const card = element("article", "album-photo-card");
        const button = element("button", "album-photo-button");
        button.type = "button";
        button.setAttribute("aria-label", `View ${photo.name || album.name} full size`);
        const image = document.createElement("img");
        image.src = photo.displaySrc || driveImageDisplayUrl(photo.src, photo.fileId);
        image.alt = photo.name || `${album.name} photo`;
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";
        image.addEventListener("error", () => {
          if (image.dataset.fallbackTried) return;
          image.dataset.fallbackTried = "true";
          image.src = photo.src;
        });
        button.appendChild(image);
        button.addEventListener("click", () => openPhotoViewer(photo, album.name));

        const meta = element("div", "album-photo-meta");
        meta.appendChild(element("strong", "", formatStoredPhotoDate(photo.createdAt)));

        const photoActions = element("div", "album-photo-actions");
        const deletePhotoButton = element("button", "danger-action small-action", "Delete Photo");
        deletePhotoButton.type = "button";
        deletePhotoButton.disabled = isBusy;
        deletePhotoButton.addEventListener("click", () => deletePhoto(album.id, photo.id));
        photoActions.appendChild(deletePhotoButton);

        card.append(button, meta, photoActions);
        grid.appendChild(card);
      });
      detail.appendChild(grid);
    }

    async function renameAlbum(albumId) {
      const album = albums.find((item) => item.id === albumId);
      if (!album) return;

      const nextName = prompt("Edit album title:", album.name);
      if (nextName === null) return;

      const trimmedName = nextName.trim();
      if (!trimmedName) {
        alert("Album title cannot be blank.");
        return;
      }

      if (cloudAlbumsEnabled) {
        await runCloudMutation("Saving album title...", async () => {
          const result = await photoAlbumRequest({ action: "renameAlbum", albumId, name: trimmedName });
          albums = normalizeCloudAlbums(result.albums);
          selectedAlbumId = albumId;
        });
      } else {
        album.name = trimmedName;
        saveAlbums(storageKey, albums);
        renderAlbums();
      }
    }

    async function deleteAlbum(albumId) {
      const album = albums.find((item) => item.id === albumId);
      if (!album) return;

      const confirmed = confirm(`Are you sure you want to delete the album "${album.name}" and all photos inside it?`);
      if (!confirmed) return;

      if (cloudAlbumsEnabled) {
        await runCloudMutation("Deleting album...", async () => {
          const result = await photoAlbumRequest({ action: "deleteAlbum", albumId });
          albums = normalizeCloudAlbums(result.albums);
          selectedAlbumId = albums[0]?.id || "";
        });
      } else {
        albums = albums.filter((item) => item.id !== albumId);
        selectedAlbumId = albums[0] ? albums[0].id : "";
        saveAlbums(storageKey, albums);
        renderAlbums();
      }
    }

    async function deletePhoto(albumId, photoId) {
      const album = albums.find((item) => item.id === albumId);
      if (!album) return;

      const confirmed = confirm("Are you sure you want to delete this photo?");
      if (!confirmed) return;

      if (cloudAlbumsEnabled) {
        await runCloudMutation("Deleting photo...", async () => {
          const result = await photoAlbumRequest({ action: "deletePhoto", photoId });
          albums = normalizeCloudAlbums(result.albums);
          selectedAlbumId = albumId;
        });
      } else {
        album.photos = album.photos.filter((photo) => photo.id !== photoId);
        saveAlbums(storageKey, albums);
        renderAlbums();
      }
    }

    async function addPhotosToAlbum(albumId, fileList) {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const maxBytes = cloudAlbumsEnabled ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
      const album = albums.find((item) => item.id === albumId);
      if (!album || isBusy) return;

      if (cloudAlbumsEnabled) {
        const photos = [];
        for (const file of files) {
          if (!file.type.startsWith("image/")) continue;
          if (file.size > maxBytes) {
            alert(`${file.name} is larger than 5 MB. Please choose a smaller photo.`);
            continue;
          }
          const src = await readFileAsDataUrl(file);
          photos.push({
            filename: file.name,
            mimeType: file.type,
            base64: src.split(",")[1] || ""
          });
        }
        if (!photos.length) return;
        await runCloudMutation("Uploading photos...", async () => {
          const result = await photoAlbumRequest({ action: "uploadPhotos", albumId, photos });
          albums = normalizeCloudAlbums(result.albums);
          selectedAlbumId = albumId;
        });
        return;
      }

      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > maxBytes) {
          alert(`${file.name} is larger than 2 MB. Please choose a smaller photo for local storage.`);
          continue;
        }
        const src = await readFileAsDataUrl(file);
        album.photos.unshift({
          id: `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          src,
          createdAt: new Date().toISOString()
        });
      }

      try {
        saveAlbums(storageKey, albums);
      } catch (error) {
        alert("These photos could not be saved because browser storage is full. Try smaller images or fewer photos.");
      }
      renderAlbums();
    }

    async function runCloudMutation(workingMessage, mutation) {
      try {
        isBusy = true;
        setAlbumStatus(workingMessage, "");
        renderAlbums();
        await mutation();
        setAlbumStatus("Cloud album storage is connected. Albums and photos are shared online.", "success");
      } catch (error) {
        const message = friendlyCloudAlbumError(error);
        setAlbumStatus(`Cloud album storage error: ${message}`, "error");
        alert(`Cloud album storage error: ${message}`);
      } finally {
        isBusy = false;
        renderAlbums();
      }
    }

    function setAlbumStatus(message, type) {
      if (!status) return;
      status.textContent = message;
      status.className = type ? `album-status ${type}` : "album-status";
    }
  }

  function isPhotoAlbumsCloudConfigured() {
    const url = String(window.PHOTO_ALBUMS_SCRIPT_URL || "").trim();
    return Boolean(url) && !url.includes("PASTE_PHOTO_ALBUMS");
  }

  async function loadCloudAlbums() {
    const result = await fetchPhotoAlbumsJson(window.PHOTO_ALBUMS_SCRIPT_URL);
    if (!result.success) throw new Error(result.error || "Could not load shared albums.");
    return result.albums || [];
  }

  async function photoAlbumRequest(payload) {
    const result = await fetchPhotoAlbumsJson(window.PHOTO_ALBUMS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (!result.success) throw new Error(result.error || "Album request failed.");
    return result;
  }

  async function fetchPhotoAlbumsJson(url, options = {}) {
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      ...options
    });
    const text = await response.text();
    let result = null;
    try {
      result = JSON.parse(text);
    } catch (error) {
      const preview = text.trim().slice(0, 120);
      throw new Error(`The photo album Web App did not return JSON. HTTP ${response.status}${preview ? `: ${preview}` : ""}`);
    }
    if (!response.ok) {
      throw new Error(result.error || `The photo album Web App returned HTTP ${response.status}.`);
    }
    return result;
  }

  function friendlyCloudAlbumError(error) {
    const message = error && error.message ? error.message : "Unknown error.";
    const usingFilePage = window.location.protocol === "file:";
    if (/Failed to fetch/i.test(message)) {
      return `${message} Open this site through GitHub Pages or a local http:// server, not file://, and verify the Apps Script URL opens directly to JSON.`;
    }
    if (/HTTP 404|not return JSON/i.test(message)) {
      return `${message} Open Deploy > Manage deployments in Apps Script, edit the Web App deployment, choose a new version, set access to Anyone, and copy the Web app URL ending in /exec.`;
    }
    return usingFilePage
      ? `${message} This page is currently opened as file://; test cloud storage through GitHub Pages or a local http:// server.`
      : message;
  }

  function normalizeCloudAlbums(albums) {
    return Array.isArray(albums)
      ? albums.map((album) => ({
          id: album.id || album.AlbumId,
          name: album.name || album.Name || "Untitled Album",
          createdAt: album.createdAt || album.CreatedAt || "",
          photos: normalizeCloudPhotos(album.photos || [])
        }))
      : [];
  }

  function normalizeCloudPhotos(photos) {
    return Array.isArray(photos)
      ? photos.map((photo) => {
          const src = photo.src || photo.url || photo.Url || "";
          const fileId = photo.fileId || photo.FileId || extractDriveFileId(src);
          return {
            id: photo.id || photo.PhotoId,
            name: photo.name || photo.Filename || "Activity photo",
            src,
            displaySrc: photo.displaySrc || photo.thumbnailUrl || driveImageDisplayUrl(src, fileId),
            fileId,
            createdAt: photo.createdAt || photo.CreatedAt || ""
          };
        }).filter((photo) => photo.id && photo.src)
      : [];
  }

  function loadAlbums(storageKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      return [];
    }
  }

  function saveAlbums(storageKey, albums) {
    localStorage.setItem(storageKey, JSON.stringify(albums));
  }

  function formatStoredPhotoDate(value) {
    if (!value) return "Saved photo";
    return new Date(value).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function driveImageDisplayUrl(url, fileId) {
    const id = fileId || extractDriveFileId(url);
    return id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000` : url;
  }

  function extractDriveFileId(url) {
    const value = String(url || "");
    const queryMatch = value.match(/[?&]id=([^&]+)/);
    if (queryMatch) return decodeURIComponent(queryMatch[1]);
    const fileMatch = value.match(/\/file\/d\/([^/]+)/);
    return fileMatch ? decodeURIComponent(fileMatch[1]) : "";
  }

  function openPhotoViewer(photo, albumName) {
    const viewer = getPhotoViewer();
    const image = viewer.querySelector("[data-photo-viewer-image]");
    const title = viewer.querySelector("[data-photo-viewer-title]");
    const meta = viewer.querySelector("[data-photo-viewer-meta]");
    const download = viewer.querySelector("[data-photo-viewer-download]");

    image.src = photo.displaySrc || driveImageDisplayUrl(photo.src, photo.fileId);
    image.alt = photo.name || `${albumName} photo`;
    title.textContent = formatStoredPhotoDate(photo.createdAt);
    meta.textContent = `${albumName || "Activity album"} - ${formatStoredPhotoDate(photo.createdAt)}`;
    download.href = photo.src;
    download.download = safeDownloadName(photo.name || `${albumName || "activity-photo"}.png`);

    viewer.classList.add("is-open");
    viewer.setAttribute("aria-hidden", "false");
    viewer.querySelector("[data-photo-viewer-close]").focus();
  }

  function getPhotoViewer() {
    let viewer = document.getElementById("photoViewer");
    if (viewer) return viewer;

    viewer = element("div", "photo-viewer");
    viewer.id = "photoViewer";
    viewer.setAttribute("aria-hidden", "true");
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Full photo view");

    const panel = element("div", "photo-viewer-panel");
    const close = element("button", "photo-viewer-close", "x");
    close.type = "button";
    close.setAttribute("aria-label", "Close full photo view");
    close.dataset.photoViewerClose = "true";

    const image = document.createElement("img");
    image.dataset.photoViewerImage = "true";

    const footer = element("div", "photo-viewer-footer");
    const copy = element("div", "");
    copy.append(
      element("h2", "", ""),
      element("p", "", "")
    );
    copy.querySelector("h2").dataset.photoViewerTitle = "true";
    copy.querySelector("p").dataset.photoViewerMeta = "true";

    const download = element("a", "gold-action photo-download", "Download Photo");
    download.dataset.photoViewerDownload = "true";

    footer.append(copy, download);
    panel.append(close, image, footer);
    viewer.appendChild(panel);
    document.body.appendChild(viewer);

    const closeViewer = () => {
      viewer.classList.remove("is-open");
      viewer.setAttribute("aria-hidden", "true");
    };
    close.addEventListener("click", closeViewer);
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) closeViewer();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && viewer.classList.contains("is-open")) closeViewer();
    });

    return viewer;
  }

  function safeDownloadName(filename) {
    return String(filename).trim().replace(/[\\/:*?"<>|]/g, "-") || "activity-photo.png";
  }

  function photoRecordsFromActivity(row) {
    return String(row.Photos || row.Photo || row.PhotoURL || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({
        url,
        date: row.Date,
        eventName: row.EventName,
        location: row.Location
      }));
  }

  function initAddActivityForm() {
    const modal = document.getElementById("activityModal");
    const openButton = document.getElementById("openActivityModal");
    const closeButton = document.getElementById("closeActivityModal");
    const form = document.getElementById("addActivityForm");
    if (!modal || !openButton || !closeButton || !form) return;

    const status = document.getElementById("activityFormStatus");
    const submitButton = document.getElementById("submitActivity");
    const fileInput = document.getElementById("activityPhotos");

    document.querySelectorAll("#openActivityModal, [data-open-activity-modal]").forEach((button) => {
      button.addEventListener("click", () => openModal(modal));
    });
    closeButton.addEventListener("click", () => closeModal(modal));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal(modal);
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 6) {
        showStatus(status, "Please choose up to 6 photos only.", "error");
        fileInput.value = "";
      } else {
        showStatus(status, "", "");
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const scriptUrl = window.ADD_ACTIVITY_SCRIPT_URL || "";
      const defaultSubmitText = submitButton.textContent;
      if (!scriptUrl || scriptUrl.includes("PASTE_APPS_SCRIPT_URL")) {
        showStatus(status, "Activity submissions are not configured yet.", "error");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
      showStatus(status, "Uploading your activity. Please wait...", "");

      try {
        const photos = await filesToPayload(fileInput.files);
        const payload = {
          date: document.getElementById("activityDate").value,
          time: document.getElementById("activityTime").value,
          eventName: document.getElementById("activityEventName").value.trim(),
          description: document.getElementById("activityDescription").value.trim(),
          location: document.getElementById("activityLocation").value.trim(),
          photos
        };

        const response = await fetch(scriptUrl, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "Submission failed");

        form.reset();
        showStatus(status, "Thanks! Your submission has been sent and will appear once approved.", "success");
      } catch (error) {
        showStatus(status, error.message || "Sorry, something went wrong. Please try again.", "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = defaultSubmitText;
      }
    });
  }

  function openModal(modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function showStatus(element, message, kind) {
    element.textContent = message;
    element.className = kind ? `form-status ${kind}` : "form-status";
  }

  async function filesToPayload(fileList) {
    const files = Array.from(fileList || []);
    if (files.length > 6) throw new Error("Please choose up to 6 photos only.");

    const maxBytes = 5 * 1024 * 1024;
    return Promise.all(files.map(async (file) => {
      if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
      if (file.size > maxBytes) throw new Error(`${file.name} is larger than 5 MB.`);
      const dataUrl = await readFileAsDataUrl(file);
      return {
        filename: file.name,
        mimeType: file.type,
        base64: dataUrl.split(",")[1] || ""
      };
    }));
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
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
      {
        label: "This Sunday",
        icon: "calendar",
        primary: nextService.Date || "TBA",
        secondary: nextService.WorshipLeader ? `Worship Leader: ${nextService.WorshipLeader}` : "Leader TBA",
        badge: relativeDateBadge(nextService.Date)
      },
      {
        label: "Next Assignment",
        icon: "microphone",
        primary: nextAssignment.Name || "TBA",
        secondary: nextAssignment.Role || "Role TBA"
      },
      {
        label: "Upcoming Activities",
        icon: "people",
        primary: nextActivity.EventName || "Activity TBA",
        secondary: nextActivity.Date || "Date TBA"
      },
      {
        label: "Prayer & Fasting",
        icon: "prayer",
        primary: formatPrayerPeriod(prayerPeriod),
        secondary: prayerPeriod.Theme || prayerPeriod.PrayerPoints || "Prayer focus TBA"
      }
    ].forEach((item) => {
      const card = element("article", "summary-card");
      const header = element("div", "summary-card-head");
      header.append(dashboardIcon(item.icon), element("span", "", item.label));
      if (item.badge) header.appendChild(element("b", "summary-badge", item.badge));

      const body = element("div", "summary-card-body");
      body.append(
        element("strong", "", item.primary),
        element("p", "", item.secondary)
      );
      card.append(header, body);
      container.appendChild(card);
    });
  }

  function dashboardIcon(name) {
    const icons = {
      calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4M16 2v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/></svg>',
      microphone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4a4 4 0 0 0 4 4Z"/><path d="M19 10a7 7 0 0 1-14 0M12 17v5M8 22h8"/></svg>',
      people: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z"/><path d="M3 21a9 9 0 0 1 18 0M18 8a3 3 0 0 1 3 3M6 8a3 3 0 0 0-3 3"/></svg>',
      prayer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v8l-3 4a3 3 0 0 0 5 3l2-3M16 3v8l3 4a3 3 0 0 1-5 3l-2-3M12 3v19"/></svg>'
    };
    const wrapper = element("i", "summary-icon");
    wrapper.innerHTML = icons[name] || icons.calendar;
    return wrapper;
  }

  function relativeDateBadge(value) {
    if (!value) return "";
    const target = new Date(`${value}T00:00:00`);
    if (Number.isNaN(target.getTime())) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - today) / 86400000);
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "tomorrow";
    if (diffDays > 1) return `in ${diffDays} days`;
    if (diffDays === -1) return "yesterday";
    return `${Math.abs(diffDays)} days ago`;
  }

  function renderMiniCountdown(container) {
    const now = new Date();
    const target = nextSundayAtEight(now);
    const diff = Math.max(0, target - now);
    const totalSeconds = Math.floor(diff / 1000);
    container.textContent = `${pad(Math.floor(totalSeconds / 86400))} : ${pad(Math.floor((totalSeconds % 86400) / 3600))} : ${pad(Math.floor((totalSeconds % 3600) / 60))} : ${pad(totalSeconds % 60)}`;

    const progress = document.getElementById("serviceWeekProgress");
    if (progress) {
      const previousService = new Date(target.getTime() - 7 * 86400000);
      const elapsed = Math.min(1, Math.max(0, (now - previousService) / (target - previousService)));
      progress.style.width = `${Math.round(elapsed * 100)}%`;
    }

    const sticky = document.getElementById("stickyCountdown");
    if (sticky) {
      sticky.textContent = `Next service in ${Math.floor(totalSeconds / 86400)}d ${pad(Math.floor((totalSeconds % 86400) / 3600))}h ${pad(Math.floor((totalSeconds % 3600) / 60))}m`;
    }
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

  function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
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

