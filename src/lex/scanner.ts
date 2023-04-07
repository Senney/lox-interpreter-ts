import { LoxCompiler } from '../lox';
import { keywords } from './keyword';
import { Token } from './token';
import { TokenType } from './token-type';

class Scanner {
  private start = 0;
  private current = 0;
  private line = 1;

  constructor(private source: string) {}

  scanTokens(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      this.start = this.current;

      tokens.push(...this.scanToken());
    }

    tokens.push(new Token(TokenType.EOF, '', null, this.line));

    return tokens;
  }

  private isAtEnd() {
    return this.current >= this.source.length;
  }

  private scanToken(): Token[] {
    const c = this.advance();

    const tokens: Token[] = [];

    const addToken = (t: TokenType, o?: unknown): void => {
      tokens.push(
        new Token(
          t,
          this.source.substring(this.start, this.current),
          o ?? null,
          this.line
        )
      );
    };

    const match = (char: string): boolean => {
      if (this.isAtEnd()) return false;
      if (this.source.charAt(this.current) !== char) return false;

      this.advance();
      return true;
    };

    const peek = (): string => {
      if (this.isAtEnd()) return '\0';
      return this.source.charAt(this.current);
    };

    const peekNext = (): string => {
      if (this.current + 1 >= this.source.length) return '\0';
      return this.source.charAt(this.current + 1);
    };

    const string = (): void => {
      while (peek() !== '"' && !this.isAtEnd()) {
        if (peek() == '\n') this.line++;
        this.advance();
      }

      if (this.isAtEnd()) {
        LoxCompiler.error(this.line, 'Unterminated string.');
        return;
      }

      this.advance();

      const stringValue = this.source.substring(
        this.start + 1,
        this.current - 1
      );

      addToken(TokenType.STRING, stringValue);
    };

    const number = (): void => {
      while (this.isDigit(peek())) this.advance();

      if (peek() === '.' && this.isDigit(peekNext())) {
        this.advance();

        while (this.isDigit(peek())) this.advance();
      }

      addToken(
        TokenType.NUMBER,
        Number.parseFloat(this.source.substring(this.start, this.current))
      );
    };

    const identifier = (): void => {
      while (this.isAlphanumeric(peek())) this.advance();

      const value = this.source.substring(this.start, this.current);
      const tokenType = keywords[value] ?? TokenType.IDENTIFIER;

      addToken(tokenType, this.source.substring(this.start, this.current));
    };

    switch (c) {
      case '(':
        addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        addToken(TokenType.COMMA);
        break;
      case '.':
        addToken(TokenType.DOT);
        break;
      case '-':
        addToken(TokenType.MINUS);
        break;
      case '+':
        addToken(TokenType.PLUS);
        break;
      case ';':
        addToken(TokenType.SEMICOLON);
        break;
      case '*':
        addToken(TokenType.STAR);
        break;
      case '!':
        addToken(match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        addToken(match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case '<':
        addToken(match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        addToken(match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case '/':
        if (match('/')) {
          while (peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else {
          addToken(TokenType.SLASH);
        }
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line++;
        break;
      case '"':
        string();
        break;
      default:
        if (this.isDigit(c)) {
          number();
          break;
        }

        if (this.isAlpha(c)) {
          identifier();
          break;
        }

        LoxCompiler.error(this.line, 'Unexpected character.');
        break;
    }

    return tokens;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private isDigit(char: string): boolean {
    return /^[0-9]$/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /^[a-zA-Z_]$/.test(char);
  }

  private isAlphanumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}

export { Scanner };
