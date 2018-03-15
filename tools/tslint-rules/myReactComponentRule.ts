import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.TypedRule {
  /* tslint:disable:object-literal-sort-keys */
  static metadata: Lint.IRuleMetadata = {
    ruleName: 'my-react-component',
    description: 'Enforces PascalCased React component class.',
    rationale: 'Makes it easy to differentiate classes from regular variables at a glance.',
    optionsDescription: 'Not configurable.',
    options: null,
    optionExamples: [true],
    type: 'style',
    typescriptOnly: false,
  };
  /* tslint:enable:object-literal-sort-keys */

  static FAILURE_STRING = (className: string) =>
    `React component ${className} must be PascalCased and prefixed by Component`;

  static validate(name: string): boolean {
    return isUpperCase(name[0]) && !name.includes('_') && name.endsWith('Component');
  }

  applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk, undefined, program.getTypeChecker());
  }
}

function walk(ctx: Lint.WalkContext<void>, tc: ts.TypeChecker) {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (
        isClassLikeDeclaration(node) && node.name !== undefined &&
        containsType(tc.getTypeAtLocation(node), isReactComponentType) &&
        !Rule.validate(node.name!.text)) {
      ctx.addFailureAtNode(node.name!, Rule.FAILURE_STRING(node.name!.text));
    }

    return ts.forEachChild(node, cb);
  });
}
/* tslint:disable:no-any */
function containsType(type: ts.Type, predicate: (symbol: any) => boolean): boolean {
  if (type.symbol !== undefined && predicate(type.symbol)) {
    return true;
  }

  const bases = type.getBaseTypes();
  return bases && bases.some((t) => containsType(t, predicate));
}

function isReactComponentType(symbol: any) {
  return symbol.name === 'Component' && symbol.parent && symbol.parent.name === 'React';
}
/* tslint:enable:no-any */

function isClassLikeDeclaration(node: ts.Node): node is ts.ClassLikeDeclaration {
  return node.kind === ts.SyntaxKind.ClassDeclaration ||
    node.kind === ts.SyntaxKind.ClassExpression;
}

function isUpperCase(str: string): boolean {
  return str === str.toUpperCase();
}
