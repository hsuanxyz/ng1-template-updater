import {Token} from '../utils/lexer';
import {CURRENCIES_EN} from '../utils/currencies';
import {strToNumber} from '../utils/str2number';
import {PipeChangeRules} from '../interfaces';

export const pipeChangeRules: PipeChangeRules = {
  limitTo: (pipes: Token[]) => {
    let value = '';
    const url = 'https://angular.io/api/common/SlicePipe';
    if (pipes.length <= 2) {
      value = `slice: 0`;
    } else {
      value = `slice:${pipes[2].text}:${pipes[1].text}`;
    }
    return {
      value,
      url
    };
  },
  currency: (pipes: Token[]) => {
    const originPipe = pipes.map(p => p.text).join(':');
    let value = originPipe;
    const url = 'https://angular.io/api/common/CurrencyPipe';

    if (pipes.length === 1) {
      value = `currency`;
    }

    if (pipes.length === 2) {
      const currencyCode = pipes[1] && pipes[1].text;
      if (CURRENCIES_EN.indexOf(currencyCode) !== -1) {
        value = originPipe;
      } else {
        value = `currency:'USD':${currencyCode}`;
      }
    }

    if (pipes.length === 3) {
      const fractionSize = pipes[2] && pipes[2].text;
      try {
        const num = strToNumber(fractionSize);
        value = `currency:'USD':'symbol':${num}`;
      } catch (e) {
        value = originPipe;
      }
    }

    return {
      value,
      url
    };
  }
};
