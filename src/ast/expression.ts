import { Token } from '../lex/token';
export interface ExpressionVisitor<R> {
  visitAssignExpression(assignExpression: AssignExpression): R;
  visitBinaryExpression(binaryExpression: BinaryExpression): R;
  visitGroupingExpression(groupingExpression: GroupingExpression): R;
  visitLiteralExpression(literalExpression: LiteralExpression): R;
  visitLogicalExpression(logicalExpression: LogicalExpression): R;
  visitUnaryExpression(unaryExpression: UnaryExpression): R;
  visitVariableExpression(variableExpression: VariableExpression): R;
}
export abstract class Expression {
  abstract accept<R>(visitor: ExpressionVisitor<R>): R;
}
export class AssignExpression extends Expression {
  constructor(public name: Token, public value: Expression) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitAssignExpression(this);
  }
}
export class BinaryExpression extends Expression {
  constructor(
    public lhs: Expression,
    public operator: Token,
    public rhs: Expression
  ) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitBinaryExpression(this);
  }
}
export class GroupingExpression extends Expression {
  constructor(public expr: Expression) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitGroupingExpression(this);
  }
}
export class LiteralExpression extends Expression {
  constructor(public value: unknown) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitLiteralExpression(this);
  }
}
export class LogicalExpression extends Expression {
  constructor(
    public left: Expression,
    public operator: Token,
    public right: Expression
  ) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitLogicalExpression(this);
  }
}
export class UnaryExpression extends Expression {
  constructor(public rhs: Expression, public operator: Token) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitUnaryExpression(this);
  }
}
export class VariableExpression extends Expression {
  constructor(public name: Token) {
    super();
  }
  accept<R>(visitor: ExpressionVisitor<R>): R {
    return visitor.visitVariableExpression(this);
  }
}
