import { Repository } from '../config/Repository';

let activeRepo: Repository | null = null;

/**
 * Set the active configuration repository.
 *
 * This is used by the config() helper to find the current configuration.
 *
 * @param repo The repository instance
 */
export function setConfigRepository(repo: Repository): void {
    activeRepo = repo;
}

/**
 * Get a configuration value.
 *
 * @param key The configuration key (dot notation)
 * @param defaultValue The default value if the key is not found
 * @returns The configuration value or the default value
 */
export function config<T = any>(key: string, defaultValue?: T): T | undefined {
    if (!activeRepo) {
        return defaultValue;
    }

    return activeRepo.get(key, defaultValue);
}
