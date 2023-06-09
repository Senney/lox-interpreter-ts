import { Token } from '../lex/token';
import { Expression } from './expression';
export interface StatementVisitor<R> {
  visitBlockStatement(blockStatement: BlockStatement): R;
  visitExpressionStatement(expressionStatement: ExpressionStatement): R;
  visitFunctionStatement(functionStatement: FunctionStatement): R;
  visitIfStatement(ifStatement: IfStatement): R;
  visitPrintStatement(printStatement: PrintStatement): R;
  visitReturnStatement(returnStatement: ReturnStatement): R;
  visitVarStatement(varStatement: VarStatement): R;
  visitWhileStatement(whileStatement: WhileStatement): R;
}
export abstract class Statement {
  abstract accept<R>(visitor: StatementVisitor<R>): R;
}
export class BlockStatement extends Statement {
  constructor(public statements: Statement[]) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitBlockStatement(this);
  }
}
export class ExpressionStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitExpressionStatement(this);
  }
}
export class FunctionStatement extends Statement {
  constructor(
    public name: Token,
    public params: Token[],
    public body: Statement[]
  ) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitFunctionStatement(this);
  }
}
export class IfStatement extends Statement {
  constructor(
    public condition: Expression,
    public thenBranch: Statement,
    public elseBranch?: Statement
  ) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitIfStatement(this);
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
export class ReturnStatement extends Statement {
  constructor(public keyword: Token, public value?: Expression) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitReturnStatement(this);
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
export class WhileStatement extends Statement {
  constructor(public condition: Expression, public statement: Statement) {
    super();
  }
  accept<R>(visitor: StatementVisitor<R>): R {
    return visitor.visitWhileStatement(this);
  }
}
