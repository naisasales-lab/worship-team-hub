# Worship Team Hub

Static, public read-only worship team website for Door of Faith Church.

The site is live-connected to Google Sheet tabs that are published to the web as CSV. There is no database, deployment script, or server-side code.

## File Structure

- `index.html` - Home
- `activities.html` - Church Activities
- `dashboard.html` - Dashboard
- `assignment.html` - Assignment
- `sunday-service.html` - Sunday Service
- `teens-youth.html` - Teens & Youth Fellowship with Prayer
- `prayer-fasting.html` - Prayer & Fasting
- `css/style.css` - Shared dark/gold theme
- `css/sunday-service.css` - Sunday Service styles
- `js/config.js` - Published CSV URLs and constants
- `js/main.js` - Shared nav, clock, CSV parser, fetch helpers, card rendering
- `js/sunday-service.js` - Sunday countdown and song rendering
- `backend/*.csv` - Google Sheet tab templates

## Google Sheet Tabs

Create one Google Sheet with these tabs and header rows.

```text
ServiceInfo: Date, WorshipLeader, APM, ColorAssignment, ColorHex
Songs: Date, Group, SongNumber, Title, Singer, OriginalKey, MyKey, LyricsURL, YouTubeURL
Activities: Date, EventName, Description, Location
Assignments: Date, Role, Name
YouthFellowship: Date, Topic, Speaker, Location
PrayerFasting: StartDate, EndDate, Theme, PrayerPoints
```

For `Songs`, `Group` must be exactly `Praise` or `Worship`.

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

## Hosting

Upload the `dofc-worship` folder to Netlify, GitHub Pages, or any static file host. There is no build command.
