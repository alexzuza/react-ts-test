import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.AbstractRule {
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

  static FAILURE_STRING = (className: string) => `React component ${className} must be PascalCased and prefixed by Component`;

  static validate(name: string): boolean {
    return isUpperCase(name[0]) && !name.includes('_') && name.endsWith('Component');
  }

  apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk);
  }
}

function walk(ctx: Lint.WalkContext<void>) {
  return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
    if (isClassLikeDeclaration(node) && node.name !== undefined && isReactComponent(node)) {
      if (!Rule.validate(node.name!.text)) {
        ctx.addFailureAtNode(node.name!, Rule.FAILURE_STRING(node.name!.text));
      }
    }
    return ts.forEachChild(node, cb);
  });
}

function isClassLikeDeclaration(node: ts.Node): node is ts.ClassLikeDeclaration {
  return node.kind === ts.SyntaxKind.ClassDeclaration ||
    node.kind === ts.SyntaxKind.ClassExpression;
}

function isReactComponent(node: ts.Node): boolean {
  let result = false;
  const classDeclaration = <ts.ClassDeclaration> node;
  if (classDeclaration.heritageClauses) {
    classDeclaration.heritageClauses.forEach((hc) => {
      if (hc.token === ts.SyntaxKind.ExtendsKeyword && hc.types) {

        hc.types.forEach(type => {
          if (type.getText() === 'React.Component') {
            result = true;
          }
        });
      }
    });
  }

  return result;
}

function isUpperCase(str: string): boolean {
  return str === str.toUpperCase();
}