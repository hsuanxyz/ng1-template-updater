import {AfterViewInit, Component, ElementRef, TemplateRef, ViewChild} from '@angular/core';
import {editor, Range} from 'monaco-editor';
import {MessageDetail, LogLevel, TemplateUpdater} from 'ng1-template-updater';
import {TEMPLATE} from './temptale';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('container') container: ElementRef<HTMLDivElement>;

  timeoutId = -1;
  messageDetails: MessageDetail[] = [];
  templateUpdater: TemplateUpdater;
  editor: IStandaloneCodeEditor;
  value = TEMPLATE;
  canFix = false;
  decorations: string[] = [];

  constructor() {
    this.templateUpdater = new TemplateUpdater();
  }

  ngAfterViewInit(): void {
    this.editor = editor.create(this.container.nativeElement, {
      language: 'html',
      theme: 'vs-dark',
      minimap: {
        enabled: false
      },
    });

    this.editor.getModel().onDidChangeContent(() => {
      clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.check();
      }, 300);
    });

    this.editor.setValue(this.value);
  }

  scrollToLine(failure: MessageDetail) {
    const range = new Range(
      failure.pos.line + 1, failure.pos.character + 1,
      failure.pos.line + 1, failure.pos.character + failure.length + 1
    );
    this.editor.revealRangeAtTop(range);
    this.editor.setSelection(range);
    this.editor.focus();
  }

  fix() {
    const code = this.editor.getValue();
    const { template } = this.templateUpdater.parse(code);
    this.editor.setValue(template);
    if ((window as any).ga) {
      (window as any).ga('send', 'event', {
        eventCategory: 'UpdateTemplate',
        eventLabel: 'QuickFix',
        eventAction: 'click',
        value: null
      });
    }
  }

  check() {
    const code = this.editor.getValue();
    const { messages } = this.templateUpdater.parse(code);
    this.messageDetails = [...messages];
    this.canFix = messages.some(f => f.level === LogLevel.Info);
    this.decorations = this.editor.deltaDecorations(this.decorations, messages.map(failure => {
      return {
        range: new Range(
          failure.pos.line + 1, failure.pos.character + 1,
          failure.pos.line + 1, failure.pos.character + failure.length + 1 ),
        options: {
          className: failure.level === LogLevel.Error ? '' : 'warn-content',
          inlineClassName: failure.level === LogLevel.Error ? 'decoration-link' : '',
          stickiness: 1,
          hoverMessage: {
            value: failure.message + (failure.url ? ` [more](${failure.url})` : '')
          }
        }
      };
    }));
  }

}
