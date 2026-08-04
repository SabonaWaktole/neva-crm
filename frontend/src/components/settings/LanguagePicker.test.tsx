import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LanguagePicker } from './LanguagePicker';
import { REVIEWED_LANGUAGES } from '../../i18n/reviewStatus';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../../i18n/config';
import '../../i18n';

/**
 * The point of these assertions is honesty, not layout.
 *
 * An unreviewed translation presented as an equal-footing option misleads
 * exactly the person least able to detect the problem — the one who cannot read
 * the other language well enough to judge it. Same principle as every "Coming
 * soon" placeholder in this project: the interface should not claim more than
 * is true.
 */
describe('LanguagePicker', () => {
  it('offers every supported language', () => {
    // Driven off SUPPORTED_LANGUAGES rather than a hand-listed set, so adding a
    // language to the config without wiring up its label fails here.
    render(<LanguagePicker id="lang" value="en" onChange={vi.fn()} />);

    for (const code of SUPPORTED_LANGUAGES) {
      expect(screen.getByRole('option', { name: new RegExp(LANGUAGE_LABELS[code]) })).toBeTruthy();
    }
    expect(screen.getAllByRole('option')).toHaveLength(SUPPORTED_LANGUAGES.length);
  });

  it('names each language in itself, not in the current interface language', () => {
    // Someone who cannot read the current language needs to recognise their own.
    // "Albanian" is useless to a person who only reads Albanian; "Shqip" is not.
    render(<LanguagePicker id="lang" value="en" onChange={vi.fn()} />);

    expect(screen.queryByRole('option', { name: /^Albanian/ })).toBeNull();
    expect(screen.queryByRole('option', { name: /^Greek/ })).toBeNull();
    // No exonym check for Italian: its endonym is "Italiano", which contains
    // the English name, so absence of "Italian" is not something this can show.
    // The positive assertion below is what carries the case there.
    expect(screen.getByRole('option', { name: /Shqip/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Ελληνικά/ })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Italiano/ })).toBeTruthy();
  });

  it('marks every unreviewed language in the option itself, not only in a footnote', () => {
    render(<LanguagePicker id="lang" value="en" onChange={vi.fn()} />);

    for (const code of SUPPORTED_LANGUAGES) {
      if (REVIEWED_LANGUAGES.includes(code)) continue;
      const option = screen.getByRole('option', { name: new RegExp(LANGUAGE_LABELS[code]) });
      expect(option.textContent).toMatch(/in review/i);
    }
  });

  it('does not mark a reviewed language', () => {
    render(<LanguagePicker id="lang" value="en" onChange={vi.fn()} />);

    const english = screen.getByRole('option', { name: /English/ });
    expect(english.textContent).not.toMatch(/in review/i);
    expect(REVIEWED_LANGUAGES).toContain('en');
  });

  it('states plainly that server errors stay English', () => {
    // TD-016 is a known MVP limitation. Someone choosing Albanian should learn
    // it here rather than the first time a validation error appears.
    render(<LanguagePicker id="lang" value="en" onChange={vi.fn()} />);

    expect(screen.getByText(/server error messages are still shown in English/i)).toBeTruthy();
  });

  it('offers "follow the company default" only where inheriting is possible', () => {
    const { rerender } = render(
      <LanguagePicker
        id="lang"
        value=""
        onChange={vi.fn()}
        inheritOption={{ label: 'Follow the company default' }}
      />
    );
    expect(screen.getByRole('option', { name: 'Follow the company default' })).toBeTruthy();

    // A workspace default has nothing above it to inherit from.
    rerender(<LanguagePicker id="lang" value="en" onChange={vi.fn()} />);
    expect(screen.queryByRole('option', { name: 'Follow the company default' })).toBeNull();
  });

  it('reports the inherit choice as empty so the caller can send null', () => {
    // '' -> null is what distinguishes "follow the default" from "chose English"
    // all the way down to the nullable column.
    const onChange = vi.fn();
    render(
      <LanguagePicker
        id="lang"
        value="sq"
        onChange={onChange}
        inheritOption={{ label: 'Follow the company default' }}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    select.value = '';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
