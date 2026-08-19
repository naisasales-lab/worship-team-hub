# Worship Team Hub

Static, public read-only worship team website for Door of Faith Church.

The site is live-connected to Google Sheet tabs that are published to the web as CSV. There is no database, deployment script, or server-side code.

## File Structure

- `index.html` - Home
- `activities.html` - Church Activities
- `activity-photos.html` - Redirects old photo links to `activities.html#photos`
- `dashboard.html` - Dashboard
- `assignment.html` - Assignment, Teens & Youth, and Prayer & Fasting tabs
- `sunday-service.html` - Sunday Service
- `teens-youth.html` - Redirects to `assignment.html#teens-youth`
- `prayer-fasting.html` - Redirects to `assignment.html#prayer-fasting`
- `css/style.css` - Shared dark/gold theme
- `css/sunday-service.css` - Sunday Service styles
- `js/config.js` - Published CSV URLs and constants
- `js/main.js` - Shared nav, clock, CSV parser, fetch helpers, card rendering
- `js/sunday-service.js` - Sunday countdown and song rendering
- `backend/*.csv` - Google Sheet tab templates
- `backend/AddActivity.gs` - Optional public Add Activity submission endpoint
- `backend/PhotoAlbums.gs` - Optional shared Activity Photo Albums endpoint using Google Drive

## Google Sheet Tabs

Create one Google Sheet with these tabs and header rows.

```text
ServiceInfo: Date, WorshipLeader, APM, ColorAssignment, ColorHex
Songs: Date, Group, SongNumber, Title, Singer, OriginalKey, MyKey, LyricsURL, YouTubeURL
Activities: Date, EventName, Description, Location, Photos, Status
Assignments: Date, Role, Name
YouthFellowship: Date, Topic, Speaker, Location
PrayerFasting: StartDate, EndDate, Theme, PrayerPoints
```

For `Songs`, `Group` must be exactly `Praise` or `Worship`.

For `Activities`, rows with `Status` set to `Pending` are hidden from public pages. Rows with `Status` set to `Approved`, blank, or missing are displayed.

CSV templates with sample rows are in the `backend/` folder.

## Publish Each Tab As CSV

For each tab (`ServiceInfo`, `Songs`, `Activities`, `Assignments`, `YouthFellowship`, `PrayerFasting`):

1. Open your Google Sheet.
2. Go to `File > Share > Publish to web`.
3. Under `Link`, choose the specific tab, not `Entire Document`.
4. Choose `Comma-separated values (.csv)`.
5. Click `Publish`, confirm, and copy the URL.
6. Paste that URL into the matching key in `js/config.js`.

Each tab must be published separately. Publishing `Entire Document` gives one URL for the whole sheet, which is not what this site needs.

Make sure the Sheet's general sharing is set to `Anyone with the link - Viewer`, or the published CSV links may not load.

Published CSV updates can take a minute or two to reflect changes after you edit the Sheet.

## Live Connection

The current `js/config.js` is already wired to the six published CSV URLs for:

- `ServiceInfo`
- `Songs`
- `Activities`
- `Assignments`
- `YouthFellowship`
- `PrayerFasting`

A real published CSV URL looks like:

```text
https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxxx/pub?gid=123456&single=true&output=csv
```

This project is already connected to the live published CSV URLs. If you edit data in the Google Sheet later, the site should reflect those changes automatically within a few minutes, with no redeploy needed.

Republishing is only needed if you add a brand new tab or change a tab's column structure.

## Activity Photos Albums

The Activity Photos area now lives as a tab inside `activities.html`. Visitors can create albums, select an album, and upload multiple photos into that album.

Shared album storage is supported through `backend/PhotoAlbums.gs`, which saves photo files in Google Drive and saves album/photo metadata in two Google Sheet tabs. When `PHOTO_ALBUMS_SCRIPT_URL` in `js/config.js` is connected, albums and photos are shared online and can be viewed from different devices.

If `PHOTO_ALBUMS_SCRIPT_URL` is still the placeholder, or if the cloud request fails, the page falls back to browser storage so you can still preview the album UI on one device.

The top navigation no longer includes a separate `Photos` item. Old links to `activity-photos.html` redirect to `activities.html#photos`.

