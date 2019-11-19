import {LogLevel, Message, ValueChangeRule} from '../interfaces';

const viewModelRule: ValueChangeRule = (expression: string, start?: number) => {
  const regexp = /(vm\.)/g;
  const messages: Message[] = [];

  let match = regexp.exec(expression);
  while (match !== null) {
    messages.push({
      position: start + match.index,
      message: 'No longer needed to use the `vm` alias to access controller in Angular',
      length: match[1].length,
      url: 'https://angular.io/guide/ajs-quick-reference',
      level: LogLevel.Info
    });
    match = regexp.exec(expression);
  }

  return {
    value: expression.replace(regexp, ''),
    messages
  };
};

export const valueChangeRules: ValueChangeRule[] = [ viewModelRule ];
