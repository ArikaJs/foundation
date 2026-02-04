## Arika Foundation

`@arikajs/foundation` is the **engine block** of the ArikaJS ecosystem.

Before HTTP, routing, views, or CLI, this package defines the **core runtime model**:

- Application lifecycle
- Dependency Injection container
- Service provider system
- Configuration repository
- Kernel contracts (for HTTP / CLI / Queue to plug into later)

If the following works cleanly, the foundation is considered correct:

```ts
const app = new Application(basePath);

app.register(CoreServiceProvider);
app.boot();

app.run();
```

Arika Foundation is to ArikaJS what `illuminate/foundation` is to Laravel: everything else in the framework sits on top of this.

---

### Status

- **Stage**: Experimental / v0.x
- **Scope (v0.x)**:
  - Application class (lifecycle + base path)
  - Service container (DI)
  - Service provider system
  - Configuration repository (read-only after boot)
  - Kernel contracts (interfaces only)
- **Out of scope (for this package)**:
  - HTTP server
  - Router
  - View engine
  - Auth, Queue, Mail
  - CLI command definitions

The goal of this package is to stay **small, focused, and stable**, forming the backbone for the broader ArikaJS framework.

---

## Features

- **Application core**
  - Central `Application` object as the runtime “heart”
  - Explicit lifecycle: `register()`, `boot()`, `run()`
  - Owns base path, container, and provider list

- **Dependency Injection Container**
  - Bind interfaces to concrete implementations
  - Singleton and transient bindings
  - Register existing instances
  - Resolve services by string token or class

- **Service Provider System**
  - Laravel-style `ServiceProvider` abstraction
  - `register()` for bindings
  - `boot()` for runtime logic
  - Deterministic order: all `register()` run before any `boot()`

- **Configuration Repository**
  - Loads config files from `/config`
  - Access values via `config('app.name')`-style lookup
  - Read-only after application boot

- **Kernel Contracts**
  - Interfaces only (no HTTP/CLI logic here)
  - Contracts that HTTP, CLI, and Queue kernels will implement

---

## Installation

```bash
npm install @arikajs/foundation
# or
yarn add @arikajs/foundation
# or
pnpm add @arikajs/foundation
```

This package is written in TypeScript and ships with type definitions.

---

## Quick Start

### 1. Create an application instance

```ts
import { Application } from '@arikajs/foundation';

const app = new Application(__dirname);
```

### 2. Register a core service provider

```ts
import { ServiceProvider } from '@arikajs/foundation';

class CoreServiceProvider extends ServiceProvider {
  register() {
    // Bind services here
    this.app.singleton('config.app.name', () => 'My Arika App');
  }

  boot() {
    // Runtime boot logic (optional)
  }
}

app.register(CoreServiceProvider);
```

### 3. Boot and run the application

```ts
await app.boot();
await app.run();
```

At this stage, `run()` is intentionally minimal. In higher layers (HTTP/CLI), `run()` will typically delegate to an appropriate kernel.

### 4. Register services in the container

```ts
// Bind a concrete value directly on the app
app.instance('config.app.name', 'My Arika App');

// Bind a class (transient by default)
class Logger {
  log(message: string) {
    console.log(`[app] ${message}`);
  }
}

app.bind(Logger, () => new Logger());

// Or bind with a string key
app.bind('logger', () => new Logger());
```

### 5. Resolve and use services

```ts
const logger = app.make<Logger>(Logger);
logger.log('Application started.');

const appName = app.make<string>('config.app.name');
logger.log(`Running: ${appName}`);
```

In a full ArikaJS application, higher-level packages (`@arikajs/http`, `@arikajs/router`, `@arikajs/view`, etc.) will use the same `Application` instance and container, usually via a shared `app` exported from a bootstrap file.

---

## Application

The `Application` class is the central object you create once and pass around (or export) as your app’s runtime.

Core responsibilities:

- Owns the **service container**
- Tracks the **base path** of the project
- Manages **service providers**
- Coordinates the **lifecycle**: `register()` → `boot()` → `run()`

Minimal API:

```ts
class Application {
  constructor(basePath: string);

  register(provider: ServiceProvider | (new (app: Application) => ServiceProvider)): void;
  boot(): Promise<void> | void;
  run(): Promise<void> | void;
}
```

Typical usage:

```ts
import { Application } from '@arikajs/foundation';
import { CoreServiceProvider } from './CoreServiceProvider';

const app = new Application(__dirname);

app.register(CoreServiceProvider);

await app.boot();
await app.run();
```

