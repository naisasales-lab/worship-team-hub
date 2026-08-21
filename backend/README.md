# Backend Setup - Google Sheet Published CSV

This site uses a Google Sheet as a free read-only data source by publishing each tab to the web as CSV. The only optional script is `AddActivity.gs`, which powers the public Add Activity submission form.

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
- `Birthdays`

Capitalization matters because the frontend looks up these names in `SHEET_URLS`.

## 2. Add Headers And Sample Rows

Use the CSV files in this folder as templates. Open each file and paste its contents into the matching tab.

- `ServiceInfo.csv`
- `Songs.csv`
- `Activities.csv`
- `Assignments.csv`
- `YouthFellowship.csv`
- `PrayerFasting.csv`
- `Birthdays.csv`

Expected headers:

```text
ServiceInfo: Date, WorshipLeader, APM, ColorAssignment, ColorHex
Songs: Date, Group, SongNumber, Title, Singer, OriginalKey, MyKey, LyricsURL, YouTubeURL
Activities: Date, Time, EventName, Description, Location, Photos, Status, confirmed_count, rsvp_user_ids
Assignments: Date, Role, Name
YouthFellowship: Date, Topic, Speaker, Location
PrayerFasting: StartDate, EndDate, Theme, PrayerPoints
Birthdays: Name, Birthdate, Ministry
```

For `Songs`, `Group` must be exactly `Praise` or `Worship`.

For `Activities`, `Status` controls approval. `Pending` rows are hidden from the public site. `Approved`, blank, or missing status rows are displayed. `confirmed_count` and `rsvp_user_ids` are read by the RSVP UI when present.

## 3. Publish Each Tab To Web As CSV

For each tab (`ServiceInfo`, `Songs`, `Activities`, `Assignments`, `YouthFellowship`, `PrayerFasting`, `Birthdays`):

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
  PrayerFasting: "PASTE_PUBLISHED_CSV_URL_FOR_PRAYERFASTING_TAB",
  Birthdays: "PASTE_PUBLISHED_CSV_URL_FOR_BIRTHDAYS_TAB"
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
- `Activities`: `Date`, `Time`, `EventName`, `Description`, `Location`, `Photos`, `Status`, `confirmed_count`, `rsvp_user_ids`
- `Assignments`: `Date`, `Role`, `Name`
- `YouthFellowship`: `Date`, `Topic`, `Speaker`, `Location`
- `PrayerFasting`: `StartDate`, `EndDate`, `Theme`, `PrayerPoints`
- `Birthdays`: `Name`, `Birthdate`, `Ministry`

Keep these names unchanged unless you also update the frontend JavaScript.

## Optional Public Add Activity Form

The `activities.html` page has a public `+ Add Activity` form. It does not change how the site reads published CSV data. It only adds a write path for activity submissions.

### 1. Create A Google Drive Photo Folder

1. Create a Drive folder for submitted activity photos.
2. Open the folder and copy its folder ID from the URL.
3. In a URL like `https://drive.google.com/drive/folders/FOLDER_ID_HERE`, copy only `FOLDER_ID_HERE`.
4. Paste that ID into `PHOTOS_FOLDER_ID` in `AddActivity.gs`.

### 2. Deploy `AddActivity.gs`

1. Open your Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Paste the contents of `backend/AddActivity.gs`.
4. Save the project.
5. Click `Deploy > New deployment`.
6. Select `Web app`.
7. Set `Execute as` to `Me`.
8. Set `Who has access` to `Anyone`.
9. Deploy, authorize the script, and copy the `.../exec` URL.
10. Paste that URL into `ADD_ACTIVITY_SCRIPT_URL` in `js/config.js`.

### 3. Approval Workflow

New submissions are appended to the `Activities` tab as:

```text
Date, Time, EventName, Description, Location, Photos, Pending, 0, blank rsvp_user_ids
```

Rows with `Status = Pending` are hidden from the public site. To approve one, review the details and photo links, then change `Status` to `Approved`. To reject one, delete the row.

Because the endpoint is public and there is no login gate, check the Sheet and Drive folder periodically for spam or inappropriate submissions. The script limits submissions to 6 photos and 5 MB per photo.
