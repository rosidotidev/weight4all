// Copia questo file in firebase.prod.values.ts e inserisci i valori reali del progetto Firebase
// (Console Firebase > Impostazioni progetto > La tua app > Config SDK).
import type { Environment } from './environment.model';

export const prodFirebase: Environment['firebase'] = {
  apiKey: 'PLACEHOLDER_API_KEY',
  authDomain: 'PLACEHOLDER_PROJECT_ID.firebaseapp.com',
  projectId: 'PLACEHOLDER_PROJECT_ID',
  appId: 'PLACEHOLDER_APP_ID',
};
