/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable no-empty */
/* eslint-disable guard-for-in */
/* https://github.com/AspenLuoQiang/ohEditor/blob/master/src/util/dom-core.js */
Element.prototype.matches =
  Element.prototype.matches ||
  Element.prototype.matchesSelector ||
  Element.prototype.mozMatchesSelector ||
  Element.prototype.msMatchesSelector ||
  Element.prototype.oMatchesSelector ||
  Element.prototype.webkitMatchesSelector ||
  function (s) {
    const matches = (this.document || this.ownerDocument).querySelectorAll(s);
    let i = matches.length;
    while (--i >= 0 && matches.item(i) !== this) {}
    return i > -1;
  };

/* 所有事件记录，便于解绑 */
const _allEvent = [];

/**
 * createElement - 通过创建div，并返回其子元素，创建dom
 *
 * @param  {string} html html片段
 * @return {HTMLElement}      description
 */
function createElement(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.children;
}

/**
 * querySelectorAll - 封装querySelectorAll，并返回数组DOMList
 *
 * @param  {string} selector 选择器
 * @param  {DOMList} scope 父容器
 * @return {DOMList}          description
 */
function querySelectorAll(selector, scope) {
  let result;
  if (!scope) {
    result = document.querySelectorAll(selector);
  } else {
    result = [];
    for (let i = 0, len = scope.length; i < len; i++) {
      result = result.concat(Array.from(scope[i].querySelectorAll(selector)));
    }
  }

  if (isDOMList(result)) {
    return result;
  } else {
    return Array.isArray(result) ? result : [result];
  }
}

/* 是否是 DOM List */
function isDOMList(list) {
  if (!list) return false;
  if (list instanceof HTMLCollection || list instanceof NodeList
    || (Array.isArray(list) && list.length && (list[0].nodeType === 1 || list[0].nodeType === 9))) {
    return true;
  }
  return false;
}

export class VE {
  constructor(selector, scope) {
    if (!selector) return;

    // selector 本来就是 VE 对象，直接返回
    if (selector instanceof VE) return selector;

    this.selector = selector;
    this.length = 0;
    const { nodeType } = selector;

    let result = [];

    /* document 节点 或者 单个 DOM 节点 */
    if (nodeType === 9 || nodeType === 1) {
      result = [selector];
    } else if (isDOMList(selector) || selector instanceof Array) {
      /* DOM List 或者数组 */
      result = selector;
    } else if (typeof selector === 'string') {
      /* 字符串 */
      selector = selector.trim();

      /* 需要生成dom */
      if (/^</.test(selector)) {
        result = createElement(selector);
      } else {
        /* 选择器，scope必须是VE或者字符串 */
        // eslint-disable-next-line no-lonely-if
        if (scope) {
          if (typeof scope === 'string') {
            result = querySelectorAll(selector, querySelectorAll(scope));
          } else if (scope instanceof VE) {
            result = querySelectorAll(selector, scope);
          } else {
            result = [];
          }
        } else {
          result = querySelectorAll(selector);
        }
      }
    } else {
      /* 不是选择器也不dom结构，可能只是为了使用事件机制的其他对象 */
      result = [selector];
    }

    const { length } = result;
    if (!length) return this;

    /* 加入 DOM 节点 */
    let i;
    for (i = 0; i < length; i++) {
      this[i] = result[i];
    }
    this.length = length;
  }

  is(selector) {
    const elem = this.get(0);
    return elem && elem.matches && elem.matches(selector);
  }

  each(fn) {
    let i;
    for (i = 0; i < this.length; i++) {
      const elem = this[i];
      const result = fn.call(elem, elem, i);
      if (result === false) {
        break;
      }
    }
    return this;
  }

  clone(deep) {
    const cloneList = [];
    this.each(elem => {
      cloneList.push(elem.cloneNode(!!deep));
    });
    return $(cloneList);
  }

  size() {
    return this.length;
  }

  get(index) {
    if (index < 0) index += this.length;
    return this[index];
  }

  first() {
    return this.get(0);
  }

  last() {
    return this.get(-1);
  }

  eq(index) {
    if (index === undefined) return this;
    return $(this.get(index));
  }

