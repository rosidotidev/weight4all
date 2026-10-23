# Weight4All: running and setting up Firebase

Two environments only (AD-11):

| Environment | Used by | Firebase |
|---|---|---|
| `local` | `ng serve`, tests | Firebase Emulator Suite (Auth + Firestore), demo project `demo-weight4all` |
| `prod` | production build, Hosting | Real Firebase project |

## 1. Run locally with the emulators (no Firebase account needed)

Prerequisites: Node >= 24.15, JDK >= 21 (`java -version`), `npm install` done. The first emulator start downloads the Firestore emulator jar, so it needs network once.

1. Terminal 1, start the emulators:
   ```bash
   npm run emulators
   ```
   Auth runs on `127.0.0.1:9099`, Firestore on `127.0.0.1:8080`. Data is kept in `.firebase-emulator-data/` (git-ignored): it is imported at start and exported when you stop with Ctrl+C. Killing the process or closing the window skips the export.
2. Terminal 2, start the app:
   ```bash
   npm start
   ```
   Open http://localhost:4200. The default (development) build uses `src/environments/environment.ts`, which connects to the emulators.
3. Stop both with Ctrl+C.

### Local test account

The test account is created automatically when the emulators start (`scripts/ensure-test-account.mjs`) and is kept between runs:

| Field | Value |
|---|---|
| Email | `prova.locale@weight4all.test` |
| Password | `prova-locale-2026` |

On Windows, `start-emulators.bat` (emulators) and `start-app.bat` (dev server, opens the browser) in the repository root do all of the above. These values are for the local emulator only. They are not a real account and must never be used on the production Firebase project.

Other commands:

| Command | What it does |
|---|---|
| `npm run test:rules` | Starts the Firestore emulator by itself, runs the rules tests in `tests/rules/`, stops it |
| `npm run check` | The single quality gate: ESLint + unit tests + lint-rule tests + rules tests |
| `npx ng build` | Production build (uses `environment.prod.ts`) |

## 2. Create the real Firebase project (needed only to publish, Story 5.6)

Do this in parallel whenever you like; nothing in local development depends on it.

1. **Create the project.** Open https://console.firebase.google.com, "Add project", name it (for example `weight4all`). Google Analytics is not needed. The free Spark plan is enough.
2. **Create Firestore.** Build > Firestore Database > Create database. Choose **multi-region `eur3` (Europe)**: the location cannot be changed later. Start in production mode (the repository's `firestore.rules` replace the default rules on deploy).
3. **Enable Authentication.** Build > Authentication > Get started > Sign-in method > enable **Email/Password** (leave "Email link" off).
4. **Enable email-enumeration protection.** Authentication > Settings > User actions > turn on "Email enumeration protection". Required so password reset never reveals whether an address is registered.
5. **Turn off self sign-up.** Authentication > Settings > User actions > turn off "Enable create (sign-up)". The app has no sign-up screen, and this also stops anyone creating an Account through the Auth REST API with the public web key. The owner adds Accounts in Authentication > Users > Add user.
6. **Register the web app.** Project settings (gear) > General > "Your apps" > Web (`</>`). Register it (no Firebase Hosting setup in this wizard). Copy the `firebaseConfig` values.
7. **Fill the prod environment.** Paste the values into `src/environments/environment.prod.ts`, replacing every `PLACEHOLDER_*`. These web config values are not secrets; access is protected by `firestore.rules` and Authentication.
8. **Authorized domains.** Authentication > Settings > Authorized domains: the Hosting domains (`<project>.web.app`, `<project>.firebaseapp.com`) are added automatically. Add a custom domain here if you use one.
9. **Log in and link the CLI** (once per machine):
   ```bash
   npx firebase login
   npx firebase use --add     # pick the project, alias "default"; creates .firebaserc
   ```
10. **Hosting.** Build > Hosting > Get started (or `npx firebase init hosting` and choose the existing project; public dir `dist/weight4all/browser`, single-page app: yes). Story 5.6 adds the `hosting` section to `firebase.json` and wires `npm run deploy` (check, then rules, then Hosting).

## 3. Release and rollback (Story 5.6)

- Release: `npm run deploy`. It runs `npm run check` first and stops on failure, then deploys `firestore.rules`, then Hosting.
- Roll back the app: Firebase console > Hosting > release history > roll back.
- Roll back rules: check out the previous `firestore.rules` from git and redeploy with `npx firebase deploy --only firestore:rules`.

## Notes

- Firebase config exists only under `src/environments/`; only `src/app/core/data` imports `firebase/*`.
- The prod environment must never connect to emulators; Story 5.6 adds a check that a production build contains no local values.
