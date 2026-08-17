/*
 * Shared Activity Photo Albums backend for Worship Team Hub.
 *
 * Setup:
 * 1. Create a Google Drive folder for album photos.
 * 2. Paste that folder ID into PHOTO_ALBUMS_FOLDER_ID below.
 * 3. Paste this file into Extensions > Apps Script for your worship data Sheet.
 * 4. Deploy as a Web App: Execute as Me, Who has access: Anyone.
 * 5. Paste the deployed .../exec URL into PHOTO_ALBUMS_SCRIPT_URL in js/config.js.
 */

const PHOTO_ALBUMS_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

const ALBUMS_SHEET_NAME = "PhotoAlbums";
const PHOTOS_SHEET_NAME = "AlbumPhotos";
const ALBUM_HEADERS = ["AlbumId", "Name", "CreatedAt", "UpdatedAt", "DeletedAt"];
const PHOTO_HEADERS = ["PhotoId", "AlbumId", "Filename", "Url", "FileId", "CreatedAt", "DeletedAt"];
const MAX_PHOTOS_PER_UPLOAD = 12;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Handles read requests from the website and returns every active album with
 * its active photos nested inside it.
 */
function doGet(e) {
  try {
    ensureStorage_();
    return jsonResponse_({
      success: true,
      albums: listAlbums_()
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handles public album actions from the website. This endpoint intentionally
 * supports only the album operations used by the static frontend.
 */
function doPost(e) {
  try {
    const payload = parsePayload_(e);
    ensureStorage_();

    let item = null;
    switch (payload.action) {
      case "createAlbum":
        item = createAlbum_(payload);
        break;
      case "renameAlbum":
        item = renameAlbum_(payload);
        break;
      case "deleteAlbum":
        item = deleteAlbum_(payload);
        break;
      case "uploadPhotos":
        item = uploadPhotos_(payload);
        break;
      case "deletePhoto":
        item = deletePhoto_(payload);
        break;
      default:
        throw new Error("Unknown album action.");
    }

    return jsonResponse_({
      success: true,
      album: item && item.album ? item.album : null,
      photo: item && item.photo ? item.photo : null,
      albums: listAlbums_()
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.message
    });
  }
}

/**
 * Creates a JSON response for Apps Script Web Apps.
 */
function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Parses the request body as JSON. The frontend sends a simple text body so
 * the request stays compatible with Apps Script Web Apps.
 */
function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error("Request body must be valid JSON.");
  }
}

/**
 * Ensures the metadata tabs exist and have the expected header rows.
 */
function ensureStorage_() {
  ensureHeaders_(getOrCreateSheet_(ALBUMS_SHEET_NAME), ALBUM_HEADERS);
  ensureHeaders_(getOrCreateSheet_(PHOTOS_SHEET_NAME), PHOTO_HEADERS);
  getPhotoFolder_();
}

/**
 * Creates an album row and returns the normalized album object.
 */
function createAlbum_(payload) {
  const name = cleanText_(payload.name);
  if (!name) throw new Error("Album name is required.");

  const now = timestamp_();
  const album = {
    id: "album-" + Utilities.getUuid(),
    name: name,
    createdAt: now,
    photos: []
  };

  getOrCreateSheet_(ALBUMS_SHEET_NAME).appendRow([
    album.id,
    album.name,
    now,
    now,
    ""
  ]);

  return { album: album };
}

/**
 * Renames an active album.
 */
function renameAlbum_(payload) {
  const albumId = cleanText_(payload.albumId);
  const name = cleanText_(payload.name);
  if (!albumId) throw new Error("Album ID is required.");
  if (!name) throw new Error("Album name is required.");

  const sheet = getOrCreateSheet_(ALBUMS_SHEET_NAME);
  const found = findActiveRow_(sheet, ALBUM_HEADERS, "AlbumId", albumId);
  if (!found) throw new Error("Album not found.");

  sheet.getRange(found.rowNumber, ALBUM_HEADERS.indexOf("Name") + 1).setValue(name);
  sheet.getRange(found.rowNumber, ALBUM_HEADERS.indexOf("UpdatedAt") + 1).setValue(timestamp_());

  return {
    album: {
      id: albumId,
      name: name,
      createdAt: found.row.CreatedAt || "",
      photos: []
    }
  };
}

/**
 * Soft-deletes an album, soft-deletes its photos, and moves the Drive files to
 * trash where possible.
 */
function deleteAlbum_(payload) {
  const albumId = cleanText_(payload.albumId);
  if (!albumId) throw new Error("Album ID is required.");

  const albumSheet = getOrCreateSheet_(ALBUMS_SHEET_NAME);
  const found = findActiveRow_(albumSheet, ALBUM_HEADERS, "AlbumId", albumId);
  if (!found) throw new Error("Album not found.");

  const now = timestamp_();
  albumSheet.getRange(found.rowNumber, ALBUM_HEADERS.indexOf("DeletedAt") + 1).setValue(now);
  albumSheet.getRange(found.rowNumber, ALBUM_HEADERS.indexOf("UpdatedAt") + 1).setValue(now);

  const photoSheet = getOrCreateSheet_(PHOTOS_SHEET_NAME);
  const photoRows = readObjects_(photoSheet, PHOTO_HEADERS);
  photoRows.forEach(function(row) {
    if (row.AlbumId === albumId && !row.DeletedAt) {
      photoSheet.getRange(row._rowNumber, PHOTO_HEADERS.indexOf("DeletedAt") + 1).setValue(now);
      trashFile_(row.FileId);
    }
  });

  return { album: { id: albumId } };
}

/**
 * Uploads one or more base64 image files to Drive and records their metadata.
 */
function uploadPhotos_(payload) {
  const albumId = cleanText_(payload.albumId);
  if (!albumId) throw new Error("Album ID is required.");

  const albumSheet = getOrCreateSheet_(ALBUMS_SHEET_NAME);
  if (!findActiveRow_(albumSheet, ALBUM_HEADERS, "AlbumId", albumId)) {
    throw new Error("Album not found.");
  }

  const photos = Array.isArray(payload.photos) ? payload.photos : [];
  if (!photos.length) throw new Error("Choose at least one photo.");
  if (photos.length > MAX_PHOTOS_PER_UPLOAD) {
    throw new Error("Upload up to " + MAX_PHOTOS_PER_UPLOAD + " photos at a time.");
  }

  const folder = getPhotoFolder_();
  const sheet = getOrCreateSheet_(PHOTOS_SHEET_NAME);
  const now = timestamp_();
  const saved = [];

  photos.forEach(function(photo) {
    const filename = sanitizeFilename_(photo.filename || "activity-photo.png");
    const mimeType = cleanText_(photo.mimeType) || "image/png";
    const base64 = cleanText_(photo.base64);
    if (!base64) throw new Error(filename + " is missing image data.");
    if (estimatedBase64Bytes_(base64) > MAX_PHOTO_BYTES) {
      throw new Error(filename + " is larger than 5 MB.");
    }

    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const photoId = "photo-" + Utilities.getUuid();
    const url = "https://drive.google.com/uc?export=view&id=" + file.getId();
    const thumbnailUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
    sheet.appendRow([
      photoId,
      albumId,
      filename,
      url,
      file.getId(),
      now,
      ""
    ]);

    saved.push({
      id: photoId,
      name: filename,
      src: url,
      url: url,
      displaySrc: thumbnailUrl,
      thumbnailUrl: thumbnailUrl,
      fileId: file.getId(),
      createdAt: now
    });
  });

  return { photo: saved[0] || null };
}

/**
 * Soft-deletes one photo and moves its Drive file to trash where possible.
 */
function deletePhoto_(payload) {
  const photoId = cleanText_(payload.photoId);
  if (!photoId) throw new Error("Photo ID is required.");

  const sheet = getOrCreateSheet_(PHOTOS_SHEET_NAME);
  const found = findActiveRow_(sheet, PHOTO_HEADERS, "PhotoId", photoId);
  if (!found) throw new Error("Photo not found.");

  sheet.getRange(found.rowNumber, PHOTO_HEADERS.indexOf("DeletedAt") + 1).setValue(timestamp_());
  trashFile_(found.row.FileId);

  return {
    photo: {
      id: photoId
    }
  };
}

/**
 * Reads active albums and active photos, then returns frontend-friendly keys.
 */
function listAlbums_() {
  const albums = readObjects_(getOrCreateSheet_(ALBUMS_SHEET_NAME), ALBUM_HEADERS)
    .filter(function(row) {
      return row.AlbumId && !row.DeletedAt;
    })
    .map(function(row) {
      return {
        id: row.AlbumId,
        name: row.Name,
        createdAt: row.CreatedAt,
        photos: []
      };
    });

  const byAlbumId = {};
  albums.forEach(function(album) {
    byAlbumId[album.id] = album;
  });

  readObjects_(getOrCreateSheet_(PHOTOS_SHEET_NAME), PHOTO_HEADERS)
    .filter(function(row) {
      return row.PhotoId && row.AlbumId && row.Url && !row.DeletedAt && byAlbumId[row.AlbumId];
    })
    .forEach(function(row) {
      byAlbumId[row.AlbumId].photos.unshift({
        id: row.PhotoId,
        name: row.Filename,
        src: row.Url,
        url: row.Url,
        displaySrc: driveThumbnailUrl_(row.FileId, row.Url),
        thumbnailUrl: driveThumbnailUrl_(row.FileId, row.Url),
        fileId: row.FileId,
        createdAt: row.CreatedAt
      });
    });

  albums.sort(function(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  return albums;
}

/**
 * Gets a metadata sheet, creating it when it does not exist.
 */
function getOrCreateSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

/**
 * Adds or repairs header row cells without removing extra user columns.
 */
function ensureHeaders_(sheet, headers) {
  const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const needsHeaders = existing.every(function(value) {
    return !value;
  });
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  headers.forEach(function(header, index) {
    if (cleanText_(existing[index]) !== header) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

/**
 * Converts rows into objects using the provided header names.
 */
function readObjects_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, headers.length)
    .getValues()
    .map(function(values, index) {
      const row = { _rowNumber: index + 2 };
      headers.forEach(function(header, headerIndex) {
        row[header] = formatValue_(values[headerIndex]);
      });
      return row;
    });
}

/**
 * Finds one active metadata row by ID.
 */
function findActiveRow_(sheet, headers, key, value) {
  const rows = readObjects_(sheet, headers);
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i][key] === value && !rows[i].DeletedAt) {
      return {
        row: rows[i],
        rowNumber: rows[i]._rowNumber
      };
    }
  }
  return null;
}

/**
 * Returns the configured Google Drive folder or a clear setup error.
 */
function getPhotoFolder_() {
  if (!PHOTO_ALBUMS_FOLDER_ID || PHOTO_ALBUMS_FOLDER_ID.indexOf("PASTE_") === 0) {
    throw new Error("Set PHOTO_ALBUMS_FOLDER_ID in PhotoAlbums.gs before deploying.");
  }
  return DriveApp.getFolderById(PHOTO_ALBUMS_FOLDER_ID);
}

/**
 * Sends a Drive file to trash, ignoring missing or already-inaccessible files.
 */
function trashFile_(fileId) {
  const id = cleanText_(fileId);
  if (!id) return;
  try {
    DriveApp.getFileById(id).setTrashed(true);
  } catch (error) {
    // A missing file should not stop the Sheet metadata from being cleaned up.
  }
}

/**
 * Returns a Google Drive thumbnail URL that works better inside image tags.
 */
function driveThumbnailUrl_(fileId, url) {
  const id = cleanText_(fileId) || extractDriveFileId_(url);
  return id ? "https://drive.google.com/thumbnail?id=" + encodeURIComponent(id) + "&sz=w1000" : cleanText_(url);
}

/**
 * Extracts a Drive file ID from common Drive URL shapes.
 */
function extractDriveFileId_(url) {
  const value = cleanText_(url);
  const queryMatch = value.match(/[?&]id=([^&]+)/);
  if (queryMatch) return decodeURIComponent(queryMatch[1]);
  const fileMatch = value.match(/\/file\/d\/([^/]+)/);
  return fileMatch ? decodeURIComponent(fileMatch[1]) : "";
}

/**
 * Normalizes Apps Script cell values for JSON output.
 */
function formatValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return value === null || value === undefined ? "" : value;
}

/**
 * Returns a compact timestamp string for metadata rows.
 */
function timestamp_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Trims text safely.
 */
function cleanText_(value) {
  return String(value === null || value === undefined ? "" : value).trim();
}

/**
 * Removes characters that are awkward in Drive filenames.
 */
function sanitizeFilename_(filename) {
  const safe = cleanText_(filename).replace(/[\\/:*?"<>|]/g, "-");
  return safe || "activity-photo.png";
}

/**
 * Estimates decoded bytes before attempting to save a base64 upload.
 */
function estimatedBase64Bytes_(base64) {
  return Math.ceil(cleanText_(base64).length * 3 / 4);
}
