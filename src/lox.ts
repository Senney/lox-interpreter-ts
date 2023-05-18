import fs from 'fs';

import { LoxRepl } from './repl/lox-repl';
import { Scanner } from './lex/scanner';
import { Parser } from './parse/parser';
import { Interpreter } from './interpret/interpreter';

let hadError = false;

class LoxCompiler {
  public static async main(): Promise<void> {
    if (process.argv.length > 3) {
      console.error('Usage: lox [script]');
      process.exit(64);
    } else if (process.argv.length === 3) {
      this.runFile(process.argv[2]);
    } else {
      this.runPrompt();
    }
  }

  private static runFile(path: string): void {
    console.log(`Executing file ${path}`);
    const fileContent = fs.readFileSync(path, 'utf-8');

    this.run(fileContent);

    if (hadError) {
      process.exit(65);
    }
  }

  private static runPrompt(): void {
    console.log('Starting Lox prompt...');
    new LoxRepl().start();
  }

  private static run(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    new Interpreter().interpret(statements);
  }

  public static error(line: number, err: string): void {
    this.report(line, '', err);
  }

  private static report(line: number, where: string, message: string): void {
    console.error(`[line ${line}] Error ${where}: ${message}`);

    hadError = true;
  }
}

LoxCompiler.main();

export { LoxCompiler };