  attr(key, val) {
    if (!val) {
      return this[0].getAttribute(key);
    } else {
      return this.each(elem => {
        elem.setAttribute(key, val);
      });
    }
  }

  children() {
    const elem = this.get(0);
    return $(elem.children);
  }

  lastChildren() {
    return this.children().last();
  }

  on(type, selector, fn, options = false) {
    /* 没有传selector， 则不用代理 */
    if (!fn) {
      fn = selector;
      selector = null;
    }

    /* 可能有多个事件 */
    const types = type.split(/[\s+,]/);
    const opts = typeof options === 'object' ? {
      once: false,
      capture: false,
      passive: false,
      ...options,
    } : options;
    return this.each(elem => {
      types.forEach(type => {
        type = type.trim();
        if (!type) return;

        if (!selector) {
          /* 无代理 */
          const callback = function (e) {
            const res = fn.call(this, e, this);
            if (res === false) {
              e.preventDefault();
              e.returnValue = false;
              e.stopPropagation();
              e.cancelBubble = true;
            }
          };
          /* 记录事件 */
          _allEvent.push({
            type,
            selector,
            fn,
            options,
            elem,
            callback,
            opts,
          });
          elem.addEventListener(type, callback, opts);
        } else {
          /* 有代理 */
          const callback = function (e) {
            let { target } = e;
            const { currentTarget } = e;
            /* 遍历外层并且匹配 */
            while (target !== currentTarget) {
              /* 判断是否匹配到我们所需要的元素上 */
              if (target.matches(selector)) {
                /* 执行绑定的函数 */
                const res = fn.call(target, e, this, target);

                if (res === false) {
                  e.preventDefault();
                  e.returnValue = false;
                  e.stopPropagation();
                  e.cancelBubble = true;
                }
                break;
              }
              target = target.parentNode;
            }
          };
          /* 记录事件 */
          _allEvent.push({
            type,
            selector,
            fn,
            options,
            elem,
            callback,
            opts,
          });
          elem.addEventListener(type, callback, opts);
        }
      });
    });
  }

  onLongPress(selector, fn, options = false) {
    /* 没有传selector， 则不用代理 */
    if (!fn) {
      fn = selector;
      selector = null;
    }

    const opts = typeof options === 'object' ? {
      once: false,
      capture: false,
      passive: false,
      ...options,
    } : options;

    return this.each(elem => {
      let callback;
      if (!selector) {
        /* 无代理 */
        callback = function (e) {
          const res = fn.call(this, e, this);
          if (res === false) {
            e.preventDefault();
            e.returnValue = false;
            e.stopPropagation();
            e.cancelBubble = true;
          }
        };
      } else {
        /* 有代理 */
        callback = function (e) {
          let { target } = e;
          const { currentTarget } = e;
          /* 遍历外层并且匹配 */
          while (target !== currentTarget) {
            /* 判断是否匹配到我们所需要的元素上 */
            if (target.matches && target.matches(selector)) {
              /* 执行绑定的函数 */
              const res = fn.call(target, e, this, target);

              if (res === false) {
                e.preventDefault();
                e.returnValue = false;
                e.stopPropagation();
                e.cancelBubble = true;
              }
              break;
            }
            target = target.parentNode;
          }
        };
      }

      const time = options.time || 800;
      let timer = null;
      elem.addEventListener('touchstart', function (e) {
        // eslint-disable-next-line no-console
        // console.log('touchstart', +new Date());
        timer = setTimeout(() => {
          callback.call(this, e);
        }, time);
      }, opts);
      document.body.addEventListener('touchmove', () => {
        // eslint-disable-next-line no-console
        // console.log('touchmove', +new Date());
        clearTimeout(timer);
        timer = null;
      }, false);
      elem.addEventListener('touchend', () => {
        // eslint-disable-next-line no-console
        // console.log('touchend', +new Date());
        clearTimeout(timer);
        timer = null;
      }, opts);
    });
  }

  once(type, selector, fn) {
    return this.on(type, selector, fn, { once: true });
  }

