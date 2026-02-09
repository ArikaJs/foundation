/**
 * Get the value of an environment variable.
 *
 * @param key The environment variable key
 * @param defaultValue The default value if the key is not set
 * @returns The environment variable value or the default value
 */
export function env<T = string>(key: string, defaultValue?: T): T {
  const value = process.env[key];

  if (value === undefined) {
    return defaultValue as T;
  }

  // Handle common boolean strings
  if (value.toLowerCase() === 'true') {
    return true as any;
  }

  if (value.toLowerCase() === 'false') {
    return false as any;
  }

  // Handle common null/empty strings
  if (value.toLowerCase() === 'null') {
    return null as any;
  }

  if (value.toLowerCase() === '(empty)') {
    return '' as any;
  }

  return value as any;
}
