import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntryStatus, EntryStore } from '../../core/data/entry.store';
import { PreferencesStore } from '../../core/data/preferences.store';
import { ClockService } from '../../core/state/clock.service';
import { Entry } from '../../domain/entry';
import { ReportComponent } from './report.component';
import { CombinedChartComponent } from './combined-chart.component';

const TODAY = '2026-10-21';

describe('ReportComponent', () => {
  let status: ReturnType<typeof signal<EntryStatus>>;
  let entries: ReturnType<typeof signal<Readonly<Record<string, Entry>>>>;
  let retry: ReturnType<typeof vi.fn<() => Promise<void>>>;

  beforeEach(async () => {
    status = signal<EntryStatus>('ready');
    entries = signal<Readonly<Record<string, Entry>>>({});
    retry = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    await TestBed.configureTestingModule({
      imports: [ReportComponent],
      providers: [
        provideRouter([]),
        { provide: EntryStore, useValue: { status, entries, retry } },
        { provide: PreferencesStore, useValue: { language: signal('en') } },
        { provide: ClockService, useValue: { today: signal(TODAY) } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Renders the Report and returns the fixture after the first change detection. */
  function render(): ComponentFixture<ReportComponent> {
    const fixture = TestBed.createComponent(ReportComponent);
    fixture.detectChanges();
    return fixture;
  }

  const element = (fixture: ComponentFixture<ReportComponent>, selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelector(selector);
  const count = (fixture: ComponentFixture<ReportComponent>, selector: string) =>
    (fixture.nativeElement as HTMLElement).querySelectorAll(selector).length;

  const withWeight = (): Record<string, Entry> => ({
    '2026-10-19': { day: '2026-10-19', values: { weight: 72.5 } },
    '2026-10-20': { day: '2026-10-20', values: { weight: 72.1 } },
  });

  it('shows only the loading status while loading with no Entries', () => {
    status.set('loading');
    const fixture = render();
    expect(element(fixture, '.visually-hidden[role="status"]')).not.toBeNull();
    expect(element(fixture, '.layout')).toBeNull();
    expect(element(fixture, '.empty')).toBeNull();
  });

  it('shows the empty message with a link to Today and the Statistics reading No data when loaded with no Entries', () => {
    const fixture = render();
    expect(element(fixture, '.empty')).not.toBeNull();
    expect(element(fixture, '.empty a')?.getAttribute('href')).toBe('/today');
    expect(element(fixture, '.layout.bare')).not.toBeNull();
    expect(count(fixture, '.card')).toBe(3);
    expect(count(fixture, '.card .value.none')).toBe(12);
  });

  it('shows only the alert, with no empty message and no charts, when the load fails with no Entries', () => {
    status.set('error');
    const fixture = render();
    expect(element(fixture, '[role="alert"]')).not.toBeNull();
    expect(element(fixture, '.empty')).toBeNull();
    expect(element(fixture, '.layout')).toBeNull();
    expect(count(fixture, '.card')).toBe(0);
  });

  it('keeps the Statistics and charts on screen when the load fails with Entries loaded', () => {
    entries.set(withWeight());
    status.set('error');
    const fixture = render();
    expect(element(fixture, '[role="alert"]')).not.toBeNull();
    expect(count(fixture, '.card')).toBe(3);
  });

  it('keeps the layout while a retry runs, so earlier data does not disappear', () => {
    entries.set(withWeight());
    status.set('loading');
    const fixture = render();
    expect(element(fixture, '.layout')).not.toBeNull();
    expect(element(fixture, '.visually-hidden[role="status"]')).toBeNull();
    expect(count(fixture, '.card')).toBe(3);
  });

  it('calls the store retry from the alert button', () => {
    status.set('error');
    const fixture = render();
    element(fixture, '.load-error button')?.dispatchEvent(new Event('click'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows the Statistics with no-data text for a Dimension without values in the Range', () => {
    entries.set(withWeight());
    const fixture = render();
    const values = Array.from(fixture.nativeElement.querySelectorAll('.card .value')) as HTMLElement[];
    // Weight has values (Average, Min, Max, Change); Mood and Sleep have none, so each reads "No data".
    expect(values.filter((value) => value.classList.contains('none')).length).toBe(8);
  });

  it('gives the Mood card the rect marker shared with the Mood chart', () => {
    entries.set(withWeight());
    const fixture = render();
    expect(element(fixture, '.marker[data-shape="rect"]')).not.toBeNull();
    expect(element(fixture, '.marker[data-shape="square"]')).toBeNull();
  });

  it('gives the combined chart one line per Dimension, in Dimension order, even when some have no values', () => {
    entries.set(withWeight());
    const fixture = render();
    const lines = fixture.componentInstance['combinedLines']();
    expect(lines.map((line) => line.legend)).toEqual(['Weight (kg)', 'Mood (1–10)', 'Sleep (h)']);
  });

  it('draws a chart only for a Dimension with a Real value in the Range', () => {
    entries.set(withWeight());
    const fixture = render();
    expect(count(fixture, 'w4a-dimension-chart')).toBe(1);
    expect(count(fixture, '.charts .chart-empty')).toBe(2);
  });

  it('shows a new Entry added after the Report rendered', () => {
    entries.set(withWeight());
    const fixture = render();
    entries.set({ ...withWeight(), [TODAY]: { day: TODAY, values: { weight: 72 } } });
    fixture.detectChanges();
    const series = fixture.componentInstance['combinedLines']()[0].series;
    expect(series[series.length - 1].value).toBe(72);
  });

  it('recovers after a retry: the alert goes and the Statistics stay', () => {
    entries.set(withWeight());
    status.set('error');
    const fixture = render();
    status.set('loading');
    fixture.detectChanges();
    status.set('ready');
    fixture.detectChanges();
    expect(element(fixture, '[role="alert"]')).toBeNull();
    expect(count(fixture, '.card')).toBe(3);
  });

  it('selects a Range chip on click and shows the check mark on it only', () => {
    entries.set(withWeight());
    const fixture = render();
    const chips = Array.from(fixture.nativeElement.querySelectorAll('.chip')) as HTMLButtonElement[];
    chips[0].click();
    fixture.detectChanges();
    expect(chips[0].getAttribute('aria-checked')).toBe('true');
    expect(chips[1].getAttribute('aria-checked')).toBe('false');
    expect(chips[0].querySelector('svg')).not.toBeNull();
    expect(chips[1].querySelector('svg')).toBeNull();
  });

  it('labels the combined section so it is a named region', () => {
    entries.set(withWeight());
    const fixture = render();
    expect(element(fixture, 'section.combined[aria-label]')).not.toBeNull();
  });

  it('moves to the first and last Range chips with Home and End', () => {
    entries.set(withWeight());
    const fixture = render();
    const chips = () => Array.from(fixture.nativeElement.querySelectorAll('.chip')) as HTMLButtonElement[];
    chips()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(chips()[4].getAttribute('aria-checked')).toBe('true');
    chips()[4].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(chips()[0].getAttribute('aria-checked')).toBe('true');
  });

  it('does not use the combined chart component when no Dimension has values', () => {
    entries.set({ '2026-10-20': { day: '2026-10-20', values: {} } });
    const fixture = render();
    expect(fixture.debugElement.query((node) => node.componentInstance instanceof CombinedChartComponent)).toBeFalsy();
    expect(element(fixture, '.combined .chart-empty')).not.toBeNull();
  });

  it('shows the Report in Italian when the Language is Italian', () => {
    TestBed.overrideProvider(PreferencesStore, { useValue: { language: signal('it') } });
    entries.set(withWeight());
    const fixture = render();
    const texts = (selector: string) =>
      Array.from(fixture.nativeElement.querySelectorAll(selector) as NodeListOf<HTMLElement>).map((node) =>
        node.textContent?.trim(),
      );
    expect(texts('.chip span')).toEqual(['7 g', '30 g', '90 g', '1 a', 'Tutto']);
    expect(texts('.card .caption')[0]).toBe('ultimi 30 giorni');
    expect(texts('.card .label')).toEqual(['Media', 'Minimo', 'Massimo', 'Variazione', 'Media', 'Minimo', 'Massimo', 'Variazione', 'Media', 'Minimo', 'Massimo', 'Variazione']);
    expect(texts('.card .value.none')[0]).toBe('Nessun dato');
  });
});
