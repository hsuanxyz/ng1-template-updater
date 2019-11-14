export const attrReplaceRules = [
  {
    replace: 'ng-model',
    replaceWith: '[(ngModel)]',
  },
  {
    replace: 'ng-change',
    replaceWith: '(ngModelChange)',
  },
  {
    replace: 'ng-class',
    replaceWith: '[ngClass]',
  },
  {
    replace: 'ng-disabled',
    replaceWith: '[disabled]',
  },
  {
    replace: 'ng-bind-html',
    replaceWith: '[innerHTML]',
  },
  {
    replace: 'ng-href',
    replaceWith: 'href',
  },
  {
    replace: 'ng-src',
    replaceWith: 'src',
  },
  {
    replace: 'ng-srcset',
    replaceWith: 'srcset',
  },
  {
    replace: 'ng-style',
    replaceWith: '[ngStyle]',
  },
  {
    replace: 'ng-if',
    replaceWith: '*ngIf',
  },
  {
    replace: 'ng-show',
    replaceWith: '[hidden]',
  },
  {
    replace: 'ng-repeat',
    replaceWith: '*ngFor',
  },
  {
    replace: 'ng-keydown',
    replaceWith: '(keydown)',
  },
  {
    replace: 'ng-keypress',
    replaceWith: '(keypress)',
  },
  {
    replace: 'ng-keyup',
    replaceWith: '(keyup)',
  },
  {
    replace: 'ng-blur',
    replaceWith: '(blur)',
  },
  {
    replace: 'ng-focus',
    replaceWith: '(blur)',
  },
  {
    replace: 'ng-cut',
    replaceWith: '(cut)',
  },
  {
    replace: 'ng-paste',
    replaceWith: '(paste)',
  },
  {
    replace: 'ng-copy',
    replaceWith: '(copy)',
  },
  {
    replace: 'ng-submit',
    replaceWith: '(submit)',
  },
  {
    replace: 'ng-click',
    replaceWith: '(click)',
  },
  {
    replace: 'ng-dblclick',
    replaceWith: '(dblclick)',
  },
  {
    replace: 'ng-switch',
    replaceWith: '[ngSwitch]',
  },
  {
    replace: 'ng-switch-when',
    replaceWith: '*ngSwitchCase',
  },
  {
    replace: 'ng-switch-default',
    replaceWith: '*ngSwitchDefault',
  }
];
