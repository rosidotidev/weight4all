import { PRIMARY } from './dimensions';
import { Entry, initialDraft } from './entry';

const stored: Entry = { day: '2026-10-20', values: { [PRIMARY.key]: 72.7 } };
const last: Entry = { day: '2026-10-19', values: { [PRIMARY.key]: 73.1 } };

describe('initialDraft', () => {
  it('uses the stored Entry values when one exists', () => {
    expect(initialDraft('2026-10-20', { '2026-10-20': stored }, last)).toEqual({ [PRIMARY.key]: 72.7 });
  });

  it('copies the values rather than sharing them', () => {
    expect(initialDraft('2026-10-20', { '2026-10-20': stored }, null)).not.toBe(stored.values);
  });

  it('is empty for a Dimension without a default and no last Entry', () => {
    expect(initialDraft('2026-10-20', {}, null)).toEqual({});
  });

  it('suggests the last Entry primary value when given', () => {
    expect(initialDraft('2026-10-20', {}, last)).toEqual({ [PRIMARY.key]: 73.1 });
  });

  it('ignores another Day entry', () => {
    expect(initialDraft('2026-10-20', { '2026-10-19': last }, null)).toEqual({});
  });
});
