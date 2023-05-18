import { Token } from '../lex/token';
import {
  Expression,
  BinaryExpression,
  UnaryExpression,
  LiteralExpression,
  GroupingExpression,
} from '../ast/expression';
import { TokenType } from '../lex/token-type';

class Parser {
  private current = 0;

  constructor(private tokens: Token[]) {}

  public parse() {
    while (!this.isAtEnd()) {
      const expr = this.expression();
      console.log(expr);
    }
  }

  private expression(): Expression {
    return this.equality();
  }

  private equality(): Expression {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.BANG_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expression {
    let expr = this.term();

    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private term(): Expression {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expression {
    let expr = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpression(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpression(right, operator);
    }

    return this.primary();
  }

  private primary(): Expression {
    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();

      if (!this.match(TokenType.RIGHT_PAREN)) {
        throw new Error('Unmatched paren');
      }

      return new GroupingExpression(expr);
    }

    if (this.match(TokenType.TRUE)) return new LiteralExpression(true);
    if (this.match(TokenType.FALSE)) return new LiteralExpression(false);
    if (this.match(TokenType.NIL)) return new LiteralExpression(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) return new LiteralExpression(this.previous().literal);

    throw new Error('Fell through the parser');
  }

  private match(...tokenTypes: TokenType[]): boolean {
    for (const tokenType of tokenTypes) {
      if (this.check(tokenType)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(tokenType: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === tokenType;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}

export { Parser };
