# Backend Setup - Google Sheet Published CSV

This site uses a Google Sheet as a free read-only data source by publishing each tab to the web as CSV. There is no script backend and no server deployment.

## 1. Create The Google Sheet

1. Create a new Google Sheet in your Google account.
2. Rename the file to something like `Worship Team Hub Data`.
3. Rename the tabs at the bottom to exactly:

- `ServiceInfo`
- `Songs`
- `Activities`
- `Assignments`
- `YouthFellowship`
- `PrayerFasting`

Capitalization matters because the frontend looks up these names in `SHEET_URLS`.

## 2. Add Headers And Sample Rows

Use the CSV files in this folder as templates. Open each file and paste its contents into the matching tab.

- `ServiceInfo.csv`
- `Songs.csv`
- `Activities.csv`
- `Assignments.csv`
- `YouthFellowship.csv`
- `PrayerFasting.csv`

Expected headers:

```text
ServiceInfo: Date, WorshipLeader, APM, ColorAssignment, ColorHex
Songs: Date, Group, SongNumber, Title, Singer, OriginalKey, MyKey, LyricsURL, YouTubeURL
Activities: Date, EventName, Description, Location
Assignments: Date, Role, Name
YouthFellowship: Date, Topic, Speaker, Location
PrayerFasting: StartDate, EndDate, Theme, PrayerPoints
```

For `Songs`, `Group` must be exactly `Praise` or `Worship`.

## 3. Publish Each Tab To Web As CSV

For each tab (`ServiceInfo`, `Songs`, `Activities`, `Assignments`, `YouthFellowship`, `PrayerFasting`):

1. Open the Google Sheet.
2. Go to `File > Share > Publish to web`.
3. Under `Link`, choose the specific sheet/tab, not `Entire Document`.
4. Choose `Comma-separated values (.csv)` as the format.
5. Click `Publish`, confirm, and copy the resulting URL.
6. Paste that URL into the matching key in `js/config.js`.

Each tab must be published separately. Publishing `Entire Document` gives one URL for the whole sheet, which is not what the frontend expects.

Make sure the Sheet's general sharing is set to `Anyone with the link - Viewer`, or publish-to-web links may not load.

After editing data in the Sheet, the published CSV can take a minute or two to reflect changes.

## 4. Connect The Frontend

Open `js/config.js` and replace every placeholder in `SHEET_URLS`:

```js
const SHEET_URLS = {
  ServiceInfo: "PASTE_PUBLISHED_CSV_URL_FOR_SERVICEINFO_TAB",
  Songs: "PASTE_PUBLISHED_CSV_URL_FOR_SONGS_TAB",
  Activities: "PASTE_PUBLISHED_CSV_URL_FOR_ACTIVITIES_TAB",
  Assignments: "PASTE_PUBLISHED_CSV_URL_FOR_ASSIGNMENTS_TAB",
  YouthFellowship: "PASTE_PUBLISHED_CSV_URL_FOR_YOUTHFELLOWSHIP_TAB",
  PrayerFasting: "PASTE_PUBLISHED_CSV_URL_FOR_PRAYERFASTING_TAB"
};
```

A real URL looks like:

```text
https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxxx/pub?gid=123456&single=true&output=csv
```

## 5. Test A Published CSV URL

Paste one published CSV URL directly into your browser. You should see comma-separated text with your row 1 headers at the top.

If the site keeps showing fallback sample data:

- Check that the URL is pasted into the matching `SHEET_URLS` key.
- Check that the tab was published as `.csv`, not webpage or PDF.
- Check that the specific tab was selected instead of `Entire Document`.
- Check that general sharing is `Anyone with the link - Viewer`.
- Wait a minute or two after editing the Sheet, then reload the site.

## Frontend Compatibility

The frontend currently reads these exact fields:

- `ServiceInfo`: `Date`, `WorshipLeader`, `APM`, `ColorAssignment`, `ColorHex`
- `Songs`: `Date`, `Group`, `SongNumber`, `Title`, `Singer`, `OriginalKey`, `MyKey`, `LyricsURL`, `YouTubeURL`
- `Activities`: `Date`, `EventName`, `Description`, `Location`
- `Assignments`: `Date`, `Role`, `Name`
- `YouthFellowship`: `Date`, `Topic`, `Speaker`, `Location`
- `PrayerFasting`: `StartDate`, `EndDate`, `Theme`, `PrayerPoints`

Keep these names unchanged unless you also update the frontend JavaScript.
