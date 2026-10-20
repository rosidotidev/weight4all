// Production environment. PLACEHOLDER VALUES: replace with the real Firebase project
// config when the project is created (Story 5.6). No emulator fields: prod never connects to emulators.
import type { Environment } from './environment.model';

export const environment: Environment = {
  name: 'prod',
  firebase: {
    apiKey: 'PLACEHOLDER_API_KEY',
    authDomain: 'PLACEHOLDER_PROJECT_ID.firebaseapp.com',
    projectId: 'PLACEHOLDER_PROJECT_ID',
    appId: 'PLACEHOLDER_APP_ID',
  },
};
