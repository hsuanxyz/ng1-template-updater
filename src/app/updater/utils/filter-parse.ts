import {Token} from './lexer';

export class FilterParse {
  private filters: Token[][] = [];
  private left: Token;
  constructor(private tokens: Token[]) {}

  pares() {
    this.searchFilter();
    return [...this.filters];
  }

  searchFilter() {
    while (this.expect('|')) {
      if (this.left && this.left.identifier || this.left.constant || `])"'`.includes(this.left.text)) {
        const baseExpression = this.expression();
        this.searchArgs(baseExpression);
      }
    }
    this.left = this.tokens.shift();
    if (this.tokens.length) {
      this.searchFilter();
    }
  }

  searchArgs(baseExpression) {
    if (!baseExpression) {
      return;
    }
    const args = [baseExpression];
    while (this.expect(':')) {
      args.push(this.expression());
    }
    this.filters.push(args);
  }

  expression() {
    const left = this.tokens[0];
    return (left && (left.identifier || left.constant)) ? this.tokens.shift() : false;
  }
  expect(e: string) {
    const token = this.tokens[0];
    if (token && token.text === e) {
      this.tokens.shift();
      return token;
    }
    return false;
  }
}
