import { FunctionStatement } from '../ast/statement';
import { Environment } from './environment';
import { Interpreter } from './interpreter';
import { isReturnError } from './return';

const CallableSymbol = Symbol('callable');

export interface Callable {
  [CallableSymbol]: boolean;
  arity(): number;
  call(interpreter: Interpreter, args: unknown[]): unknown;
}

export abstract class NativeCallable implements Callable {
  public [CallableSymbol] = true;
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: unknown[]): unknown;
}

export const isCallable = (candidate: unknown): candidate is Callable => {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    Object.prototype.hasOwnProperty.call(candidate, CallableSymbol) &&
    (candidate as Callable)[CallableSymbol] === true
  );
};

export class LoxFunction implements Callable {
  public [CallableSymbol] = true;

  constructor(
    private declaration: FunctionStatement,
    private closure: Environment
  ) {}

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      const param = this.declaration.params[i];
      environment.define(param.lexeme, args[i]);
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if (isReturnError(error)) {
        return error.value;
      }

      throw error;
    }

    return null;
  }

  arity(): number {
    return this.declaration.params.length;
  }
}
