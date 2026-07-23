# CSV Import Instructions

Use these six CSV files as clean starting data for your Google Sheet tabs:

- `ServiceInfo.csv`
- `Songs.csv`
- `Activities.csv`
- `Assignments.csv`
- `YouthFellowship.csv`
- `PrayerFasting.csv`

Each file has row 1 as headers only, followed by sample records. There are no note rows, blank rows, formulas, or merged cells.

## Import Each CSV

1. Open your Google Sheet.
2. Go to `File > Import`.
3. Choose `Upload`.
4. Select one CSV file.
5. Choose `Insert new sheet(s)`.
6. Import the file.
7. Rename the newly created tab to match the CSV name exactly, without `.csv`.

Example: after importing `ServiceInfo.csv`, rename the new tab to `ServiceInfo`.

Repeat this process for all six CSV files.

## Check The Imported Tabs

After each import, quickly confirm:

- Row 1 contains only the headers.
- There is no extra blank row at the top or between records.
- There is no note row such as `sample data`.
- Dates use `YYYY-MM-DD`.
- The `Songs` tab uses only `Praise` or `Worship` in the `Group` column.

## Publish The Tabs

After all six tabs are imported:

1. Set the Sheet sharing to `Anyone with the link - Viewer`.
2. Go to `File > Share > Publish to web`.
3. For each tab, choose that specific tab, not `Entire Document`.
4. Choose `Comma-separated values (.csv)`.
5. Publish and copy the CSV URL.
6. Paste each URL into the matching key in `js/config.js` inside the `SHEET_URLS` object.

Each tab must be published separately so the site can fetch the correct CSV for each page.
