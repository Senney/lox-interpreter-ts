import { Token } from '../lex/token';
export abstract class Expression {
}
export class BinaryExpression extends Expression {
    constructor(public lhs: Expression, public operator: Token, public rhs: Expression) { super(); }
}
export class GroupingExpression extends Expression {
    constructor(public expr: Expression) { super(); }
}
export class LiteralExpression extends Expression {
    constructor(public value: unknown) { super(); }
}
export class UnaryExpression extends Expression {
    constructor(public lhs: Expression, public operator: Token) { super(); }
}