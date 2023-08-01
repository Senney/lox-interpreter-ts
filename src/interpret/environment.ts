import { Token } from '../lex/token';

class Environment {
  private values: Map<string, unknown>;
  private enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.values = new Map();
    this.enclosing = enclosing;
  }

  public define(name: string, value: unknown): void {
    this.values.set(name, value);
  }

  assign(name: Token, value: unknown): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      return this.enclosing.assign(name, value);
    }

    throw new Error(`Undefined variable "${name.lexeme}".`);
  }

  public assignAt(distance: number, name: Token, value: unknown): void {
    this.ancestor(distance).values.set(name.lexeme, value);
  }

  public get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new Error(`Undefined variable "${name.lexeme}.`);
  }

  public getAt(distance: number, name: string): unknown {
    return this.ancestor(distance).values.get(name);
  }

  private ancestor(distance: number): Environment {
    let env: Environment | undefined = this;
    for (let i = 0; i < distance; i++) {
      env = env?.enclosing;
    }

    if (!env) {
      throw new Error('Unable to resolve ancestor environment');
    }

    return env;
  }
}

export { Environment };
