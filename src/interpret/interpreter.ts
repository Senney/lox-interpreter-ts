import {
  BinaryExpression,
  Expression,
  GroupingExpression,
  LiteralExpression,
  UnaryExpression,
  ExpressionVisitor,
} from '../ast/expression';
import {
  ExpressionStatement,
  PrintStatement,
  Statement,
  StatementVisitor,
} from '../ast/statement';
import { TokenType } from '../lex/token-type';

class Interpreter
  implements ExpressionVisitor<unknown>, StatementVisitor<unknown>
{
  interpret(statements: Statement[]): void {
    try {
      for (const statement of statements) {
        statement.accept(this);
      }
    } catch (error) {
      console.error(error);
    }
  }

  visitExpressionStatement(expressionStatement: ExpressionStatement): unknown {
    this.evaluate(expressionStatement.expression);
    return null;
  }

  visitPrintStatement(printStatement: PrintStatement): unknown {
    const value = this.evaluate(printStatement.expression);
    console.log(this.stringify(value));
    return null;
  }

  visitBinaryExpression(binaryExpression: BinaryExpression): unknown {
    const left = this.evaluate(binaryExpression.lhs);
    const right = this.evaluate(binaryExpression.rhs);

    switch (binaryExpression.operator.type) {
      case TokenType.GREATER:
        return this.n(left) > this.n(right);
      case TokenType.GREATER_EQUAL:
        return this.n(left) >= this.n(right);
      case TokenType.LESS:
        return this.n(left) < this.n(right);
      case TokenType.LESS_EQUAL:
        return this.n(left) <= this.n(right);
      case TokenType.MINUS:
        return this.n(left) - this.n(right);
      case TokenType.PLUS:
        if (typeof left === 'number' && typeof right === 'number')
          return this.n(left) + this.n(right);
        if (typeof left === 'string' && typeof right === 'string')
          return `${left}${right}`;
        throw new Error('Both operands must be numbers or strings.');
      case TokenType.SLASH:
        return this.n(left) / this.n(right);
      case TokenType.STAR:
        return this.n(left) * this.n(right);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
    }
  }

  visitGroupingExpression(groupingExpression: GroupingExpression): unknown {
    return this.evaluate(groupingExpression.expr);
  }

  visitLiteralExpression(literalExpression: LiteralExpression): unknown {
    return literalExpression.value;
  }

  visitUnaryExpression(unaryExpression: UnaryExpression): unknown {
    const right = this.evaluate(unaryExpression.rhs);

    switch (unaryExpression.operator.type) {
      case TokenType.MINUS:
        return -1 * this.n(right);
      case TokenType.BANG:
        return this.isTruthy(right);
    }

    return null;
  }

  private evaluate(expr: Expression): unknown {
    return expr.accept(this);
  }

  private n(value: unknown): number {
    if (typeof value !== 'number') {
      throw new Error(`Expected numeric value, received ${typeof value}.`);
    }

    return value;
  }

  private isTruthy(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  private isEqual(lhs: unknown, rhs: unknown) {
    if (lhs === null && rhs === null) return true;
    if (lhs === null) return false;
    return lhs === rhs;
  }

  private stringify(value: unknown): string {
    if (value === null) return 'nil';
    return `${value}`;
  }
}

export { Interpreter };
