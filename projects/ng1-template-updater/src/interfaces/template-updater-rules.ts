import {Message} from './message';
import {Token} from '../utils/lexer';

export type ValueChangeRule = (expression: string, start?: number) => { value: string; messages: Message[] };

export interface ValueChangeRules {
  [key: string]: ValueChangeRule;
}

export interface AttrReplaceRule {
  replace: string;
  replaceWith: string;
  url: string;
}

export type PipeChangeRule = (pipes: Token[]) => { value: string,  url: string};

export interface PipeChangeRules {
  [key: string]: PipeChangeRule;
}

export interface TemplateUpdaterRules {
  attrReplaceRules?: AttrReplaceRule[];
  attrValueChangeRules?: ValueChangeRules;
  attrUnsupportedRules?: string[];
  pipeChangeRules?: PipeChangeRules;
  pipeUnsupportedRules?: string[];
  valueChangeRules?: ValueChangeRule[];
}

