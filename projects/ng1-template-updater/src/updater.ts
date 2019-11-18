import {
  Attribute,
  DefaultTreeChildNode,
  DefaultTreeDocument,
  DefaultTreeElement,
  DefaultTreeTextNode,
  Location,
  parseFragment
} from 'parse5';
import {StringUpdater} from './utils/update-recorder';
import {computeLineStartsMap, getLineAndCharacterFromPosition} from '@angular/core/schematics/utils/line_mappings';
import {Lexer} from './utils/lexer';
import {FilterParse} from './utils/filter-parse';

import {Message, MessageDetail, LogLevel, AttrReplaceRule, AttrValueChangeRules, PipeChangeRules, TemplateUpdaterRules} from './interfaces';

import {
  attrReplaceRules as defaultAttrReplaceRules,
  attrUnsupportedRules as defaultAttrUnsupportedRules,
  attrValueChangeRules as defaultAttrValueChangeRules,
  pipeChangeRules as defaultPipeChangeRules,
  pipeUnsupportedRules as defaultPipeUnsupportedRules
} from './rules';

export const defaultTemplateUpdaterRules: TemplateUpdaterRules = {
  attrReplaceRules: defaultAttrReplaceRules,
  attrUnsupportedRules: defaultAttrUnsupportedRules,
  pipeChangeRules: defaultPipeChangeRules,
  pipeUnsupportedRules: defaultPipeUnsupportedRules,
  attrValueChangeRules: defaultAttrValueChangeRules
};

export class TemplateUpdater {

  private messages: Message[] = [];
  private html: DefaultTreeDocument;
  private updateBuffer: StringUpdater;
  private originTemplate: string;
  private template: string;

  constructor(private rules: TemplateUpdaterRules = defaultTemplateUpdaterRules) {

  }

  getMessages(): MessageDetail[] {
    const lineMap = computeLineStartsMap(this.originTemplate);
    return this.messages
      .sort((a, b) => a.level - b.level)
      .map(failure => {
        const pos = getLineAndCharacterFromPosition(lineMap, failure.position);
        return {
          message: failure.message,
          pos,
          length: failure.length,
          level: failure.level,
          url: failure.url
        };
      });
  }

  getResult(): { template: string, originTemplate: string; messages: MessageDetail[] } {
    return {
      template: this.template,
      messages: this.getMessages(),
      originTemplate: this.originTemplate
    };
  }

  parse(originTemplate: string) {
    if (originTemplate === this.originTemplate) {
      return this.getResult();
    }

    this.originTemplate = originTemplate;
    this.messages = [];
    this.html = parseFragment(originTemplate, { sourceCodeLocationInfo: true }) as DefaultTreeDocument;
    this.updateBuffer = new StringUpdater(originTemplate);

    const visitNodes = nodes => {
      nodes.forEach(node => {
        if (node.childNodes) {
          visitNodes(node.childNodes);
        }
        this.visitNode(node);
      });
    };
    visitNodes(this.html.childNodes);
    this.template = this.updateBuffer.toString();

    return this.getResult();
  }

  visitNode(node: DefaultTreeElement) {
    if (node && node.attrs && node.attrs.length) {
      node.attrs.forEach(attr => {
        this.visitAttrs(attr, node.sourceCodeLocation.attrs[attr.name]);
      });
    }
    if (node && node.nodeName === '#text') {
      this.visitTextNode(node as DefaultTreeChildNode);
    }
  }

  visitAttrs(attr: Attribute, location: Location) {

    const attrValueChangeRules: AttrValueChangeRules = this.rules.attrValueChangeRules || {};
    const attrReplaceRules: AttrReplaceRule[] = this.rules.attrReplaceRules || [];
    const attrUnsupportedRules: string[] = this.rules.attrUnsupportedRules || [];

    const changeRuleFun = attrValueChangeRules[attr.name];
    const messages: Message[] = [];
    if (changeRuleFun) {
      const start = location.endOffset - 1 - attr.value.length;
      const data = changeRuleFun(attr.value, location);
      this.updateBuffer.remove(start, attr.value.length);
      this.updateBuffer.insertLeft(start, data.value);
      messages.push(...data.messages);
    }

    if (messages.filter(failure => failure.level === LogLevel.Error).length === 0) {
      attrReplaceRules.forEach(rule => {
        if (attr.name === rule.replace) {
          this.updateBuffer.remove(location.startOffset, attr.name.length);
          this.updateBuffer.insertLeft(location.startOffset, rule.replaceWith);
          messages.push({
            message: `Update property ${attr.name} to ${rule.replaceWith}`,
            position: location.startOffset,
            level: LogLevel.Info,
            length: attr.name.length,
            url: rule.url
          });
        }
      });

      attrUnsupportedRules.forEach(rule => {
        if (attr.name === rule) {
          messages.push({
            message: `Unsupported property ${rule}`,
            position: location.startOffset,
            level: LogLevel.Error,
            length: attr.name.length
          });
        }
      });
    }

    this.messages.push(...messages);
  }

  visitTextNode(node: DefaultTreeChildNode) {
    const pipeChangeRules: PipeChangeRules = this.rules.pipeChangeRules || {};
    const pipeUnsupportedRules: string[] = this.rules.pipeUnsupportedRules || [];

    const location = (node as DefaultTreeElement).sourceCodeLocation;
    const textNode = node as DefaultTreeTextNode;
    if (!textNode.value.trim()) {
      return;
    }
    const lex = new Lexer(textNode.value).lex();
    const filterParse = new FilterParse([...lex]);
    const filters = filterParse.pares();
    filters.filter(f => f.length).forEach(filter => {
      const fun = pipeChangeRules[filter[0].text];
      const start = location.startOffset + filter[0].index;
      const length = filter[filter.length - 1].index + filter[filter.length - 1].text.length - filter[0].index;
      if (fun) {
        const { value, url } = fun(filter);
        if (value !== filter.map(f => f.text).join(':')) {
          this.updateBuffer.remove(start, length);
          this.updateBuffer.insertLeft(start, value);
          this.messages.push({
            message: `Update filter ${filter.map(f => f.text).join(':')} to pipe ${value}`,
            position: start,
            level: LogLevel.Info,
            length,
            url
          });
        }
      }

      pipeUnsupportedRules.forEach(pipe => {
        if (filter[0].text === pipe) {
          this.messages.push({
            message: `Unsupported filter(pipe) ${pipe}`,
            position: start,
            level: LogLevel.Error,
            length
          });
        }
      });
    });

  }
}
