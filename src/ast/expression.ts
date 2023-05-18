import { Token } from '../lex/token';
export interface Visitor<R> {
    visitBinaryExpression(binaryExpression: BinaryExpression): R;
    visitGroupingExpression(groupingExpression: GroupingExpression): R;
    visitLiteralExpression(literalExpression: LiteralExpression): R;
    visitUnaryExpression(unaryExpression: UnaryExpression): R;
}
export abstract class Expression {
    abstract accept<R>(visitor: Visitor<R>): R;
}
export class BinaryExpression extends Expression {
    constructor(public lhs: Expression, public operator: Token, public rhs: Expression) { super(); }
    accept<R>(visitor: Visitor<R>): R { return visitor.visitBinaryExpression(this); }
}
export class GroupingExpression extends Expression {
    constructor(public expr: Expression) { super(); }
    accept<R>(visitor: Visitor<R>): R { return visitor.visitGroupingExpression(this); }
}
export class LiteralExpression extends Expression {
    constructor(public value: unknown) { super(); }
    accept<R>(visitor: Visitor<R>): R { return visitor.visitLiteralExpression(this); }
}
export class UnaryExpression extends Expression {
    constructor(public rhs: Expression, public operator: Token) { super(); }
    accept<R>(visitor: Visitor<R>): R { return visitor.visitUnaryExpression(this); }
}