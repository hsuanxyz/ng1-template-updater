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
import {attrReplaceRules} from './rules/attr-replace';
import {attrUnsupportedRules} from './rules/attr-unsupported';
import {pipeChangeRules} from './rules/pipe-change';
import {pipeUnsupportedRules} from './rules/pipe-unsupported';
import {valueChangeRules} from './rules/value-change';
import {Failure, FailureMessages} from './interfaces/failure';
import {LogLevel} from './interfaces/log-level';

export class TemplateAdapter {

  failures: Failure[] = [];
  html: DefaultTreeDocument;
  // rootNodes: html.Node[];
  updateBuffer: StringUpdater;

  constructor(private originTemplate: string) {
    this.html = parseFragment(originTemplate, { sourceCodeLocationInfo: true }) as DefaultTreeDocument;
    this.updateBuffer = new StringUpdater(originTemplate);
  }

  failureMessages(): FailureMessages[] {
    const lineMap = computeLineStartsMap(this.originTemplate);
    return this.failures
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

  parse(): string {
    const visitNodes = nodes => {
      nodes.forEach(node => {
        if (node.childNodes) {
          visitNodes(node.childNodes);
        }
        this.visitNode(node);
      });
    };
    visitNodes(this.html.childNodes);
    return this.updateBuffer.toString();
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

    const changeRuleFun = valueChangeRules[attr.name];
    const failures: Failure[] = [];
    if (changeRuleFun) {
      const start = location.endOffset - 1 - attr.value.length;
      const data = changeRuleFun(attr.value, location);
      this.updateBuffer.remove(start, attr.value.length);
      this.updateBuffer.insertLeft(start, data.value);
      failures.push(...data.failures);
    }

    if (failures.filter(failure => failure.level === LogLevel.Error).length === 0) {
      attrReplaceRules.forEach(rule => {
        if (attr.name === rule.replace) {
          this.updateBuffer.remove(location.startOffset, attr.name.length);
          this.updateBuffer.insertLeft(location.startOffset, rule.replaceWith);
          failures.push({
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
          failures.push({
            message: `Unsupported property ${rule}`,
            position: location.startOffset,
            level: LogLevel.Error,
            length: attr.name.length
          });
        }
      });
    }

    this.failures.push(...failures);
  }

  visitTextNode(node: DefaultTreeChildNode) {
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
          this.failures.push({
            message: `Update filter ${filter.map(f => f.text).join(':')} to pipe ${value}`,
            position: start,
            level: LogLevel.Info,
            length,
            url
          });
        }
      }

      pipeUnsupportedRules.filter(pipe => {
        if (filter[0].text === pipe) {
          this.failures.push({
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
