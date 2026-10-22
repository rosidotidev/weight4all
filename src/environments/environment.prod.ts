// Production environment: real Firebase project. Never connects to emulators.
// `environment.prod.ts` replaces `environment.ts` in the production build (angular.json fileReplacements).
// I valori Firebase arrivano da firebase.prod.values.ts (ignorato da git).
import type { Environment } from './environment.model';
import { prodFirebase } from './firebase.prod.values';

export const environment: Environment = {
  name: 'prod',
  firebase: prodFirebase,
};
