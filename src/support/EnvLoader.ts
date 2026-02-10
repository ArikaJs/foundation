import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Environment variable loader for ArikaJS.
 *
 * Uses dotenv to load key=value pairs from a .env file
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

        // Use dotenv to load environment variables
        dotenv.config({ path: envPath });
    }
}
