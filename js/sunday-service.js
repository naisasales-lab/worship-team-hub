const fallbackServiceInfo = [
  { Date: "2026-07-26", WorshipLeader: "Jane Reyes", APM: "Mark Santos", ColorAssignment: "Red", ColorHex: "#c0392b" }
];

const fallbackSongs = [
  { Date: "2026-07-26", Group: "Praise", SongNumber: "1", Title: "Great Are You Lord", Singer: "All Sons & Daughters", OriginalKey: "G", MyKey: "A", LyricsURL: "https://www.google.com/search?q=Great+Are+You+Lord+lyrics", YouTubeURL: "https://www.youtube.com/" },
  { Date: "2026-07-26", Group: "Praise", SongNumber: "2", Title: "Praise", Singer: "Elevation Worship", OriginalKey: "Bb", MyKey: "A", LyricsURL: "https://www.google.com/search?q=Praise+Elevation+Worship+lyrics", YouTubeURL: "https://www.youtube.com/" },
  { Date: "2026-07-26", Group: "Worship", SongNumber: "1", Title: "Build My Life", Singer: "Housefires", OriginalKey: "D", MyKey: "E", LyricsURL: "https://www.google.com/search?q=Build+My+Life+lyrics", YouTubeURL: "https://www.youtube.com/" },
  { Date: "2026-07-26", Group: "Worship", SongNumber: "2", Title: "Goodness of God", Singer: "Bethel Music", OriginalKey: "Ab", MyKey: "G", LyricsURL: "https://www.google.com/search?q=Goodness+of+God+lyrics", YouTubeURL: "https://www.youtube.com/" }
];

function updateCountdown() {
  const now = new Date();
  const target = window.DFC.nextSundayAtEight(now);
  const diff = Math.max(0, target - now);
  const totalSeconds = Math.floor(diff / 1000);

  setText("days", window.DFC.pad(Math.floor(totalSeconds / 86400)));
  setText("hours", window.DFC.pad(Math.floor((totalSeconds % 86400) / 3600)));
  setText("minutes", window.DFC.pad(Math.floor((totalSeconds % 3600) / 60)));
  setText("seconds", window.DFC.pad(totalSeconds % 60));
  setText("currentTime", now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }));
}

async function loadSundayService() {
  const serviceRows = await window.DFC.fetchSheet("ServiceInfo", fallbackServiceInfo);
  const songRows = await window.DFC.fetchSheet("Songs", fallbackSongs);
  const info = serviceRows[0] || {};

  setText("serviceDate", info.Date || "TBA");
  setText("worshipLeader", info.WorshipLeader || "TBA");
  setText("apm", info.APM || "TBA");
  setText("colorAssignment", info.ColorAssignment || "TBA");

  const dot = document.getElementById("colorDot");
  if (dot) dot.style.background = info.ColorHex || colorFromAssignment(info.ColorAssignment);

  renderSongs("praiseSongs", songRows.filter((song) => String(song.Group || "").toLowerCase() === "praise"));
  renderSongs("worshipSongs", songRows.filter((song) => String(song.Group || "").toLowerCase() === "worship"));
}

function renderSongs(id, songs) {
  const list = document.getElementById(id);
  list.innerHTML = "";

  if (!songs.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Songs will appear here.";
    list.appendChild(empty);
    return;
  }

  songs
    .sort((a, b) => Number(a.SongNumber || 0) - Number(b.SongNumber || 0))
    .forEach((song) => list.appendChild(songCard(song)));
}

function songCard(song) {
  const card = document.createElement("article");
  card.className = "song-card";

  const number = element("div", "song-number", `${song.SongNumber || ""}.`);
  const body = element("div", "song-body");
  const actions = element("div", "song-actions");

  body.append(
    element("h3", "", song.Title || "Untitled Song"),
    element("p", "song-singer", song.Singer || "Singer TBA")
  );

  const keys = element("div", "song-keys");
  keys.append(keyPill("Original Key", song.OriginalKey), keyPill("My Key", song.MyKey));
  body.appendChild(keys);

  actions.append(linkButton("Lyrics", song.LyricsURL), linkButton("YouTube", song.YouTubeURL));
  card.append(number, body, actions);
  return card;
}

function keyPill(label, value) {
  const pill = element("span", "");
  pill.append(`${label}: `, element("strong", "", value || "-"));
  return pill;
}

function linkButton(label, href) {
  const link = element("a", "song-btn", label);
  if (href) {
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener";
  } else {
    link.href = "#";
    link.classList.add("disabled");
    link.setAttribute("aria-disabled", "true");
  }
  return link;
}

function colorFromAssignment(value) {
  const normalized = String(value || "").toLowerCase();
  const colors = [
    ["teal", "#008080"], ["red", "#e53935"], ["blue", "#1e88e5"],
    ["green", "#43a047"], ["yellow", "#ffd700"], ["gold", "#d4af37"],
    ["purple", "#8e24aa"], ["black", "#111"], ["white", "#fff"]
  ];
  const match = colors.find(([name]) => normalized.includes(name));
  return match ? match[1] : "#d4af37";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

updateCountdown();
setInterval(updateCountdown, 1000);
loadSundayService();
