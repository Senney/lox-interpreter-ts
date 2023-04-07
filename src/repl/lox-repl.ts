import repl from 'repl';
import { Context } from 'vm';
import { Scanner } from '../lex/scanner';

class LoxRepl {
  start(): void {
    repl.start({
      prompt: 'lox > ',
      eval: this.evaluator.bind(this),
    });
  }

  private evaluator(
    evalCmd: string,
    context: Context,
    file: string,
    cb: (err: Error | null, result: any) => void
  ): void {
    const scanner = new Scanner(evalCmd);
    const tokens = scanner.scanTokens();

    for (const token of tokens) {
      console.log(token);
    }

    cb(null, null);
  }
}

export { LoxRepl };
