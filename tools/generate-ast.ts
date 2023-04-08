import ts from 'typescript';
import path from 'path';
import fs from 'fs';

const globalImports = [['Token', 'src/lex/token']];

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

function defineAst(outputDir: string, baseName: string, types: string[]): void {
  const typeRootPath = path.join(outputDir, `${kebabCase(baseName)}.ts`);
  const typeRootFile = ts.createSourceFile(
    typeRootPath,
    '',
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.TS
  );
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const importStatements = globalImports.map((imp) => {
    const relativePath = path
      .relative(outputDir, imp[1])
      .split(path.sep)
      .join(path.posix.sep);

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

  const abstractBaseClass = ts.factory.createClassDeclaration(
    [
      ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
      ts.factory.createToken(ts.SyntaxKind.AbstractKeyword),
    ],
    baseName,
    undefined,
    undefined,
    []
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

    const childClass = ts.factory.createClassDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      `${className}${baseName}`,
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
      ]
    );

    children.push(childClass);
  }

  const sourceFile = [...importStatements, abstractBaseClass, ...children]
    .map((node) =>
      printer.printNode(ts.EmitHint.Unspecified, node, typeRootFile)
    )
    .join('\n');

  fs.writeFileSync(typeRootPath, sourceFile, 'utf-8');
}

defineAst('src/ast', 'Expression', [
  'Binary : Expression lhs, Token operator, Expression rhs',
  'Grouping : Expression expr',
  'Literal : unknown value',
  'Unary : Expression lhs, Token operator',
]);
