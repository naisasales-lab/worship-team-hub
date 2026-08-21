/*
 * Publish each Google Sheet tab to the web as CSV, then paste each tab's CSV
 * URL below. A real published CSV URL looks like:
 * https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxxx/pub?gid=123456&single=true&output=csv
 */
const SHEET_URLS = {
  ServiceInfo: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWAgQp41RDz-hGEznGI2ZvgMy53OcjuMcM_62LZl_-ZsYa73n7PsxKnC5U-OXbDzZSCBd9EJpoinwd/pub?gid=1143737837&single=true&output=csv",
  Songs: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWAgQp41RDz-hGEznGI2ZvgMy53OcjuMcM_62LZl_-ZsYa73n7PsxKnC5U-OXbDzZSCBd9EJpoinwd/pub?gid=698579204&single=true&output=csv",
  Activities: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWAgQp41RDz-hGEznGI2ZvgMy53OcjuMcM_62LZl_-ZsYa73n7PsxKnC5U-OXbDzZSCBd9EJpoinwd/pub?gid=551329346&single=true&output=csv",
  Assignments: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWAgQp41RDz-hGEznGI2ZvgMy53OcjuMcM_62LZl_-ZsYa73n7PsxKnC5U-OXbDzZSCBd9EJpoinwd/pub?gid=1689033600&single=true&output=csv",
  YouthFellowship: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWAgQp41RDz-hGEznGI2ZvgMy53OcjuMcM_62LZl_-ZsYa73n7PsxKnC5U-OXbDzZSCBd9EJpoinwd/pub?gid=1520137634&single=true&output=csv",
  PrayerFasting: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWAgQp41RDz-hGEznGI2ZvgMy53OcjuMcM_62LZl_-ZsYa73n7PsxKnC5U-OXbDzZSCBd9EJpoinwd/pub?gid=984236217&single=true&output=csv",
  Birthdays: "PASTE_PUBLISHED_CSV_URL_FOR_BIRTHDAYS_TAB"
};

// Web App URL for the public Add Activity submission form.
// Deploy backend/AddActivity.gs as a Google Apps Script Web App, then paste
// the resulting .../exec URL here.
const ADD_ACTIVITY_SCRIPT_URL = "PASTE_APPS_SCRIPT_URL_HERE";

// Web App URL for shared Activity Photo Albums.
// Deploy backend/PhotoAlbums.gs as a Google Apps Script Web App connected to
// your Google Sheet and Drive folder, then paste the resulting .../exec URL.
// When this placeholder is unchanged, albums fall back to this browser only.
const PHOTO_ALBUMS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzqd6CdEkgHq0LMGuuRRhpu1GIeLwpaKI9SaXvER9VQuTL7c7_qdB4vsMV7Cw8EmjK2/exec";

window.SHEET_URLS = SHEET_URLS;
window.ADD_ACTIVITY_SCRIPT_URL = ADD_ACTIVITY_SCRIPT_URL;
window.PHOTO_ALBUMS_SCRIPT_URL = PHOTO_ALBUMS_SCRIPT_URL;
window.APP_CONFIG = {
  CHURCH_NAME: "Door of Faith Church",
  SITE_NAME: "Worship Team Hub",
  SUNDAY_SERVICE_HOUR: 8
};
