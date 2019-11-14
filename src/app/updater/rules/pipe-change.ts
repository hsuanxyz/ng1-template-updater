import {Token} from '../utils/lexer';
import {CURRENCIES_EN} from '../utils/currencies';
import {strToNumber} from '../utils/str2number';

export const pipeChangeRules = {
  limitTo: (pipes: Token[]) => {
    if (pipes.length <= 2) {
      return `slice: 0`;
    } else {
      return `slice:${pipes[2].text}:${pipes[1].text}`;
    }
  },
  currency: (pipes: Token[]) => {
    const originPipe = pipes.map(p => p.text).join(':');
    if (pipes.length === 1) {
      return `currency`;
    }

    if (pipes.length === 2) {
      const currencyCode = pipes[1] && pipes[1].text;
      if (CURRENCIES_EN.indexOf(currencyCode) !== -1) {
        return originPipe;
      }
      return `currency:'USD':${currencyCode}`;
    }

    if (pipes.length === 3) {
      const fractionSize = pipes[2] && pipes[2].text;
      try {
        const num = strToNumber(fractionSize);
        return `currency:'USD':'symbol':${num}`;
      } catch (e) {
        return originPipe;
      }
    }
    return originPipe;
  }
};
