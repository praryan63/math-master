# Math Master

Offline math practice app. Plain HTML, CSS and vanilla JavaScript.
Built into an Android APK with Capacitor and GitHub Actions.

## Folder layout

    math-master/
      .github/workflows/build.yml
      resources/icon.png      (you add this)
      resources/splash.png    (you add this)
      www/index.html
      www/css/style.css
      www/js/*.js
      capacitor.config.json
      package.json

## App icon and splash

Put your own images here (do not rename):

- `resources/icon.png`   -> 1024 x 1024 PNG, square, no transparency needed
- `resources/splash.png` -> 2732 x 2732 PNG, artwork in the middle

The workflow runs `capacitor-assets` and automatically creates every Android
icon and splash size. If these files are missing the build still works with the
default Capacitor icon.

To replace the icon manually instead: after the first build, put your images in
`android/app/src/main/res/mipmap-*` folders.

## Build the debug APK

1. Create a GitHub repository and upload all files.
2. Go to the **Actions** tab.
3. The workflow "Build Debug APK" runs on every push, or press **Run workflow**.
4. When it finishes open the run and download the artifact
   **math-master-debug-apk** -> inside is `app-debug.apk`.
5. Copy the APK to your phone and install it (allow "install unknown apps").

## Editing on the phone (Acode)

- All design colors are at the top of `www/css/style.css`.
- All icons are in `www/js/icons.js` (one SVG path each).
- All question types and number ranges are in `www/js/questions.js`.
- Learn screen text is in `www/js/screens.js` (`LEARN_DATA`).
- Daily goal is `DAILY_GOAL` in `www/js/store.js`.

## Data

Everything is saved in `localStorage` on the phone only.
Use Profile -> Backup and restore to export or import your data as JSON.