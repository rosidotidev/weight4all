// Local environment: Firebase Emulator Suite only, never real data (AD-11).
// `environment.prod.ts` replaces this file in the production build (angular.json fileReplacements).
import type { Environment } from './environment.model';

export const environment: Environment = {
  name: 'local',
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'demo-weight4all.firebaseapp.com',
    projectId: 'demo-weight4all',
    appId: 'demo-app-id',
  },
  emulators: {
    authUrl: 'http://127.0.0.1:9099',
    firestoreHost: '127.0.0.1',
    firestorePort: 8080,
  },
};
