const voidElements = [
  'base',
  'meta',
  'area',
  'embed',
  'link',
  'img',
  'input',
  'param',
  'hr',
  'br',
  'source',
  'track',
  'wbr'
];

export function fixVoidElement(template: string): string {
  let i = voidElements.length - 1;
  let str = template;
  while (i >= 0) {
    str = str.replace(new RegExp(`<\/${voidElements[i]}>`, 'ig'), '');
    i--;
  }
  return str;
}
