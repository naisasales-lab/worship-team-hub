(function () {
  const sampleData = {
    Activities: [
      { Date: "2026-07-26", EventName: "PAW Rehearsal", Description: "Full band and vocal preparation for Sunday service.", Location: "Main Sanctuary", Photos: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80", Status: "Approved" },
      { Date: "2026-08-02", EventName: "Worship Workshop", Description: "Training, devotion, and practical worship team coaching.", Location: "Fellowship Hall", Photos: "https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=900&q=80", Status: "Approved" }
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

  initActivityTabs();
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

    if (window.location.hash === "#photos") showTab("photos");
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
    return String(row.Photos || "")
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

