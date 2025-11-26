'use strict';

export function getDisplaySelect(app, device, buttons, ident, model = null, command = null, title = null) {
  device.functions.push({
    title: title ? title : `main.${ident}`,
    type: ident,
    view: 'select',
    model: `device.:ident.status.${model ? model : ident}`,
    value: null,
    buttons,
    data: {
      ident: ':ident',
      command: command ? command : ident,
      value: `:${ident}`
    }
  });
}

export function combineObjects(target, source, check = false, error = false) {
  if (source && Array.isArray(source)) {
    source.forEach(item => {
      if (typeof item === 'object') {
        const item1 = {};
        combineObjects(item1, item);
        target.push(item1);
      } else {
        target.push(item);
      }
    });
  } else if (source) {
    Object.keys(source).forEach(key => {
      if (error && ['body'].indexOf(key) === -1) {
      } else if (source[key] === null) {
        target[key] = null;
      } else if (typeof source[key] === 'object') {
        if (!target[key]) {
          if (Array.isArray(source[key])) {
            target[key] = [];
          } else {
            target[key] = {};
          }
        }
        combineObjects(target[key], source[key], false, key === 'error')
      } else {
        if (!check || target[key] === undefined) {
          target[key] = source[key];
        }
      }
    });
  }
}

