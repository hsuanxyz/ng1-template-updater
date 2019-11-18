import {Location} from 'parse5';
import {Message} from './message';
import {Token} from '../utils/lexer';

export interface AttrValueChangeRules {
  [key: string]: (expression: string, location?: Location) => { value: string; messages: Message[] };
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
  attrValueChangeRules?: AttrValueChangeRules;
  attrUnsupportedRules?: string[];
  pipeChangeRules?: PipeChangeRules;
  pipeUnsupportedRules?: string[];
}

