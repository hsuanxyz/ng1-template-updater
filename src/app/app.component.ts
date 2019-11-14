import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import {editor, Range} from 'monaco-editor';
import {FailureMessages, LogLevel, TemplateAdapter} from './updater';
import {TEMPLATE} from './temptale';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('container', { static: false }) container: ElementRef<HTMLDivElement>;

  timeoutId = -1;
  failures: FailureMessages[] = [];
  editor: IStandaloneCodeEditor;
  value = TEMPLATE;
  canFix = false;
  decorations: string[] = [];

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

  scrollToLine(failure: FailureMessages) {
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
    const templateAdapter = new TemplateAdapter(code);
    const newCode = templateAdapter.parse();
    this.editor.setValue(newCode);
  }

  check() {
    const code = this.editor.getValue();
    const templateAdapter = new TemplateAdapter(code);
    templateAdapter.parse();
    const failures = templateAdapter.failureMessages();
    this.failures = [...failures];
    this.canFix = failures.some(f => f.level === LogLevel.Info);
    this.decorations = this.editor.deltaDecorations(this.decorations, failures.map(failure => {
      return {
        range: new Range(
          failure.pos.line + 1, failure.pos.character + 1,
          failure.pos.line + 1, failure.pos.character + failure.length + 1 ),
        options: {
          className: failure.level === LogLevel.Error ? '' : 'warn-content',
          inlineClassName: failure.level === LogLevel.Error ? 'decoration-link' : '',
          stickiness: 1,
          hoverMessage: {
            value: failure.message
          }
        }
      };
    }));
  }

}
