import ts from 'typescript';
import path from 'path';
import fs from 'fs';

const globalImports: [string, string][] = [];

function kebabCase(str: string): string {
  let newString = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (i > 0 && /[A-Z]{1}/.test(char)) {
      newString += `-${char.toLowerCase()}`;
    } else {
      newString += char.toLowerCase();
    }
  }

  return newString;
}

function snakeCase(str: string): string {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

function defineAst(
  outputDir: string,
  baseName: string,
  types: string[],
  imports: [string, string][] = []
): void {
  const typeRootPath = path.join(outputDir, `${kebabCase(baseName)}.ts`);
  const typeRootFile = ts.createSourceFile(
    typeRootPath,
    '',
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.TS
  );
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const importStatements = [...globalImports, ...imports].map((imp) => {
    let relativePath = path
      .relative(outputDir, imp[1])
      .split(path.sep)
      .join(path.posix.sep);

    if (!relativePath.startsWith('../')) {
      relativePath = `./${relativePath}`;
    }

    return ts.factory.createImportDeclaration(
      undefined,
      ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports([
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(imp[0])
          ),
        ])
      ),
      ts.factory.createStringLiteral(relativePath, true)
    );
  });

  const visitorMethods = types.map((type) => {
    const typeName = `${type.split(':')[0].trim()}${baseName}`;
    return ts.factory.createMethodSignature(
      [],
      `visit${typeName}`,
      undefined,
      undefined,
      [
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          snakeCase(typeName),
          undefined,
          ts.factory.createTypeReferenceNode(typeName)
        ),
      ],
      ts.factory.createTypeReferenceNode('R')
    );
  });

  const visitorInterfaceName = `${baseName}Visitor`;

  const visitorInterface = ts.factory.createInterfaceDeclaration(
    [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
    visitorInterfaceName,
    [ts.factory.createTypeParameterDeclaration(undefined, 'R')],
    undefined,
    visitorMethods
  );

  const abstractBaseClass = ts.factory.createClassDeclaration(
    [
      ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
      ts.factory.createToken(ts.SyntaxKind.AbstractKeyword),
    ],
    baseName,
    undefined,
    undefined,
    [
      ts.factory.createMethodDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.AbstractKeyword)],
        undefined,
        'accept',
        undefined,
        [ts.factory.createTypeParameterDeclaration(undefined, 'R')],
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            'visitor',
            undefined,
            ts.factory.createTypeReferenceNode(visitorInterfaceName, [
              ts.factory.createTypeReferenceNode('R'),
            ])
          ),
        ],
        ts.factory.createTypeReferenceNode('R'),
        undefined
      ),
    ]
  );

  const children: ts.Node[] = [];

  for (const type of types) {
    const className = type.split(':')[0].trim();
    const fields = type.split(':')[1].trim();

    const fieldParameters = fields.split(',').map((field) => {
      const type = field.trim().split(' ')[0].trim();
      const name = field.trim().split(' ')[1].trim();

      const typeNode = ts.factory.createTypeReferenceNode(type);

      return ts.factory.createParameterDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.PublicKeyword)],
        undefined,
        name,
        undefined,
        typeNode,
        undefined
      );
    });

    const heritage = ts.factory.createHeritageClause(
      ts.SyntaxKind.ExtendsKeyword,
      [
        ts.factory.createExpressionWithTypeArguments(
          ts.factory.createIdentifier(baseName),
          undefined
        ),
      ]
    );

    const childClassName = `${className}${baseName}`;
    const childClass = ts.factory.createClassDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      childClassName,
      undefined,
      [heritage],
      [
        ts.factory.createConstructorDeclaration(
          undefined,
          fieldParameters,
          ts.factory.createBlock([
            ts.factory.createExpressionStatement(
              ts.factory.createCallExpression(
                ts.factory.createSuper(),
                undefined,
                undefined
              )
            ),
          ])
        ),
        ts.factory.createMethodDeclaration(
          undefined,
          undefined,
          'accept',
          undefined,
          [ts.factory.createTypeParameterDeclaration(undefined, 'R')],
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              'visitor',
              undefined,
              ts.factory.createTypeReferenceNode(visitorInterfaceName, [
                ts.factory.createTypeReferenceNode('R'),
              ])
            ),
          ],
          ts.factory.createTypeReferenceNode('R'),
          ts.factory.createBlock([
            ts.factory.createReturnStatement(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier('visitor'),
                  `visit${childClassName}`
                ),
                undefined,
                [ts.factory.createThis()]
              )
            ),
          ])
        ),
      ]
    );

    children.push(childClass);
  }

  const sourceFile = [
    ...importStatements,
    visitorInterface,
    abstractBaseClass,
    ...children,
  ]
    .map((node) =>
      printer.printNode(ts.EmitHint.Unspecified, node, typeRootFile)
    )
    .join('\n');

  fs.writeFileSync(typeRootPath, sourceFile, 'utf-8');
}

defineAst(
  'src/ast',
  'Expression',
  [
    'Assign : Token name, Expression value',
    'Binary : Expression lhs, Token operator, Expression rhs',
    'Grouping : Expression expr',
    'Literal : unknown value',
    'Unary : Expression rhs, Token operator',
    'Variable : Token name',
  ],
  [['Token', 'src/lex/token']]
);

defineAst(
  'src/ast',
  'Statement',
  [
    'Block : Statement[] statements',
    'Expression : Expression expression',
    'If : Expression condition, Statement thenBranch, Statement elseBranch?',
    'Print : Expression expression',
    'Var : Token name, Expression initializer?',
  ],
  [
    ['Token', 'src/lex/token'],
    ['Expression', 'src/ast/expression'],
  ]
);
