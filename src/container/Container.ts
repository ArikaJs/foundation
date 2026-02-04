export type Token<T = any> = string | symbol | (new (...args: any[]) => T);

export type Factory<T = any> = (container: Container) => T;

interface Binding<T = any> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * Lightweight dependency injection container for ArikaJS.
 *
 * Responsible for:
 * - Registering bindings and singletons
 * - Resolving services on demand
 * - Holding pre-built instances
 */
export class Container {
  private bindings = new Map<Token, Binding>();

  /**
   * Bind a token to a factory. Produces a new instance on every resolution.
   */
  bind<T>(token: Token<T>, factory: Factory<T>): void {
    this.bindings.set(token, { factory, singleton: false });
  }

  /**
   * Bind a token as a singleton. The factory runs once and the
   * same instance is returned for all subsequent resolutions.
   */
  singleton<T>(token: Token<T>, factory: Factory<T>): void {
    this.bindings.set(token, { factory, singleton: true });
  }

  /**
   * Directly register an existing instance for a token.
   */
  instance<T>(token: Token<T>, value: T): void {
    this.bindings.set(token, {
      factory: () => value,
      singleton: true,
      instance: value,
    });
  }

  /**
   * Resolve a token from the container.
   */
  make<T>(token: Token<T>): T {
    const binding = this.bindings.get(token);

    if (!binding) {
      throw new Error(
        `Container: no binding found for token "${String(token)}"`,
      );
    }

    if (binding.singleton) {
      if (binding.instance === undefined) {
        binding.instance = binding.factory(this);
      }
      return binding.instance as T;
    }

    return binding.factory(this);
  }

  /**
   * Alias for make() - resolves a token from the container.
   */
  resolve<T>(token: Token<T>): T {
    return this.make(token);
  }

  /**
   * Check whether a token has been registered.
   */
  has(token: Token): boolean {
    return this.bindings.has(token);
  }
}
