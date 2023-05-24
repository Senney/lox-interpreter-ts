import { Token } from '../lex/token';

class Environment {
  private values: Map<string, unknown>;
  constructor() {
    this.values = new Map();
  }

  public define(name: string, value: unknown): void {
    this.values.set(name, value);
  }

  assign(name: Token, value: unknown): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    throw new Error(`UNdefined variable "${name.lexeme}".`);
  }

  public get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    throw new Error(`Undefined variable "${name.lexeme}.`);
  }
}

export { Environment };
