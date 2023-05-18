import repl from 'repl';
import { Context } from 'vm';
import { Interpreter } from '../interpret/interpreter';
import { Scanner } from '../lex/scanner';
import { Parser } from '../parse/parser';

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

    const parser = new Parser(tokens);
    const expressions = parser.parse();

    new Interpreter().interpret(expressions[0]);

    cb(null, null);
  }
}

export { LoxRepl };
