RECOVERYX PRIVATE PORTAL — FILE SETUP

FILES
- index.html
- style.css
- app.js
- cloud-sync.js

INSTALLATION
1. Extract this ZIP file.
2. Upload all three files to the SAME GitHub Pages published folder (usually the repository root).
3. Keep the filenames exactly lowercase as shown above.
4. Commit/push the changes and wait for GitHub Pages to publish.
5. Open the website and hard-refresh/reload it. The CSS and JS links include a version query to avoid stale browser cache.

IMPORTANT
- This is a front-end account-assistance record organizer, not an account recovery service.
- Recovery records can be synced to the visitor's private cloud account after email/password sign-in; other workspace data remains in browser local storage.
- The support form is local-only and does not send messages to a server.
- Do not collect or enter passwords, OTPs, backup codes, or private recovery links.
- Official recovery resources are linked from the Recovery Tools page.
- 


VERIFICATION CENTER
- `verification-center.js` adds a Facebook identity-preparation workspace and universal recovery case tracker for Facebook, Instagram, TikTok, and Gmail.
- The ID photo editor processes selected images locally in the browser and exports a prepared JPG or PNG; it does not upload the image or alter document text or identity details.
- Verification profile details, case notes, and checklist state are stored in this browser's local storage. Treat exported JSON files as private.
- The module does not submit verification requests, access provider systems, or guarantee account restoration. Users must submit through official provider channels.
- Never enter passwords, OTPs, backup codes, or full ID numbers into the workspace.


RECOVERY ASSISTANT
- `recovery-assistant.js` adds a guided plan for Facebook, Instagram, Gmail, and TikTok account access problems.
- The assistant creates suggested next steps and an editable appeal-message draft based on the user's selected issue. Plans can be saved in the current browser.
- It links to official provider support pages. It does not log in, bypass security checks, submit appeals, contact providers, or change account status. Only the provider can verify ownership and restore access.
- Answers and drafts are processed in the browser. Never enter passwords, OTPs, backup codes, full ID numbers, or private recovery links.

## Android APK build

The Android project is under `app/`. GitHub Actions builds an installable debug APK on pushes to `main` that touch Android source/configuration, and can also be started manually from the Actions tab.

The workflow always uploads the debug APK as `IPPOXRECOVERY-debug-apk`. It uploads a signed release APK only when all four repository Actions secrets are configured:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded contents of the release JKS file
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: `ippoxrecovery`
- `ANDROID_KEY_PASSWORD`: private-key password

Add these under **Repository Settings → Secrets and variables → Actions**. Never commit the keystore or passwords to the repository. The release signing key must be backed up securely; losing it prevents signing compatible updates.

The app uses application ID `com.ippoxrecovery.app`. A newly generated signing key will not update an installation signed with a different key; uninstalling the older app may be required and can erase its local data.
