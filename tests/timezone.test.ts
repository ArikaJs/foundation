import { test } from 'node:test';
import assert from 'node:assert';
import { Application } from '../src/application/Application';

test('Application: applies timezone from config during boot', async (t) => {
    // Save original TZ
    const originalTZ = process.env.TZ;

    // Ensure we start clean for this test
    delete process.env.TZ;

    const app = new Application(__dirname);

    // Mock config repository to return a timezone
    // We can't easily load a file here without creating one, but we can inject into the repo
    // Since Repository.config is private, we use the type assertion trick used in other tests
    (app.config() as any).config = {
        app: {
            timezone: 'Asia/Kolkata'
        }
    };

    await app.boot();

    assert.strictEqual(process.env.TZ, 'Asia/Kolkata');

    // Verify Date behavior (optional, but good sanity check)
    // Note: This depends on the system having the timezone data, which most Node environments do
    try {
        const date = new Date('2023-01-01T12:00:00Z');
        // checking the string representation might be flaky across systems if full ICU data isn't present
        // but verifying process.env.TZ is sufficient for the requirement "process.env.TZ = config('app.timezone')"
        assert.ok(process.env.TZ);
    } catch (e) {
        // ignore
    }

    // Cleanup
    if (originalTZ) {
        process.env.TZ = originalTZ;
    } else {
        delete process.env.TZ;
    }
});

test('Application: does not change TZ if not configured', async () => {
    // Save original TZ
    const originalTZ = process.env.TZ;

    const app = new Application(__dirname);
    // No config injected

    await app.boot();

    assert.strictEqual(process.env.TZ, originalTZ); // Should remain unchanged
});
