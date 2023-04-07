import fs from 'fs';

import { LoxRepl } from './repl/lox-repl';

class LoxCompiler {
  public static async main(): Promise<void> {
    if (process.argv.length > 3) {
      console.error('Usage: lox [script]');
      process.exit(64);
    } else if (process.argv.length === 3) {
      this.runFile(process.argv[1]);
    } else {
      this.runPrompt();
    }
  }

  private static runFile(path: string): void {
    console.log(`Executing file ${path}`);
    const fileContent = fs.readFileSync(path, 'utf-8');
    // TODO: Run file content through lexer.
  }

  private static runPrompt(): void {
    console.log('Starting Lox prompt...');
    new LoxRepl().start();
  }
}

LoxCompiler.main();
