import { Token } from '../lex/token';
import {
  Expression,
  BinaryExpression,
  UnaryExpression,
  LiteralExpression,
  GroupingExpression,
  VariableExpression,
  AssignExpression,
} from '../ast/expression';
import { TokenType } from '../lex/token-type';
import {
  BlockStatement,
  ExpressionStatement,
  IfStatement,
  PrintStatement,
  Statement,
  VarStatement,
} from '../ast/statement';

class Parser {
  private current = 0;

  constructor(private tokens: Token[]) {}

  public parse(): Statement[] {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.delcaration());
    }

    return statements;
  }

  private expression(): Expression {
    return this.assignment();
  }

  private assignment(): Expression {
    const expr = this.equality();

    if (this.match(TokenType.EQUAL)) {
      const value = this.assignment();

      if (expr instanceof VariableExpression) {
        const name = expr.name;
        return new AssignExpression(name, value);
      }

      throw new Error('Invalid assignment target.');
    }

    return expr;
  }

  private delcaration(): Statement {
    if (this.match(TokenType.VAR)) {
      return this.varDeclaration();
    }

    return this.statement();
  }

  private varDeclaration(): Statement {
    const name = this.consume(TokenType.IDENTIFIER, 'Expected variable name.');
    const initializer = this.match(TokenType.EQUAL)
      ? this.expression()
      : undefined;

    this.consume(
      TokenType.SEMICOLON,
      "Expected ';' after variable declaration."
    );

    return new VarStatement(name, initializer);
  }

  private statement(): Statement {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new BlockStatement(this.block());

    return this.expressionStatement();
  }

  private ifStatement(): Statement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'if' condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match(TokenType.ELSE) ? this.statement() : undefined;

    return new IfStatement(condition, thenBranch, elseBranch);
  }

  private printStatement(): Statement {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after value.");
    return new PrintStatement(value);
  }

  private block(): Statement[] {
    const statements = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.delcaration());
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");

    return statements;
  }

  private expressionStatement(): Statement {
    const expression = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after value.");
    return new ExpressionStatement(expression);
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

    if (this.match(TokenType.NUMBER, TokenType.STRING))
      return new LiteralExpression(this.previous().literal);

    if (this.match(TokenType.IDENTIFIER)) {
      return new VariableExpression(this.previous());
    }

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

  private consume(tokenType: TokenType, expected: string): Token {
    if (!this.check(tokenType)) {
      throw new Error(expected);
    }

    return this.advance();
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
