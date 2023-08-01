import {
  BinaryExpression,
  Expression,
  GroupingExpression,
  LiteralExpression,
  UnaryExpression,
  ExpressionVisitor,
  VariableExpression,
  AssignExpression,
  LogicalExpression,
  CallExpression,
} from '../ast/expression';
import {
  BlockStatement,
  ExpressionStatement,
  FunctionStatement,
  IfStatement,
  PrintStatement,
  ReturnStatement,
  Statement,
  StatementVisitor,
  VarStatement,
  WhileStatement,
} from '../ast/statement';
import { Token } from '../lex/token';
import { TokenType } from '../lex/token-type';
import { LoxFunction, isCallable } from './callable';
import { Environment } from './environment';
import { ClockCallable } from './native-fns';
import { Return } from './return';

class Interpreter
  implements ExpressionVisitor<unknown>, StatementVisitor<unknown>
{
  public static readonly globals: Environment = new Environment();
  private environment: Environment = Interpreter.globals;
  private locals: Map<Expression, number>;

  constructor() {
    Interpreter.globals.define('clock', new ClockCallable());

    this.locals = new Map();
  }

  interpret(statements: Statement[]): void {
    try {
      for (const statement of statements) {
        statement.accept(this);
      }
    } catch (error) {
      console.error(error);
    }
  }

  public resolve(expression: Expression, depth: number): void {
    this.locals.set(expression, depth);
  }

  visitFunctionStatement(functionStatement: FunctionStatement): unknown {
    this.environment.define(
      functionStatement.name.lexeme,
      new LoxFunction(functionStatement, this.environment)
    );

    return null;
  }

  visitIfStatement(ifStatement: IfStatement): unknown {
    if (this.isTruthy(this.evaluate(ifStatement.condition))) {
      ifStatement.thenBranch.accept(this);
    } else if (ifStatement.elseBranch !== undefined) {
      ifStatement.elseBranch.accept(this);
    }
    return null;
  }

  visitBlockStatement(blockStatement: BlockStatement): unknown {
    this.executeBlock(
      blockStatement.statements,
      new Environment(this.environment)
    );
    return null;
  }

  visitVarStatement(varStatement: VarStatement): unknown {
    const value = varStatement.initializer
      ? this.evaluate(varStatement.initializer)
      : null;

    this.environment.define(varStatement.name.lexeme, value);

    return null;
  }

  visitAssignExpression(assignExpression: AssignExpression): unknown {
    const value = this.evaluate(assignExpression.value);

    const distance = this.locals.get(assignExpression);

    if (distance !== undefined) {
      this.environment.assignAt(distance, assignExpression.name, value);
    } else {
      Interpreter.globals.assign(assignExpression.name, value);
    }

    return value;
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

  visitReturnStatement(returnStatement: ReturnStatement): unknown {
    const value = returnStatement.value
      ? this.evaluate(returnStatement.value)
      : undefined;

    throw new Return(value);
  }

  visitWhileStatement(whileStatement: WhileStatement): unknown {
    while (this.isTruthy(this.evaluate(whileStatement.condition))) {
      whileStatement.statement.accept(this);
    }

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

  visitCallExpression(callExpression: CallExpression): unknown {
    const callee = this.evaluate(callExpression.callee);
    const args: unknown[] = [];

    for (const arg of callExpression.args) {
      args.push(this.evaluate(arg));
    }

    if (!isCallable(callee)) {
      throw new Error('Can only call functions and classes.');
    }

    if (args.length !== callee.arity()) {
      throw new Error(
        `Expected ${callee.arity()} arguments but got ${args.length}.`
      );
    }

    return callee.call(this, args);
  }

  visitGroupingExpression(groupingExpression: GroupingExpression): unknown {
    return this.evaluate(groupingExpression.expr);
  }

  visitLiteralExpression(literalExpression: LiteralExpression): unknown {
    return literalExpression.value;
  }

  visitLogicalExpression(logicalExpression: LogicalExpression): unknown {
    const left = this.evaluate(logicalExpression.left);

    if (logicalExpression.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(logicalExpression.right);
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

  visitVariableExpression(variableExpression: VariableExpression): unknown {
    return this.lookUpVariable(variableExpression.name, variableExpression);
  }

  public executeBlock(statements: Statement[], environment: Environment): void {
    const previous = this.environment;

    try {
      this.environment = environment;
      statements.forEach((statement) => statement.accept(this));
    } finally {
      this.environment = previous;
    }
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

  private lookUpVariable(name: Token, expression: Expression): unknown {
    const distance = this.locals.get(expression);

    if (distance !== undefined) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return Interpreter.globals.get(name);
    }
  }
}

export { Interpreter };
