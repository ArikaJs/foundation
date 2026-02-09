import * as fs from 'fs';
import * as path from 'path';

/**
 * Lightweight environment variable loader for ArikaJS.
 *
 * Inspired by Laravel/Dotenv, it loads key=value pairs from a .env file
 * and injects them into process.env.
 */
export class EnvLoader {
    /**
     * Load the .env file from the given directory.
     *
     * @param directory The directory where the .env file is located
     */
    public static load(directory: string): void {
        const envPath = path.join(directory, '.env');

        if (!fs.existsSync(envPath)) {
            return;
        }

        try {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split(/\r?\n/);

            for (const line of lines) {
                // Skip comments and empty lines
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('#')) {
                    continue;
                }

                // Parse key=value
                const match = trimmedLine.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    let value = match[2].trim();

                    // Handle inline comments (if not quoted)
                    if (!value.startsWith('"') && !value.startsWith("'")) {
                        const commentIndex = value.indexOf('#');
                        if (commentIndex !== -1) {
                            value = value.substring(0, commentIndex).trim();
                        }
                    }

                    // Remove quotes if present
                    if (
                        (value.startsWith('"') && value.endsWith('"')) ||
                        (value.startsWith("'") && value.endsWith("'"))
                    ) {
                        value = value.substring(1, value.length - 1);
                    }

                    if (process.env[key] === undefined) {
                        process.env[key] = value;
                    }
                }
            }
        } catch (error) {
            // Silently fail if file cannot be read
        }
    }
}
