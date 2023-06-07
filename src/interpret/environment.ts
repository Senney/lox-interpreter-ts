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

    throw new Error(`UNdefined variable "${name.lexeme}".`);
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
}

export { Environment };
