/* eslint-disable no-restricted-imports -- rules tests drive the emulator through the Firebase SDK (AD-1 governs app code). */
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createEnv } from './helpers';
import {
  INVALID_DAY_IDS,
  INVALID_MOODS,
  INVALID_SLEEPS,
  INVALID_WEIGHTS,
  VALID_DAY_IDS,
  VALID_MOODS,
  VALID_SLEEPS,
  VALID_WEIGHTS,
} from './vectors';

let env: RulesTestEnvironment;
const DAY = '2026-01-05';

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
const write = (id: string, data: Record<string, unknown>, db = alice()) =>
  setDoc(doc(db, `users/alice/entries/${id}`), data);
const base = () => ({ weight: 72.5, updatedAt: serverTimestamp() });

describe('entries access', () => {
  it('owner can write and read own entry', async () => {
    await assertSucceeds(write(DAY, base()));
    await assertSucceeds(getDoc(doc(alice(), `users/alice/entries/${DAY}`)));
  });

  it('owner can delete own entry', async () => {
    await assertSucceeds(write(DAY, base()));
    await assertSucceeds(deleteDoc(doc(alice(), `users/alice/entries/${DAY}`)));
  });

  it('another user and unauthenticated cannot delete an entry', async () => {
    await assertSucceeds(write(DAY, base()));
    const bob = env.authenticatedContext('bob').firestore();
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(deleteDoc(doc(bob, `users/alice/entries/${DAY}`)));
    await assertFails(deleteDoc(doc(anon, `users/alice/entries/${DAY}`)));
  });

  it('another user is denied read and write', async () => {
    await assertSucceeds(write(DAY, base()));
    const bob = env.authenticatedContext('bob').firestore();
    await assertFails(getDoc(doc(bob, `users/alice/entries/${DAY}`)));
    await assertFails(write(DAY, base(), bob));
  });

  it('unauthenticated is denied read and write', async () => {
    await assertSucceeds(write(DAY, base()));
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, `users/alice/entries/${DAY}`)));
    await assertFails(write(DAY, base(), anon));
  });

  it('other paths are denied even for the owner', async () => {
    const db = alice();
    await assertFails(setDoc(doc(db, 'users/alice/other/x'), { a: 1 }));
    await assertFails(getDoc(doc(db, 'users/alice/other/x')));
    await assertFails(setDoc(doc(db, 'users/alice'), { a: 1 }));
    await assertFails(setDoc(doc(db, 'stuff/x'), { a: 1 }));
    await assertFails(getDoc(doc(db, 'stuff/x')));
  });
});

describe('entries shape', () => {
  it('accepts a full entry', async () => {
    await assertSucceeds(write(DAY, { ...base(), mood: 7, sleep: 7.5 }));
  });

  it.each(VALID_WEIGHTS)('accepts weight %s', async (weight) => {
    await assertSucceeds(write(DAY, { ...base(), weight }));
  });
  it.each(INVALID_WEIGHTS)('denies weight %j', async (weight) => {
    await assertFails(write(DAY, { ...base(), weight }));
  });

  it.each(VALID_MOODS)('accepts mood %s', async (mood) => {
    await assertSucceeds(write(DAY, { ...base(), mood }));
  });
  it.each(INVALID_MOODS)('denies mood %j', async (mood) => {
    await assertFails(write(DAY, { ...base(), mood }));
  });

  it.each(VALID_SLEEPS)('accepts sleep %s', async (sleep) => {
    await assertSucceeds(write(DAY, { ...base(), sleep }));
  });
  it.each(INVALID_SLEEPS)('denies sleep %j', async (sleep) => {
    await assertFails(write(DAY, { ...base(), sleep }));
  });

  it.each(VALID_DAY_IDS)('accepts id %s', async (id) => {
    await assertSucceeds(write(id, base()));
  });
  it.each(INVALID_DAY_IDS)('denies id %s', async (id) => {
    await assertFails(write(id, base()));
  });

  it('denies an extra key', async () => {
    await assertFails(write(DAY, { ...base(), note: 'hi' }));
  });
  it('denies a missing weight', async () => {
    await assertFails(write(DAY, { mood: 5, updatedAt: serverTimestamp() }));
  });
  it('denies a missing updatedAt', async () => {
    await assertFails(write(DAY, { weight: 72 }));
  });
  it('denies updatedAt that is not request.time', async () => {
    await assertFails(write(DAY, { weight: 72, updatedAt: new Date('2020-01-01T00:00:00Z') }));
  });
  it('also validates updates', async () => {
    await assertSucceeds(write(DAY, base()));
    await assertFails(write(DAY, { ...base(), weight: 19.9 }));
  });
});
