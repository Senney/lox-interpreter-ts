import repl from 'repl';
import { Context } from 'vm';

class LoxRepl {
  start(): void {
    repl.start({
      prompt: 'lox > ',
      eval: this.evaluator.bind(this)
    });
  }

  private evaluator(evalCmd: string, context: Context, file: string, cb: (err: Error | null, result: any) => void): void {
    console.log(evalCmd);
  }
}

export {LoxRepl};
