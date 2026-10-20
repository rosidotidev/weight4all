import { PRIMARY } from './dimensions';
import { Entry, initialDraft } from './entry';

const stored: Entry = { day: '2026-10-20', values: { [PRIMARY.key]: 72.7 } };
const last: Entry = { day: '2026-10-19', values: { [PRIMARY.key]: 73.1 } };

describe('initialDraft', () => {
  it('does not add the Sleep default to a stored Entry without Sleep', () => {
    expect(initialDraft('2026-10-20', { '2026-10-20': stored }, null)).not.toHaveProperty('sleep');
  });

  it('uses the stored Entry values when one exists', () => {
    expect(initialDraft('2026-10-20', { '2026-10-20': stored }, last)).toEqual({ [PRIMARY.key]: 72.7 });
  });

  it('copies the values rather than sharing them', () => {
    expect(initialDraft('2026-10-20', { '2026-10-20': stored }, null)).not.toBe(stored.values);
  });

  it('starts from the registry default for a Dimension with one, and leaves the others out', () => {
    expect(initialDraft('2026-10-20', {}, null)).toEqual({ sleep: 6 });
  });

  it('suggests the last Entry primary value when given', () => {
    expect(initialDraft('2026-10-20', {}, last)).toEqual({ [PRIMARY.key]: 73.1, sleep: 6 });
  });

  it('ignores another Day entry', () => {
    expect(initialDraft('2026-10-20', { '2026-10-19': last }, null)).toEqual({ sleep: 6 });
  });
});
