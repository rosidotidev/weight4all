import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import type { Environment } from '../../../environments/environment.model';

export function initFirebase(env: Environment) {
  const app = initializeApp(env.firebase);
  const auth = getAuth(app);
  const db = getFirestore(app);
  // Only the `local` environment talks to the emulators (AD-11); `prod` never does.
  if (env.name === 'local' && env.emulators) {
    connectAuthEmulator(auth, env.emulators.authUrl, { disableWarnings: true });
    connectFirestoreEmulator(db, env.emulators.firestoreHost, env.emulators.firestorePort);
  }
  return { app, auth, db };
}

export const { app, auth, db } = initFirebase(environment);