### Shared Album Cloud Setup

1. In Google Drive, create a folder for Activity Photo Album uploads.
2. Open the folder and copy the folder ID from the URL. In a URL like `https://drive.google.com/drive/folders/FOLDER_ID_HERE`, copy only `FOLDER_ID_HERE`.
3. Open your worship data Google Sheet.
4. Go to `Extensions > Apps Script`.
5. Paste the contents of `backend/PhotoAlbums.gs` into the Apps Script editor. You can keep it in the same Apps Script project as other worship scripts.
6. In `PhotoAlbums.gs`, replace `PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE` with your Drive folder ID.
7. Save the script.
8. Click `Deploy > New deployment`.
9. Choose `Web app`.
10. Set `Execute as` to `Me`.
11. Set `Who has access` to `Anyone`.
12. Deploy, authorize when prompted, and copy the resulting `.../exec` URL.
13. Paste that URL into `PHOTO_ALBUMS_SCRIPT_URL` in `js/config.js`.

The script creates these tabs automatically if they do not exist:

```text
PhotoAlbums: AlbumId, Name, CreatedAt, UpdatedAt, DeletedAt
AlbumPhotos: PhotoId, AlbumId, Filename, Url, FileId, CreatedAt, DeletedAt
```

Album/photo changes are saved by the deployed script immediately. You do not need to republish the CSV tabs or redeploy the website when users add, rename, upload, or delete album photos. Redeploy the Apps Script only if you edit `PhotoAlbums.gs` later.

If the site says `Cloud album storage could not load`:

1. Open the `PHOTO_ALBUMS_SCRIPT_URL` directly in a browser. It should show JSON such as `{"success":true,"albums":[]}`.
2. If the direct URL shows `404 Not Found`, open Apps Script, go to `Deploy > Manage deployments`, edit the Web App deployment, choose `New version`, confirm `Who has access` is `Anyone`, deploy, and copy the Web app URL ending in `/exec` again.
3. Test the website from GitHub Pages or a local `http://` server. Cloud fetches may fail when the page is opened directly as `file://`.

## Public Add Activity Submissions

The Church Activities page includes a public `+ Add Activity` form. Normal site data still loads from published CSV links, but this form needs one small Google Apps Script Web App so visitors can submit new activity rows and upload photos for approval.

### 1. Prepare The Activities Tab

Use these headers in the `Activities` tab:

```text
Date, EventName, Description, Location, Photos, Status
```

Existing rows with only `Date`, `EventName`, `Description`, and `Location` still work. The submission script also fills missing `Photos` and `Status` headers if those cells are blank.

### 2. Create A Photo Folder

1. In Google Drive, create a folder for submitted activity photos.
2. Open the folder.
3. Copy the folder ID from the URL. In a URL like `https://drive.google.com/drive/folders/FOLDER_ID_HERE`, copy only `FOLDER_ID_HERE`.
4. Paste that ID into `PHOTOS_FOLDER_ID` near the top of `backend/AddActivity.gs`.

### 3. Deploy The Submission Script

1. Open the Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Paste the contents of `backend/AddActivity.gs`.
4. Save the project.
5. Click `Deploy > New deployment`.
6. Choose `Web app`.
7. Set `Execute as` to `Me`.
8. Set `Who has access` to `Anyone`.
9. Deploy, authorize when prompted, and copy the resulting `.../exec` URL.
10. Paste that URL into `ADD_ACTIVITY_SCRIPT_URL` in `js/config.js`.

### 4. Approve Or Reject Submissions

New public submissions are appended to the `Activities` tab with `Status` set to `Pending`, so they do not appear publicly right away. Approved photo URLs from the `Photos` column can still be used by the site data, while local Activity Photo albums are managed inside `activities.html#photos`.

To approve a submission, review the row and photo links, then change `Status` from `Pending` to `Approved`. To reject a submission, delete the row. Approved changes should appear on the published site within a few minutes.

This endpoint is public. It has basic limits of 6 images per submission and 5 MB per image, but you should still check the Sheet and Drive folder periodically for spam or inappropriate uploads.

## Hosting

Upload the `dofc-worship` folder to Netlify, GitHub Pages, or any static file host. There is no build command.
