import * as path from 'path';
import { Container, Token, Factory } from '../container/Container';
import { ServiceProvider } from '../providers/ServiceProvider';
import { Repository } from '../config/Repository';

/**
 * Application is the core runtime of ArikaJS.
 *
 * It manages:
 * - Service container
 * - Service providers
 * - Configuration
 * - Application lifecycle (register → boot → run)
 */
export class Application {
  private readonly container: Container;
  private readonly basePath: string;
  private readonly configRepository: Repository;
  private providers: ServiceProvider[] = [];
  private booted = false;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
    this.container = new Container();
    this.configRepository = new Repository();

    // Register the application, container, and config for injection
    this.container.instance(Application, this);
    this.container.instance(Container, this.container);
    this.container.instance(Repository, this.configRepository);

    // Load configuration from config directory
    const configPath = path.join(this.basePath, 'config');
    this.configRepository.loadConfigDirectory(configPath);
  }

  /**
   * Get the base path of the application.
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Access the underlying container.
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Access the configuration repository.
   */
  config(): Repository {
    return this.configRepository;
  }

  /**
   * Register a service provider.
   * Can accept a class (will be instantiated) or an instance.
   */
  register(
    provider:
      | ServiceProvider
      | (new (app: Application) => ServiceProvider),
  ): void {
    if (this.booted) {
      throw new Error(
        'Cannot register providers after the application has been booted.',
      );
    }

    const providerInstance =
      provider instanceof ServiceProvider
        ? provider
        : new provider(this);

    this.providers.push(providerInstance);
  }

  /**
   * Boot all registered service providers.
   * First runs all register() methods, then all boot() methods.
   */
  async boot(): Promise<void> {
    if (this.booted) {
      return;
    }

    // Phase 1: Register all providers
    for (const provider of this.providers) {
      await provider.register();
    }

    // Phase 2: Boot all providers
    for (const provider of this.providers) {
      await provider.boot();
    }

    // Mark config as booted (read-only)
    this.configRepository.markAsBooted();

    this.booted = true;
  }

  /**
   * Run the application.
   * This is intentionally minimal in foundation - higher layers
   * (HTTP/CLI) will override or extend this behavior.
   */
  async run(): Promise<void> {
    if (!this.booted) {
      await this.boot();
    }

    // In foundation, run() is a no-op
    // HTTP/CLI kernels will implement actual run logic
  }

  /**
   * Bind a transient service.
   */
  bind<T>(token: Token<T>, factory: Factory<T>): void {
    this.container.bind(token, factory);
  }

  /**
   * Bind a singleton service.
   */
  singleton<T>(token: Token<T>, factory: Factory<T>): void {
    this.container.singleton(token, factory);
  }

  /**
   * Register an existing instance.
   */
  instance<T>(token: Token<T>, value: T): void {
    this.container.instance(token, value);
  }

  /**
   * Resolve a service from the container.
   */
  make<T>(token: Token<T>): T {
    return this.container.make(token);
  }

  /**
   * Alias for make() - resolves a service from the container.
   */
  resolve<T>(token: Token<T>): T {
    return this.container.resolve(token);
  }

  /**
   * Check if the application has been booted.
   */
  isBooted(): boolean {
    return this.booted;
  }
}
