import repl from 'repl';
import { Context } from 'vm';
import { Interpreter } from '../interpret/interpreter';
import { Scanner } from '../lex/scanner';
import { Parser } from '../parse/parser';

class LoxRepl {
  private interpreter: Interpreter = new Interpreter();

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
    const statements = parser.parse();

    this.interpreter.interpret(statements);

    cb(null, null);
  }
}

export { LoxRepl };
