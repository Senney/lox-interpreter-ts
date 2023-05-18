import { Token } from '../lex/token';
import { Expression } from './expression';
export interface StatementVisitor<R> {
  visitExpressionStatement(expressionStatement: ExpressionStatement): R;
  visitPrintStatement(printStatement: PrintStatement): R;
  visitVarStatement(varStatement: VarStatement): R;
}
export abstract class Statement {
  abstract accept<R>(visitor: StatementVisitor<R>): R;
}
export class ExpressionStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitExpressionStatement(this);
  }
}
export class PrintStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitPrintStatement(this);
  }
}
export class VarStatement extends Statement {
  constructor(public name: Token, public initializer?: Expression) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitVarStatement(this);
  }
}
