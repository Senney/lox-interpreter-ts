import { Token } from '../lex/token';
import {
  Expression,
  BinaryExpression,
  UnaryExpression,
  LiteralExpression,
  GroupingExpression,
  VariableExpression,
  AssignExpression,
  LogicalExpression,
  CallExpression,
} from '../ast/expression';
import { TokenType } from '../lex/token-type';
import {
  BlockStatement,
  ExpressionStatement,
  FunctionStatement,
  IfStatement,
  PrintStatement,
  ReturnStatement,
  Statement,
  VarStatement,
  WhileStatement,
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
    const expr = this.or();

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
    if (this.match(TokenType.FUN)) {
      return this.functionDeclaration('function');
    }

    if (this.match(TokenType.VAR)) {
      return this.varDeclaration();
    }

    return this.statement();
  }

  private functionDeclaration(kind: 'function' | 'method'): FunctionStatement {
    const name = this.consume(TokenType.IDENTIFIER, `Expected ${kind} name.`);
    this.consume(TokenType.LEFT_PAREN, `Expected "(" after ${kind} name.`);
    const parameters: Token[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (parameters.length > 255) {
          throw new Error('Cannot have more than 255 parameters.');
        }

        parameters.push(
          this.consume(TokenType.IDENTIFIER, 'Expected parameter name.')
        );
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RIGHT_PAREN, 'Expected ")" after parameters.');
    this.consume(TokenType.LEFT_BRACE, `Expected "{" before ${kind} body.`);

    const body = this.block();

    return new FunctionStatement(name, parameters, body);
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
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.LEFT_BRACE))
      return new BlockStatement(this.block());

    return this.expressionStatement();
  }

  private ifStatement(): Statement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'if' condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match(TokenType.ELSE)
      ? this.statement()
      : undefined;

    return new IfStatement(condition, thenBranch, elseBranch);
  }

  private printStatement(): Statement {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after value.");
    return new PrintStatement(value);
  }

  private returnStatement(): Statement {
    const keyword = this.previous();
    const value = !this.check(TokenType.SEMICOLON)
      ? this.expression()
      : undefined;

    this.consume(TokenType.SEMICOLON, 'Expected ";" after return value.');

    return new ReturnStatement(keyword, value);
  }

  private forStatement(): Statement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'.");

    let initializer: Statement | undefined;

    if (this.match(TokenType.SEMICOLON)) {
      initializer = undefined;
    } else if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expression | undefined;
    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Exprected ';' after loop condition.");

    let increment: Expression | undefined;
    if (!this.check(TokenType.RIGHT_PAREN)) {
      increment = this.expression();
    }

    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'for' condition.");

    let body = this.statement();

    if (increment !== undefined) {
      body = new BlockStatement([body, new ExpressionStatement(increment)]);
    }

    if (condition === undefined) {
      condition = new LiteralExpression(true);
    }

    body = new WhileStatement(condition, body);

    if (initializer !== undefined) {
      body = new BlockStatement([initializer, body]);
    }

    return body;
  }

  private whileStatement(): Statement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
    const condition = this.expression();
    this.consume(
      TokenType.RIGHT_PAREN,
      "Expected ')' after 'while' condition."
    );
    const body = this.statement();

    return new WhileStatement(condition, body);
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

  private or(): Expression {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpression(expr, operator, right);
    }

    return expr;
  }

  private and(): Expression {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new LogicalExpression(expr, operator, right);
    }

    return expr;
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

    return this.call();
  }

  private call(): Expression {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expression): Expression {
    const args: Expression[] = [];

    if (!this.check(TokenType.RIGHT_PAREN)) {
      do {
        if (args.length > 255) {
          throw new Error('Cannot have more than 255 arguments.');
        }

        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    const paren = this.consume(
      TokenType.RIGHT_PAREN,
      'Expected ")" after arguments.'
    );

    return new CallExpression(callee, paren, args);
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
