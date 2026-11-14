// A number that lives in a text input. A DOM input's value is always a string,
// so every numeric form field needs a way in; this is form-agnostic so any
// screen with number fields uses the same rule.

/**
 * For `register(path, { setValueAs: toNumberOrNull })` on a nullable column.
 *
 * An empty box means "not set", which is `null`. `valueAsNumber` cannot express
 * that — it turns `''` into `NaN`, which fails a `.nullable()` number and shows
 * an error on a field deliberately left blank.
 *
 * The parameter is `unknown` rather than `string` because react-hook-form also
 * runs this over the value already in form state, which starts out as `null`.
 */
export function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : Number(trimmed)
}
