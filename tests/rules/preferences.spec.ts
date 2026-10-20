/* eslint-disable no-restricted-imports -- rules tests drive the emulator through the Firebase SDK (AD-1 governs app code). */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { createEnv } from './helpers';
import { ACCENTS, INVALID_ACCENTS, INVALID_LANGUAGES, LANGUAGES } from './vectors';

let env: RulesTestEnvironment;
const PATH = 'users/alice/preferences/app';

beforeAll(async () => {
  env = await createEnv();
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
});

const alice = () => env.authenticatedContext('alice').firestore();
const write = (data: Record<string, unknown>, db = alice()) => setDoc(doc(db, PATH), data);
const ok = { accent: 'violet', language: 'en' };

describe('preferences access', () => {
  it('owner can write and read', async () => {
    await assertSucceeds(write(ok));
    await assertSucceeds(getDoc(doc(alice(), PATH)));
  });

  it('another user and anonymous are denied', async () => {
    await assertSucceeds(write(ok));
    const bob = env.authenticatedContext('bob').firestore();
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(bob, PATH)));
    await assertFails(write(ok, bob));
    await assertFails(getDoc(doc(anon, PATH)));
    await assertFails(write(ok, anon));
  });

  it('owner can delete; another user and anonymous cannot', async () => {
    await assertSucceeds(write(ok));
    const bob = env.authenticatedContext('bob').firestore();
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(deleteDoc(doc(bob, PATH)));
    await assertFails(deleteDoc(doc(anon, PATH)));
    await assertSucceeds(deleteDoc(doc(alice(), PATH)));
  });

  it('other preferences documents are denied', async () => {
    await assertFails(setDoc(doc(alice(), 'users/alice/preferences/other'), ok));
  });
});

describe('preferences values', () => {
  it.each(ACCENTS)('accepts accent %s', async (accent) => {
    await assertSucceeds(write({ accent, language: 'en' }));
  });
  it.each(INVALID_ACCENTS)('denies accent %j', async (accent) => {
    await assertFails(write({ accent, language: 'en' }));
  });
  it.each(LANGUAGES)('accepts language %s', async (language) => {
    await assertSucceeds(write({ accent: 'teal', language }));
  });
  it.each(INVALID_LANGUAGES)('denies language %j', async (language) => {
    await assertFails(write({ accent: 'teal', language }));
  });
  it('denies extra or missing keys', async () => {
    await assertFails(write({ accent: 'teal', language: 'it', extra: 1 }));
    await assertFails(write({ accent: 'teal' }));
  });
});
