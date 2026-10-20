// Starts the Auth and Firestore emulators and keeps their data between runs:
// imports `.firebase-emulator-data/` when it exists and exports to it on exit (Ctrl+C).
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const DATA_DIR = '.firebase-emulator-data';
const args = ['firebase', 'emulators:start', '--only', 'auth,firestore', '--project', 'demo-weight4all'];

if (existsSync(DATA_DIR)) args.push('--import', DATA_DIR);
args.push('--export-on-exit', DATA_DIR);

const result = spawnSync('npx', args, { stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
