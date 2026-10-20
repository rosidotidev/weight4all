export interface Environment {
  name: 'local' | 'prod';
  firebase: { apiKey: string; authDomain: string; projectId: string; appId: string };
  emulators?: { authUrl: string; firestoreHost: string; firestorePort: number };
}
