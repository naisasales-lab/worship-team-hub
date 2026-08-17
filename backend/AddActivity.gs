/**
 * Public Add Activity submission endpoint for Worship Team Hub.
 *
 * Manual setup:
 * 1. Create a Google Drive folder for submitted photos.
 * 2. Copy the folder ID from its URL and paste it into PHOTOS_FOLDER_ID below.
 * 3. In the Google Sheet, open Extensions > Apps Script.
 * 4. Paste this file into Apps Script.
 * 5. Deploy > New deployment > Web app.
 * 6. Execute as: Me.
 * 7. Who has access: Anyone.
 * 8. Copy the resulting .../exec URL into js/config.js as ADD_ACTIVITY_SCRIPT_URL.
 *
 * New rows are appended to Activities as Pending. The site owner approves an
 * activity by changing Status from Pending to Approved in the Google Sheet.
 */

const PHOTOS_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";
const ACTIVITIES_SHEET_NAME = "Activities";
const ACTIVITIES_HEADERS = ["Date", "EventName", "Description", "Location", "Photos", "Status"];
const MAX_PHOTOS = 6;
const MAX_BASE64_BYTES = 5 * 1024 * 1024;

/**
 * Handles public activity submissions from the static site.
 */
function doPost(e) {
  try {
    const payload = parsePayload(e);
    validatePayload(payload);

    const photoUrls = savePhotos(payload.photos || []);
    appendPendingActivity(payload, photoUrls);

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message || "Submission failed"
    });
  }
}

/**
 * Parses the JSON body sent by the frontend.
 */
function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error("Invalid JSON body.");
  }
}

/**
 * Validates required fields and basic upload limits.
 */
function validatePayload(payload) {
  if (!payload.date || !String(payload.date).trim()) {
    throw new Error("Date is required.");
  }

  if (!payload.eventName || !String(payload.eventName).trim()) {
    throw new Error("Event Name is required.");
  }

  const photos = payload.photos || [];
  if (!Array.isArray(photos)) {
    throw new Error("Photos must be an array.");
  }

  if (photos.length > MAX_PHOTOS) {
    throw new Error(`Please upload no more than ${MAX_PHOTOS} photos.`);
  }

  photos.forEach((photo) => {
    if (!photo.base64) return;
    if (estimatedBase64Bytes(photo.base64) > MAX_BASE64_BYTES) {
      throw new Error(`${photo.filename || "A photo"} is larger than 5 MB.`);
    }
  });
}

/**
 * Saves uploaded photos to Drive and returns direct-view URLs.
 */
function savePhotos(photos) {
  if (!photos.length) return [];

  if (!PHOTOS_FOLDER_ID || PHOTOS_FOLDER_ID === "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE") {
    throw new Error("Photo upload folder is not configured.");
  }

  const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return photos
    .filter((photo) => photo.base64)
    .map((photo) => {
      const bytes = Utilities.base64Decode(photo.base64);
      const blob = Utilities.newBlob(
        bytes,
        photo.mimeType || "application/octet-stream",
        sanitizeFilename(photo.filename || "activity-photo")
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    });
}

/**
 * Appends the new activity as Pending. Submitters cannot set Status.
 */
function appendPendingActivity(payload, photoUrls) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ACTIVITIES_SHEET_NAME);
  if (!sheet) throw new Error("Activities sheet tab was not found.");

  ensureActivityHeaders(sheet);
  sheet.appendRow([
    String(payload.date).trim(),
    String(payload.eventName).trim(),
    String(payload.description || "").trim(),
    String(payload.location || "").trim(),
    photoUrls.join(", "),
    "Pending"
  ]);
}

/**
 * Ensures the Activities tab has the headers needed by the public CSV reader.
 */
function ensureActivityHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, ACTIVITIES_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0].map((header) => String(header || "").trim());

  const nextHeaders = ACTIVITIES_HEADERS.map((expectedHeader, index) => {
    const currentHeader = currentHeaders[index];
    if (!currentHeader) return expectedHeader;
    if (currentHeader !== expectedHeader) {
      throw new Error(`Activities column ${index + 1} must be named ${expectedHeader}.`);
    }
    return currentHeader;
  });

  headerRange.setValues([nextHeaders]);
}

/**
 * Estimates decoded file bytes from base64 character length.
 */
function estimatedBase64Bytes(base64) {
  const normalized = String(base64).replace(/\s/g, "");
  return Math.ceil((normalized.length * 3) / 4);
}

/**
 * Keeps Drive filenames simple.
 */
function sanitizeFilename(filename) {
  return String(filename).replace(/[\\/:*?"<>|]/g, "-").slice(0, 120);
}

/**
 * Returns JSON through Apps Script ContentService.
 */
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
