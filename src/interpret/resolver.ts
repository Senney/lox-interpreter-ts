import {
  AssignExpression,
  BinaryExpression,
  CallExpression,
  Expression,
  ExpressionVisitor,
  GroupingExpression,
  LiteralExpression,
  LogicalExpression,
  UnaryExpression,
  VariableExpression,
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
import { Interpreter } from './interpreter';

type Scope = Record<string, boolean>;

enum FunctionType {
  NONE,
  FUNCTION,
}

class Resolver
  implements ExpressionVisitor<unknown>, StatementVisitor<unknown>
{
  private scopes: Scope[];
  private currentFunction: FunctionType;

  constructor(private interpreter: Interpreter) {
    this.scopes = [];
    this.currentFunction = FunctionType.NONE;
  }

  visitBlockStatement(blockStatement: BlockStatement): unknown {
    this.beginScope();
    this.resolveStatements(blockStatement.statements);
    this.endScope();

    return null;
  }

  visitVarStatement(varStatement: VarStatement): unknown {
    this.declare(varStatement.name);

    if (varStatement.initializer) {
      this.resolveExpression(varStatement.initializer);
    }

    this.define(varStatement.name);

    return null;
  }

  visitVariableExpression(variableExpression: VariableExpression): unknown {
    if (
      this.scopes.length > 0 &&
      this.activeScope[variableExpression.name.lexeme] === false
    ) {
      throw new Error("Can't read local variable in its own initializer.");
    }

    this.resolveLocal(variableExpression, variableExpression.name);

    return null;
  }

  visitAssignExpression(assignExpression: AssignExpression): unknown {
    this.resolveExpression(assignExpression.value);
    this.resolveLocal(assignExpression, assignExpression.name);
    return null;
  }

  visitFunctionStatement(functionStatement: FunctionStatement): unknown {
    this.declare(functionStatement.name);
    this.define(functionStatement.name);

    this.resolveFunction(functionStatement, FunctionType.FUNCTION);

    return null;
  }

  visitIfStatement(ifStatement: IfStatement): unknown {
    this.resolveExpression(ifStatement.condition);
    this.resolveStatement(ifStatement.thenBranch);
    if (ifStatement.elseBranch) this.resolveStatement(ifStatement.elseBranch);
    return null;
  }

  visitPrintStatement(printStatement: PrintStatement): unknown {
    this.resolveExpression(printStatement.expression);
    return;
  }

  visitReturnStatement(returnStatement: ReturnStatement): unknown {
    if (this.currentFunction === FunctionType.NONE)
      throw new Error('Cannot call "return" from outside of a function.');

    if (returnStatement.value) this.resolveExpression(returnStatement.value);
    return null;
  }

  visitWhileStatement(whileStatement: WhileStatement): unknown {
    this.resolveExpression(whileStatement.condition);
    this.resolveStatement(whileStatement.statement);
    return;
  }

  visitExpressionStatement(expressionStatement: ExpressionStatement): unknown {
    this.resolveExpression(expressionStatement.expression);

    return null;
  }

  visitBinaryExpression(binaryExpression: BinaryExpression): unknown {
    this.resolveExpression(binaryExpression.lhs);
    this.resolveExpression(binaryExpression.rhs);
    return null;
  }

  visitCallExpression(callExpression: CallExpression): unknown {
    this.resolveExpression(callExpression.callee);

    for (const argument of callExpression.args) {
      this.resolveExpression(argument);
    }

    return null;
  }

  visitGroupingExpression(groupingExpression: GroupingExpression): unknown {
    this.resolveExpression(groupingExpression.expr);
    return null;
  }

  visitLiteralExpression(_literalExpression: LiteralExpression): unknown {
    return null;
  }

  visitLogicalExpression(logicalExpression: LogicalExpression): unknown {
    this.resolveExpression(logicalExpression.left);
    this.resolveExpression(logicalExpression.right);
    return null;
  }

  visitUnaryExpression(unaryExpression: UnaryExpression): unknown {
    this.resolveExpression(unaryExpression.rhs);
    return null;
  }

  public resolveStatements(statement: Statement[]): void {
    statement.forEach((statement) => this.resolveStatement(statement));
  }

  private resolveStatement(statement: Statement): void {
    statement.accept(this);
  }

  private resolveExpression(expression: Expression): void {
    expression.accept(this);
  }

  private resolveLocal(expression: Expression, name: Token): void {
    const matchingScopeIndex = this.scopes.findIndex(
      (s) => s[name.lexeme] !== undefined
    );

    if (matchingScopeIndex !== -1) {
      this.interpreter.resolve(
        expression,
        this.scopes.length - 1 - matchingScopeIndex
      );

      return;
    }
  }

  private resolveFunction(
    functionStatement: FunctionStatement,
    functionType: FunctionType
  ): void {
    const enclosingFunction = this.currentFunction;

    this.beginScope();

    this.currentFunction = functionType;

    for (const token of functionStatement.params) {
      this.declare(token);
      this.define(token);
    }

    this.resolveStatements(functionStatement.body);
    this.endScope();
    this.currentFunction = enclosingFunction;
  }

  private beginScope() {
    this.scopes.push({});
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token): void {
    if (this.scopes.length === 0) return;

    if (this.activeScope[name.lexeme] !== undefined) {
      throw new Error(
        `Already a variable with name "${name.lexeme}" defined in this scope.`
      );
    }

    this.activeScope[name.lexeme] = false;
  }

  private define(name: Token): void {
    if (this.scopes.length === 0) return;

    this.activeScope[name.lexeme] = true;
  }

  private get activeScope(): Scope {
    if (this.scopes.length === 0) {
      throw new Error('Cannot access activeScope, scope is empty.');
    }

    return this.scopes[this.scopes.length - 1];
  }
}

export { Resolver };
