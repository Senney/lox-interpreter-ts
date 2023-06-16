import { FunctionStatement } from '../ast/statement';
import { Environment } from './environment';
import { Interpreter } from './interpreter';

export interface Callable {
  arity(): number;
  call(interpreter: Interpreter, args: unknown[]): unknown;
}

export const isCallable = (candidate: unknown): candidate is Callable => {
  return true;
};

export class LoxFunction implements Callable {
  constructor(private declaration: FunctionStatement) {}

  call(interpreter: Interpreter, args: unknown[]): unknown {
    const environment = new Environment(Interpreter.globals);

    for (let i = 0; i < this.declaration.params.length; i++) {
      const param = this.declaration.params[i];
      environment.define(param.lexeme, args[i]);
    }

    interpreter.executeBlock(this.declaration.body, environment);

    return null;
  }

  arity(): number {
    return this.declaration.params.length;
  }
}
