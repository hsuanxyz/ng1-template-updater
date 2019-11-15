
export interface AttrReplaceRule {
  replace: string;
  replaceWith: string;
  url: string;
}

export const attrReplaceRules: AttrReplaceRule[] = [
  {
    replace: 'ng-model',
    replaceWith: '[(ngModel)]',
    url: 'https://angular.io/api/forms/NgModel#properties'
  },
  {
    replace: 'ng-change',
    replaceWith: '(ngModelChange)',
    url: 'https://angular.io/api/forms/NgModel#properties'
  },
  {
    replace: 'ng-submit',
    replaceWith: '(ngSubmit)',
    url: 'https://angular.io/api/forms/NgModel#using-ngmodel-within-a-form'
  },
  {
    replace: 'ng-disabled',
    replaceWith: '[disabled]',
    url: 'https://angular.io/api/forms/NgModel#properties'
  },
  {
    replace: 'ng-class',
    replaceWith: '[ngClass]',
    url: 'https://angular.io/api/common/NgClass'
  },
  {
    replace: 'ng-style',
    replaceWith: '[ngStyle]',
    url: 'https://angular.io/api/common/NgStyle'
  },
  {
    replace: 'ng-bind-html',
    replaceWith: '[innerHTML]',
    url: 'https://angular.io/guide/template-syntax'
  },
  {
    replace: 'ng-href',
    replaceWith: 'href',
    url: 'https://angular.io/guide/template-syntax'
  },
  {
    replace: 'ng-src',
    replaceWith: 'src',
    url: 'https://angular.io/guide/template-syntax'
  },
  {
    replace: 'ng-srcset',
    replaceWith: 'srcset',
    url: 'https://angular.io/guide/template-syntax'
  },
  {
    replace: 'ng-show',
    replaceWith: '[hidden]',
    url: 'https://angular.io/guide/template-syntax'
  },
  {
    replace: 'ng-if',
    replaceWith: '*ngIf',
    url: 'https://angular.io/api/common/NgIf'
  },
  {
    replace: 'ng-repeat',
    replaceWith: '*ngFor',
    url: 'https://angular.io/api/common/NgForOf'
  },
  {
    replace: 'ng-keydown',
    replaceWith: '(keydown)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-keypress',
    replaceWith: '(keypress)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-keyup',
    replaceWith: '(keyup)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-blur',
    replaceWith: '(blur)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-focus',
    replaceWith: '(blur)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-cut',
    replaceWith: '(cut)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-paste',
    replaceWith: '(paste)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-copy',
    replaceWith: '(copy)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-click',
    replaceWith: '(click)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-dblclick',
    replaceWith: '(dblclick)',
    url: 'https://angular.io/guide/user-input'
  },
  {
    replace: 'ng-switch',
    replaceWith: '[ngSwitch]',
    url: 'https://angular.io/api/common/NgSwitch'
  },
  {
    replace: 'ng-switch-when',
    replaceWith: '*ngSwitchCase',
    url: 'https://angular.io/api/common/NgSwitchCase'
  },
  {
    replace: 'ng-switch-default',
    replaceWith: '*ngSwitchDefault',
    url: 'https://angular.io/api/common/NgSwitchDefault'
  }
];
