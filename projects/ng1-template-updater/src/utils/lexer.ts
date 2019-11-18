export interface Token {
  index: number;
  text: string;
  constant?: boolean;
  value?: boolean;
  identifier?: boolean;
  operator?: boolean;
}

const OPERATORS = {};
const ESCAPE = {n: '\n', f: '\f', r: '\r', t: '\t', v: '\v', '\'': '\'', '"': '"'};
'+ - * / % === !== == != < > <= >= && || ! = |'.split(' ').forEach(operator => OPERATORS[operator] = true);

export class Lexer {
  index = 0;
  tokens = [];

  constructor(private text: string) {

  }

  lex() {
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index);
      if (ch === '"' || ch === '\'') {
        this.readString(ch);
      } else if (this.isNumber(ch) || ch === '.' && this.isNumber(this.peek() as string)) {
        this.readNumber();
      } else if (this.isIdentifierStart(this.peekMultichar())) {
        this.readIdent();
      } else if (this.is(ch, '(){}[].,;:?')) {
        this.tokens.push({index: this.index, text: ch});
        this.index++;
      } else if (this.isWhitespace(ch)) {
        this.index++;
      } else {
        const ch2 = ch + this.peek();
        const ch3 = ch2 + this.peek(2);
        const op1 = OPERATORS[ch];
        const op2 = OPERATORS[ch2];
        const op3 = OPERATORS[ch3];
        if (op1 || op2 || op3) {
          const token = op3 ? ch3 : (op2 ? ch2 : ch);
          this.tokens.push({index: this.index, text: token, operator: true});
          this.index += token.length;
        } else {
          this.throwError('Unexpected next character ', this.index, this.index + 1);
        }
      }
    }
    return this.tokens;
  }

  is(ch: string, chars: string) {
    return chars.indexOf(ch) !== -1;
  }

  readIdent() {
    const start = this.index;
    this.index += this.peekMultichar().length;
    while (this.index < this.text.length) {
      const ch = this.peekMultichar();
      if (!this.isIdentifierContinue(ch)) {
        break;
      }
      this.index += ch.length;
    }
    this.tokens.push({
      index: start,
      text: this.text.slice(start, this.index),
      identifier: true
    });
  }

  isIdentifierContinue(ch: string) {
    return this.isIdentifierStart(ch) || this.isNumber(ch);
  }

  peek(i?: number) {
    const num = i || 1;
    return (this.index + num < this.text.length) ? this.text.charAt(this.index + num) : false;
  }

  peekMultichar() {
    const ch = this.text.charAt(this.index);
    const peek = this.peek();
    if (!peek) {
      return ch;
    }
    const cp1 = ch.charCodeAt(0);
    const cp2 = peek.charCodeAt(0);
    if (cp1 >= 0xD800 && cp1 <= 0xDBFF && cp2 >= 0xDC00 && cp2 <= 0xDFFF) {
      return ch + peek;
    }
    return ch;
  }

  isIdentifierStart(ch: string) {
    return ('a' <= ch && ch <= 'z' ||
      'A' <= ch && ch <= 'Z' ||
      '_' === ch || ch === '$');
  }

  isNumber(ch: string) {
    return ('0' <= ch && ch <= '9') && typeof ch === 'string';
  }

  isWhitespace(ch: string) {
    return (ch === ' ' || ch === '\r' || ch === '\t' ||
      ch === '\n' || ch === '\v' || ch === '\u00A0');
  }

  isExpOperator(ch: string) {
    return (ch === '-' || ch === '+' || this.isNumber(ch));
  }

  readNumber() {
    let num = '';
    const start = this.index;
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index).toLowerCase();
      if (ch === '.' || this.isNumber(ch)) {
        num += ch;
      } else {
        const peekCh = this.peek();
        if (ch === 'e' && this.isExpOperator(peekCh as string)) {
          num += ch;
        } else if (this.isExpOperator(ch) &&
          peekCh && this.isNumber(peekCh) &&
          num.charAt(num.length - 1) === 'e') {
          num += ch;
        } else if (this.isExpOperator(ch) &&
          (!peekCh || !this.isNumber(peekCh)) &&
          num.charAt(num.length - 1) === 'e') {
          this.throwError('Invalid exponent');
        } else {
          break;
        }
      }
      this.index++;
    }
    this.tokens.push({
      index: start,
      text: num,
      constant: true,
      value: Number(num)
    });
  }

  readString(quote) {
    const start = this.index;
    this.index++;
    let str = '';
    let rawString = quote;
    let escape = false;
    while (this.index < this.text.length) {
      const ch = this.text.charAt(this.index);
      rawString += ch;
      if (escape) {
        if (ch === 'u') {
          const hex = this.text.substring(this.index + 1, this.index + 5);
          if (!hex.match(/[\da-f]{4}/i)) {
            this.throwError('Invalid unicode escape [\\u' + hex + ']');
          }
          this.index += 4;
          str += String.fromCharCode(parseInt(hex, 16));
        } else {
          const rep = ESCAPE[ch];
          str = str + (rep || ch);
        }
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === quote) {
        this.index++;
        this.tokens.push({
          index: start,
          text: rawString,
          constant: true,
          value: str
        });
        return;
      } else {
        str += ch;
      }
      this.index++;
    }
    this.throwError('Unterminated quote', start);
  }

  throwError(error: string, start?: number, end?: number) {
    end = end || this.index;
    const colStr = (typeof start !== 'undefined'
      ? 's ' + start +  '-' + this.index + ' [' + this.text.substring(start, end) + ']'
      : ' ' + end);
    console.warn(`lexerr', 'Lexer Error: ${error} at column${colStr} in expression [${this.text}].`);
  }
}
