import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getPreferenceCategoryLabel, preferenceCategoryOptions, preferenceCountryOptions } from '../../lib/preferences'

const emptyPreferences = {
  countries: [],
  categories: [],
}

function normalizePreferences(value) {
  return {
    countries: value?.countries ?? emptyPreferences.countries,
    categories: value?.categories ?? emptyPreferences.categories,
  }
}

export function PreferenceEditor({
  value,
  onChange,
  countryLabel = 'Countries to keep in view',
  categoryLabel = 'Signal types to prioritize',
  helper,
  compact = false,
  disabled = false,
}) {
  const preferences = normalizePreferences(value)
  const [countryDraft, setCountryDraft] = useState('')

  const availableCountries = useMemo(
    () => preferenceCountryOptions.filter((country) => !preferences.countries.includes(country)),
    [preferences.countries],
  )

  const updateCountries = (countries) => onChange({ ...preferences, countries })
  const updateCategories = (categories) => onChange({ ...preferences, categories })
  const addCountry = (country) => {
    if (!country || preferences.countries.includes(country)) return

    updateCountries([...preferences.countries, country])
    setCountryDraft('')
  }

  const selectedCountries = preferences.countries.length ? (
    <div className="mt-3 flex flex-wrap gap-2">
      {preferences.countries.map((country) => (
        <button
          key={country}
          type="button"
          disabled={disabled}
          onClick={() => updateCountries(preferences.countries.filter((item) => item !== country))}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-3 py-1.5 text-sm text-cyan-100 transition hover:border-cyan-400/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {country}
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  ) : null

  if (compact) {
    return (
      <div className="space-y-7">
        <section>
          <div className="flex items-center justify-between gap-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-300">{countryLabel}</div>
            <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {preferences.countries.length}
            </div>
          </div>

          <div className="mt-3 rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
            <select
              value={countryDraft}
              onChange={(event) => addCountry(event.target.value)}
              disabled={disabled || !availableCountries.length}
              className="w-full border-0 bg-transparent text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" className="bg-surface text-text-dim">
                {availableCountries.length ? 'Select a country' : 'All countries selected'}
              </option>
              {availableCountries.map((country) => (
                <option key={country} value={country} className="bg-surface text-white">
                  {country}
                </option>
              ))}
            </select>
          </div>

          {selectedCountries}
        </section>

        <section>
          <div className="flex items-center justify-between gap-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-300">{categoryLabel}</div>
            <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              {preferences.categories.length}
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {preferenceCategoryOptions.map((option) => {
              const active = preferences.categories.includes(option.value)

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    updateCategories(
                      active
                        ? preferences.categories.filter((item) => item !== option.value)
                        : [...preferences.categories, option.value],
                    )
                  }
                  className={`rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                    active
                      ? 'border-cyan-500/30 bg-cyan-500/[0.08] text-white shadow-glow-cyan'
                      : 'border-white/8 bg-white/[0.03] text-text-secondary hover:border-cyan-500/18 hover:text-white'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </section>

        {helper ? <p className="text-sm text-cyan-100">{helper}</p> : null}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">{countryLabel}</div>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Search and choose the places you want the account view to keep foregrounded.
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {preferences.countries.length} selected
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
            <select
              value={countryDraft}
              onChange={(event) => addCountry(event.target.value)}
              disabled={disabled || !availableCountries.length}
              className="w-full border-0 bg-transparent text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="" className="bg-surface text-text-dim">
                {availableCountries.length ? 'Select a country' : 'All countries selected'}
              </option>
              {availableCountries.map((country) => (
                <option key={country} value={country} className="bg-surface text-white">
                  {country}
                </option>
              ))}
            </select>
          </div>

          {preferences.countries.length ? (
            selectedCountries
          ) : (
            <div className="mt-4 rounded-full border border-dashed border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              No countries selected yet
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">{categoryLabel}</div>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Choose the kinds of developments that should shape your AI-suggested watchlist first.
            </p>
          </div>
          <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {preferences.categories.length} selected
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {preferenceCategoryOptions.map((option) => {
            const active = preferences.categories.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() =>
                  updateCategories(
                    active
                      ? preferences.categories.filter((item) => item !== option.value)
                      : [...preferences.categories, option.value],
                  )
                }
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  active
                    ? 'border-cyan-500/30 bg-cyan-500/[0.08] shadow-glow-cyan'
                    : 'border-white/8 bg-white/[0.03] hover:border-cyan-500/18 hover:bg-white/[0.05]'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="font-display text-[21px] font-medium text-white">{option.label}</div>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{option.description}</p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {active ? 'Selected' : 'Tap to include'}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {helper ? <p className="text-sm leading-7 text-text-secondary">{helper}</p> : null}

      {preferences.categories.length ? (
        <div className="flex flex-wrap gap-2">
          {preferences.categories.map((category) => (
            <span
              key={category}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary"
            >
              {getPreferenceCategoryLabel(category)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