Later, your HTTP server, CLI commands, and queue workers will all receive this shared `app` instance.

---

## Service Container

The container is responsible for:

- Holding bindings between **keys** (string tokens or classes) and **factories**
- Caching singletons when requested
- Resolving dependencies on demand

Minimal API:

```ts
container.bind(key, factory);
container.singleton(key, factory);
container.instance(key, value);
container.resolve(key); // or app.make(key)
```

### Binding

```ts
// Bind a class
app.bind(Logger, () => new Logger());

// Bind by string key
app.bind('logger', () => new Logger());

// Bind singleton
app.singleton(Logger, () => new Logger());
app.singleton('config', () => loadConfig());
```

### Resolving

```ts
const logger = app.make<Logger>(Logger);
logger.log('Hello from Arika Foundation.');

const config = app.make<Config>('config');
```

### Instances

Use `instance` when you already have an object and just want to register it:

```ts
const cache = new InMemoryCache();
app.instance('cache', cache);
```

---

## Service Providers

Service providers are the primary way to package and register features.

Base class:

```ts
abstract class ServiceProvider {
  constructor(protected readonly app: Application) {}

  abstract register(): void | Promise<void>;

  boot(): void | Promise<void> {
    // optional to override
  }
}
```

Rules:

- `register()`:
  - Bind services to the container.
  - No heavy runtime side-effects.
- `boot()`:
  - Perform runtime logic after all providers are registered.
  - Safe to resolve other services.

Registration order:

- All providers’ `register()` methods run first.
- Then all providers’ `boot()` methods run.

Usage:

```ts
class CoreServiceProvider extends ServiceProvider {
  register() {
    this.app.singleton('logger', () => new Logger());
  }

  boot() {
    const logger = this.app.make<Logger>('logger');
    logger.log('Core services booted.');
  }
}

app.register(CoreServiceProvider);
await app.boot();
```

---

## Configuration

Configuration is accessed via a lightweight repository that:

- Loads plain objects from files in `/config`
- Exposes them through a simple `get` API (or helper)
- Is read-only after application boot

Conceptually:

```ts
const name = app.config().get('app.name');
// or
const name = config('app.name');
```

Implementation details (for this package):

- A `Repository` class (e.g. `config/Repository.ts`) that stores nested config.
- Loading happens during application bootstrap, based on the `basePath` passed to `Application`.

Example `config/app.ts`:

```ts
export default {
  name: 'My Arika App',
  env: process.env.NODE_ENV ?? 'development',
};
```

Then:

```ts
const appName = app.config().get('app.name');
```

---

## Kernel Contracts

Foundation defines contracts for kernels, but does **not** implement HTTP, CLI, or Queue logic itself.

Example:

```ts
export interface Kernel {
  bootstrap(): Promise<void> | void;
  handle(...args: any[]): Promise<any> | any;
}
```

Higher-level packages (e.g. `@arikajs/http`, `@arikajs/cli`) will implement these interfaces and plug into the `Application` lifecycle.

---

## Project Structure (recommended)

Inside the `arika-foundation` repository:

- `src/`
  - `application/`
    - `Application.ts` – core application class and lifecycle
  - `container/`
    - `Container.ts` – service container implementation
  - `providers/`
    - `ServiceProvider.ts` – base service provider abstraction
  - `config/`
    - `Repository.ts` – configuration repository
  - `contracts/`
    - `Kernel.ts` – kernel interface(s)
  - `index.ts` – public exports
- `tests/`
  - Unit tests for container, providers, config, and application lifecycle

Your ArikaJS apps that consume this package will typically have:

- `app/` for application code
- `bootstrap/` for creating and configuring the `Application` instance

---

## Versioning & Stability

- While in **v0.x**, the API may change between minor versions.
- Once the container + application APIs stabilize, `@arikajs/foundation` will move to **v1.0** and follow **semver** strictly.

Because all other ArikaJS packages depend on this foundation, we aim to keep it:

- **Small**
- **Predictable**
- **Backward compatible** (post v1.0)

---

## Contributing

Contributions are welcome, especially around:

- Container ergonomics
- Clear, framework-level contracts
- Test coverage and type safety

Before submitting a PR:

- Run the test suite
- Add tests for any new behavior
- Keep the public API minimal and well-documented

---

## License

`@arikajs/foundation` is open-sourced software licensed under the **MIT license**.
