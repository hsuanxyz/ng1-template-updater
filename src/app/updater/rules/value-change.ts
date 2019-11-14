import {Location} from 'parse5';
import {Lexer} from '../utils/lexer';
import {FilterParse} from '../utils/filter-parse';
import {pipeChangeRules} from './pipe-change';
import {pipeUnsupportedRules} from './pipe-unsupported';
import {Failure} from '../interfaces/failure';
import {LogLevel} from '../interfaces/log-level';

export const valueChangeRules = {
  'ng-show': (expression: string, location?: Location) => {
    const failures: Failure[] = [];
    const start = location.endOffset - 1 - expression.length;
    failures.push({
      message: 'Update expression `ng-show="expression"` to `[hidden]="!(expression)"`',
      position: start,
      level: LogLevel.Info,
      length: expression.length
    });
    return {
      value: `!(${expression})`,
      failures
    };
  },
  'ng-repeat': (expression: string, location?: Location) => {
    const start = location.endOffset - 1 - expression.length;
    const failures: Failure[] = [];
    let match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
    if (!match) {
      failures.push({
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
      failures.push({
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
      failures.push({
        message: 'Unexpected expression',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }
    if (trackByExp) {
      failures.push({
        message: 'Unsupported expression `track by` use `trackBy` instead',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }
    if (keyIdentifier) {
      failures.push({
        message: 'Unsupported expression `(key, value) in items`',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }

    if (aliasAs) {
      failures.push({
        message: 'Unsupported expression `item in items as named`',
        position: start,
        level: LogLevel.Error,
        length: expression.length
      });
    }

    failures.push({
      message: 'Update expression `item in items` to `let item of items`',
      position: start,
      level: LogLevel.Info,
      length: expression.length
    });

    const lex = new Lexer(rhs).lex();
    const filterParse = new FilterParse([...lex]);
    const filters = filterParse.pares();
    filters.filter(f => f.length).forEach(filter => {
      const fun = pipeChangeRules[filter[0].text];
      if (fun) {
        const newPipe = fun(filter);
        rhs = `${rhs.slice(0, filter[0].index)}${newPipe}`;
      }

      pipeUnsupportedRules.forEach(pipe => {
        if (filter[0].text === pipe) {
          failures.push({
            message: `Unsupported filter(pipe) ${pipe}`,
            position: start,
            level: LogLevel.Error,
            length: expression.length
          });
        }
      });
    });
    return {
      value: failures.length === 0 ? `let ${valueIdentifier} of ${rhs}` : expression,
      failures
    };
  }
};
