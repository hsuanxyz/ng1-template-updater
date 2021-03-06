import {Location} from 'parse5';
import {Lexer} from '../utils/lexer';
import {FilterParse} from '../utils/filter-parse';
import {pipeChangeRules} from './pipe-change';
import {pipeUnsupportedRules} from './pipe-unsupported';
import {ValueChangeRules, Message, LogLevel} from '../interfaces';

export const attrValueChangeRules: ValueChangeRules = {
  'ng-show': (expression: string, start: number) => {
    const messages: Message[] = [];
    messages.push({
      message: 'Update expression `ng-show="expression"` to `[hidden]="!(expression)"`',
      position: start,
      level: LogLevel.Info,
      length: expression.length,
      url: 'https://angular.io/guide/ajs-quick-reference'
    });
    return {
      value: `!(${expression})`,
      messages
    };
  },
  'ng-repeat': (expression: string, start: number) => {
    const messages: Message[] = [];
    let match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
    if (!match) {
      messages.push({
        message: 'Unexpected expression',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }
    const lhs = match[1];
    let rhs = match[2];
    const aliasAs = match[3];
    const trackByExp = match[4];
    match = lhs.match(/^(?:(\s*[$\w]+)|\(\s*([$\w]+)\s*,\s*([$\w]+)\s*\))$/);
    if (!match) {
      messages.push({
        message: 'Unexpected expression',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }
    const valueIdentifier = match[3] || match[1];
    const keyIdentifier = match[2];
    if (aliasAs && (!/^[$a-zA-Z_][$a-zA-Z0-9_]*$/.test(aliasAs) ||
      /^(null|undefined|this|\$index|\$first|\$middle|\$last|\$even|\$odd|\$parent|\$root|\$id)$/.test(aliasAs))) {
      messages.push({
        message: 'Unexpected expression',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }
    if (trackByExp) {
      messages.push({
        message: 'Unsupported expression `track by` use `trackBy` instead',
        position: start,
        level: LogLevel.Error,
        length: expression.length,
        url: 'https://angular.io/api/common/NgForOf#ngForTrackBy'
      });
    }
    if (keyIdentifier) {
      messages.push({
        message: 'Unsupported expression `(key, value) in items`',
        position: start,
        level: LogLevel.Error,
        length: expression.length,
        url: 'https://angular.io/api/common/NgForOf'
      });
    }

    if (aliasAs) {
      messages.push({
        message: 'Unsupported expression `item in items as named`',
        position: start,
        level: LogLevel.Error,
        length: expression.length,
        url: 'https://angular.io/api/common/NgForOf'
      });
    }

    messages.push({
      message: 'Update expression `item in items` to `let item of items`',
      position: start,
      level: LogLevel.Info,
      length: expression.length,
      url: 'https://angular.io/api/common/NgForOf'
    });

    const lex = new Lexer(rhs).lex();
    const filterParse = new FilterParse([...lex]);
    const filters = filterParse.pares();
    filters.filter(f => f.length).forEach(filter => {
      const fun = pipeChangeRules[filter[0].text];
      if (fun) {
        const { value, url } = fun(filter);
        rhs = `${rhs.slice(0, filter[0].index)}${value}`;
        messages.push({
          message: `Update filter ${filter.map(f => f.text).join(':')} to pipe ${value}`,
          position: start,
          level: LogLevel.Info,
          length: expression.length,
          url
        });
      }

      pipeUnsupportedRules.forEach(pipe => {
        if (filter[0].text === pipe) {
          messages.push({
            message: `Unsupported filter(pipe) ${pipe}`,
            position: start,
            level: LogLevel.Error,
            length: expression.length
          });
        }
      });
    });
    return {
      value: messages.every(f => f.level !== LogLevel.Error)
        ? `let ${valueIdentifier} of ${rhs}`
        : expression,
      messages
    };
  }
};
