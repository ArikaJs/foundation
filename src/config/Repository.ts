import * as fs from 'fs';
import * as path from 'path';

// Type declaration for require in CommonJS context
declare const require: (id: string) => any;

/**
 * Configuration repository for ArikaJS.
 *
 * Loads configuration files from the /config directory and provides
 * read-only access to configuration values.
 */
export class Repository {
  private config: Record<string, any> = {};
  private booted = false;

  /**
   * Load configuration files from the config directory.
   */
  loadConfigDirectory(configPath: string): void {
    if (this.booted) {
      throw new Error('Configuration cannot be modified after boot.');
    }

    if (!fs.existsSync(configPath)) {
      return;
    }

    const files = fs.readdirSync(configPath);
    const configFiles = files.filter(
      (file: string) => file.endsWith('.js') || file.endsWith('.ts'),
    );

    for (const file of configFiles) {
      const filePath = path.join(configPath, file);
      const configName = path.basename(file, path.extname(file));

      try {
        // Load config file - expects compiled JS in production
        // For TS files, they should be pre-compiled to JS
        const configModule = require(filePath);
        const configValue = configModule.default || configModule;

        if (typeof configValue === 'object' && configValue !== null) {
          this.config[configName] = configValue;
        }
      } catch (error) {
        // Silently skip files that can't be loaded
        // In production, you might want to log this
      }
    }
  }

  /**
   * Get a configuration value using dot notation.
   * Example: get('app.name') returns config.app.name
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value === undefined || value === null) {
        return defaultValue;
      }
      value = value[k];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Check if a configuration key exists.
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Get all configuration.
   */
  all(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * Mark the repository as booted (read-only).
   */
  markAsBooted(): void {
    this.booted = true;
  }

  /**
   * Check if the repository has been booted.
   */
  isBooted(): boolean {
    return this.booted;
  }
}