  off(type, selector, fn, options) {
    if (!fn) {
      fn = selector;
      selector = null;
    }
    return this.each(elem => {
      const events = _allEvent.filter(event => {
        let eqSel = true;
        if (selector && selector !== event.selector) {
          eqSel = false;
        }
        let eqOpts = true;
        if (options && options !== event.options) {
          eqOpts = false;
        }
        return elem === event.elem
          && type === event.type
          && fn === event.fn
          && eqSel
          && eqOpts;
      });
      events.forEach(event => {
        event.elem.removeEventListener(event.type, event.callback, event.opts);
      });
    });
  }

  siblings(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(sibling((elem.parentNode || {}).firstChild, elem));
    });

    return $(result).filter(selector);
  }

  next(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(elem.nextElementSibling);
    });

    return $(result).filter(selector);
  }

  prev(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(elem.previousElementSibling);
    });

    return $(result).filter(selector);
  }

  nextAll(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(dir(elem, 'nextElementSibling'));
    });

    return $(result).filter(selector);
  }

  prevAll(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(dir(elem, 'previousElementSibling'));
    });

    return $(result).filter(selector);
  }

  parent(selector) {
    let result = [];
    this.each(elem => {
      const parent = elem.parentNode;
      if (parent && parent.nodeType !== 11) {
        result = result.concat(parent);
      }
    });

    return $(result).filter(selector);
  }

  parents(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(dir(elem, 'parentNode'));
    });

    return $(result).filter(selector);
  }

  /**
   * filter - 过滤
   *
   * @param  {string|VE|HTMLElement} selector description
   * @return {type}          description
   */
  filter(selector) {
    if (!selector) return this;
    const result = [];
    if (selector instanceof VE) {
      this.each(elem => {
        selector.each(preElem => {
          elem === preElem && result.push(elem);
        });
      });
    } else if (selector.nodeType === 1) {
      this.each(elem => {
        elem === selector && result.push(elem);
      });
    } else if (typeof selector === 'string') {
      this.each(elem => {
        elem.matches && elem.matches(selector) && result.push(elem);
      });
    }
    return $(result);
  }

  index(selector) {
    // No argument, return index in parent
    if (!selector) {
      return (this[0] && this[0].parentNode) ? this.eq(0).prevAll().length : -1;
    }

    // index in selector
    if (typeof selector === 'string') {
      return [].indexOf.call($(selector), this[0]);
    }
  }

  hasClass(className = '') {
    className = className.trim();
    if (!className) return false;
    const elem = this.get(0);
    if (!elem) return false;
    const classList = (elem.className ? elem.className.split(/\s/) : [])
      .filter(item => {
        return !!item.trim();
      });
    return classList.includes(className);
  }

  toggleClass(className) {
    if (!className) return this;
    return this.each(elem => {
      const $elem = $(elem);
      if ($elem.hasClass(className)) {
        $elem.removeClass(className);
      } else {
        $elem.addClass(className);
      }
    });
  }

  addClass(className) {
    if (!className) return this;

    return this.each(elem => {
      if (elem.className) {
        const arr = elem.className.split(/\s/).filter(item => {
          return !!item.trim();
        });
        const newCls = className.split(/\s/).filter(item => {
          return !!item.trim();
        });

        newCls.forEach(cls => {
          cls = cls.trim();
          if (cls && arr.indexOf(cls) < 0) {
            arr.push(cls);
          }
        });

        elem.className = arr.join(' ');
      } else {
        elem.className = className;
      }
    });
  }


  removeClass(className) {
    if (!className) return this;

    return this.each(elem => {
      if (elem.className) {
        let arr = elem.className.split(/\s/);
        const delCls = className.split(/\s/).filter(item => {
          return !!item.trim();
        });
        arr = arr.filter(item => {
          item = item.trim();

          if (!item || delCls.includes(item)) {
            return false;
          }
          return true;
        });

        elem.className = arr.join(' ');
      }
    });
  }

  css(key, val) {
    if (typeof key === 'object') {
      /* json格式 */
      return this.each(elem => {
        for (const name in key) {
          const styleName = formatStyleName(name);
          elem.style[styleName] = key[name];
        }
      });
    } else if (val === undefined) {
      const styleName = formatStyleName(key);
      const elem = this.get(0);
      if (elem) {
        const style = document.defaultView.getComputedStyle(elem, null);
        return styleName ? style[styleName] : style;
      }
      return '';
    } else if (typeof key === 'string') {
      const styleName = formatStyleName(key);
      return this.each(elem => {
        elem.style[styleName] = val;
      });
    }
  }

  /* 显示 */
  show() {
    return this.css('display', 'block');
  }

  /* 隐藏 */
  hide() {
    return this.css('display', 'none');
  }

  /* 元素内部最前面添加一个节点 */
  prepend($children) {
    $children = $($children);
    return this.each(target => {
      $children.each(child => {
        target.insertBefore(child, target.firstChild);
      });
    });
  }

  /* 增加子节点 */
  append($children) {
    $children = $($children);
    return this.each(target => {
      $children.each(child => {
        target.appendChild(child);
      });
    });
  }

  /* 元素后面添加一个节点 */
  after($ele) {
    const ele = $($ele)[0];
    if (!ele) return;
    return this.each(target => {
      target.parentNode.insertBefore(ele, target.nextElementSibling);
    });
  }

  /* 元素前面添加一个节点 */
  before($ele) {
    const ele = $($ele)[0];
    if (!ele) return;
    return this.each(target => {
      target.parentNode.insertBefore(ele, target);
    });
  }

  /* 移除当前节点 */
  remove() {
    return this.each(elem => {
      if (elem.remove) {
        elem.remove();
      } else {
        const parent = elem.parentElement;
        parent && parent.removeChild(elem);
      }
    });
  }

  find(selector) {
    let result = [];
    this.each(elem => {
      result = result.concat(querySelectorAll(selector, [elem]));
    });

    return $(result);
  }

  /* 获取当前元素的 text */
  text(val) {
    if (!val) {
      const elem = this[0];
      return elem.innerText;
    } else {
      return this.each(elem => {
        elem.innerText = val;
      });
    }
  }

  /* 获取 html */
  html(val) {
    if (val === undefined) {
      const elem = this[0];
      return elem.innerHTML;
    } else {
      return this.each(elem => {
        elem.innerHTML = val;
      });
    }
  }

  /* 获取 value */
  val(val) {
    if (!val) {
      const elem = this[0];
      return elem.value.trim();
    } else {
      return this.each(elem => {
        elem.value = val;
      });
    }
  }

  data(key, val) {
    key = formatStyleName(key);
    if (!val) {
      return this.get(0).dataset[key];
    } else {
      return this.each(elem => {
        elem.dataset[key] = val;
      });
    }
  }

  width() {
    const elem = this.get(0);
    if (elem) {
      return elem.offsetWidth;
    }
    return NaN;
    // return parseFloat(this.eq(0).css('width'));
  }

  height() {
    const elem = this.get(0);
    if (elem) {
      return elem.offsetHeight;
    }
    return NaN;
    // return parseFloat(this.eq(0).css('height'));
  }

  offset() {
    const elem = this.get(0);
    return {
      left: elem.offsetLeft,
      top: elem.offsetTop,
      width: elem.offsetWidth,
      height: elem.offsetHeight,
    };
  }
}

/**
 * formatStyleName - 将 background-color 变为backgroundColor
 *
 * @param  {string} name description
 * @return {string}      description
 */
function formatStyleName(name) {
  if (typeof name !== 'string') return name;
  return name.replace(/(-\w)/img, ($0, $1) => {
    return $1.replace('-', '').toUpperCase();
  });
}

function dir(elem, direction, until) {
  const matched = [];
  const truncate = until !== undefined;

  // eslint-disable-next-line no-cond-assign
  while ((elem = elem[direction]) && elem.nodeType !== 9) {
    if (elem.nodeType === 1) {
      if (truncate && $(elem).is(until)) {
        break;
      }
      matched.push(elem);
    }
  }
  return matched;
}

function sibling(first, elem) {
  const matched = [];

  for (; first; first = first.nextElementSibling) {
    if (first.nodeType === 1 && first !== elem) {
      matched.push(first);
    }
  }

  return matched;
}

function $(selector, scope) {
  return new VE(selector, scope);
}

$.inArray = function (value, array) {
  if (!value || !array || !Array.isArray(array)) return -1;
  return array.indexOf(value);
};

!window.$ && (window.$ = $);

export default $;
