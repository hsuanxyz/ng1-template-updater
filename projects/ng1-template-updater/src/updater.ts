import {computeLineStartsMap, getLineAndCharacterFromPosition} from '@angular/core/schematics/utils/line_mappings';
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
import {Lexer} from './utils/lexer';
import {FilterParse} from './utils/filter-parse';
import {fixVoidElement} from './utils/void-element';

import {
  Message,
  MessageDetail,
  LogLevel,
  AttrReplaceRule,
  ValueChangeRules,
  PipeChangeRules,
  TemplateUpdaterRules,
  ValueChangeRule
} from './interfaces';

import {
  attrReplaceRules as defaultAttrReplaceRules,
  attrUnsupportedRules as defaultAttrUnsupportedRules,
  attrValueChangeRules as defaultAttrValueChangeRules,
  pipeChangeRules as defaultPipeChangeRules,
  pipeUnsupportedRules as defaultPipeUnsupportedRules,
  valueChangeRules as defaultValueChangeRules
} from './rules';

export const defaultTemplateUpdaterRules: TemplateUpdaterRules = {
  attrReplaceRules: defaultAttrReplaceRules,
  attrUnsupportedRules: defaultAttrUnsupportedRules,
  pipeChangeRules: defaultPipeChangeRules,
  pipeUnsupportedRules: defaultPipeUnsupportedRules,
  attrValueChangeRules: defaultAttrValueChangeRules,
  valueChangeRules: defaultValueChangeRules
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
    this.template = fixVoidElement(this.updateBuffer.toString());

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
    this.fixNgModelName(node);
  }

  visitAttrs(attr: Attribute, location: Location) {

    const attrValueChangeRules: ValueChangeRules = this.rules.attrValueChangeRules || {};
    const attrReplaceRules: AttrReplaceRule[] = this.rules.attrReplaceRules || [];
    const attrUnsupportedRules: string[] = this.rules.attrUnsupportedRules || [];
    const valueChangeRules: ValueChangeRule[] = this.rules.valueChangeRules || [];

    const start = location.endOffset - 1 - attr.value.length;
    const changeRuleFun = attrValueChangeRules[attr.name];
    const messages: Message[] = [];
    let value = attr.value;
    if (changeRuleFun) {
      const data = changeRuleFun(attr.value, start);
      if (data.value !== value) {
        value = data.value;
      }
      messages.push(...data.messages);
    }

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < valueChangeRules.length; i++) {
      if (value !== attr.value) {
        break;
      }
      const valueChangeRule = valueChangeRules[i];
      const data = valueChangeRule(value, start);
      if (data.value !== value) {
        value = data.value;
      }
      messages.push(...data.messages);
    }

    if (value !== attr.value) {
      this.updateBuffer.remove(start, attr.value.length);
      this.updateBuffer.insertLeft(start, value);
    }

    if (!messages.some(failure => failure.level === LogLevel.Error)) {
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
    const valueChangeRules: ValueChangeRule[] = this.rules.valueChangeRules || [];

    const messages: Message[] = [];
    const location = (node as DefaultTreeElement).sourceCodeLocation;
    const textNode = node as DefaultTreeTextNode;
    let textValue = textNode.value;
    if (!textNode.value.trim()) {
      return;
    }

    const lex = new Lexer(textValue).lex();
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
          messages.push({
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
          messages.push({
            message: `Unsupported filter(pipe) ${pipe}`,
            position: start,
            level: LogLevel.Error,
            length
          });
        }
      });
    });

    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < valueChangeRules.length; i++) {
      if (textValue !== textNode.value) {
        break;
      }
      const valueChangeRule = valueChangeRules[i];
      const data = valueChangeRule(textValue, location.startOffset);
      if (data.value !== textValue) {
        textValue = data.value;
      }
      messages.push(...data.messages);
    }

    if (textValue !== textNode.value) {
      this.updateBuffer.remove(location.startOffset, textValue.length);
      this.updateBuffer.insertLeft(location.startOffset, textValue);
    }

    this.messages.push(...messages);
  }

  private fixNgModelName(node: DefaultTreeElement) {
    if (node.attrs) {
      const isModel = node.attrs.find(attr => attr.name === 'ng-model');
      if (isModel) {
        const hasName = node.attrs.find(attr => attr.name === 'name');
        if (!hasName) {
          const start = node.sourceCodeLocation.startOffset + node.tagName.length + 1;
          const id = node.attrs.find(attr => attr.name === 'id');
          this.updateBuffer.insertRight(
            start,
            ` name="${ id ? id.value : 'modelName' + String(start)}"`
          );
        }
      }
    }
  }
}
