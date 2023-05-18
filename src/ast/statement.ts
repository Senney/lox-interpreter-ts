import { Expression } from './expression';
export interface Visitor<R> {
  visitExpressionStatement(expressionStatement: ExpressionStatement): R;
  visitPrintStatement(printStatement: PrintStatement): R;
}
export abstract class Statement {
  abstract accept<R>(visitor: Visitor<R>): R;
}
export class ExpressionStatement extends Statement {
  constructor(public Expression: Expression) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitExpressionStatement(this);
  }
}
export class PrintStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }
  accept<R>(visitor: Visitor<R>): R {
    return visitor.visitPrintStatement(this);
  }
}
