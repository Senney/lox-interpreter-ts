import { Interpreter } from './interpreter';

export interface Callable {
  arity(): number;
  call(interpreter: Interpreter, args: unknown[]): unknown;
}

export const isCallable = (candidate: unknown): candidate is Callable => {
  return true;
};
