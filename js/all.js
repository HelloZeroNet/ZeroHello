
/* ---- lib/Class.coffee ---- */


(function() {
  var Class,
    slice = [].slice;

  Class = (function() {
    function Class() {}

    Class.prototype.trace = true;

    Class.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (!this.trace) {
        return;
      }
      if (typeof console === 'undefined') {
        return;
      }
      args.unshift("[" + this.constructor.name + "]");
      console.log.apply(console, args);
      return this;
    };

    Class.prototype.logStart = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!this.trace) {
        return;
      }
      this.logtimers || (this.logtimers = {});
      this.logtimers[name] = +(new Date);
      if (args.length > 0) {
        this.log.apply(this, ["" + name].concat(slice.call(args), ["(started)"]));
      }
      return this;
    };

    Class.prototype.logEnd = function() {
      var args, ms, name;
      name = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      ms = +(new Date) - this.logtimers[name];
      this.log.apply(this, ["" + name].concat(slice.call(args), ["(Done in " + ms + "ms)"]));
      return this;
    };

    return Class;

  })();

  window.Class = Class;

}).call(this);

/* ---- lib/Promise.coffee ---- */


(function() {
  var Promise,
    slice = [].slice;

  Promise = (function() {
    Promise.when = function() {
      var args, fn, i, len, num_uncompleted, promise, task, task_id, tasks;
      tasks = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      num_uncompleted = tasks.length;
      args = new Array(num_uncompleted);
      promise = new Promise();
      fn = function(task_id) {
        return task.then(function() {
          args[task_id] = Array.prototype.slice.call(arguments);
          num_uncompleted--;
          if (num_uncompleted === 0) {
            return promise.complete.apply(promise, args);
          }
        });
      };
      for (task_id = i = 0, len = tasks.length; i < len; task_id = ++i) {
        task = tasks[task_id];
        fn(task_id);
      }
      return promise;
    };

    function Promise() {
      this.resolved = false;
      this.end_promise = null;
      this.result = null;
      this.callbacks = [];
    }

    Promise.prototype.resolve = function() {
      var back, callback, i, len, ref;
      if (this.resolved) {
        return false;
      }
      this.resolved = true;
      this.data = arguments;
      if (!arguments.length) {
        this.data = [true];
      }
      this.result = this.data[0];
      ref = this.callbacks;
      for (i = 0, len = ref.length; i < len; i++) {
        callback = ref[i];
        back = callback.apply(callback, this.data);
      }
      if (this.end_promise) {
        return this.end_promise.resolve(back);
      }
    };

    Promise.prototype.fail = function() {
      return this.resolve(false);
    };

    Promise.prototype.then = function(callback) {
      if (this.resolved === true) {
        callback.apply(callback, this.data);
        return;
      }
      this.callbacks.push(callback);
      return this.end_promise = new Promise();
    };

    return Promise;

  })();

  window.Promise = Promise;


  /*
  s = Date.now()
  log = (text) ->
  	console.log Date.now()-s, Array.prototype.slice.call(arguments).join(", ")
  
  log "Started"
  
  cmd = (query) ->
  	p = new Promise()
  	setTimeout ( ->
  		p.resolve query+" Result"
  	), 100
  	return p
  
  back = cmd("SELECT * FROM message").then (res) ->
  	log res
  	return "Return from query"
  .then (res) ->
  	log "Back then", res
  
  log "Query started", back
   */

}).call(this);

/* ---- lib/Property.coffee ---- */


(function() {
  Function.prototype.property = function(prop, desc) {
    return Object.defineProperty(this.prototype, prop, desc);
  };

}).call(this);

/* ---- lib/Prototypes.coffee ---- */


(function() {
  String.prototype.startsWith = function(s) {
    return this.slice(0, s.length) === s;
  };

  String.prototype.endsWith = function(s) {
    return s === '' || this.slice(-s.length) === s;
  };

  String.prototype.repeat = function(count) {
    return new Array(count + 1).join(this);
  };

  window.isEmpty = function(obj) {
    var key;
    for (key in obj) {
      return false;
    }
    return true;
  };

}).call(this);

/* ---- lib/maquette.js ---- */


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory(root.maquette = {});
    }
}(this, function (exports) {
    'use strict';
    ;
    ;
    ;
    ;
    var NAMESPACE_W3 = 'http://www.w3.org/';
    var NAMESPACE_SVG = NAMESPACE_W3 + '2000/svg';
    var NAMESPACE_XLINK = NAMESPACE_W3 + '1999/xlink';
    // Utilities
    var emptyArray = [];
    var extend = function (base, overrides) {
        var result = {};
        Object.keys(base).forEach(function (key) {
            result[key] = base[key];
        });
        if (overrides) {
            Object.keys(overrides).forEach(function (key) {
                result[key] = overrides[key];
            });
        }
        return result;
    };
    // Hyperscript helper functions
    var same = function (vnode1, vnode2) {
        if (vnode1.vnodeSelector !== vnode2.vnodeSelector) {
            return false;
        }
        if (vnode1.properties && vnode2.properties) {
            if (vnode1.properties.key !== vnode2.properties.key) {
                return false;
            }
            return vnode1.properties.bind === vnode2.properties.bind;
        }
        return !vnode1.properties && !vnode2.properties;
    };
    var toTextVNode = function (data) {
        return {
            vnodeSelector: '',
            properties: undefined,
            children: undefined,
            text: data.toString(),
            domNode: null
        };
    };
    var appendChildren = function (parentSelector, insertions, main) {
        for (var i = 0; i < insertions.length; i++) {
            var item = insertions[i];
            if (Array.isArray(item)) {
                appendChildren(parentSelector, item, main);
            } else {
                if (item !== null && item !== undefined) {
                    if (!item.hasOwnProperty('vnodeSelector')) {
                        item = toTextVNode(item);
                    }
                    main.push(item);
                }
            }
        }
    };
    // Render helper functions
    var missingTransition = function () {
        throw new Error('Provide a transitions object to the projectionOptions to do animations');
    };
    var DEFAULT_PROJECTION_OPTIONS = {
        namespace: undefined,
        eventHandlerInterceptor: undefined,
        styleApplyer: function (domNode, styleName, value) {
            // Provides a hook to add vendor prefixes for browsers that still need it.
            domNode.style[styleName] = value;
        },
        transitions: {
            enter: missingTransition,
            exit: missingTransition
        }
    };
    var applyDefaultProjectionOptions = function (projectorOptions) {
        return extend(DEFAULT_PROJECTION_OPTIONS, projectorOptions);
    };
    var checkStyleValue = function (styleValue) {
        if (typeof styleValue !== 'string') {
            throw new Error('Style values must be strings');
        }
    };
    var setProperties = function (domNode, properties, projectionOptions) {
        if (!properties) {
            return;
        }
        var eventHandlerInterceptor = projectionOptions.eventHandlerInterceptor;
        var propNames = Object.keys(properties);
        var propCount = propNames.length;
        for (var i = 0; i < propCount; i++) {
            var propName = propNames[i];
            /* tslint:disable:no-var-keyword: edge case */
            var propValue = properties[propName];
            /* tslint:enable:no-var-keyword */
            if (propName === 'className') {
                throw new Error('Property "className" is not supported, use "class".');
            } else if (propName === 'class') {
                if (domNode.className) {
                    // May happen if classes is specified before class
                    domNode.className += ' ' + propValue;
                } else {
                    domNode.className = propValue;
                }
            } else if (propName === 'classes') {
                // object with string keys and boolean values
                var classNames = Object.keys(propValue);
                var classNameCount = classNames.length;
                for (var j = 0; j < classNameCount; j++) {
                    var className = classNames[j];
                    if (propValue[className]) {
                        domNode.classList.add(className);
                    }
                }
            } else if (propName === 'styles') {
                // object with string keys and string (!) values
                var styleNames = Object.keys(propValue);
                var styleCount = styleNames.length;
                for (var j = 0; j < styleCount; j++) {
                    var styleName = styleNames[j];
                    var styleValue = propValue[styleName];
                    if (styleValue) {
                        checkStyleValue(styleValue);
                        projectionOptions.styleApplyer(domNode, styleName, styleValue);
                    }
                }
            } else if (propName === 'key') {
                continue;
            } else if (propValue === null || propValue === undefined) {
                continue;
            } else {
                var type = typeof propValue;
                if (type === 'function') {
                    if (propName.lastIndexOf('on', 0) === 0) {
                        if (eventHandlerInterceptor) {
                            propValue = eventHandlerInterceptor(propName, propValue, domNode, properties);    // intercept eventhandlers
                        }
                        if (propName === 'oninput') {
                            (function () {
                                // record the evt.target.value, because IE and Edge sometimes do a requestAnimationFrame between changing value and running oninput
                                var oldPropValue = propValue;
                                propValue = function (evt) {
                                    evt.target['oninput-value'] = evt.target.value;
                                    // may be HTMLTextAreaElement as well
                                    oldPropValue.apply(this, [evt]);
                                };
                            }());
                        }
                        domNode[propName] = propValue;
                    }
                } else if (type === 'string' && propName !== 'value' && propName !== 'innerHTML') {
                    if (projectionOptions.namespace === NAMESPACE_SVG && propName === 'href') {
                        domNode.setAttributeNS(NAMESPACE_XLINK, propName, propValue);
                    } else {
                        domNode.setAttribute(propName, propValue);
                    }
                } else {
                    domNode[propName] = propValue;
                }
            }
        }
    };
    var updateProperties = function (domNode, previousProperties, properties, projectionOptions) {
        if (!properties) {
            return;
        }
        var propertiesUpdated = false;
        var propNames = Object.keys(properties);
        var propCount = propNames.length;
        for (var i = 0; i < propCount; i++) {
            var propName = propNames[i];
            // assuming that properties will be nullified instead of missing is by design
            var propValue = properties[propName];
            var previousValue = previousProperties[propName];
            if (propName === 'class') {
                if (previousValue !== propValue) {
                    throw new Error('"class" property may not be updated. Use the "classes" property for conditional css classes.');
                }
            } else if (propName === 'classes') {
                var classList = domNode.classList;
                var classNames = Object.keys(propValue);
                var classNameCount = classNames.length;
                for (var j = 0; j < classNameCount; j++) {
                    var className = classNames[j];
                    var on = !!propValue[className];
                    var previousOn = !!previousValue[className];
                    if (on === previousOn) {
                        continue;
                    }
                    propertiesUpdated = true;
                    if (on) {
                        classList.add(className);
                    } else {
                        classList.remove(className);
                    }
                }
            } else if (propName === 'styles') {
                var styleNames = Object.keys(propValue);
                var styleCount = styleNames.length;
                for (var j = 0; j < styleCount; j++) {
                    var styleName = styleNames[j];
                    var newStyleValue = propValue[styleName];
                    var oldStyleValue = previousValue[styleName];
                    if (newStyleValue === oldStyleValue) {
                        continue;
                    }
                    propertiesUpdated = true;
                    if (newStyleValue) {
                        checkStyleValue(newStyleValue);
                        projectionOptions.styleApplyer(domNode, styleName, newStyleValue);
                    } else {
                        projectionOptions.styleApplyer(domNode, styleName, '');
                    }
                }
            } else {
                if (!propValue && typeof previousValue === 'string') {
                    propValue = '';
                }
                if (propName === 'value') {
                    if (domNode[propName] !== propValue && domNode['oninput-value'] !== propValue) {
                        domNode[propName] = propValue;
                        // Reset the value, even if the virtual DOM did not change
                        domNode['oninput-value'] = undefined;
                    }
                    // else do not update the domNode, otherwise the cursor position would be changed
                    if (propValue !== previousValue) {
                        propertiesUpdated = true;
                    }
                } else if (propValue !== previousValue) {
                    var type = typeof propValue;
                    if (type === 'function') {
                        throw new Error('Functions may not be updated on subsequent renders (property: ' + propName + '). Hint: declare event handler functions outside the render() function.');
                    }
                    if (type === 'string' && propName !== 'innerHTML') {
                        if (projectionOptions.namespace === NAMESPACE_SVG && propName === 'href') {
                            domNode.setAttributeNS(NAMESPACE_XLINK, propName, propValue);
                        } else {
                            domNode.setAttribute(propName, propValue);
                        }
                    } else {
                        if (domNode[propName] !== propValue) {
                            domNode[propName] = propValue;
                        }
                    }
                    propertiesUpdated = true;
                }
            }
        }
        return propertiesUpdated;
    };
    var findIndexOfChild = function (children, sameAs, start) {
        if (sameAs.vnodeSelector !== '') {
            // Never scan for text-nodes
            for (var i = start; i < children.length; i++) {
                if (same(children[i], sameAs)) {
                    return i;
                }
            }
        }
        return -1;
    };
    var nodeAdded = function (vNode, transitions) {
        if (vNode.properties) {
            var enterAnimation = vNode.properties.enterAnimation;
            if (enterAnimation) {
                if (typeof enterAnimation === 'function') {
                    enterAnimation(vNode.domNode, vNode.properties);
                } else {
                    transitions.enter(vNode.domNode, vNode.properties, enterAnimation);
                }
            }
        }
    };
    var nodeToRemove = function (vNode, transitions) {
        var domNode = vNode.domNode;
        if (vNode.properties) {
            var exitAnimation = vNode.properties.exitAnimation;
            if (exitAnimation) {
                domNode.style.pointerEvents = 'none';
                var removeDomNode = function () {
                    if (domNode.parentNode) {
                        domNode.parentNode.removeChild(domNode);
                    }
                };
                if (typeof exitAnimation === 'function') {
                    exitAnimation(domNode, removeDomNode, vNode.properties);
                    return;
                } else {
                    transitions.exit(vNode.domNode, vNode.properties, exitAnimation, removeDomNode);
                    return;
                }
            }
        }
        if (domNode.parentNode) {
            domNode.parentNode.removeChild(domNode);
        }
    };
    var checkDistinguishable = function (childNodes, indexToCheck, parentVNode, operation) {
        var childNode = childNodes[indexToCheck];
        if (childNode.vnodeSelector === '') {
            return;    // Text nodes need not be distinguishable
        }
        var properties = childNode.properties;
        var key = properties ? properties.key === undefined ? properties.bind : properties.key : undefined;
        if (!key) {
            for (var i = 0; i < childNodes.length; i++) {
                if (i !== indexToCheck) {
                    var node = childNodes[i];
                    if (same(node, childNode)) {
                        if (operation === 'added') {
                            throw new Error(parentVNode.vnodeSelector + ' had a ' + childNode.vnodeSelector + ' child ' + 'added, but there is now more than one. You must add unique key properties to make them distinguishable.');
                        } else {
                            throw new Error(parentVNode.vnodeSelector + ' had a ' + childNode.vnodeSelector + ' child ' + 'removed, but there were more than one. You must add unique key properties to make them distinguishable.');
                        }
                    }
                }
            }
        }
    };
    var createDom;
    var updateDom;
    var updateChildren = function (vnode, domNode, oldChildren, newChildren, projectionOptions) {
        if (oldChildren === newChildren) {
            return false;
        }
        oldChildren = oldChildren || emptyArray;
        newChildren = newChildren || emptyArray;
        var oldChildrenLength = oldChildren.length;
        var newChildrenLength = newChildren.length;
        var transitions = projectionOptions.transitions;
        var oldIndex = 0;
        var newIndex = 0;
        var i;
        var textUpdated = false;
        while (newIndex < newChildrenLength) {
            var oldChild = oldIndex < oldChildrenLength ? oldChildren[oldIndex] : undefined;
            var newChild = newChildren[newIndex];
            if (oldChild !== undefined && same(oldChild, newChild)) {
                textUpdated = updateDom(oldChild, newChild, projectionOptions) || textUpdated;
                oldIndex++;
            } else {
                var findOldIndex = findIndexOfChild(oldChildren, newChild, oldIndex + 1);
                if (findOldIndex >= 0) {
                    // Remove preceding missing children
                    for (i = oldIndex; i < findOldIndex; i++) {
                        nodeToRemove(oldChildren[i], transitions);
                        checkDistinguishable(oldChildren, i, vnode, 'removed');
                    }
                    textUpdated = updateDom(oldChildren[findOldIndex], newChild, projectionOptions) || textUpdated;
                    oldIndex = findOldIndex + 1;
                } else {
                    // New child
                    createDom(newChild, domNode, oldIndex < oldChildrenLength ? oldChildren[oldIndex].domNode : undefined, projectionOptions);
                    nodeAdded(newChild, transitions);
                    checkDistinguishable(newChildren, newIndex, vnode, 'added');
                }
            }
            newIndex++;
        }
        if (oldChildrenLength > oldIndex) {
            // Remove child fragments
            for (i = oldIndex; i < oldChildrenLength; i++) {
                nodeToRemove(oldChildren[i], transitions);
                checkDistinguishable(oldChildren, i, vnode, 'removed');
            }
        }
        return textUpdated;
    };
    var addChildren = function (domNode, children, projectionOptions) {
        if (!children) {
            return;
        }
        for (var i = 0; i < children.length; i++) {
            createDom(children[i], domNode, undefined, projectionOptions);
        }
    };
    var initPropertiesAndChildren = function (domNode, vnode, projectionOptions) {
        addChildren(domNode, vnode.children, projectionOptions);
        // children before properties, needed for value property of <select>.
        if (vnode.text) {
            domNode.textContent = vnode.text;
        }
        setProperties(domNode, vnode.properties, projectionOptions);
        if (vnode.properties && vnode.properties.afterCreate) {
            vnode.properties.afterCreate(domNode, projectionOptions, vnode.vnodeSelector, vnode.properties, vnode.children);
        }
    };
    createDom = function (vnode, parentNode, insertBefore, projectionOptions) {
        var domNode, i, c, start = 0, type, found;
        var vnodeSelector = vnode.vnodeSelector;
        if (vnodeSelector === '') {
            domNode = vnode.domNode = document.createTextNode(vnode.text);
            if (insertBefore !== undefined) {
                parentNode.insertBefore(domNode, insertBefore);
            } else {
                parentNode.appendChild(domNode);
            }
        } else {
            for (i = 0; i <= vnodeSelector.length; ++i) {
                c = vnodeSelector.charAt(i);
                if (i === vnodeSelector.length || c === '.' || c === '#') {
                    type = vnodeSelector.charAt(start - 1);
                    found = vnodeSelector.slice(start, i);
                    if (type === '.') {
                        domNode.classList.add(found);
                    } else if (type === '#') {
                        domNode.id = found;
                    } else {
                        if (found === 'svg') {
                            projectionOptions = extend(projectionOptions, { namespace: NAMESPACE_SVG });
                        }
                        if (projectionOptions.namespace !== undefined) {
                            domNode = vnode.domNode = document.createElementNS(projectionOptions.namespace, found);
                        } else {
                            domNode = vnode.domNode = document.createElement(found);
                        }
                        if (insertBefore !== undefined) {
                            parentNode.insertBefore(domNode, insertBefore);
                        } else {
                            parentNode.appendChild(domNode);
                        }
                    }
                    start = i + 1;
                }
            }
            initPropertiesAndChildren(domNode, vnode, projectionOptions);
        }
    };
    updateDom = function (previous, vnode, projectionOptions) {
        var domNode = previous.domNode;
        var textUpdated = false;
        if (previous === vnode) {
            return false;    // By contract, VNode objects may not be modified anymore after passing them to maquette
        }
        var updated = false;
        if (vnode.vnodeSelector === '') {
            if (vnode.text !== previous.text) {
                var newVNode = document.createTextNode(vnode.text);
                domNode.parentNode.replaceChild(newVNode, domNode);
                vnode.domNode = newVNode;
                textUpdated = true;
                return textUpdated;
            }
        } else {
            if (vnode.vnodeSelector.lastIndexOf('svg', 0) === 0) {
                projectionOptions = extend(projectionOptions, { namespace: NAMESPACE_SVG });
            }
            if (previous.text !== vnode.text) {
                updated = true;
                if (vnode.text === undefined) {
                    domNode.removeChild(domNode.firstChild);    // the only textnode presumably
                } else {
                    domNode.textContent = vnode.text;
                }
            }
            updated = updateChildren(vnode, domNode, previous.children, vnode.children, projectionOptions) || updated;
            updated = updateProperties(domNode, previous.properties, vnode.properties, projectionOptions) || updated;
            if (vnode.properties && vnode.properties.afterUpdate) {
                vnode.properties.afterUpdate(domNode, projectionOptions, vnode.vnodeSelector, vnode.properties, vnode.children);
            }
        }
        if (updated && vnode.properties && vnode.properties.updateAnimation) {
            vnode.properties.updateAnimation(domNode, vnode.properties, previous.properties);
        }
        vnode.domNode = previous.domNode;
        return textUpdated;
    };
    var createProjection = function (vnode, projectionOptions) {
        return {
            update: function (updatedVnode) {
                if (vnode.vnodeSelector !== updatedVnode.vnodeSelector) {
                    throw new Error('The selector for the root VNode may not be changed. (consider using dom.merge and add one extra level to the virtual DOM)');
                }
                updateDom(vnode, updatedVnode, projectionOptions);
                vnode = updatedVnode;
            },
            domNode: vnode.domNode
        };
    };
    ;
    // The other two parameters are not added here, because the Typescript compiler creates surrogate code for desctructuring 'children'.
    exports.h = function (selector) {
        var properties = arguments[1];
        if (typeof selector !== 'string') {
            throw new Error();
        }
        var childIndex = 1;
        if (properties && !properties.hasOwnProperty('vnodeSelector') && !Array.isArray(properties) && typeof properties === 'object') {
            childIndex = 2;
        } else {
            // Optional properties argument was omitted
            properties = undefined;
        }
        var text = undefined;
        var children = undefined;
        var argsLength = arguments.length;
        // Recognize a common special case where there is only a single text node
        if (argsLength === childIndex + 1) {
            var onlyChild = arguments[childIndex];
            if (typeof onlyChild === 'string') {
                text = onlyChild;
            } else if (onlyChild !== undefined && onlyChild.length === 1 && typeof onlyChild[0] === 'string') {
                text = onlyChild[0];
            }
        }
        if (text === undefined) {
            children = [];
            for (; childIndex < arguments.length; childIndex++) {
                var child = arguments[childIndex];
                if (child === null || child === undefined) {
                    continue;
                } else if (Array.isArray(child)) {
                    appendChildren(selector, child, children);
                } else if (child.hasOwnProperty('vnodeSelector')) {
                    children.push(child);
                } else {
                    children.push(toTextVNode(child));
                }
            }
        }
        return {
            vnodeSelector: selector,
            properties: properties,
            children: children,
            text: text === '' ? undefined : text,
            domNode: null
        };
    };
    /**
 * Contains simple low-level utility functions to manipulate the real DOM.
 */
    exports.dom = {
        /**
     * Creates a real DOM tree from `vnode`. The [[Projection]] object returned will contain the resulting DOM Node in
     * its [[Projection.domNode|domNode]] property.
     * This is a low-level method. Users wil typically use a [[Projector]] instead.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]]
     * objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the projection.
     * @returns The [[Projection]] which also contains the DOM Node that was created.
     */
        create: function (vnode, projectionOptions) {
            projectionOptions = applyDefaultProjectionOptions(projectionOptions);
            createDom(vnode, document.createElement('div'), undefined, projectionOptions);
            return createProjection(vnode, projectionOptions);
        },
        /**
     * Appends a new childnode to the DOM which is generated from a [[VNode]].
     * This is a low-level method. Users wil typically use a [[Projector]] instead.
     * @param parentNode - The parent node for the new childNode.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]]
     * objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the [[Projection]].
     * @returns The [[Projection]] that was created.
     */
        append: function (parentNode, vnode, projectionOptions) {
            projectionOptions = applyDefaultProjectionOptions(projectionOptions);
            createDom(vnode, parentNode, undefined, projectionOptions);
            return createProjection(vnode, projectionOptions);
        },
        /**
     * Inserts a new DOM node which is generated from a [[VNode]].
     * This is a low-level method. Users wil typically use a [[Projector]] instead.
     * @param beforeNode - The node that the DOM Node is inserted before.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function.
     * NOTE: [[VNode]] objects may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the projection, see [[createProjector]].
     * @returns The [[Projection]] that was created.
     */
        insertBefore: function (beforeNode, vnode, projectionOptions) {
            projectionOptions = applyDefaultProjectionOptions(projectionOptions);
            createDom(vnode, beforeNode.parentNode, beforeNode, projectionOptions);
            return createProjection(vnode, projectionOptions);
        },
        /**
     * Merges a new DOM node which is generated from a [[VNode]] with an existing DOM Node.
     * This means that the virtual DOM and the real DOM will have one overlapping element.
     * Therefore the selector for the root [[VNode]] will be ignored, but its properties and children will be applied to the Element provided.
     * This is a low-level method. Users wil typically use a [[Projector]] instead.
     * @param domNode - The existing element to adopt as the root of the new virtual DOM. Existing attributes and childnodes are preserved.
     * @param vnode - The root of the virtual DOM tree that was created using the [[h]] function. NOTE: [[VNode]] objects
     * may only be rendered once.
     * @param projectionOptions - Options to be used to create and update the projection, see [[createProjector]].
     * @returns The [[Projection]] that was created.
     */
        merge: function (element, vnode, projectionOptions) {
            projectionOptions = applyDefaultProjectionOptions(projectionOptions);
            vnode.domNode = element;
            initPropertiesAndChildren(element, vnode, projectionOptions);
            return createProjection(vnode, projectionOptions);
        }
    };
    /**
 * Creates a [[CalculationCache]] object, useful for caching [[VNode]] trees.
 * In practice, caching of [[VNode]] trees is not needed, because achieving 60 frames per second is almost never a problem.
 * For more information, see [[CalculationCache]].
 *
 * @param <Result> The type of the value that is cached.
 */
    exports.createCache = function () {
        var cachedInputs = undefined;
        var cachedOutcome = undefined;
        var result = {
            invalidate: function () {
                cachedOutcome = undefined;
                cachedInputs = undefined;
            },
            result: function (inputs, calculation) {
                if (cachedInputs) {
                    for (var i = 0; i < inputs.length; i++) {
                        if (cachedInputs[i] !== inputs[i]) {
                            cachedOutcome = undefined;
                        }
                    }
                }
                if (!cachedOutcome) {
                    cachedOutcome = calculation();
                    cachedInputs = inputs;
                }
                return cachedOutcome;
            }
        };
        return result;
    };
    /**
 * Creates a {@link Mapping} instance that keeps an array of result objects synchronized with an array of source objects.
 * See {@link http://maquettejs.org/docs/arrays.html|Working with arrays}.
 *
 * @param <Source>       The type of source items. A database-record for instance.
 * @param <Target>       The type of target items. A [[Component]] for instance.
 * @param getSourceKey   `function(source)` that must return a key to identify each source object. The result must either be a string or a number.
 * @param createResult   `function(source, index)` that must create a new result object from a given source. This function is identical
 *                       to the `callback` argument in `Array.map(callback)`.
 * @param updateResult   `function(source, target, index)` that updates a result to an updated source.
 */
    exports.createMapping = function (getSourceKey, createResult, updateResult) {
        var keys = [];
        var results = [];
        return {
            results: results,
            map: function (newSources) {
                var newKeys = newSources.map(getSourceKey);
                var oldTargets = results.slice();
                var oldIndex = 0;
                for (var i = 0; i < newSources.length; i++) {
                    var source = newSources[i];
                    var sourceKey = newKeys[i];
                    if (sourceKey === keys[oldIndex]) {
                        results[i] = oldTargets[oldIndex];
                        updateResult(source, oldTargets[oldIndex], i);
                        oldIndex++;
                    } else {
                        var found = false;
                        for (var j = 1; j < keys.length; j++) {
                            var searchIndex = (oldIndex + j) % keys.length;
                            if (keys[searchIndex] === sourceKey) {
                                results[i] = oldTargets[searchIndex];
                                updateResult(newSources[i], oldTargets[searchIndex], i);
                                oldIndex = searchIndex + 1;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            results[i] = createResult(source, i);
                        }
                    }
                }
                results.length = newSources.length;
                keys = newKeys;
            }
        };
    };
    /**
 * Creates a [[Projector]] instance using the provided projectionOptions.
 *
 * For more information, see [[Projector]].
 *
 * @param projectionOptions   Options that influence how the DOM is rendered and updated.
 */
    exports.createProjector = function (projectorOptions) {
        var projector;
        var projectionOptions = applyDefaultProjectionOptions(projectorOptions);
        projectionOptions.eventHandlerInterceptor = function (propertyName, eventHandler, domNode, properties) {
            return function () {
                // intercept function calls (event handlers) to do a render afterwards.
                projector.scheduleRender();
                return eventHandler.apply(properties.bind || this, arguments);
            };
        };
        var renderCompleted = true;
        var scheduled;
        var stopped = false;
        var projections = [];
        var renderFunctions = [];
        // matches the projections array
        var doRender = function () {
            scheduled = undefined;
            if (!renderCompleted) {
                return;    // The last render threw an error, it should be logged in the browser console.
            }
            renderCompleted = false;
            for (var i = 0; i < projections.length; i++) {
                var updatedVnode = renderFunctions[i]();
                projections[i].update(updatedVnode);
            }
            renderCompleted = true;
        };
        projector = {
            scheduleRender: function () {
                if (!scheduled && !stopped) {
                    scheduled = requestAnimationFrame(doRender);
                }
            },
            stop: function () {
                if (scheduled) {
                    cancelAnimationFrame(scheduled);
                    scheduled = undefined;
                }
                stopped = true;
            },
            resume: function () {
                stopped = false;
                renderCompleted = true;
                projector.scheduleRender();
            },
            append: function (parentNode, renderMaquetteFunction) {
                projections.push(exports.dom.append(parentNode, renderMaquetteFunction(), projectionOptions));
                renderFunctions.push(renderMaquetteFunction);
            },
            insertBefore: function (beforeNode, renderMaquetteFunction) {
                projections.push(exports.dom.insertBefore(beforeNode, renderMaquetteFunction(), projectionOptions));
                renderFunctions.push(renderMaquetteFunction);
            },
            merge: function (domNode, renderMaquetteFunction) {
                projections.push(exports.dom.merge(domNode, renderMaquetteFunction(), projectionOptions));
                renderFunctions.push(renderMaquetteFunction);
            },
            replace: function (domNode, renderMaquetteFunction) {
                var vnode = renderMaquetteFunction();
                createDom(vnode, domNode.parentNode, domNode, projectionOptions);
                domNode.parentNode.removeChild(domNode);
                projections.push(createProjection(vnode, projectionOptions));
                renderFunctions.push(renderMaquetteFunction);
            },
            detach: function (renderMaquetteFunction) {
                for (var i = 0; i < renderFunctions.length; i++) {
                    if (renderFunctions[i] === renderMaquetteFunction) {
                        renderFunctions.splice(i, 1);
                        return projections.splice(i, 1)[0];
                    }
                }
                throw new Error('renderMaquetteFunction was not found');
            }
        };
        return projector;
    };
}));


/* ---- lib/marked.min.js ---- */


/**
 * marked - a markdown parser
 * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */
(function(){var block={newline:/^\n+/,code:/^( {4}[^\n]+\n*)+/,fences:noop,hr:/^( *[-*_]){3,} *(?:\n+|$)/,heading:/^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,nptable:noop,lheading:/^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,blockquote:/^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,list:/^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,html:/^ *(?:comment|closed|closing) *(?:\n{2,}|\s*$)/,def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,table:noop,paragraph:/^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,text:/^[^\n]+/};block.bullet=/(?:[*+-]|\d+\.)/;block.item=/^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;block.item=replace(block.item,"gm")(/bull/g,block.bullet)();block.list=replace(block.list)(/bull/g,block.bullet)("hr","\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))")("def","\\n+(?="+block.def.source+")")();block.blockquote=replace(block.blockquote)("def",block.def)();block._tag="(?!(?:"+"a|em|strong|small|s|cite|q|dfn|abbr|data|time|code"+"|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo"+"|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b";block.html=replace(block.html)("comment",/<!--[\s\S]*?-->/)("closed",/<(tag)[\s\S]+?<\/\1>/)("closing",/<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)(/tag/g,block._tag)();block.paragraph=replace(block.paragraph)("hr",block.hr)("heading",block.heading)("lheading",block.lheading)("blockquote",block.blockquote)("tag","<"+block._tag)("def",block.def)();block.normal=merge({},block);block.gfm=merge({},block.normal,{fences:/^ *(`{3,}|~{3,}) *(\S+)? *\n([\s\S]+?)\s*\1 *(?:\n+|$)/,paragraph:/^/});block.gfm.paragraph=replace(block.paragraph)("(?!","(?!"+block.gfm.fences.source.replace("\\1","\\2")+"|"+block.list.source.replace("\\1","\\3")+"|")();block.tables=merge({},block.gfm,{nptable:/^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,table:/^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/});function Lexer(options){this.tokens=[];this.tokens.links={};this.options=options||marked.defaults;this.rules=block.normal;if(this.options.gfm){if(this.options.tables){this.rules=block.tables}else{this.rules=block.gfm}}}Lexer.rules=block;Lexer.lex=function(src,options){var lexer=new Lexer(options);return lexer.lex(src)};Lexer.prototype.lex=function(src){src=src.replace(/\r\n|\r/g,"\n").replace(/\t/g,"    ").replace(/\u00a0/g," ").replace(/\u2424/g,"\n");return this.token(src,true)};Lexer.prototype.token=function(src,top,bq){var src=src.replace(/^ +$/gm,""),next,loose,cap,bull,b,item,space,i,l;while(src){if(cap=this.rules.newline.exec(src)){src=src.substring(cap[0].length);if(cap[0].length>1){this.tokens.push({type:"space"})}}if(cap=this.rules.code.exec(src)){src=src.substring(cap[0].length);cap=cap[0].replace(/^ {4}/gm,"");this.tokens.push({type:"code",text:!this.options.pedantic?cap.replace(/\n+$/,""):cap});continue}if(cap=this.rules.fences.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"code",lang:cap[2],text:cap[3]});continue}if(cap=this.rules.heading.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"heading",depth:cap[1].length,text:cap[2]});continue}if(top&&(cap=this.rules.nptable.exec(src))){src=src.substring(cap[0].length);item={type:"table",header:cap[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:cap[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:cap[3].replace(/\n$/,"").split("\n")};for(i=0;i<item.align.length;i++){if(/^ *-+: *$/.test(item.align[i])){item.align[i]="right"}else if(/^ *:-+: *$/.test(item.align[i])){item.align[i]="center"}else if(/^ *:-+ *$/.test(item.align[i])){item.align[i]="left"}else{item.align[i]=null}}for(i=0;i<item.cells.length;i++){item.cells[i]=item.cells[i].split(/ *\| */)}this.tokens.push(item);continue}if(cap=this.rules.lheading.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"heading",depth:cap[2]==="="?1:2,text:cap[1]});continue}if(cap=this.rules.hr.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"hr"});continue}if(cap=this.rules.blockquote.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"blockquote_start"});cap=cap[0].replace(/^ *> ?/gm,"");this.token(cap,top,true);this.tokens.push({type:"blockquote_end"});continue}if(cap=this.rules.list.exec(src)){src=src.substring(cap[0].length);bull=cap[2];this.tokens.push({type:"list_start",ordered:bull.length>1});cap=cap[0].match(this.rules.item);next=false;l=cap.length;i=0;for(;i<l;i++){item=cap[i];space=item.length;item=item.replace(/^ *([*+-]|\d+\.) +/,"");if(~item.indexOf("\n ")){space-=item.length;item=!this.options.pedantic?item.replace(new RegExp("^ {1,"+space+"}","gm"),""):item.replace(/^ {1,4}/gm,"")}if(this.options.smartLists&&i!==l-1){b=block.bullet.exec(cap[i+1])[0];if(bull!==b&&!(bull.length>1&&b.length>1)){src=cap.slice(i+1).join("\n")+src;i=l-1}}loose=next||/\n\n(?!\s*$)/.test(item);if(i!==l-1){next=item.charAt(item.length-1)==="\n";if(!loose)loose=next}this.tokens.push({type:loose?"loose_item_start":"list_item_start"});this.token(item,false,bq);this.tokens.push({type:"list_item_end"})}this.tokens.push({type:"list_end"});continue}if(cap=this.rules.html.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:this.options.sanitize?"paragraph":"html",pre:cap[1]==="pre"||cap[1]==="script"||cap[1]==="style",text:cap[0]});continue}if(!bq&&top&&(cap=this.rules.def.exec(src))){src=src.substring(cap[0].length);this.tokens.links[cap[1].toLowerCase()]={href:cap[2],title:cap[3]};continue}if(top&&(cap=this.rules.table.exec(src))){src=src.substring(cap[0].length);item={type:"table",header:cap[1].replace(/^ *| *\| *$/g,"").split(/ *\| */),align:cap[2].replace(/^ *|\| *$/g,"").split(/ *\| */),cells:cap[3].replace(/(?: *\| *)?\n$/,"").split("\n")};for(i=0;i<item.align.length;i++){if(/^ *-+: *$/.test(item.align[i])){item.align[i]="right"}else if(/^ *:-+: *$/.test(item.align[i])){item.align[i]="center"}else if(/^ *:-+ *$/.test(item.align[i])){item.align[i]="left"}else{item.align[i]=null}}for(i=0;i<item.cells.length;i++){item.cells[i]=item.cells[i].replace(/^ *\| *| *\| *$/g,"").split(/ *\| */)}this.tokens.push(item);continue}if(top&&(cap=this.rules.paragraph.exec(src))){src=src.substring(cap[0].length);this.tokens.push({type:"paragraph",text:cap[1].charAt(cap[1].length-1)==="\n"?cap[1].slice(0,-1):cap[1]});continue}if(cap=this.rules.text.exec(src)){src=src.substring(cap[0].length);this.tokens.push({type:"text",text:cap[0]});continue}if(src){throw new Error("Infinite loop on byte: "+src.charCodeAt(0))}}return this.tokens};var inline={escape:/^\\([\\`*{}\[\]()#+\-.!_>])/,autolink:/^<([^ >]+(@|:\/)[^ >]+)>/,url:noop,tag:/^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^'">])*?>/,link:/^!?\[(inside)\]\(href\)/,reflink:/^!?\[(inside)\]\s*\[([^\]]*)\]/,nolink:/^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,strong:/^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,em:/^\b_((?:__|[\s\S])+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,code:/^(`+)\s*([\s\S]*?[^`])\s*\1(?!`)/,br:/^ {2,}\n(?!\s*$)/,del:noop,text:/^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/};inline._inside=/(?:\[[^\]]*\]|[^\[\]]|\](?=[^\[]*\]))*/;inline._href=/\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;inline.link=replace(inline.link)("inside",inline._inside)("href",inline._href)();inline.reflink=replace(inline.reflink)("inside",inline._inside)();inline.normal=merge({},inline);inline.pedantic=merge({},inline.normal,{strong:/^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,em:/^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/});inline.gfm=merge({},inline.normal,{escape:replace(inline.escape)("])","~|])")(),url:/^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,del:/^~~(?=\S)([\s\S]*?\S)~~/,text:replace(inline.text)("]|","~]|")("|","|https?://|")()});inline.breaks=merge({},inline.gfm,{br:replace(inline.br)("{2,}","*")(),text:replace(inline.gfm.text)("{2,}","*")()});function InlineLexer(links,options){this.options=options||marked.defaults;this.links=links;this.rules=inline.normal;this.renderer=this.options.renderer||new Renderer;this.renderer.options=this.options;if(!this.links){throw new Error("Tokens array requires a `links` property.")}if(this.options.gfm){if(this.options.breaks){this.rules=inline.breaks}else{this.rules=inline.gfm}}else if(this.options.pedantic){this.rules=inline.pedantic}}InlineLexer.rules=inline;InlineLexer.output=function(src,links,options){var inline=new InlineLexer(links,options);return inline.output(src)};InlineLexer.prototype.output=function(src){var out="",link,text,href,cap;while(src){if(cap=this.rules.escape.exec(src)){src=src.substring(cap[0].length);out+=cap[1];continue}if(cap=this.rules.autolink.exec(src)){src=src.substring(cap[0].length);if(cap[2]==="@"){text=cap[1].charAt(6)===":"?this.mangle(cap[1].substring(7)):this.mangle(cap[1]);href=this.mangle("mailto:")+text}else{text=escape(cap[1]);href=text}out+=this.renderer.link(href,null,text);continue}if(!this.inLink&&(cap=this.rules.url.exec(src))){src=src.substring(cap[0].length);text=escape(cap[1]);href=text;out+=this.renderer.link(href,null,text);continue}if(cap=this.rules.tag.exec(src)){if(!this.inLink&&/^<a /i.test(cap[0])){this.inLink=true}else if(this.inLink&&/^<\/a>/i.test(cap[0])){this.inLink=false}src=src.substring(cap[0].length);out+=this.options.sanitize?escape(cap[0]):cap[0];continue}if(cap=this.rules.link.exec(src)){src=src.substring(cap[0].length);this.inLink=true;out+=this.outputLink(cap,{href:cap[2],title:cap[3]});this.inLink=false;continue}if((cap=this.rules.reflink.exec(src))||(cap=this.rules.nolink.exec(src))){src=src.substring(cap[0].length);link=(cap[2]||cap[1]).replace(/\s+/g," ");link=this.links[link.toLowerCase()];if(!link||!link.href){out+=cap[0].charAt(0);src=cap[0].substring(1)+src;continue}this.inLink=true;out+=this.outputLink(cap,link);this.inLink=false;continue}if(cap=this.rules.strong.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.strong(this.output(cap[2]||cap[1]));continue}if(cap=this.rules.em.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.em(this.output(cap[2]||cap[1]));continue}if(cap=this.rules.code.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.codespan(escape(cap[2],true));continue}if(cap=this.rules.br.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.br();continue}if(cap=this.rules.del.exec(src)){src=src.substring(cap[0].length);out+=this.renderer.del(this.output(cap[1]));continue}if(cap=this.rules.text.exec(src)){src=src.substring(cap[0].length);out+=escape(this.smartypants(cap[0]));continue}if(src){throw new Error("Infinite loop on byte: "+src.charCodeAt(0))}}return out};InlineLexer.prototype.outputLink=function(cap,link){var href=escape(link.href),title=link.title?escape(link.title):null;return cap[0].charAt(0)!=="!"?this.renderer.link(href,title,this.output(cap[1])):this.renderer.image(href,title,escape(cap[1]))};InlineLexer.prototype.smartypants=function(text){if(!this.options.smartypants)return text;return text.replace(/--/g,"—").replace(/(^|[-\u2014/(\[{"\s])'/g,"$1‘").replace(/'/g,"’").replace(/(^|[-\u2014/(\[{\u2018\s])"/g,"$1“").replace(/"/g,"”").replace(/\.{3}/g,"…")};InlineLexer.prototype.mangle=function(text){var out="",l=text.length,i=0,ch;for(;i<l;i++){ch=text.charCodeAt(i);if(Math.random()>.5){ch="x"+ch.toString(16)}out+="&#"+ch+";"}return out};function Renderer(options){this.options=options||{}}Renderer.prototype.code=function(code,lang,escaped){if(this.options.highlight){var out=this.options.highlight(code,lang);if(out!=null&&out!==code){escaped=true;code=out}}if(!lang){return"<pre><code>"+(escaped?code:escape(code,true))+"\n</code></pre>"}return'<pre><code class="'+this.options.langPrefix+escape(lang,true)+'">'+(escaped?code:escape(code,true))+"\n</code></pre>\n"};Renderer.prototype.blockquote=function(quote){return"<blockquote>\n"+quote+"</blockquote>\n"};Renderer.prototype.html=function(html){return html};Renderer.prototype.heading=function(text,level,raw){return"<h"+level+' id="'+this.options.headerPrefix+raw.toLowerCase().replace(/[^\w]+/g,"-")+'">'+text+"</h"+level+">\n"};Renderer.prototype.hr=function(){return this.options.xhtml?"<hr/>\n":"<hr>\n"};Renderer.prototype.list=function(body,ordered){var type=ordered?"ol":"ul";return"<"+type+">\n"+body+"</"+type+">\n"};Renderer.prototype.listitem=function(text){return"<li>"+text+"</li>\n"};Renderer.prototype.paragraph=function(text){return"<p>"+text+"</p>\n"};Renderer.prototype.table=function(header,body){return"<table>\n"+"<thead>\n"+header+"</thead>\n"+"<tbody>\n"+body+"</tbody>\n"+"</table>\n"};Renderer.prototype.tablerow=function(content){return"<tr>\n"+content+"</tr>\n"};Renderer.prototype.tablecell=function(content,flags){var type=flags.header?"th":"td";var tag=flags.align?"<"+type+' style="text-align:'+flags.align+'">':"<"+type+">";return tag+content+"</"+type+">\n"};Renderer.prototype.strong=function(text){return"<strong>"+text+"</strong>"};Renderer.prototype.em=function(text){return"<em>"+text+"</em>"};Renderer.prototype.codespan=function(text){return"<code>"+text+"</code>"};Renderer.prototype.br=function(){return this.options.xhtml?"<br/>":"<br>"};Renderer.prototype.del=function(text){return"<del>"+text+"</del>"};Renderer.prototype.link=function(href,title,text){if(this.options.sanitize){try{var prot=decodeURIComponent(unescape(href)).replace(/[^\w:]/g,"").toLowerCase()}catch(e){return""}if(prot.indexOf("javascript:")===0){return""}}var out='<a href="'+href+'"';if(title){out+=' title="'+title+'"'}out+=">"+text+"</a>";return out};Renderer.prototype.image=function(href,title,text){var out='<img src="'+href+'" alt="'+text+'"';if(title){out+=' title="'+title+'"'}out+=this.options.xhtml?"/>":">";return out};function Parser(options){this.tokens=[];this.token=null;this.options=options||marked.defaults;this.options.renderer=this.options.renderer||new Renderer;this.renderer=this.options.renderer;this.renderer.options=this.options}Parser.parse=function(src,options,renderer){var parser=new Parser(options,renderer);return parser.parse(src)};Parser.prototype.parse=function(src){this.inline=new InlineLexer(src.links,this.options,this.renderer);this.tokens=src.reverse();var out="";while(this.next()){out+=this.tok()}return out};Parser.prototype.next=function(){return this.token=this.tokens.pop()};Parser.prototype.peek=function(){return this.tokens[this.tokens.length-1]||0};Parser.prototype.parseText=function(){var body=this.token.text;while(this.peek().type==="text"){body+="\n"+this.next().text}return this.inline.output(body)};Parser.prototype.tok=function(){switch(this.token.type){case"space":{return""}case"hr":{return this.renderer.hr()}case"heading":{return this.renderer.heading(this.inline.output(this.token.text),this.token.depth,this.token.text)}case"code":{return this.renderer.code(this.token.text,this.token.lang,this.token.escaped)}case"table":{var header="",body="",i,row,cell,flags,j;cell="";for(i=0;i<this.token.header.length;i++){flags={header:true,align:this.token.align[i]};cell+=this.renderer.tablecell(this.inline.output(this.token.header[i]),{header:true,align:this.token.align[i]})}header+=this.renderer.tablerow(cell);for(i=0;i<this.token.cells.length;i++){row=this.token.cells[i];cell="";for(j=0;j<row.length;j++){cell+=this.renderer.tablecell(this.inline.output(row[j]),{header:false,align:this.token.align[j]})}body+=this.renderer.tablerow(cell)}return this.renderer.table(header,body)}case"blockquote_start":{var body="";while(this.next().type!=="blockquote_end"){body+=this.tok()}return this.renderer.blockquote(body)}case"list_start":{var body="",ordered=this.token.ordered;while(this.next().type!=="list_end"){body+=this.tok()}return this.renderer.list(body,ordered)}case"list_item_start":{var body="";while(this.next().type!=="list_item_end"){body+=this.token.type==="text"?this.parseText():this.tok()}return this.renderer.listitem(body)}case"loose_item_start":{var body="";while(this.next().type!=="list_item_end"){body+=this.tok()}return this.renderer.listitem(body)}case"html":{var html=!this.token.pre&&!this.options.pedantic?this.inline.output(this.token.text):this.token.text;return this.renderer.html(html)}case"paragraph":{return this.renderer.paragraph(this.inline.output(this.token.text))}case"text":{return this.renderer.paragraph(this.parseText())}}};function escape(html,encode){return html.replace(!encode?/&(?!#?\w+;)/g:/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function unescape(html){return html.replace(/&([#\w]+);/g,function(_,n){n=n.toLowerCase();if(n==="colon")return":";if(n.charAt(0)==="#"){return n.charAt(1)==="x"?String.fromCharCode(parseInt(n.substring(2),16)):String.fromCharCode(+n.substring(1))}return""})}function replace(regex,opt){regex=regex.source;opt=opt||"";return function self(name,val){if(!name)return new RegExp(regex,opt);val=val.source||val;val=val.replace(/(^|[^\[])\^/g,"$1");regex=regex.replace(name,val);return self}}function noop(){}noop.exec=noop;function merge(obj){var i=1,target,key;for(;i<arguments.length;i++){target=arguments[i];for(key in target){if(Object.prototype.hasOwnProperty.call(target,key)){obj[key]=target[key]}}}return obj}function marked(src,opt,callback){if(callback||typeof opt==="function"){if(!callback){callback=opt;opt=null}opt=merge({},marked.defaults,opt||{});var highlight=opt.highlight,tokens,pending,i=0;try{tokens=Lexer.lex(src,opt)}catch(e){return callback(e)}pending=tokens.length;var done=function(err){if(err){opt.highlight=highlight;return callback(err)}var out;try{out=Parser.parse(tokens,opt)}catch(e){err=e}opt.highlight=highlight;return err?callback(err):callback(null,out)};if(!highlight||highlight.length<3){return done()}delete opt.highlight;if(!pending)return done();for(;i<tokens.length;i++){(function(token){if(token.type!=="code"){return--pending||done()}return highlight(token.text,token.lang,function(err,code){if(err)return done(err);if(code==null||code===token.text){return--pending||done()}token.text=code;token.escaped=true;--pending||done()})})(tokens[i])}return}try{if(opt)opt=merge({},marked.defaults,opt);return Parser.parse(Lexer.lex(src,opt),opt)}catch(e){e.message+="\nPlease report this to https://github.com/chjj/marked.";if((opt||marked.defaults).silent){return"<p>An error occured:</p><pre>"+escape(e.message+"",true)+"</pre>"}throw e}}marked.options=marked.setOptions=function(opt){merge(marked.defaults,opt);return marked};marked.defaults={gfm:true,tables:true,breaks:false,pedantic:false,sanitize:false,smartLists:false,silent:false,highlight:null,langPrefix:"lang-",smartypants:false,headerPrefix:"",renderer:new Renderer,xhtml:false};marked.Parser=Parser;marked.parser=Parser.parse;marked.Renderer=Renderer;marked.Lexer=Lexer;marked.lexer=Lexer.lex;marked.InlineLexer=InlineLexer;marked.inlineLexer=InlineLexer.output;marked.parse=marked;if(typeof module!=="undefined"&&typeof exports==="object"){module.exports=marked}else if(typeof define==="function"&&define.amd){define(function(){return marked})}else{this.marked=marked}}).call(function(){return this||(typeof window!=="undefined"?window:global)}());

/* ---- PageFiles/Bigfiles.coffee ---- */


(function() {
  var Bigfiles,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Bigfiles = (function(superClass) {
    extend(Bigfiles, superClass);

    function Bigfiles() {
      this.render = bind(this.render, this);
      this.getHref = bind(this.getHref, this);
      this.updateFiles = bind(this.updateFiles, this);
      this.files = new SiteFiles(this);
      this.files.mode = "bigfiles";
      this.files.limit = 100;
      this.files.update = this.updateFiles;
      this.row = {
        "address": "bigfiles"
      };
    }

    Bigfiles.prototype.updateFiles = function(cb) {
      var orderby;
      if (Page.server_info.rev < 3090) {
        return typeof cb === "function" ? cb() : void 0;
      }
      orderby = this.files.orderby + (this.files.orderby_desc ? " DESC" : "");
      return Page.cmd("optionalFileList", {
        address: "all",
        filter: "downloaded,bigfile",
        limit: this.files.limit + 1,
        orderby: orderby
      }, (function(_this) {
        return function(res) {
          var i, len, row;
          for (i = 0, len = res.length; i < len; i++) {
            row = res[i];
            row.site = Page.site_list.sites_byaddress[row.address];
          }
          _this.files.items = res.slice(0, +(_this.files.limit - 1) + 1 || 9e9);
          _this.files.loaded = true;
          _this.files.has_more = res.length > _this.files.limit;
          Page.projector.scheduleRender();
          return typeof cb === "function" ? cb() : void 0;
        };
      })(this));
    };

    Bigfiles.prototype.getHref = function(row) {
      return row.inner_path;
    };

    Bigfiles.prototype.render = function() {
      if (!this.files.items.length) {
        return [];
      }
      return h("div.site", [h("div.title", [h("h3.name", "Bigfiles")]), this.files.render()]);
    };

    return Bigfiles;

  })(Class);

  window.Bigfiles = Bigfiles;

}).call(this);

/* ---- PageFiles/FilesResult.coffee ---- */


(function() {
  var FilesResult,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  FilesResult = (function(superClass) {
    extend(FilesResult, superClass);

    function FilesResult() {
      this.render = bind(this.render, this);
      this.getHref = bind(this.getHref, this);
      this.setFilter = bind(this.setFilter, this);
      this.updateFiles = bind(this.updateFiles, this);
      this.files = new SiteFiles(this);
      this.files.mode = "result";
      this.files.limit = 20;
      this.files.update = this.updateFiles;
      this.row = {
        "address": "result"
      };
      this.filter_inner_path = "";
    }

    FilesResult.prototype.updateFiles = function(cb) {
      var orderby;
      this.log("Update FilesResult", this.filter_inner_path);
      if (Page.server_info.rev < 4120) {
        Page.projector.scheduleRender();
        return typeof cb === "function" ? cb() : void 0;
      }
      orderby = this.files.orderby + (this.files.orderby_desc ? " DESC" : "");
      return Page.cmd("optionalFileList", {
        address: "all",
        filter: "downloaded",
        filter_inner_path: "%" + this.filter_inner_path + "%",
        limit: this.files.limit + 1,
        orderby: orderby
      }, (function(_this) {
        return function(res) {
          var i, len, row;
          for (i = 0, len = res.length; i < len; i++) {
            row = res[i];
            row.site = Page.site_list.sites_byaddress[row.address];
          }
          _this.files.items = res.slice(0, +(_this.files.limit - 1) + 1 || 9e9);
          _this.files.loaded = true;
          _this.files.has_more = res.length > _this.files.limit;
          Page.projector.scheduleRender();
          return typeof cb === "function" ? cb() : void 0;
        };
      })(this));
    };

    FilesResult.prototype.setFilter = function(filter, cb) {
      this.filter_inner_path = filter;
      return this.updateFiles(cb);
    };

    FilesResult.prototype.getHref = function(row) {
      return row.inner_path;
    };

    FilesResult.prototype.render = function() {
      if (Page.server_info.rev < 4120) {
        return h("div.empty", [h("h4", "Feature not supported"), h("small", "You need to update to the latest version to use this feature")]);
      }
      if (!this.filter_inner_path) {
        return [];
      }
      if (!this.files.items.length) {
        return h("div.empty", [h("h4", "Filter result: " + this.filter_inner_path), h("small", "No files found")]);
      }
      return h("div.site", [h("div.title", [h("h3.name", "Filter result: " + this.filter_inner_path)]), this.files.render()]);
    };

    return FilesResult;

  })(Class);

  window.FilesResult = FilesResult;

}).call(this);

/* ---- PageFiles/PageFiles.coffee ---- */


(function() {
  var PageFiles,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  PageFiles = (function(superClass) {
    extend(PageFiles, superClass);

    function PageFiles() {
      this.onSiteInfo = bind(this.onSiteInfo, this);
      this.render = bind(this.render, this);
      this.updateAllFiles = bind(this.updateAllFiles, this);
      this.updateOptionalStats = bind(this.updateOptionalStats, this);
      this.renderFilter = bind(this.renderFilter, this);
      this.handleFilterKeyup = bind(this.handleFilterKeyup, this);
      this.handleFilterInput = bind(this.handleFilterInput, this);
      this.renderSelectbar = bind(this.renderSelectbar, this);
      this.renderTotalbar = bind(this.renderTotalbar, this);
      this.handleLimitInput = bind(this.handleLimitInput, this);
      this.handleTotalbarMenu = bind(this.handleTotalbarMenu, this);
      this.handleLimitSetClick = bind(this.handleLimitSetClick, this);
      this.handleLimitCancelClick = bind(this.handleLimitCancelClick, this);
      this.handleEditlimitClick = bind(this.handleEditlimitClick, this);
      this.handleTotalbarOut = bind(this.handleTotalbarOut, this);
      this.handleTotalbarOver = bind(this.handleTotalbarOver, this);
      this.handleSelectbarDelete = bind(this.handleSelectbarDelete, this);
      this.handleSelectbarUnpin = bind(this.handleSelectbarUnpin, this);
      this.handleSelectbarPin = bind(this.handleSelectbarPin, this);
      this.handleSelectbarCancel = bind(this.handleSelectbarCancel, this);
      this.checkSelectedFiles = bind(this.checkSelectedFiles, this);
      this.getSites = bind(this.getSites, this);
      this.need_update = true;
      this.updating_files = 0;
      this.optional_stats = {
        limit: "0",
        free: "0",
        used: "0"
      };
      this.updateOptionalStats();
      this.hover_totalbar = false;
      this.menu_totalbar = new Menu();
      this.editing_limit = false;
      this.limit = "";
      this.selected_files_num = 0;
      this.selected_files_size = 0;
      this.selected_files_pinned = 0;
      this.bigfiles = new Bigfiles();
      this.result = new FilesResult();
      this.display_limit = 0;
      this.filtering = "";
      this;
    }

    PageFiles.prototype.getSites = function() {
      if (this.result.filter_inner_path) {
        return this.result.files.getSites();
      }
      if (this.bigfiles.files.items.length > 0) {
        return this.bigfiles.files.getSites().concat(Page.site_list.sites);
      } else {
        return Page.site_list.sites;
      }
    };

    PageFiles.prototype.checkSelectedFiles = function() {
      var i, len, ref, results, site, site_file;
      this.selected_files_num = 0;
      this.selected_files_size = 0;
      this.selected_files_pinned = 0;
      ref = this.getSites();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        results.push((function() {
          var j, len1, ref1, results1;
          ref1 = site.files.items;
          results1 = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            site_file = ref1[j];
            if (!site.files.selected[site_file.inner_path]) {
              continue;
            }
            this.selected_files_num += 1;
            this.selected_files_size += site_file.size;
            results1.push(this.selected_files_pinned += site_file.is_pinned);
          }
          return results1;
        }).call(this));
      }
      return results;
    };

    PageFiles.prototype.handleSelectbarCancel = function() {
      var i, j, key, len, len1, ref, ref1, ref2, site, site_file, val;
      ref = this.getSites();
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        ref1 = site.files.items;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          site_file = ref1[j];
          ref2 = site.files.selected;
          for (key in ref2) {
            val = ref2[key];
            delete site.files.selected[key];
          }
        }
      }
      this.checkSelectedFiles();
      Page.projector.scheduleRender();
      return false;
    };

    PageFiles.prototype.handleSelectbarPin = function() {
      var i, inner_paths, len, ref, site, site_file;
      ref = this.getSites();
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        inner_paths = (function() {
          var j, len1, ref1, results;
          ref1 = site.files.items;
          results = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            site_file = ref1[j];
            if (site.files.selected[site_file.inner_path]) {
              results.push(site_file.inner_path);
            }
          }
          return results;
        })();
        if (inner_paths.length > 0) {
          (function(site) {
            return Page.cmd("optionalFilePin", [inner_paths, site.row.address], function() {
              return site.files.update();
            });
          })(site);
        }
      }
      return this.handleSelectbarCancel();
    };

    PageFiles.prototype.handleSelectbarUnpin = function() {
      var i, inner_paths, len, ref, site, site_file;
      ref = this.getSites();
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        inner_paths = (function() {
          var j, len1, ref1, results;
          ref1 = site.files.items;
          results = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            site_file = ref1[j];
            if (site.files.selected[site_file.inner_path]) {
              results.push(site_file.inner_path);
            }
          }
          return results;
        })();
        if (inner_paths.length > 0) {
          (function(site) {
            return Page.cmd("optionalFileUnpin", [inner_paths, site.row.address], function() {
              return site.files.update();
            });
          })(site);
        }
      }
      return this.handleSelectbarCancel();
    };

    PageFiles.prototype.handleSelectbarDelete = function() {
      var bigfiles_modified_sites, i, j, k, len, len1, len2, ref, ref1, ref2, selected_site_file, selected_site_files, site, site_file;
      bigfiles_modified_sites = [];
      ref = this.getSites();
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        selected_site_files = (function() {
          var j, len1, ref1, results;
          ref1 = site.files.items;
          results = [];
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            site_file = ref1[j];
            if (site.files.selected[site_file.inner_path]) {
              results.push(site_file);
            }
          }
          return results;
        })();
        if (selected_site_files.length > 0) {
          for (j = 0, len1 = selected_site_files.length; j < len1; j++) {
            selected_site_file = selected_site_files[j];
            Page.cmd("optionalFileDelete", [selected_site_file.inner_path, site.row.address]);
            if (site.files.mode === "bigfiles") {
              Page.cmd("optionalFileDelete", [selected_site_file.inner_path + ".piecemap.msgpack", site.row.address]);
              bigfiles_modified_sites.push(site.row.address);
            }
          }
          site.files.update();
        }
      }
      if (bigfiles_modified_sites) {
        ref1 = Page.site_list.sites;
        for (k = 0, len2 = ref1.length; k < len2; k++) {
          site = ref1[k];
          if (ref2 = site.row.address, indexOf.call(bigfiles_modified_sites, ref2) >= 0) {
            site.files.update();
          }
        }
      }
      Page.site_list.update();
      return this.handleSelectbarCancel();
    };

    PageFiles.prototype.handleTotalbarOver = function() {
      this.hover_totalbar = true;
      return Page.projector.scheduleRender();
    };

    PageFiles.prototype.handleTotalbarOut = function() {
      this.hover_totalbar = false;
      return Page.projector.scheduleRender();
    };

    PageFiles.prototype.handleEditlimitClick = function() {
      this.editing_limit = true;
      return false;
    };

    PageFiles.prototype.handleLimitCancelClick = function() {
      this.editing_limit = false;
      return false;
    };

    PageFiles.prototype.handleLimitSetClick = function() {
      var limit;
      if (this.limit.indexOf("M") > 0 || this.limit.indexOf("m") > 0) {
        limit = (parseFloat(this.limit) / 1024).toString();
      } else if (this.limit.indexOf("%") > 0) {
        limit = parseFloat(this.limit) + "%";
      } else {
        limit = parseFloat(this.limit).toString();
      }
      this.optional_stats.limit = limit;
      Page.cmd("optionalLimitSet", limit);
      this.editing_limit = false;
      return false;
    };

    PageFiles.prototype.handleTotalbarMenu = function() {
      this.menu_totalbar.items = [];
      this.menu_totalbar.items.push(["Edit optional files limit", this.handleEditlimitClick]);
      if (this.menu_totalbar.visible) {
        this.menu_totalbar.hide();
      } else {
        this.menu_totalbar.show();
      }
      return false;
    };

    PageFiles.prototype.handleLimitInput = function(e) {
      return this.limit = e.target.value;
    };

    PageFiles.prototype.renderTotalbar = function() {

      /*
      		size_optional = 0
      		optional_downloaded = 0
      		for site in Page.site_list.sites
      			size_optional += site.row.settings.size_optional
      			optional_downloaded += site.row.settings.optional_downloaded
       */
      var limit, percent_limit, percent_optional_downloaded, percent_optional_used, total_space_limited;
      if (this.editing_limit && parseFloat(this.limit) > 0) {
        if (this.limit.indexOf("M") > 0 || this.limit.indexOf("m") > 0) {
          limit = (parseFloat(this.limit) / 1024) + "GB";
        } else {
          limit = this.limit;
        }
      } else {
        limit = this.optional_stats.limit;
      }
      if (limit.endsWith("%")) {
        limit = this.optional_stats.free * (parseFloat(limit) / 100);
      } else {
        limit = parseFloat(limit) * 1024 * 1024 * 1024;
      }
      if (this.optional_stats.free > limit * 1.8 && !this.hover_totalbar) {
        total_space_limited = limit * 1.8;
      } else {
        total_space_limited = this.optional_stats.free;
      }
      percent_optional_downloaded = (this.optional_stats.used / limit) * 100;
      percent_optional_used = percent_optional_downloaded * (limit / total_space_limited);
      percent_limit = (limit / total_space_limited) * 100;
      return h("div#PageFilesDashboard", {
        classes: {
          editing: this.editing_limit
        }
      }, [
        h("div.totalbar-edit", [
          h("span.title", "Optional files limit:"), h("input", {
            type: "text",
            value: this.limit,
            oninput: this.handleLimitInput
          }), h("a.set", {
            href: "#",
            onclick: this.handleLimitSetClick
          }, "Set"), h("a.cancel", {
            href: "#",
            onclick: this.handleLimitCancelClick
          }, "Cancel")
        ]), h("a.totalbar-title", {
          href: "#",
          title: "Space current used by optional files",
          onclick: this.handleTotalbarMenu
        }, "Used: " + (Text.formatSize(this.optional_stats.used)) + " / " + (Text.formatSize(limit)) + " (" + (Math.round(percent_optional_downloaded)) + "%)", h("div.icon-arrow-down")), this.menu_totalbar.render(), h("div.totalbar", {
          onmouseover: this.handleTotalbarOver,
          onmouseout: this.handleTotalbarOut
        }, h("div.totalbar-used", {
          style: "width: " + percent_optional_used + "%"
        }), h("div.totalbar-limitbar", {
          style: "width: " + percent_limit + "%"
        }), h("div.totalbar-limit", {
          style: "margin-left: " + percent_limit + "%"
        }, h("span", {
          title: "Space allowed to used by optional files"
        }, Text.formatSize(limit))), h("div.totalbar-hddfree", h("span", {
          title: "Total free space on your storage"
        }, [
          Text.formatSize(this.optional_stats.free), h("div.arrow", {
            style: this.optional_stats.free > total_space_limited ? "width: 10px" : "width: 0px"
          }, " \u25B6")
        ])))
      ]);
    };

    PageFiles.prototype.renderSelectbar = function() {
      return h("div.selectbar", {
        classes: {
          visible: this.selected_files_num > 0
        }
      }, [
        "Selected:", h("span.info", [h("span.num", this.selected_files_num + " files"), h("span.size", "(" + (Text.formatSize(this.selected_files_size)) + ")")]), h("div.actions", [
          this.selected_files_pinned > this.selected_files_num / 2 ? h("a.action.pin.unpin", {
            href: "#",
            onclick: this.handleSelectbarUnpin
          }, "UnPin") : h("a.action.pin", {
            href: "#",
            title: "Don't delete these files automatically",
            onclick: this.handleSelectbarPin
          }, "Pin"), h("a.action.delete", {
            href: "#",
            onclick: this.handleSelectbarDelete
          }, "Delete")
        ]), h("a.cancel.link", {
          href: "#",
          onclick: this.handleSelectbarCancel
        }, "Cancel")
      ]);
    };

    PageFiles.prototype.handleFilterInput = function(e) {
      if (this.input_timer) {
        clearInterval(this.input_timer);
      }
      this.filtering = e.target.value;
      return this.input_timer = setTimeout(((function(_this) {
        return function() {
          return RateLimitCb(600, function(cb_done) {
            return _this.result.setFilter(_this.filtering, function() {
              _this.checkSelectedFiles();
              return cb_done();
            });
          });
        };
      })(this)), 300);
    };

    PageFiles.prototype.handleFilterKeyup = function(e) {
      if (e.keyCode === 27) {
        e.target.value = "";
        this.handleFilterInput(e);
      }
      return false;
    };

    PageFiles.prototype.renderFilter = function() {
      return h("div.filter", [
        h("input.text", {
          placeholder: "Filter: File name",
          spellcheck: false,
          oninput: this.handleFilterInput,
          onkeyup: this.handleFilterKeyup,
          value: this.filtering
        })
      ]);
    };

    PageFiles.prototype.updateOptionalStats = function() {
      return Page.cmd("optionalLimitStats", [], (function(_this) {
        return function(res) {
          _this.limit = res.limit;
          if (!_this.limit.endsWith("%")) {
            _this.limit += " GB";
          }
          return _this.optional_stats = res;
        };
      })(this));
    };

    PageFiles.prototype.updateAllFiles = function() {
      var used;
      this.updating_files = 0;
      used = 0;
      Page.site_list.sites.map((function(_this) {
        return function(site) {
          if (!site.row.settings.size_optional) {
            return;
          }
          _this.updating_files += 1;
          used += site.row.settings.optional_downloaded;
          return site.files.update(function() {
            return _this.updating_files -= 1;
          });
        };
      })(this));
      this.updating_files += 1;
      return this.bigfiles.files.update((function(_this) {
        return function() {
          return _this.updating_files -= 1;
        };
      })(this));
    };

    PageFiles.prototype.render = function() {
      var site, sites, sites_connected, sites_favorited;
      if (Page.site_list.sites && !this.need_update && this.updating_files === 0 && document.body.className !== "loaded") {
        document.body.classList.add("loaded");
      }
      if (this.need_update && Page.site_list.sites.length) {
        this.updateAllFiles();
        this.need_update = false;
      }
      sites = (function() {
        var i, len, ref, results;
        ref = Page.site_list.sites;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          site = ref[i];
          if (site.row.settings.size_optional) {
            results.push(site);
          }
        }
        return results;
      })();
      sites_favorited = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = sites.length; i < len; i++) {
          site = sites[i];
          if (site.favorite) {
            results.push(site);
          }
        }
        return results;
      })();
      sites_connected = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = sites.length; i < len; i++) {
          site = sites[i];
          if (!site.favorite) {
            results.push(site);
          }
        }
        return results;
      })();
      if (sites.length > 0 && sites[0].files.loaded === false) {
        if (sites_favorited.length) {
          sites_favorited = [sites_favorited[0]];
          sites_connected = [];
        } else {
          sites_favorited = [];
          sites_connected = [sites_connected[0]];
        }
      }
      if (sites.length === 0) {
        document.body.classList.add("loaded");
        return h("div#PageFiles", this.renderSelectbar(), this.renderTotalbar(), h("div.empty", [h("h4", "Hello newcomer!"), h("small", "You have not downloaded any optional files yet")]));
      }
      if (this.display_limit < sites.length) {
        setTimeout(((function(_this) {
          return function() {
            _this.display_limit += 1;
            return Page.projector.scheduleRender();
          };
        })(this)), 1000);
      }
      return h("div#PageFiles", [
        this.renderSelectbar(), this.renderTotalbar(), this.renderFilter(), this.result.filter_inner_path ? this.result.render() : [
          this.bigfiles.render(), sites_favorited.slice(0, +this.display_limit + 1 || 9e9).map((function(_this) {
            return function(site) {
              return site.renderOptionalStats();
            };
          })(this)), sites_connected.slice(0, +this.display_limit + 1 || 9e9).map((function(_this) {
            return function(site) {
              return site.renderOptionalStats();
            };
          })(this))
        ]
      ]);
    };

    PageFiles.prototype.onSiteInfo = function(site_info) {
      var rate_limit, ref, ref1;
      if (((ref = site_info.event) != null ? ref[0] : void 0) === "peers_added") {
        return false;
      }
      if (site_info.tasks === 0 && ((ref1 = site_info.event) != null ? ref1[0] : void 0) === "file_done") {
        rate_limit = 1000;
      } else {
        rate_limit = 10000;
      }
      return RateLimit(rate_limit, (function(_this) {
        return function() {
          return _this.need_update = true;
        };
      })(this));
    };

    return PageFiles;

  })(Class);

  window.PageFiles = PageFiles;

}).call(this);

/* ---- PageFiles/SiteFiles.coffee ---- */


(function() {
  var SiteFiles,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SiteFiles = (function(superClass) {
    extend(SiteFiles, superClass);

    function SiteFiles(site1) {
      this.site = site1;
      this.update = bind(this.update, this);
      this.render = bind(this.render, this);
      this.isSelectedAll = bind(this.isSelectedAll, this);
      this.renderOrderRight = bind(this.renderOrderRight, this);
      this.renderOrder = bind(this.renderOrder, this);
      this.handleSelectAllClick = bind(this.handleSelectAllClick, this);
      this.selectAll = bind(this.selectAll, this);
      this.handleMoreClick = bind(this.handleMoreClick, this);
      this.handleOrderbyClick = bind(this.handleOrderbyClick, this);
      this.handleRowMouseenter = bind(this.handleRowMouseenter, this);
      this.handleSelectMousedown = bind(this.handleSelectMousedown, this);
      this.handleSelectEnd = bind(this.handleSelectEnd, this);
      this.handleSelectClick = bind(this.handleSelectClick, this);
      this.getSites = bind(this.getSites, this);
      this.limit = 10;
      this.selected = {};
      this.items = [];
      this.loaded = false;
      this.orderby = "time_downloaded";
      this.mode = "site";
      this.mode = "single_site";
      this.orderby_desc = true;
      this.has_more = false;
    }

    SiteFiles.prototype.getSites = function() {
      var address, back, file, i, len, name, ref, site, sites;
      back = [];
      sites = {};
      ref = this.items;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        if (sites[name = file.site.row.address] == null) {
          sites[name] = {
            row: file.site.row,
            files: {
              mode: this.mode,
              items: [],
              selected: this.selected,
              update: this.update
            }
          };
        }
        sites[file.site.row.address].files.items.push(file);
      }
      for (address in sites) {
        site = sites[address];
        back.push(site);
      }
      return back;
    };

    SiteFiles.prototype.handleSelectClick = function(e) {
      return false;
    };

    SiteFiles.prototype.handleSelectEnd = function(e) {
      document.body.removeEventListener('mouseup', this.handleSelectEnd);
      return this.select_action = null;
    };

    SiteFiles.prototype.handleSelectMousedown = function(e) {
      var inner_path;
      inner_path = e.currentTarget.attributes.inner_path.value;
      if (this.selected[inner_path]) {
        delete this.selected[inner_path];
        this.select_action = "deselect";
      } else {
        this.selected[inner_path] = true;
        this.select_action = "select";
      }
      Page.page_files.checkSelectedFiles();
      document.body.addEventListener('mouseup', this.handleSelectEnd);
      e.stopPropagation();
      Page.projector.scheduleRender();
      return false;
    };

    SiteFiles.prototype.handleRowMouseenter = function(e) {
      var inner_path;
      if (e.buttons && this.select_action) {
        inner_path = e.target.attributes.inner_path.value;
        if (this.select_action === "select") {
          this.selected[inner_path] = true;
        } else {
          delete this.selected[inner_path];
        }
        Page.page_files.checkSelectedFiles();
        Page.projector.scheduleRender();
      }
      return false;
    };

    SiteFiles.prototype.handleOrderbyClick = function(e) {
      var orderby;
      orderby = e.currentTarget.attributes.orderby.value;
      if (this.orderby === orderby) {
        this.orderby_desc = !this.orderby_desc;
      }
      this.orderby = orderby;
      this.update();
      return false;
    };

    SiteFiles.prototype.handleMoreClick = function() {
      this.limit += 15;
      this.update();
      return false;
    };

    SiteFiles.prototype.selectAll = function() {
      var i, is_selected_all, item, len, ref;
      is_selected_all = this.isSelectedAll();
      ref = this.items;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (is_selected_all) {
          delete this.selected[item.inner_path];
        } else {
          this.selected[item.inner_path] = true;
        }
      }
      Page.projector.scheduleRender();
      return Page.page_files.checkSelectedFiles();
    };

    SiteFiles.prototype.handleSelectAllClick = function() {
      if (this.has_more) {
        this.limit = 1000;
        this.update((function(_this) {
          return function() {
            return _this.selectAll();
          };
        })(this));
      } else {
        this.selectAll();
      }
      return false;
    };

    SiteFiles.prototype.renderOrder = function(title, orderby) {
      return h("a.title.orderby", {
        href: "#" + orderby,
        orderby: orderby,
        onclick: this.handleOrderbyClick,
        classes: {
          selected: this.orderby === orderby,
          desc: this.orderby_desc
        }
      }, [title, h("div.icon.icon-arrow-down")]);
    };

    SiteFiles.prototype.renderOrderRight = function(title, orderby) {
      return h("a.title.orderby", {
        href: "#" + orderby,
        orderby: orderby,
        onclick: this.handleOrderbyClick,
        classes: {
          selected: this.orderby === orderby,
          desc: this.orderby_desc
        }
      }, [h("div.icon.icon-arrow-down"), title]);
    };

    SiteFiles.prototype.isSelectedAll = function() {
      return !this.has_more && Object.keys(this.selected).length === this.items.length;
    };

    SiteFiles.prototype.render = function() {
      var ref;
      if (!((ref = this.items) != null ? ref.length : void 0)) {
        return [];
      }
      return [
        h("div.files.files-" + this.mode, {
          exitAnimation: Animation.slideUpInout
        }, [
          h("div.tr.thead", [
            h("div.td.pre", h("a.checkbox-outer", {
              href: "#Select+all",
              onclick: this.handleSelectAllClick,
              classes: {
                selected: this.isSelectedAll()
              }
            }, h("span.checkbox"))), this.mode === "bigfiles" || this.mode === "result" ? h("div.td.site", this.renderOrder("Site", "address")) : void 0, h("div.td.inner_path", this.renderOrder("Optional file", "is_pinned DESC, inner_path")), this.mode === "bigfiles" ? h("div.td.status", "Status") : void 0, h("div.td.size", this.renderOrderRight("Size", "size")), h("div.td.peer", this.renderOrder("Peers", "peer")), h("div.td.uploaded", this.renderOrder("Uploaded", "uploaded")), h("div.td.added", this.renderOrder("Finished", "time_downloaded"))
          ]), h("div.tbody", this.items.map((function(_this) {
            return function(file) {
              var classes, percent, percent_bg, percent_title, profile_color, site, status;
              site = file.site || _this.site;
              if (file.peer >= 10) {
                profile_color = "#47d094";
              } else if (file.peer > 0) {
                profile_color = "#f5b800";
              } else {
                profile_color = "#d1d1d1";
              }
              if (_this.mode === "bigfiles") {
                if (file.pieces == null) {
                  file.pieces = 0;
                }
                if (file.pieces_downloaded == null) {
                  file.pieces_downloaded = 0;
                }
                if (file.pieces === 0 || file.pieces_downloaded === 0) {
                  percent = 0;
                } else {
                  percent = parseInt((file.pieces_downloaded / file.pieces) * 100);
                }
                if (file.is_downloading || percent === 100) {
                  status = "";
                  percent_bg = "#9ef5cf";
                } else {
                  status = "paused";
                  percent_bg = "#f5f49e";
                }
                percent_title = percent + "% " + status;
              }
              classes = {
                selected: _this.selected[file.inner_path],
                pinned: file.is_pinned
              };
              return h("div.tr", {
                key: file.inner_path,
                inner_path: file.inner_path,
                exitAnimation: Animation.slideUpInout,
                enterAnimation: Animation.slideDown,
                classes: classes,
                onmouseenter: _this.handleRowMouseenter
              }, [
                h("div.td.pre", h("a.checkbox-outer", {
                  href: "#Select",
                  onmousedown: _this.handleSelectMousedown,
                  onclick: _this.handleSelectClick,
                  inner_path: file.inner_path
                }, h("span.checkbox"))), _this.mode === "bigfiles" || _this.mode === "result" ? h("div.td.site", h("a.link", {
                  href: site.getHref()
                }, site.row.content.title)) : void 0, h("div.td.inner_path", h("a.title.link", {
                  href: site.getHref(file),
                  target: "_blank",
                  title: file.inner_path.replace(/.*\//, "")
                }, file.inner_path.replace(/.*\//, "")), file.is_pinned ? h("span.pinned", {
                  exitAnimation: Animation.slideUpInout,
                  enterAnimation: Animation.slideDown
                }, "Pinned") : void 0), _this.mode === "bigfiles" ? h("div.td.status", {
                  classes: {
                    "downloading": file.is_downloading
                  }
                }, h("span.percent", {
                  title: file.pieces_downloaded + " of " + file.pieces + " pieces downloaded",
                  style: "box-shadow: inset " + (percent * 0.8) + "px 0px 0px " + percent_bg + ";"
                }, percent_title)) : void 0, h("div.td.size", Text.formatSize(file.size)), h("div.td.peer", [
                  h("div.icon.icon-profile", {
                    style: "color: " + profile_color
                  }), h("span.num", file.peer)
                ]), h("div.td.uploaded", h("div.uploaded-text", Text.formatSize(file.uploaded)), h("div.dots-container", [
                  h("span.dots.dots-bg", {
                    title: "Ratio: " + ((file.uploaded / file.size).toFixed(1))
                  }, "\u2022\u2022\u2022\u2022\u2022"), h("span.dots.dots-fg", {
                    title: "Ratio: " + ((file.uploaded / file.size).toFixed(1)),
                    style: "width: " + (Math.min(5, file.uploaded / file.size) * 9) + "px"
                  }, "\u2022\u2022\u2022\u2022\u2022")
                ])), h("div.td.added", file.time_downloaded ? Time.since(file.time_downloaded) : "n/a")
              ]);
            };
          })(this)))
        ]), this.has_more ? h("div.more-container", h("a.more", {
          href: "#More",
          onclick: this.handleMoreClick
        }, "More files...")) : void 0
      ];
    };

    SiteFiles.prototype.update = function(cb) {
      var orderby;
      orderby = this.orderby + (this.orderby_desc ? " DESC" : "");
      return Page.cmd("optionalFileList", {
        address: this.site.row.address,
        limit: this.limit + 1,
        orderby: orderby
      }, (function(_this) {
        return function(res) {
          _this.items = res.slice(0, +(_this.limit - 1) + 1 || 9e9);
          _this.loaded = true;
          _this.has_more = res.length > _this.limit;
          Page.projector.scheduleRender();
          return typeof cb === "function" ? cb() : void 0;
        };
      })(this));
    };

    return SiteFiles;

  })(Class);

  window.SiteFiles = SiteFiles;

}).call(this);

/* ---- PageSites/Dashboard.coffee ---- */


(function() {
  var Dashboard,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Dashboard = (function(superClass) {
    extend(Dashboard, superClass);

    function Dashboard() {
      this.render = bind(this.render, this);
      this.getWarnings = bind(this.getWarnings, this);
      this.handleWarningsClick = bind(this.handleWarningsClick, this);
      this.handleTrackersClick = bind(this.handleTrackersClick, this);
      this.handleNewversionClick = bind(this.handleNewversionClick, this);
      this.handleLogoutClick = bind(this.handleLogoutClick, this);
      this.handleDonateClick = bind(this.handleDonateClick, this);
      this.handleMultiuserClick = bind(this.handleMultiuserClick, this);
      this.handlePortRecheckClick = bind(this.handlePortRecheckClick, this);
      this.handlePortClick = bind(this.handlePortClick, this);
      this.handleDisableAlwaysTorClick = bind(this.handleDisableAlwaysTorClick, this);
      this.handleEnableAlwaysTorClick = bind(this.handleEnableAlwaysTorClick, this);
      this.handleTorClick = bind(this.handleTorClick, this);
      this.menu_newversion = new Menu();
      this.menu_port = new Menu();
      this.menu_tor = new Menu();
      this.menu_trackers = new Menu();
      this.menu_multiuser = new Menu();
      this.menu_donate = new Menu();
      this.menu_warnings = new Menu();
      this.port_checking = false;
      this.has_web_gl = null;
    }

    Dashboard.prototype.isTorAlways = function() {
      return Page.server_info.fileserver_ip === "127.0.0.1";
    };

    Dashboard.prototype.hasWebGl = function() {
      var canvas, ctx;
      if (this.has_web_gl === null) {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext("webgl");
        this.has_web_gl = ctx ? true : false;
        this.log("Webgl:", this.has_web_gl);
      }
      return this.has_web_gl;
    };

    Dashboard.prototype.getTorTitle = function() {
      var tor_title;
      tor_title = Page.server_info.tor_status.replace(/\((.*)\)/, "").trim();
      if (tor_title === "Disabled") {
        tor_title = _("Disabled");
      } else if (tor_title === "Error") {
        tor_title = _("Error");
      }
      return tor_title;
    };

    Dashboard.prototype.tagTrackersTitle = function() {
      var key, num_ok, num_total, stats, status_db, title, val;
      if (Page.server_info.offline) {
        return h("span.status.status-warning", "n/a");
      }
      num_ok = 0;
      num_total = 0;
      status_db = {
        announcing: [],
        error: [],
        announced: []
      };
      if (Page.announcer_stats) {
        stats = Page.announcer_stats;
      } else {
        stats = Page.announcer_info;
      }
      for (key in stats) {
        val = stats[key];
        if (val.status === "announced") {
          num_ok += 1;
        }
        num_total += 1;
      }
      title = num_ok + "/" + num_total;
      if (num_total === 0) {
        return h("span.status", "Waiting...");
      } else if (num_ok > num_total / 2) {
        return h("span.status.status-ok", title);
      } else if (num_ok > 0) {
        return h("span.status.status-warning", title);
      } else {
        return h("span.status.status-error", title);
      }
    };

    Dashboard.prototype.handleTorClick = function() {
      var ref;
      this.menu_tor.items = [];
      this.menu_tor.items.push(["Status: " + ((ref = Page.server_info) != null ? ref.tor_status : void 0), Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#how-to-make-zeronet-work-with-tor-under-linux"]);
      if (this.getTorTitle() !== "OK") {
        this.menu_tor.items.push(["How to make Tor connection work?", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#how-to-make-zeronet-work-with-tor-under-linux"]);
      }
      this.menu_tor.items.push(["How to use ZeroNet in Tor Browser?", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#how-to-use-zeronet-in-tor-browser"]);
      this.menu_tor.items.push(["---"]);
      if (this.isTorAlways()) {
        this.menu_tor.items.push(["Disable always Tor mode", this.handleDisableAlwaysTorClick]);
      } else {
        this.menu_tor.items.push(["Enable Tor for every connection (slower)", this.handleEnableAlwaysTorClick]);
      }
      this.menu_tor.toggle();
      return false;
    };

    Dashboard.prototype.handleEnableAlwaysTorClick = function() {
      return Page.cmd("configSet", ["tor", "always"], (function(_this) {
        return function(res) {
          Page.cmd("wrapperNotification", ["done", "Tor always mode enabled, please restart your ZeroNet to make it work.<br>For your privacy switch to Tor browser and start a new profile by renaming the data directory."]);
          return Page.cmd("wrapperConfirm", ["Restart ZeroNet client?", "Restart now"], function(res) {
            if (res) {
              return Page.cmd("serverShutdown", {
                restart: true
              });
            }
          });
        };
      })(this));
    };

    Dashboard.prototype.handleDisableAlwaysTorClick = function() {
      return Page.cmd("configSet", ["tor", null], (function(_this) {
        return function(res) {
          return Page.cmd("wrapperNotification", ["done", "Tor always mode disabled, please restart your ZeroNet."]);
        };
      })(this));
    };

    Dashboard.prototype.handlePortClick = function() {
      var format, port_opened;
      this.menu_port.items = [];
      if (Page.server_info.offline) {
        this.menu_port.items.push(["Offline mode, network communication disabled.", "/Config"]);
      } else if (Page.server_info.ip_external) {
        this.menu_port.items.push(["Nice! Your port " + Page.server_info.fileserver_port + " is opened.", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#do-i-need-to-have-a-port-opened"]);
      } else if (this.isTorAlways()) {
        this.menu_port.items.push(["Good, your port is always closed when using ZeroNet in Tor always mode.", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#do-i-need-to-have-a-port-opened"]);
      } else if (this.getTorTitle() === "OK") {
        this.menu_port.items.push(["Your port " + Page.server_info.fileserver_port + " is closed, but your Tor gateway is running well.", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#do-i-need-to-have-a-port-opened"]);
      } else {
        this.menu_port.items.push(["Your port " + Page.server_info.fileserver_port + " is closed. You are still fine, but for faster experience try open it.", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#do-i-need-to-have-a-port-opened"]);
      }
      if (Page.server_info.port_opened) {
        this.menu_port.items.push(["---"]);
        port_opened = Page.server_info.port_opened;
        format = {
          "true": h("span.status.status-ok", "Opened"),
          "false": h("span.status.status-warning", "Closed"),
          "null": h("span.status.status-disabled", "Unsupported"),
          undefined: h("span.status.status-disabled", "Checking...")
        };
        this.menu_port.items.push([["IPv4: ", format[port_opened.ipv4], ", IPv6: ", format[port_opened.ipv6]], null]);
      }
      this.menu_port.items.push(["---"]);
      this.menu_port.items.push(["Re-check opened port", this.handlePortRecheckClick]);
      this.menu_port.toggle();
      return false;
    };

    Dashboard.prototype.handlePortRecheckClick = function() {
      this.port_checking = true;
      return Page.cmd("serverPortcheck", [], (function(_this) {
        return function(res) {
          _this.port_checking = false;
          return Page.reloadServerInfo();
        };
      })(this));
    };

    Dashboard.prototype.handleMultiuserClick = function() {
      this.menu_multiuser.items = [];
      this.menu_multiuser.items.push([
        "Show your masterseed", (function() {
          return Page.cmd("userShowMasterSeed");
        })
      ]);
      if (Page.server_info.multiuser_admin) {
        this.menu_multiuser.items.push([
          "Select user", (function() {
            return Page.cmd("userSelectForm");
          })
        ]);
      }
      this.menu_multiuser.items.push([
        "Logout", (function() {
          return Page.cmd("userLogout");
        })
      ]);
      this.menu_multiuser.toggle();
      return false;
    };

    Dashboard.prototype.handleDonateClick = function() {
      this.menu_donate.items = [];
      this.menu_donate.items.push(["Help to keep this project alive", Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "help_zeronet/donate/"]);
      this.menu_donate.toggle();
      return false;
    };

    Dashboard.prototype.handleLogoutClick = function() {
      return Page.cmd("uiLogout");
    };

    Dashboard.prototype.handleNewversionClick = function() {
      this.menu_newversion.items = [];
      this.menu_newversion.items.push([
        "Update ZeroNet", (function() {
          return Page.updateZeronet();
        })
      ]);
      this.menu_newversion.items.push(["Details of the update", Text.getSiteUrl("Blog.ZeroNetwork.bit")]);
      this.menu_newversion.toggle();
      return false;
    };

    Dashboard.prototype.handleTrackersClick = function() {
      var request_taken, stat, stats, status, success_percent, title, title_text, tracker_name, tracker_url;
      if (Page.announcer_stats) {
        stats = Page.announcer_stats;
        Page.reloadAnnouncerStats();
      } else {
        stats = Page.announcer_info;
      }
      this.menu_trackers.items = [];
      for (tracker_url in stats) {
        stat = stats[tracker_url];
        tracker_name = tracker_url.replace(/(.*:\/\/.*?)[\/#].*/, "$1").replace(/:[0-9]+$/, "");
        success_percent = parseInt((stat.num_success / stat.num_request) * 100);
        if (isNaN(success_percent)) {
          success_percent = "?";
        }
        status = stat.status.capitalize();
        if (status === "Announced" && stat.time_request && stat.time_status) {
          request_taken = stat.time_status - stat.time_request;
          status = (request_taken.toFixed(2)) + "s";
        }
        title_text = "Requests: " + stat.num_request;
        if (stat.last_error) {
          title_text += ", Last error: " + stat.last_error + " (" + (Time.since(stat.time_last_error)) + ")";
        }
        title = [
          tracker_name, h("span.tracker-status", {
            title: title_text
          }, status + " (" + success_percent + "% success)")
        ];
        this.menu_trackers.items.push([title, null]);
      }
      this.menu_trackers.toggle();
      return false;
    };

    Dashboard.prototype.handleWarningsClick = function() {
      var i, len, warning, warnings;
      warnings = this.getWarnings();
      this.menu_warnings.items = [];
      for (i = 0, len = warnings.length; i < len; i++) {
        warning = warnings[i];
        this.menu_warnings.items.push([h("b.status-error", warning.title), warning.href]);
        if (warning.descr) {
          this.menu_warnings.items.push([warning.descr, warning.href]);
        }
        this.menu_warnings.items.push(["---"]);
      }
      this.menu_warnings.items.push([
        "Restart ZeroNet client", (function(_this) {
          return function() {
            return Page.cmd("serverShutdown", {
              restart: true
            });
          };
        })(this)
      ]);
      this.menu_warnings.toggle();
      return false;
    };

    Dashboard.prototype.getWarnings = function(add_server_errors) {
      var warnings;
      if (add_server_errors == null) {
        add_server_errors = true;
      }
      warnings = [];
      if (navigator.userAgent.match(/(\b(MS)?IE\s+|Trident\/7.0)/)) {
        warnings.push({
          title: "Unsupported browser",
          href: "http://browsehappy.com/",
          descr: "Internet Explorer is not fully supported browser by ZeroNet, please consider switching to Chrome or Firefox"
        });
      }
      if (this.isTorAlways() && (!navigator.userAgent.match(/(Firefox)/) || (navigator.maxTouchPoints != null) || (navigator.serviceWorker != null))) {
        warnings.push({
          title: "Your browser is not safe",
          href: Text.getSiteUrl("1DocsYf2tZVVMEMJFHiDsppmFicZCWkVv1") + "faq/#how-to-use-zeronet-in-tor-browser",
          descr: "To protect your anonymity you should use ZeroNet in the Tor browser."
        });
      }
      if (Page.server_info.lib_verify_best === "btctools") {
        warnings.push({
          title: "Slow verification library",
          href: "#",
          descr: "To significantly reduce CPU usage install libsecp256k1 or OpenSSL"
        });
      }
      if (Math.abs(Page.server_info.timecorrection) > 30) {
        warnings.push({
          title: ["Time out of sync: ", 0 - Page.server_info.timecorrection.toFixed(2), "s"],
          href: "https://time.is",
          descr: "Looks like your system time is out of sync. Other users may not see your posted content and other problems could happen."
        });
      }
      if (add_server_errors) {
        if (Page.server_errors.length > 2) {
          warnings = warnings.concat(Page.server_errors.slice(-2).reverse());
          warnings.push({
            title: (Page.server_errors.length - 2) + " more errors...",
            href: "#ZeroNet:Console:Error"
          });
        } else {
          warnings = warnings.concat(Page.server_errors);
        }
      }
      return warnings;
    };

    Dashboard.prototype.render = function() {
      var num_warnings, tor_title;
      if (Page.server_info) {
        tor_title = this.getTorTitle();
        num_warnings = this.getWarnings(false) + Page.server_errors.length;
        return h("div#Dashboard", num_warnings > 0 ? h("a.warnings.dashboard-item", {
          href: "#Warnings",
          onmousedown: this.handleWarningsClick,
          onclick: Page.returnFalse
        }, "Warnings: " + num_warnings) : void 0, this.menu_warnings.render(".menu-warnings"), parseFloat(Page.server_info.version.replace(/\./g, "0")) < parseFloat(Page.latest_version.replace(/\./g, "0")) ? h("a.newversion.dashboard-item", {
          href: "#Update",
          onmousedown: this.handleNewversionClick,
          onclick: Page.returnFalse
        }, "New ZeroNet version: " + Page.latest_version) : Page.server_info.rev < Page.latest_rev ? h("a.newversion.dashboard-item", {
          href: "#Update",
          onmousedown: this.handleNewversionClick,
          onclick: Page.returnFalse
        }, "New important update: rev" + Page.latest_rev) : void 0, this.menu_newversion.render(".menu-newversion"), h("a.port.dashboard-item.donate", {
          "href": "#Donate",
          onmousedown: this.handleDonateClick,
          onclick: Page.returnFalse
        }, [h("div.icon-heart")]), this.menu_donate.render(".menu-donate"), Page.server_info.multiuser ? h("a.port.dashboard-item.multiuser", {
          href: "#Multiuser",
          onmousedown: this.handleMultiuserClick,
          onclick: Page.returnFalse
        }, [
          h("span", "User: "), h("span.status", {
            style: "color: " + (Text.toColor(Page.server_info.master_address))
          }, Page.server_info.master_address.slice(0, 5) + ".." + Page.server_info.master_address.slice(-4))
        ]) : void 0, Page.server_info.multiuser ? this.menu_multiuser.render(".menu-multiuser") : void 0, indexOf.call(Page.server_info.plugins, "UiPassword") >= 0 ? h("a.port.dashboard-item.logout", {
          href: "#Logout",
          onmousedown: this.handleLogoutClick,
          onclick: Page.returnFalse
        }, [h("span", "Logout")]) : void 0, this.menu_port.render(".menu-port.menu-left"), h("a.dashboard-item.port", {
          href: "#Port",
          classes: {
            bounce: this.port_checking
          },
          onmousedown: this.handlePortClick,
          onclick: Page.returnFalse
        }, [h("span", "Port: "), Page.server_info.offline ? h("span.status.status-warning", "Offline mode") : this.port_checking ? h("span.status", "Checking") : Page.server_info.ip_external === null ? h("span.status", "Checking") : Page.server_info.ip_external === true ? h("span.status.status-ok", "Opened") : this.isTorAlways ? h("span.status.status-ok", "Closed") : tor_title === "OK" ? h("span.status.status-warning", "Closed") : h("span.status.status-bad", "Closed")]), h("a.dashboard-item.tor", {
          href: "#Tor",
          onmousedown: this.handleTorClick,
          onclick: Page.returnFalse
        }, [h("span", "Tor: "), tor_title === "OK" ? this.isTorAlways() ? h("span.status.status-ok", "Always") : h("span.status.status-ok", "Available") : h("span.status.status-warning", tor_title)]), this.menu_tor.render(".menu-tor"), Page.announcer_info || Page.announcer_stats ? h("a.dashboard-item.trackers", {
          href: "#Trackers",
          onmousedown: this.handleTrackersClick,
          onclick: Page.returnFalse
        }, [h("span", "Trackers: "), this.tagTrackersTitle()]) : void 0, this.menu_trackers.render(".menu-trackers"));
      } else {
        return h("div#Dashboard");
      }
    };

    return Dashboard;

  })(Class);

  window.Dashboard = Dashboard;

}).call(this);


/* ---- PageSites/FeedList.coffee ---- */


(function() {
  var FeedList,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  FeedList = (function(superClass) {
    extend(FeedList, superClass);

    function FeedList() {
      this.onSiteInfo = bind(this.onSiteInfo, this);
      this.render = bind(this.render, this);
      this.renderSearchHelp = bind(this.renderSearchHelp, this);
      this.saveFeedVisit = bind(this.saveFeedVisit, this);
      this.getClass = bind(this.getClass, this);
      this.renderNotifications = bind(this.renderNotifications, this);
      this.handleNotificationHideClick = bind(this.handleNotificationHideClick, this);
      this.renderSearchStat = bind(this.renderSearchStat, this);
      this.renderWelcome = bind(this.renderWelcome, this);
      this.renderFeed = bind(this.renderFeed, this);
      this.exitAnimation = bind(this.exitAnimation, this);
      this.enterAnimation = bind(this.enterAnimation, this);
      this.handleSearchClear = bind(this.handleSearchClear, this);
      this.handleSearchInfoClick = bind(this.handleSearchInfoClick, this);
      this.handleFilterClick = bind(this.handleFilterClick, this);
      this.handleSearchKeyup = bind(this.handleSearchKeyup, this);
      this.handleSearchInput = bind(this.handleSearchInput, this);
      this.storeNodeSearch = bind(this.storeNodeSearch, this);
      this.search = bind(this.search, this);
      this.update = bind(this.update, this);
      this.displayRows = bind(this.displayRows, this);
      this.checkScroll = bind(this.checkScroll, this);
      this.feeds = null;
      this.searching = null;
      this.searching_text = null;
      this.searched = null;
      this.res = null;
      this.loading = false;
      this.filter = null;
      this.feed_types = {};
      this.need_update = false;
      this.updating = false;
      this.limit = 30;
      this.query_limit = 20;
      this.query_day_limit = 3;
      this.show_stats = false;
      this.feed_keys = {};
      this.date_feed_visit = null;
      this.date_save_feed_visit = 0;
      Page.on_settings.then((function(_this) {
        return function() {
          _this.need_update = true;
          return document.body.onscroll = function() {
            return RateLimit(300, function() {
              return _this.checkScroll();
            });
          };
        };
      })(this));
      this;
    }

    FeedList.prototype.checkScroll = function() {
      var ref, scroll_top;
      scroll_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (scroll_top + window.innerHeight > document.getElementById("FeedList").clientHeight - 400 && !this.updating && ((ref = this.feeds) != null ? ref.length : void 0) > 5 && Page.mode === "Sites" && this.limit < 300) {
        this.limit += 30;
        this.query_limit += 30;
        if (this.query_day_limit !== null) {
          this.query_day_limit += 5;
          if (this.query_day_limit > 30) {
            this.query_day_limit = null;
          }
        }
        this.log("checkScroll update");
        if (this.searching && Page.server_info.rev >= 3817) {
          this.search(this.searching);
        } else {
          this.update();
        }
        return true;
      } else {
        return false;
      }
    };

    FeedList.prototype.displayRows = function(rows, search) {
      var i, last_row, len, row, row_group;
      this.feeds = [];
      this.feed_keys = {};
      if (!rows) {
        return false;
      }
      rows.sort(function(a, b) {
        return a.date_added + (a.type === "mention" ? 1 : 0) - b.date_added - (b.type === "mention" ? 1 : 0);
      });
      row_group = {};
      last_row = {};
      this.feed_types = {};
      rows.reverse();
      for (i = 0, len = rows.length; i < len; i++) {
        row = rows[i];
        if (last_row.body === row.body && last_row.date_added === row.date_added) {
          continue;
        }
        if (row_group.type === row.type && row.url === row_group.url && row.site === row_group.site) {
          if (row_group.body_more == null) {
            row_group.body_more = [];
            row_group.body_more.push(row.body);
          } else if (row_group.body_more.length < 3) {
            row_group.body_more.push(row.body);
          } else {
            if (row_group.more == null) {
              row_group.more = 0;
            }
            row_group.more += 1;
          }
          row_group.feed_id = row.date_added;
        } else {
          if (row.feed_id == null) {
            row.feed_id = row.date_added;
          }
          row.key = row.site + row.type + row.title + row.feed_id;
          if (this.feed_keys[row.key]) {
            this.log("Duplicate feed key: " + row.key);
          } else {
            this.feeds.push(row);
          }
          this.feed_keys[row.key] = true;
          row_group = row;
        }
        this.feed_types[row.type] = true;
        last_row = row;
      }
      return Page.projector.scheduleRender();
    };

    FeedList.prototype.update = function(cb) {
      var params;
      if (this.searching || this.updating) {
        return false;
      }
      if (!Page.server_info || Page.server_info.rev < 1850) {
        params = [];
      } else {
        params = {
          limit: this.query_limit,
          day_limit: this.query_day_limit
        };
      }
      this.logStart("Updating feed", params);
      this.updating = true;
      return Page.cmd("feedQuery", params, (function(_this) {
        return function(res) {
          var rows;
          if (res.rows) {
            rows = res.rows;
          } else {
            rows = res;
          }
          _this.res = res;
          if (rows.length < 10 && _this.query_day_limit !== null) {
            _this.log("Only " + res.rows.length + " results, query without day limit");
            _this.query_limit = 20;
            _this.query_day_limit = null;
            _this.updating = false;
            _this.update();
            return false;
          }
          _this.displayRows(rows);
          setTimeout(_this.checkScroll, 100);
          _this.logEnd("Updating feed");
          if (cb) {
            cb();
          }
          return _this.updating = false;
        };
      })(this));
    };

    FeedList.prototype.search = function(search, cb) {
      var params;
      if (Page.server_info.rev < 1230) {
        this.displayRows([]);
        if (cb) {
          cb();
        }
        return;
      }
      if (!Page.server_info || Page.server_info.rev < 3817) {
        params = search;
      } else {
        params = {
          search: search,
          limit: this.query_limit * 3,
          day_limit: this.query_day_limit * 10 || null
        };
      }
      this.log("Searching for", params);
      this.loading = true;
      Page.projector.scheduleRender();
      return Page.cmd("feedSearch", params, (function(_this) {
        return function(res) {
          _this.loading = false;
          if (res.rows.length < 10 && _this.query_day_limit !== null) {
            _this.log("Only " + res.rows.length + " results, search without day limit");
            _this.query_limit = 30;
            _this.query_day_limit = null;
            _this.search(search, cb);
            return false;
          }
          _this.displayRows(res["rows"], search);
          delete res["rows"];
          _this.res = res;
          _this.searched = search;
          if (cb) {
            return cb();
          }
        };
      })(this));
    };

    FeedList.prototype.storeNodeSearch = function(node) {
      return document.body.onkeypress = (function(_this) {
        return function(e) {
          var ref, ref1;
          if ((ref = e.charCode) === 0 || ref === 32) {
            return;
          }
          if (((ref1 = document.activeElement) != null ? ref1.tagName : void 0) !== "INPUT") {
            return node.focus();
          }
        };
      })(this);
    };

    FeedList.prototype.handleSearchInput = function(e) {
      var delay, ref;
      if (((ref = this.searching) != null ? ref.length : void 0) > 3) {
        delay = 400;
      } else {
        delay = 800;
      }
      if (Page.site_list.sites.length > 300) {
        delay = delay * 3;
      } else if (Page.site_list.sites.length > 100) {
        delay = delay * 2;
      }
      this.searching = e.target.value;
      this.searching_text = this.searching.replace(/[^ ]+:.*$/, "").trim();
      if (Page.server_info.rev < 1230) {
        this.feeds = [];
        this.feed_keys = {};
      }
      if (e.target.value === "") {
        delay = 1;
      }
      if (e.keyCode === 13) {
        delay = 1;
      }
      clearInterval(this.input_timer);
      setTimeout((function(_this) {
        return function() {
          return _this.waiting = true;
        };
      })(this));
      this.input_timer = setTimeout(((function(_this) {
        return function() {
          return RateLimitCb(delay, function(cb_done) {
            _this.limit = 30;
            _this.query_limit = 20;
            _this.query_day_limit = 3;
            _this.waiting = false;
            if (_this.searching) {
              return _this.search(_this.searching, function() {
                return cb_done();
              });
            } else {
              return _this.update(function() {
                cb_done();
                if (!_this.searching) {
                  _this.searching = null;
                }
                return _this.searched = null;
              });
            }
          });
        };
      })(this)), delay);
      return false;
    };

    FeedList.prototype.handleSearchKeyup = function(e) {
      if (e.keyCode === 27) {
        e.target.value = "";
        this.handleSearchInput(e);
      }
      if (e.keyCode === 13) {
        this.handleSearchInput(e);
      }
      return false;
    };

    FeedList.prototype.handleFilterClick = function(e) {
      this.filter = e.target.getAttribute("href").replace("#", "");
      if (this.filter === "all") {
        this.filter = null;
      }
      return false;
    };

    FeedList.prototype.handleSearchInfoClick = function(e) {
      this.show_stats = !this.show_stats;
      return false;
    };

    FeedList.prototype.handleSearchClear = function(e) {
      e.target.value = "";
      this.handleSearchInput(e);
      return false;
    };

    FeedList.prototype.formatTitle = function(title) {
      if (this.searching_text && this.searching_text.length > 1) {
        return Text.highlight(title, this.searching_text);
      } else {
        if (title) {
          return title;
        } else {
          return "";
        }
      }
    };

    FeedList.prototype.formatBody = function(body, type) {
      var username_formatted, username_match;
      body = body.replace(/[\n\r]+/, "\n");
      if (type === "comment" || type === "mention") {
        username_match = body.match(/^(([a-zA-Z0-9\.]+)@[a-zA-Z0-9\.]+|@(.*?)):/);
        if (username_match) {
          if (username_match[2]) {
            username_formatted = username_match[2] + " › ";
          } else {
            username_formatted = username_match[3] + " › ";
          }
          body = body.replace(/> \[(.*?)\].*/g, "$1: ");
          body = body.replace(/^[ ]*>.*/gm, "");
          body = body.replace(username_match[0], "");
        } else {
          username_formatted = "";
        }
        body = body.replace(/\n/g, " ");
        body = body.trim();
        if (this.searching_text && this.searching_text.length > 1) {
          body = Text.highlight(body, this.searching_text);
          if (body[0].length > 60 && body.length > 1) {
            body[0] = "..." + body[0].slice(body[0].length - 50, +(body[0].length - 1) + 1 || 9e9);
          }
          return [h("b", Text.highlight(username_formatted, this.searching_text)), body];
        } else {
          body = body.slice(0, 201);
          return [h("b", [username_formatted]), body];
        }
      } else {
        body = body.replace(/\n/g, " ");
        if (this.searching_text && this.searching_text.length > 1) {
          body = Text.highlight(body, this.searching_text);
          if (body[0].length > 60) {
            body[0] = "..." + body[0].slice(body[0].length - 50, +(body[0].length - 1) + 1 || 9e9);
          }
        } else {
          body = body.slice(0, 201);
        }
        return body;
      }
    };

    FeedList.prototype.formatType = function(type, title) {
      if (type === "comment") {
        return "Comment on";
      } else if (type === "mention") {
        if (title) {
          return "You got mentioned in";
        } else {
          return "You got mentioned";
        }
      } else {
        return "";
      }
    };

    FeedList.prototype.enterAnimation = function(elem, props) {
      if (this.searching === null) {
        return Animation.slideDown.apply(this, arguments);
      } else {
        return null;
      }
    };

    FeedList.prototype.exitAnimation = function(elem, remove_func, props) {
      if (this.searching === null) {
        return Animation.slideUp.apply(this, arguments);
      } else {
        return remove_func();
      }
    };

    FeedList.prototype.renderFeed = function(feed) {
      var classes, err, site, type_formatted;
      if (this.filter && feed.type !== this.filter) {
        return null;
      }
      try {
        site = Page.site_list.item_list.items_bykey[feed.site];
        type_formatted = this.formatType(feed.type, feed.title);
        classes = {};
        if (this.date_feed_visit && feed.date_added > this.date_feed_visit) {
          classes["new"] = true;
        }
        return h("div.feed." + feed.type, {
          key: feed.key,
          enterAnimation: this.enterAnimation,
          exitAnimation: this.exitAnimation,
          classes: classes
        }, [
          h("div.details", [
            h("span.dot", {
              title: "new"
            }, "\u2022"), h("a.site", {
              href: site.getHref()
            }, [site.row.content.title]), h("div.added", [Time.since(feed.date_added)])
          ]), h("div.circle", {
            style: "border-color: " + (Text.toColor(feed.type + site.row.address, 60, 60))
          }), h("div.title-container", [
            type_formatted ? h("span.type", type_formatted) : void 0, h("a.title", {
              href: site.getHref() + feed.url
            }, this.formatTitle(feed.title))
          ]), h("div.body", {
            key: feed.body,
            enterAnimation: this.enterAnimation,
            exitAnimation: this.exitAnimation
          }, this.formatBody(feed.body, feed.type)), feed.body_more ? feed.body_more.map((function(_this) {
            return function(body_more) {
              return h("div.body", {
                key: body_more,
                enterAnimation: _this.enterAnimation,
                exitAnimation: _this.exitAnimation
              }, _this.formatBody(body_more, feed.type));
            };
          })(this)) : void 0, feed.more > 0 ? h("a.more", {
            href: site.getHref() + feed.url
          }, ["+" + feed.more + " more"]) : void 0
        ]);
      } catch (error) {
        err = error;
        this.log(err);
        return h("div", {
          key: Time.timestamp()
        });
      }
    };

    FeedList.prototype.renderWelcome = function() {
      return h("div.welcome", [
        h("img", {
          src: "img/logo.svg",
          height: 150,
          onerror: "this.src='img/logo.png'; this.onerror=null;"
        }), h("h1", "Welcome to ZeroNet"), h("h2", "Let's build a decentralized Internet together!"), h("div.served", ["This site currently served by ", h("b.peers", Page.site_info["peers"] || "n/a"), " peers, without any central server."]), h("div.sites", [
          h("h3", "Some sites we created:"), h("a.site.site-zerotalk", {
            href: Text.getSiteUrl("Talk.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroTalk"]), h("div.description", ["Reddit-like, decentralized forum"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zeroblog", {
            href: Text.getSiteUrl("Blog.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroBlog"]), h("div.description", ["Microblogging platform"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zeromail", {
            href: Text.getSiteUrl("Mail.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroMail"]), h("div.description", ["End-to-end encrypted mailing"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zerome", {
            href: Text.getSiteUrl("Me.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroMe"]), h("div.description", ["P2P social network"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zerosites", {
            href: Text.getSiteUrl("Sites.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroSites"]), h("div.description", ["Discover more sites"]), h("div.visit", ["Activate \u2501"])])
        ])
      ]);
    };

    FeedList.prototype.renderSearchStat = function(stat) {
      var back, site, total_taken;
      if (stat.taken === 0) {
        return null;
      }
      total_taken = this.res.taken;
      site = Page.site_list.item_list.items_bykey[stat.site];
      if (!site) {
        return [];
      }
      back = [];
      back.push(h("tr", {
        key: stat.site + "_" + stat.feed_name,
        classes: {
          "slow": stat.taken > total_taken * 0.1,
          "extra-slow": stat.taken > total_taken * 0.3
        }
      }, [
        h("td.site", h("a.site", {
          href: site.getHref()
        }, [site.row.content.title])), h("td.feed_name", stat.feed_name), h("td.taken", (stat.taken != null ? stat.taken + "s" : "n/a "))
      ]));
      if (stat.error) {
        back.push(h("tr.error", h("td", "Error:"), h("td", {
          colSpan: 2
        }, stat.error)));
      }
      return back;
    };

    FeedList.prototype.handleNotificationHideClick = function(e) {
      var address;
      address = e.target.getAttribute("address");
      Page.settings.siteblocks_ignore[address] = true;
      Page.mute_list.update();
      Page.saveSettings();
      return false;
    };

    FeedList.prototype.renderNotifications = function() {
      return h("div.notifications", {
        classes: {
          empty: Page.mute_list.siteblocks_serving.length === 0
        }
      }, [
        Page.mute_list.siteblocks_serving.map((function(_this) {
          return function(siteblock) {
            return h("div.notification", {
              key: siteblock.address,
              enterAnimation: Animation.show,
              exitAnimation: Animation.slideUpInout
            }, [
              h("a.hide", {
                href: "#Hide",
                onclick: _this.handleNotificationHideClick,
                address: siteblock.address
              }, "\u00D7"), "You are serving a blocked site: ", h("a.site", {
                href: siteblock.site.getHref()
              }, siteblock.site.row.content.title || siteblock.site.row.address_short), h("span.reason", [
                h("a.title", {
                  href: siteblock.include.site.getHref()
                }, "Reason"), ": ", siteblock.reason
              ])
            ]);
          };
        })(this))
      ]);
    };

    FeedList.prototype.getClass = function() {
      if (this.searching !== null) {
        return "search";
      } else {
        return "newsfeed.limit-" + this.limit;
      }
    };

    FeedList.prototype.saveFeedVisit = function(date_feed_visit) {
      this.log("Saving feed visit...", Page.settings.date_feed_visit, "->", date_feed_visit);
      Page.settings.date_feed_visit = date_feed_visit;
      return Page.saveSettings();
    };

    FeedList.prototype.renderSearchHelp = function() {
      return h("div.search-help", ["Tip: Search in specific site using ", h("code", "anything site:SiteName")]);
    };

    FeedList.prototype.render = function() {
      var feed_type, ref, ref1;
      if (this.need_update) {
        RateLimitCb(5000, this.update);
        this.need_update = false;
      }
      if (this.feeds && Page.settings.date_feed_visit < ((ref = this.feeds[0]) != null ? ref.date_added : void 0)) {
        this.saveFeedVisit(this.feeds[0].date_added);
      }
      if (this.feeds && Page.site_list.loaded && document.body.className !== "loaded" && !this.updating) {
        if (document.body.scrollTop > 500) {
          setTimeout((function() {
            return document.body.classList.add("loaded");
          }), 2000);
        } else {
          document.body.classList.add("loaded");
        }
      }
      return h("div#FeedList.FeedContainer", {
        classes: {
          faded: Page.mute_list.visible
        }
      }, Page.mute_list.updated ? this.renderNotifications() : void 0, this.feeds === null || !Page.site_list.loaded ? h("div.loading") : this.feeds.length > 0 || this.searching !== null ? [
        h("div.feeds-filters", [
          h("a.feeds-filter", {
            href: "#all",
            classes: {
              active: this.filter === null
            },
            onclick: this.handleFilterClick
          }, "All"), (function() {
            var results;
            results = [];
            for (feed_type in this.feed_types) {
              results.push(h("a.feeds-filter", {
                key: feed_type,
                href: "#" + feed_type,
                classes: {
                  active: this.filter === feed_type
                },
                onclick: this.handleFilterClick
              }, feed_type));
            }
            return results;
          }).call(this)
        ]), h("div.feeds-line"), h("div.feeds-search", {
          classes: {
            "searching": this.searching,
            "searched": this.searched,
            "loading": this.loading || this.waiting
          }
        }, h("div.icon-magnifier"), this.loading ? h("div.loader", {
          enterAnimation: Animation.show,
          exitAnimation: Animation.hide
        }, h("div.arc")) : void 0, this.searched && !this.loading ? h("a.search-clear.nolink", {
          href: "#clear",
          onclick: this.handleSearchClear,
          enterAnimation: Animation.show,
          exitAnimation: Animation.hide
        }, "\u00D7") : void 0, ((ref1 = this.res) != null ? ref1.stats : void 0) ? h("a.search-info.nolink", {
          href: "#ShowStats",
          enterAnimation: Animation.show,
          exitAnimation: Animation.hide,
          onclick: this.handleSearchInfoClick
        }, (this.searching ? this.res.num + " results " : "") + ("from " + this.res.sites + " sites in " + (this.res.taken.toFixed(2)) + "s")) : void 0, h("input", {
          type: "text",
          placeholder: "Search in connected sites",
          value: this.searching,
          onkeyup: this.handleSearchKeyup,
          oninput: this.handleSearchInput,
          afterCreate: this.storeNodeSearch
        }), this.show_stats ? h("div.search-info-stats", {
          enterAnimation: Animation.slideDown,
          exitAnimation: Animation.slideUp
        }, [h("table", [h("tr", h("th", "Site"), h("th", "Feed"), h("th.taken", "Taken")), this.res.stats.map(this.renderSearchStat)])]) : void 0, this.renderSearchHelp(), Page.server_info.rev < 1230 && this.searching ? h("div.search-noresult", {
          enterAnimation: Animation.show
        }, [
          "You need to ", h("a", {
            href: "#Update",
            onclick: Page.head.handleUpdateZeronetClick
          }, "update"), " your ZeroNet client to use the search feature!"
        ]) : this.feeds.length === 0 && this.searched ? h("div.search-noresult", {
          enterAnimation: Animation.show
        }, "No results for " + this.searched) : void 0), h("div.FeedList." + this.getClass(), {
          classes: {
            loading: this.loading || this.waiting
          }
        }, this.feeds.slice(0, +this.limit + 1 || 9e9).map(this.renderFeed))
      ] : this.renderWelcome());
    };

    FeedList.prototype.onSiteInfo = function(site_info) {
      var ref, ref1, ref2;
      if (((ref = site_info.event) != null ? ref[0] : void 0) === "file_done" && ((ref1 = site_info.event) != null ? ref1[1].endsWith(".json") : void 0) && !((ref2 = site_info.event) != null ? ref2[1].endsWith("content.json") : void 0)) {
        if (!this.searching) {
          return this.need_update = true;
        }
      }
    };

    return FeedList;

  })(Class);

  window.FeedList = FeedList;

}).call(this);

/* ---- PageSites/MuteList.coffee ---- */


(function() {
  var MuteList,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  MuteList = (function(superClass) {
    extend(MuteList, superClass);

    function MuteList() {
      this.show = bind(this.show, this);
      this.render = bind(this.render, this);
      this.renderIncludes = bind(this.renderIncludes, this);
      this.renderSiteblocks = bind(this.renderSiteblocks, this);
      this.renderMutes = bind(this.renderMutes, this);
      this.storeNode = bind(this.storeNode, this);
      this.afterUpdate = bind(this.afterUpdate, this);
      this.handleIncludeRemoveClick = bind(this.handleIncludeRemoveClick, this);
      this.handleMuteRemoveClick = bind(this.handleMuteRemoveClick, this);
      this.handleHideClick = bind(this.handleHideClick, this);
      this.updateFilterIncludes = bind(this.updateFilterIncludes, this);
      this.update = bind(this.update, this);
      this.mutes = null;
      this.includes = null;
      this.visible = false;
      this.max_height = 0;
      this.updated = false;
      this.siteblocks_serving = [];
      Page.site_list.on_loaded.then((function(_this) {
        return function() {
          return _this.updateFilterIncludes();
        };
      })(this));
      this;
    }

    MuteList.prototype.update = function() {
      this.need_update = false;
      Page.cmd("MuteList", [], (function(_this) {
        return function(res) {
          var auth_address, mute;
          _this.mutes = [];
          for (auth_address in res) {
            mute = res[auth_address];
            mute.auth_address = auth_address;
            mute.site = Page.site_list.sites_byaddress[mute.source];
            _this.mutes.push(mute);
          }
          _this.mutes.sort(function(a, b) {
            return b.date_added - a.date_added;
          });
          if (!_this.max_height) {
            _this.max_height = 100;
          }
          _this.updated = true;
          return Page.projector.scheduleRender();
        };
      })(this));
      return this.updateFilterIncludes();
    };

    MuteList.prototype.updateFilterIncludes = function() {
      return Page.cmd("filterIncludeList", {
        all_sites: true,
        filters: true
      }, (function(_this) {
        return function(res) {
          var address, address_hash, auth_address, i, include, j, len, len1, mute, mutes, ref, ref1, ref2, site, siteblock, siteblocks;
          _this.siteblocks_serving = [];
          _this.includes = [];
          _this.siteblocks = {};
          for (i = 0, len = res.length; i < len; i++) {
            include = res[i];
            include.site = Page.site_list.sites_byaddress[include.address];
            mutes = [];
            if (include.mutes != null) {
              ref = include.mutes;
              for (auth_address in ref) {
                mute = ref[auth_address];
                mute.auth_address = auth_address;
                mutes.push(mute);
              }
            }
            include.mutes = mutes;
            siteblocks = [];
            if (include.siteblocks != null) {
              ref1 = include.siteblocks;
              for (address in ref1) {
                siteblock = ref1[address];
                siteblock.address = address;
                siteblock.include = include;
                siteblocks.push(siteblock);
                _this.siteblocks[address] = siteblock;
              }
            }
            include.siteblocks = siteblocks;
            _this.includes.push(include);
          }
          _this.includes.sort(function(a, b) {
            return b.date_added - a.date_added;
          });
          ref2 = Page.site_list.sites;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            site = ref2[j];
            address = site.row.address;
            if (_this.siteblocks[address] && !Page.settings.siteblocks_ignore[address]) {
              _this.siteblocks[address].site = site;
              _this.siteblocks_serving.push(_this.siteblocks[address]);
            }
            address_hash = "0x" + site.row.address_hash;
            if (_this.siteblocks[address_hash] && !Page.settings.siteblocks_ignore[address_hash]) {
              _this.siteblocks[address_hash].site = site;
              _this.siteblocks_serving.push(_this.siteblocks[address_hash]);
            }
          }
          _this.updated = true;
          return Page.projector.scheduleRender();
        };
      })(this));
    };

    MuteList.prototype.handleHideClick = function() {
      this.visible = false;
      setTimeout(((function(_this) {
        return function() {
          return _this.updateFilterIncludes();
        };
      })(this)), 1000);
      return this.max_height = 0;
    };

    MuteList.prototype.handleMuteRemoveClick = function(e) {
      var mute;
      mute = e.target.mute;
      if (mute.removed) {
        Page.cmd("muteAdd", [mute.auth_address, mute.cert_user_id, mute.reason]);
      } else {
        Page.cmd("muteRemove", mute.auth_address);
      }
      mute.removed = !mute.removed;
      return false;
    };

    MuteList.prototype.handleIncludeRemoveClick = function(e) {
      var include;
      include = e.currentTarget.include;
      if (include.removed) {
        Page.cmd("filterIncludeAdd", [include.inner_path, include.description, include.address]);
      } else {
        Page.cmd("filterIncludeRemove", {
          inner_path: include.inner_path,
          address: include.address
        });
      }
      include.removed = !include.removed;
      return false;
    };

    MuteList.prototype.afterUpdate = function() {
      this.updated = false;
      if (this.node && this.visible) {
        this.max_height = this.node.offsetHeight + 100;
        return Page.projector.scheduleRender();
      }
    };

    MuteList.prototype.storeNode = function(node) {
      return this.node = node;
    };

    MuteList.prototype.renderMutes = function(mutes, mode) {
      if (mode == null) {
        mode = "mutes";
      }
      return h("div.mutes", [
        h("div.mute.mute-head", [
          h("div.mute-col", "Muted user"), h("div.mute-col", {
            style: "width: 66%"
          }, "Why?")
        ]), mutes.map((function(_this) {
          return function(mute) {
            return h("div.mute", {
              key: mute.auth_address,
              classes: {
                removed: mute.removed
              }
            }, [
              h("div.mute-col", [h("div.cert_user_id", mute.cert_user_id), h("div.auth_address", mute.auth_address)]), h("div.mute-col", {
                style: "width: 66%"
              }, [
                h("div.source", mute.site != null ? mute.site.row.content.title : mute.source), h("div.reason", {
                  innerHTML: Text.renderMarked(mute.reason)
                }), h("div.date_added", " \u2500 " + Time.since(mute.date_added))
              ]), mode === "mutes" ? h("a.action", {
                href: "#Unmute",
                onclick: _this.handleMuteRemoveClick,
                mute: mute
              }, "×") : void 0
            ]);
          };
        })(this))
      ]);
    };

    MuteList.prototype.renderSiteblocks = function(siteblocks) {
      return h("div.siteblocks", [
        h("div.mute.mute-head", [
          h("div.mute-col", "Blocked site"), h("div.mute-col", {
            style: "width: 66%"
          }, "Why?")
        ]), siteblocks.map((function(_this) {
          return function(siteblock) {
            return h("div.mute", {
              key: siteblock.address,
              classes: {
                removed: siteblock.removed
              }
            }, [
              h("div.mute-col", [h("div.cert_user_id", siteblock.name), h("div.auth_address", siteblock.address)]), h("div.mute-col", {
                style: "width: 66%"
              }, [
                h("div.reason", {
                  innerHTML: Text.renderMarked(siteblock.reason)
                }), h("div.date_added", " \u2500 " + Time.since(siteblock.date_added))
              ])
            ]);
          };
        })(this))
      ]);
    };

    MuteList.prototype.renderIncludes = function() {
      return h("div.includes", [
        this.includes.map((function(_this) {
          return function(include) {
            return h("div.include", {
              key: include.address + include.inner_path,
              classes: {
                removed: include.removed
              }
            }, [
              h("h2", h("a.site", {
                href: include.site.getHref()
              }, include.site.row.content.title), " \u203A ", h("a.inner_path", {
                href: "#"
              }, include.inner_path)), h("a.action", {
                href: "#Remove+include",
                onclick: _this.handleIncludeRemoveClick,
                include: include
              }, [h("span.closer", "×"), "deactivate this blocklist"]), include.mutes.length ? _this.renderMutes(include.mutes, "includes") : void 0, include.siteblocks.length ? _this.renderSiteblocks(include.siteblocks) : void 0
            ]);
          };
        })(this))
      ]);
    };

    MuteList.prototype.render = function() {
      var ref, ref1;
      if (this.need_update) {
        this.update();
      }
      if (!this.mutes) {
        return h("div#MuteList", {
          classes: {
            visible: false
          }
        }, "Muted");
      }
      if (this.updated) {
        this.updated = false;
        setTimeout(this.afterUpdate);
      }
      return h("div#MuteList", {
        classes: {
          visible: this.visible
        },
        style: "max-height: " + this.max_height + "px"
      }, [
        h("a.mute-hide", {
          href: "#Hide",
          onclick: this.handleHideClick
        }, "\u2039 Back to feed"), ((ref = this.mutes) != null ? ref.length : void 0) === 0 && ((ref1 = this.includes) != null ? ref1.length : void 0) === 0 ? h("div.mute-empty", "Your mute list is empty! :)") : h("div", {
          afterCreate: this.storeNode
        }, [this.mutes.length > 0 ? this.renderMutes(this.mutes) : void 0, this.includes ? this.renderIncludes() : void 0])
      ]);
    };

    MuteList.prototype.show = function() {
      this.visible = true;
      Page.site_list.on_loaded.then((function(_this) {
        return function() {
          return _this.need_update = true;
        };
      })(this));
      return Page.projector.scheduleRender();
    };

    return MuteList;

  })(Class);

  window.MuteList = MuteList;

}).call(this);

/* ---- PageSites/Site.coffee ---- */


(function() {
  var Site,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Site = (function(superClass) {
    extend(Site, superClass);

    function Site(row, item_list) {
      this.item_list = item_list;
      this.renderOptionalStats = bind(this.renderOptionalStats, this);
      this.render = bind(this.render, this);
      this.handleLimitIncreaseClick = bind(this.handleLimitIncreaseClick, this);
      this.handleHelpsClick = bind(this.handleHelpsClick, this);
      this.handleHelpAllClick = bind(this.handleHelpAllClick, this);
      this.handleHelpClick = bind(this.handleHelpClick, this);
      this.handleSettingsClick = bind(this.handleSettingsClick, this);
      this.handleDeleteClick = bind(this.handleDeleteClick, this);
      this.handleCloneUpgradeClick = bind(this.handleCloneUpgradeClick, this);
      this.handleCloneClick = bind(this.handleCloneClick, this);
      this.handlePauseClick = bind(this.handlePauseClick, this);
      this.handleResumeClick = bind(this.handleResumeClick, this);
      this.handleCheckfilesClick = bind(this.handleCheckfilesClick, this);
      this.handleUpdateClick = bind(this.handleUpdateClick, this);
      this.handleUnfavoriteClick = bind(this.handleUnfavoriteClick, this);
      this.handleFavoriteClick = bind(this.handleFavoriteClick, this);
      this.deleted = false;
      this.show_errors = false;
      this.message_visible = false;
      this.message = null;
      this.message_class = "";
      this.message_collapsed = false;
      this.message_timer = null;
      this.favorite = Page.settings.favorite_sites[row.address];
      this.key = row.address;
      this.optional_helps = [];
      this.optional_helps_disabled = {};
      this.setRow(row);
      this.files = new SiteFiles(this);
      this.menu = new Menu();
      this.menu_helps = null;
    }

    Site.prototype.setRow = function(row) {
      var base, base1, base2, base3, key, ref, ref1, ref2, val;
      if ((base = row.settings).modified == null) {
        base.modified = 0;
      }
      if ((base1 = row.settings).size == null) {
        base1.size = 0;
      }
      if ((base2 = row.settings).added == null) {
        base2.added = 0;
      }
      if ((base3 = row.settings).peers == null) {
        base3.peers = 0;
      }
      if (((ref = row.event) != null ? ref[0] : void 0) === "updated" && row.content_updated !== false) {
        this.setMessage("Updated!", "done");
      } else if (((ref1 = row.event) != null ? ref1[0] : void 0) === "updating") {
        this.setMessage("Updating...");
      } else if (row.tasks > 0) {
        this.setMessage("Updating: " + (Math.max(row.tasks, row.bad_files)) + " left");
      } else if (row.bad_files > 0) {
        if (row.peers <= 1) {
          this.setMessage("No peers", "error");
        } else {
          this.setMessage(row.bad_files + " file update failed", "error");
        }
      } else if (row.content_updated === false) {
        if (row.peers <= 1) {
          this.setMessage("No peers", "error");
        } else {
          this.setMessage("Update failed", "error");
        }
      } else if (row.tasks === 0 && ((ref2 = this.row) != null ? ref2.tasks : void 0) > 0) {
        this.setMessage("Updated!", "done");
      }
      if (row.body == null) {
        row.body = "";
      }
      this.optional_helps = (function() {
        var ref3, results;
        ref3 = row.settings.optional_help;
        results = [];
        for (key in ref3) {
          val = ref3[key];
          results.push([key, val]);
        }
        return results;
      })();
      return this.row = row;
    };

    Site.prototype.setMessage = function(message, message_class) {
      this.message_class = message_class != null ? message_class : "";
      if (message) {
        this.message = message;
        this.message_visible = true;
        if (this.message_class === "error" && !this.show_errors) {
          this.message_collapsed = true;
        } else {
          this.message_collapsed = false;
        }
      } else {
        this.message_visible = false;
      }
      clearInterval(this.message_timer);
      if (this.message_class === "done") {
        this.message_timer = setTimeout(((function(_this) {
          return function() {
            return _this.setMessage("");
          };
        })(this)), 5000);
      }
      return Page.projector.scheduleRender();
    };

    Site.prototype.isWorking = function() {
      var ref;
      return this.row.tasks > 0 || ((ref = this.row.event) != null ? ref[0] : void 0) === "updating";
    };

    Site.prototype.handleFavoriteClick = function() {
      this.favorite = true;
      this.menu = new Menu();
      Page.settings.favorite_sites[this.row.address] = true;
      Page.saveSettings();
      Page.site_list.reorder();
      return false;
    };

    Site.prototype.handleUnfavoriteClick = function() {
      this.favorite = false;
      this.menu = new Menu();
      delete Page.settings.favorite_sites[this.row.address];
      Page.saveSettings();
      Page.site_list.reorder();
      return false;
    };

    Site.prototype.handleUpdateClick = function() {
      Page.cmd("siteUpdate", {
        "address": this.row.address
      });
      this.show_errors = true;
      return false;
    };

    Site.prototype.handleCheckfilesClick = function() {
      Page.cmd("siteUpdate", {
        "address": this.row.address,
        "check_files": true,
        since: 0
      });
      this.show_errors = true;
      return false;
    };

    Site.prototype.handleResumeClick = function() {
      Page.cmd("siteResume", {
        "address": this.row.address
      });
      return false;
    };

    Site.prototype.handlePauseClick = function() {
      Page.cmd("sitePause", {
        "address": this.row.address
      });
      return false;
    };

    Site.prototype.handleCloneClick = function() {
      Page.cmd("siteClone", {
        "address": this.row.address
      });
      return false;
    };

    Site.prototype.handleCloneUpgradeClick = function() {
      Page.cmd("wrapperConfirm", ["Are you sure?" + (" Any modifications you made on<br><b>" + this.row.content.title + "</b> site's js/css files will be lost."), "Upgrade"], (function(_this) {
        return function(confirmed) {
          return Page.cmd("siteClone", {
            "address": _this.row.content.cloned_from,
            "root_inner_path": _this.row.content.clone_root,
            "target_address": _this.row.address
          });
        };
      })(this));
      return false;
    };

    Site.prototype.handleDeleteClick = function() {
      if (this.row.settings.own || this.row.privatekey) {
        Page.cmd("wrapperConfirm", ["You can delete your site using the site's sidebar.", ["Open site"]], (function(_this) {
          return function(confirmed) {
            if (confirmed) {
              return window.top.location = _this.getHref() + "#ZeroNet:OpenSidebar";
            }
          };
        })(this));
      } else {
        if (!this.row.content.title) {
          Page.cmd("siteDelete", {
            "address": this.row.address
          });
          this.item_list.deleteItem(this);
          Page.projector.scheduleRender();
        } else if (Page.server_info.rev > 2060) {
          Page.cmd("wrapperConfirm", ["Are you sure?" + (" <b>" + this.row.content.title + "</b>"), ["Delete", "Blacklist"]], (function(_this) {
            return function(confirmed) {
              if (confirmed === 1) {
                Page.cmd("siteDelete", {
                  "address": _this.row.address
                });
                _this.item_list.deleteItem(_this);
                return Page.projector.scheduleRender();
              } else if (confirmed === 2) {
                return Page.cmd("wrapperPrompt", ["Blacklist <b>" + _this.row.content.title + "</b>", "text", "Delete and Blacklist", "Reason"], function(reason) {
                  Page.cmd("siteDelete", {
                    "address": _this.row.address
                  });
                  Page.cmd("siteblockAdd", [_this.row.address, reason]);
                  _this.item_list.deleteItem(_this);
                  return Page.projector.scheduleRender();
                });
              }
            };
          })(this));
        } else {
          Page.cmd("wrapperConfirm", ["Are you sure?" + (" <b>" + this.row.content.title + "</b>"), "Delete"], (function(_this) {
            return function(confirmed) {
              if (confirmed) {
                Page.cmd("siteDelete", {
                  "address": _this.row.address
                });
                _this.item_list.deleteItem(_this);
                return Page.projector.scheduleRender();
              }
            };
          })(this));
        }
      }
      return false;
    };

    Site.prototype.handleSettingsClick = function(e) {
      this.menu.items = [];
      if (this.favorite) {
        this.menu.items.push(["Unfavorite", this.handleUnfavoriteClick]);
      } else {
        this.menu.items.push(["Favorite", this.handleFavoriteClick]);
      }
      this.menu.items.push(["Update", this.handleUpdateClick]);
      this.menu.items.push(["Check files", this.handleCheckfilesClick]);
      if (this.row.settings.serving) {
        this.menu.items.push(["Pause", this.handlePauseClick]);
      } else {
        this.menu.items.push(["Resume", this.handleResumeClick]);
      }
      this.menu.items.push(["Save as .zip", "/ZeroNet-Internal/Zip?address=" + this.row.address]);
      if (this.row.content.cloneable === true) {
        this.menu.items.push(["Clone", this.handleCloneClick]);
      }
      if (this.row.settings.own && this.row.content.cloned_from && Page.server_info.rev >= 2080) {
        this.menu.items.push(["---"]);
        this.menu.items.push(["Upgrade code", this.handleCloneUpgradeClick]);
      }
      this.menu.items.push(["---"]);
      this.menu.items.push(["Delete", this.handleDeleteClick]);
      if (this.menu.visible) {
        this.menu.hide();
      } else {
        this.menu.show();
      }
      return false;
    };

    Site.prototype.handleHelpClick = function(directory, title) {
      if (this.optional_helps_disabled[directory]) {
        Page.cmd("OptionalHelp", [directory, title, this.row.address]);
        delete this.optional_helps_disabled[directory];
      } else {
        Page.cmd("OptionalHelpRemove", [directory, this.row.address]);
        this.optional_helps_disabled[directory] = true;
      }
      return true;
    };

    Site.prototype.handleHelpAllClick = function() {
      if (this.row.settings.autodownloadoptional === true) {
        return Page.cmd("OptionalHelpAll", [false, this.row.address], (function(_this) {
          return function() {
            _this.row.settings.autodownloadoptional = false;
            return Page.projector.scheduleRender();
          };
        })(this));
      } else {
        return Page.cmd("OptionalHelpAll", [true, this.row.address], (function(_this) {
          return function() {
            _this.row.settings.autodownloadoptional = true;
            return Page.projector.scheduleRender();
          };
        })(this));
      }
    };

    Site.prototype.handleHelpsClick = function(e) {
      var directory, i, len, ref, ref1, title;
      if (e.target.classList.contains("menu-item")) {
        return;
      }
      if (!this.menu_helps) {
        this.menu_helps = new Menu();
      }
      this.menu_helps.items = [];
      this.menu_helps.items.push([
        "Help distribute all new files", this.handleHelpAllClick, ((function(_this) {
          return function() {
            return _this.row.settings.autodownloadoptional;
          };
        })(this))
      ]);
      if (this.optional_helps.length > 0) {
        this.menu_helps.items.push(["---"]);
      }
      ref = this.optional_helps;
      for (i = 0, len = ref.length; i < len; i++) {
        ref1 = ref[i], directory = ref1[0], title = ref1[1];
        this.menu_helps.items.push([
          title, ((function(_this) {
            return function() {
              return _this.handleHelpClick(directory, title);
            };
          })(this)), ((function(_this) {
            return function() {
              return !_this.optional_helps_disabled[directory];
            };
          })(this))
        ]);
      }
      this.menu_helps.toggle();
      return true;
    };

    Site.prototype.getHref = function(row) {
      var ext, has_plugin, href, ref, ref1, ref2, ref3, supported_plugins;
      if ((ref = this.row.content) != null ? ref.domain : void 0) {
        ext = (ref1 = this.row.content) != null ? ref1.domain.split(".").pop() : void 0;
        supported_plugins = {
          bit: ["Zeroname", "Dnschain", "Zeroname-local"],
          yo: ["NameYo"],
          yu: ["NameYo"],
          of: ["NameYo"],
          inf: ["NameYo"],
          zn: ["NameYo"],
          list: ["NameYo"]
        }[ext] || [];
        has_plugin = (((ref2 = Page.server_info) != null ? ref2.plugins : void 0) != null) && supported_plugins.some(function(plugin) {
          var ref3;
          return indexOf.call((ref3 = Page.server_info) != null ? ref3.plugins : void 0, plugin) >= 0;
        });
      } else {
        has_plugin = false;
      }
      if (has_plugin && ((ref3 = this.row.content) != null ? ref3.domain : void 0)) {
        href = Text.getSiteUrl(this.row.content.domain);
      } else {
        href = Text.getSiteUrl(this.row.address);
      }
      if (row != null ? row.inner_path : void 0) {
        return href + row.inner_path;
      } else {
        return href;
      }
    };

    Site.prototype.handleLimitIncreaseClick = function() {
      if (Page.server_info.rev < 3170) {
        return Page.cmd("wrapperNotification", ["info", "You need ZeroNet Rev3170 to use this command"]);
      }
      Page.cmd("as", [this.row.address, "siteSetLimit", this.row.need_limit], (function(_this) {
        return function(res) {
          if (res === "ok") {
            Page.cmd("wrapperNotification", ["done", "Site <b>" + _this.row.content.title + "</b> storage limit modified to <b>" + _this.row.need_limit + "MB</b>", 5000]);
          } else {
            Page.cmd("wrapperNotification", ["error", res.error]);
          }
          return Page.projector.scheduleRender();
        };
      })(this));
      return false;
    };

    Site.prototype.render = function() {
      var now, ref;
      now = Date.now() / 1000;
      return h("div.site", {
        key: this.key,
        "data-key": this.key,
        classes: {
          "modified-lastday": now - this.row.settings.modified < 60 * 60 * 24,
          "disabled": !this.row.settings.serving && !this.row.demo,
          "working": this.isWorking()
        }
      }, h("div.circle", {
        style: "color: " + (Text.toColor(this.row.address, 40, 50))
      }, ["\u2022"]), h("a.inner", {
        href: this.getHref(),
        title: ((ref = this.row.content.title) != null ? ref.length : void 0) > 20 ? this.row.content.title : void 0
      }, [
        h("span.title", [this.row.content.title || this.row.address]), h("div.details", [h("span.modified", [h("div.icon-clock"), Page.settings.sites_orderby === "size" ? h("span.value", [(this.row.settings.size / 1024 / 1024 + (this.row.settings.size_optional != null) / 1024 / 1024).toFixed(1), "MB"]) : h("span.value", [Time.since(this.row.settings.modified)])]), h("span.peers", [h("div.icon-profile"), h("span.value", [Math.max((this.row.settings.peers ? this.row.settings.peers : 0), this.row.peers)])])]), this.row.demo ? h("div.details.demo", "Activate \u00BB") : void 0, this.row.need_limit ? h("a.details.needaction", {
          href: "#Set+limit",
          onclick: this.handleLimitIncreaseClick
        }, "Set limit to " + this.row.need_limit + "MB") : void 0, h("div.message", {
          classes: {
            visible: this.message_visible,
            done: this.message_class === 'done',
            error: this.message_class === 'error',
            collapsed: this.message_collapsed
          }
        }, [this.message])
      ]), h("a.settings", {
        href: "#Settings",
        tabIndex: -1,
        onmousedown: this.handleSettingsClick,
        onclick: Page.returnFalse
      }, ["\u22EE"]), this.menu.render());
    };

    Site.prototype.renderCircle = function(value, max) {
      var dashoffset, stroke;
      if (value < 1) {
        dashoffset = 75 + (1 - value) * 75;
      } else {
        dashoffset = Math.max(0, 75 - ((value - 1) / 9) * 75);
      }
      stroke = "hsl(" + (Math.min(555, value * 50)) + ", 100%, 61%)";
      return h("div.circle", {
        title: "Upload/Download ratio",
        innerHTML: "<svg class=\"circle-svg\" width=\"30\" height=\"30\" viewPort=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">\n  			<circle r=\"12\" cx=\"15\" cy=\"15\" fill=\"transparent\" class='circle-bg'></circle>\n  			<circle r=\"12\" cx=\"15\" cy=\"15\" fill=\"transparent\" class='circle-fg' style='stroke-dashoffset: " + dashoffset + "; stroke: " + stroke + "'></circle>\n</svg>"
      });
    };

    Site.prototype.renderOptionalStats = function() {
      var base, ratio, ratio_hue, row;
      row = this.row;
      if ((base = row.settings).bytes_sent == null) {
        base.bytes_sent = 0;
      }
      ratio = (row.settings.bytes_sent / row.settings.bytes_recv).toFixed(1);
      if (ratio >= 100) {
        ratio = "\u221E";
      } else if (ratio >= 10) {
        ratio = (row.settings.bytes_sent / row.settings.bytes_recv).toFixed(0);
      }
      ratio_hue = Math.min(555, (row.settings.bytes_sent / row.settings.bytes_recv) * 50);
      return h("div.site", {
        key: this.key
      }, [
        h("div.title", [
          h("h3.name", h("a", {
            href: this.getHref()
          }, row.content.title)), h("div.size", {
            title: "Site size limit: " + (Text.formatSize(row.size_limit * 1024 * 1024))
          }, [
            "" + (Text.formatSize(row.settings.size)), h("div.bar", h("div.bar-active", {
              style: "width: " + (100 * (row.settings.size / (row.size_limit * 1024 * 1024))) + "%"
            }))
          ]), h("div.plus", "+"), h("div.size.size-optional", {
            title: "Optional files on site: " + (Text.formatSize(row.settings.size_optional))
          }, [
            "" + (Text.formatSize(row.settings.optional_downloaded)), h("span.size-title", "Optional"), h("div.bar", h("div.bar-active", {
              style: "width: " + (100 * (row.settings.optional_downloaded / row.settings.size_optional)) + "%"
            }))
          ]), h("a.helps", {
            href: "#",
            onmousedown: this.handleHelpsClick,
            onclick: Page.returnFalse
          }, h("div.icon-share"), this.row.settings.autodownloadoptional ? "\u2661" : this.optional_helps.length, h("div.icon-arrow-down"), this.menu_helps ? this.menu_helps.render() : void 0), this.renderCircle(parseFloat((row.settings.bytes_sent / row.settings.bytes_recv).toFixed(1)), 10), h("div.circle-value", {
            classes: {
              negative: ratio < 1
            },
            style: "color: hsl(" + ratio_hue + ", 70%, 60%)"
          }, ratio), h("div.transfers", [
            h("div.up", {
              "title": "Uploaded"
            }, "\u22F0 \u00A0" + (Text.formatSize(row.settings.bytes_sent))), h("div.down", {
              "title": "Downloaded"
            }, "\u22F1 \u00A0" + (Text.formatSize(row.settings.bytes_recv)))
          ])
        ]), this.files.render()
      ]);
    };

    return Site;

  })(Class);

  window.Site = Site;

}).call(this);

/* ---- PageSites/SiteList.coffee ---- */


(function() {
  var SiteList,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SiteList = (function(superClass) {
    extend(SiteList, superClass);

    function SiteList() {
      this.onSiteInfo = bind(this.onSiteInfo, this);
      this.render = bind(this.render, this);
      this.renderSection = bind(this.renderSection, this);
      this.handleSectionClick = bind(this.handleSectionClick, this);
      this.handleSiteListMoreClick = bind(this.handleSiteListMoreClick, this);
      this.handleFilterClear = bind(this.handleFilterClear, this);
      this.handleFilterKeyup = bind(this.handleFilterKeyup, this);
      this.handleFilterInput = bind(this.handleFilterInput, this);
      this.renderMergedSites = bind(this.renderMergedSites, this);
      this.reorder = bind(this.reorder, this);
      this.sortRows = bind(this.sortRows, this);
      this.reorderTimer = bind(this.reorderTimer, this);
      this.item_list = new ItemList(Site, "address");
      this.sites = this.item_list.items;
      this.sites_byaddress = this.item_list.items_bykey;
      this.inactive_demo_sites = null;
      this.loaded = false;
      this.on_loaded = new Promise();
      this.schedule_reorder = false;
      this.merged_db = {};
      this.filtering = "";
      setInterval(this.reorderTimer, 10000);
      this.limit = 100;
      this.should_animate = false;
      Page.on_settings.then((function(_this) {
        return function() {
          return Page.on_server_info.then(function() {
            _this.update();
            return Page.cmd("channelJoinAllsite", {
              "channel": "siteChanged"
            });
          });
        };
      })(this));
    }

    SiteList.prototype.reorderTimer = function() {
      if (!this.schedule_reorder) {
        return;
      }
      if (!document.querySelector('.left:hover') && !document.querySelector(".working") && !Page.mode === "Files") {
        this.reorder();
        return this.schedule_reorder = false;
      }
    };

    SiteList.prototype.sortRows = function(rows) {
      if (Page.settings.sites_orderby === "modified") {
        rows.sort(function(a, b) {
          return b.row.settings.modified - a.row.settings.modified;
        });
      } else if (Page.settings.sites_orderby === "addtime") {
        rows.sort(function(a, b) {
          return b.row.settings.added - a.row.settings.added;
        });
      } else if (Page.settings.sites_orderby === "size") {
        rows.sort(function(a, b) {
          return b.row.settings.size - a.row.settings.size;
        });
      } else {
        rows.sort(function(a, b) {
          return Math.max(b.row.peers, b.row.settings.peers) - Math.max(a.row.peers, a.row.settings.peers);
        });
      }
      return rows;
    };

    SiteList.prototype.reorder = function() {
      this.sortRows(this.item_list.items);
      return Page.projector.scheduleRender();
    };

    SiteList.prototype.update = function() {
      var args;
      if (Page.server_info.rev >= 3660) {
        args = {
          connecting_sites: true
        };
      } else {
        args = {};
      }
      Page.cmd("siteList", args, (function(_this) {
        return function(site_rows) {
          var favorite_sites;
          favorite_sites = Page.settings.favorite_sites;
          _this.item_list.sync(site_rows);
          _this.sortRows(_this.item_list.items);
          if (_this.inactive_demo_sites === null) {
            _this.updateInactiveDemoSites();
          }
          Page.projector.scheduleRender();
          _this.loaded = true;
          _this.log("loaded");
          return _this.on_loaded.resolve();
        };
      })(this));
      return this;
    };

    SiteList.prototype.updateInactiveDemoSites = function() {
      var demo_site_rows, i, len, results, site_row;
      demo_site_rows = [
        {
          address: "1TaLkFrMwvbNsooF4ioKAY9EuxTBTjipT",
          demo: true,
          content: {
            title: "ZeroTalk",
            domain: "Talk.ZeroNetwork.bit"
          },
          settings: {}
        }, {
          address: "1BLogC9LN4oPDcruNz3qo1ysa133E9AGg8",
          demo: true,
          content: {
            title: "ZeroBlog",
            domain: "Blog.ZeroNetwork.bit"
          },
          settings: {}
        }, {
          address: "1MaiL5gfBM1cyb4a8e3iiL8L5gXmoAJu27",
          demo: true,
          content: {
            title: "ZeroMail",
            domain: "Mail.ZeroNetwork.bit"
          },
          settings: {}
        }, {
          address: "1uPLoaDwKzP6MCGoVzw48r4pxawRBdmQc",
          demo: true,
          content: {
            title: "ZeroUp"
          },
          settings: {}
        }, {
          address: "1Gif7PqWTzVWDQ42Mo7np3zXmGAo3DXc7h",
          demo: true,
          content: {
            title: "GIF Time"
          },
          settings: {}
        }, {
          address: "1SiTEs2D3rCBxeMoLHXei2UYqFcxctdwB",
          demo: true,
          content: {
            title: "More @ ZeroSites",
            domain: "Sites.ZeroNetwork.bit"
          },
          settings: {}
        }
      ];
      if (Page.server_info.rev >= 1400) {
        demo_site_rows.push({
          address: "1MeFqFfFFGQfa1J3gJyYYUvb5Lksczq7nH",
          demo: true,
          content: {
            title: "ZeroMe",
            domain: "Me.ZeroNetwork.bit"
          },
          settings: {}
        });
      }
      this.inactive_demo_sites = [];
      results = [];
      for (i = 0, len = demo_site_rows.length; i < len; i++) {
        site_row = demo_site_rows[i];
        if (this.filtering && site.row.content.title.toLowerCase().indexOf(this.filtering.toLowerCase()) === -1) {
          continue;
        }
        if (!this.sites_byaddress[site_row.address]) {
          results.push(this.inactive_demo_sites.push(new Site(site_row)));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    SiteList.prototype.renderMergedSites = function() {
      var back, i, len, merged_db, merged_sites, merged_type, name, ref, site;
      merged_db = {};
      ref = this.sites_merged;
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        if (!site.row.content.merged_type) {
          continue;
        }
        if (merged_db[name = site.row.content.merged_type] == null) {
          merged_db[name] = [];
        }
        merged_db[site.row.content.merged_type].push(site);
      }
      back = [];
      for (merged_type in merged_db) {
        merged_sites = merged_db[merged_type];
        back.push(this.renderSection(".merged.merged-" + merged_type, "Merged: " + merged_type, merged_sites));
      }
      return back;
    };

    SiteList.prototype.handleFilterInput = function(e) {
      return this.filtering = e.target.value;
    };

    SiteList.prototype.handleFilterKeyup = function(e) {
      if (e.keyCode === 27) {
        e.target.value = "";
        this.handleFilterInput(e);
      }
      return false;
    };

    SiteList.prototype.handleFilterClear = function(e) {
      e.target.value = "";
      this.handleFilterInput(e);
      return false;
    };

    SiteList.prototype.handleSiteListMoreClick = function(e) {
      this.limit += 1000;
      Page.projector.scheduleRender();
      return false;
    };

    SiteList.prototype.handleSectionClick = function(e) {
      var class_name;
      this.should_animate = true;
      class_name = e.currentTarget.getAttribute("class_name");
      if (Page.settings.sites_section_hide[class_name]) {
        delete Page.settings.sites_section_hide[class_name];
      } else {
        Page.settings.sites_section_hide[class_name] = true;
      }
      Page.saveSettings();
      Page.projector.scheduleRender();
      return false;
    };

    SiteList.prototype.renderSection = function(class_name, title, items, limit) {
      var classes, items_limited;
      if (limit == null) {
        limit = null;
      }
      if (items.length === 0) {
        return null;
      }
      classes = {
        "hidden": Page.settings.sites_section_hide[class_name]
      };
      if (limit && items.length > limit) {
        items_limited = items.slice(0, +limit + 1 || 9e9);
      } else {
        items_limited = items;
      }
      return [
        h("h2.SiteSection.section" + class_name, {
          classes: classes
        }, h("a.section-title", {
          href: "#Show",
          onclick: this.handleSectionClick,
          class_name: class_name
        }, [title, h("span.hide-title", "[Show " + items.length + " sites]")])), !classes.hidden ? h("div.SiteList" + class_name, {
          classes: classes,
          exitAnimation: Animation.slideUp,
          enterAnimation: Animation.slideDown,
          animate_disable: !this.should_animate
        }, [
          [
            items_limited.map(function(item) {
              return item.render();
            })
          ], limit && items.length > limit ? h("a.site-list-more", {
            href: "#Show+more+connected+sites",
            onclick: this.handleSiteListMoreClick
          }, "Show more") : void 0
        ]) : void 0
      ];
    };

    SiteList.prototype.render = function() {
      var filter_base, i, len, num_found, ref, ref1, ref2, site;
      if (!this.loaded) {
        return h("div#SiteList");
      }
      this.sites_needaction = [];
      this.sites_favorited = [];
      this.sites_owned = [];
      this.sites_recent = [];
      this.sites_connected = [];
      this.sites_connecting = [];
      this.sites_merged = [];
      num_found = 0;
      ref = this.sites;
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        if (this.filtering) {
          filter_base = site.row.content.title + site.row.content.merged_type + site.row.address;
          if (filter_base.toLowerCase().indexOf(this.filtering.toLowerCase()) === -1) {
            continue;
          }
        }
        if (site.row.settings.size * 1.2 > site.row.size_limit * 1024 * 1024) {
          site.row.need_limit = site.row.size_limit * 2;
          this.sites_needaction.push(site);
        } else if (site.favorite) {
          this.sites_favorited.push(site);
        } else if (site.row.content.merged_type) {
          this.sites_merged.push(site);
        } else if ((ref1 = site.row.settings) != null ? ref1.own : void 0) {
          this.sites_owned.push(site);
        } else if (((ref2 = site.row.settings) != null ? ref2.downloaded : void 0) > Time.timestamp() - 60 * 60 * 24) {
          this.sites_recent.push(site);
        } else if (site.row.content.title) {
          this.sites_connected.push(site);
        } else {
          this.sites_connecting.push(site);
        }
        num_found += 1;
      }
      return h("div#SiteList", [
        this.sites.length > 10 ? h("input.site-filter", {
          placeholder: "Filter: Site name",
          spellcheck: false,
          oninput: this.handleFilterInput,
          onkeyup: this.handleFilterKeyup,
          value: this.filtering
        }) : void 0, this.filtering ? [
          h("span.filter-num", {
            updateAnimation: Animation.show,
            enterAnimation: Animation.show,
            exitAnimation: Animation.hide
          }, "(found " + num_found + " of " + this.sites.length + " sites)"), h("a.filter-clear", {
            href: "#clear",
            onclick: this.handleFilterClear
          }, "\u00D7")
        ] : void 0, this.renderSection(".recent", "Recently downloaded:", this.sites_recent), this.renderSection(".needaction", "Running out of size limit:", this.sites_needaction), this.renderSection(".favorited", "Favorited sites:", this.sites_favorited), this.renderSection(".owned", "Owned sites:", this.sites_owned), this.renderSection(".connecting", "Connecting sites:", this.sites_connecting), this.renderSection(".connected", "Connected sites:", this.sites_connected, this.limit), this.renderMergedSites(), this.inactive_demo_sites !== null && this.inactive_demo_sites.length > 0 ? this.renderSection(".more", "More sites:", this.inactive_demo_sites) : void 0
      ]);
    };

    SiteList.prototype.onSiteInfo = function(site_info) {
      var ref;
      if ((ref = this.item_list.items_bykey[site_info.address]) != null) {
        ref.setRow(site_info);
      }
      this.schedule_reorder = true;
      return Page.projector.scheduleRender();
    };

    return SiteList;

  })(Class);

  window.SiteList = SiteList;

}).call(this);

/* ---- PageSites/Trigger.coffee ---- */


(function() {
  var Trigger,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Trigger = (function(superClass) {
    extend(Trigger, superClass);

    function Trigger() {
      this.render = bind(this.render, this);
      this.handleTitleClick = bind(this.handleTitleClick, this);
      this.active = false;
    }

    Trigger.prototype.handleTitleClick = function() {
      this.active = !this.active;
      if (this.active) {
        document.getElementById("left").classList.add("trigger-on");
      } else {
        document.getElementById("left").classList.remove("trigger-on");
      }
      return false;
    };

    Trigger.prototype.render = function() {
      return h("div.Trigger", {
        classes: {
          "active": this.active
        }
      }, [
        h("a.icon", {
          "href": "#Trigger",
          onclick: this.handleTitleClick,
          ontouchend: ""
        }, h("div.arrow-right"))
      ]);
    };

    return Trigger;

  })(Class);

  window.Trigger = Trigger;

}).call(this);

/* ---- PageStats/Chart.coffee ---- */


(function() {
  var Chart,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Chart = (function(superClass) {
    extend(Chart, superClass);

    function Chart() {
      this.render = bind(this.render, this);
      this.updateChart = bind(this.updateChart, this);
      this.update = bind(this.update, this);
      this.getTitle = bind(this.getTitle, this);
      this.initChart = bind(this.initChart, this);
      this.query = "";
      this.title = "";
      this.value = "";
      this.line_data = [];
      this.details = [];
      this.colorize = "cc00ff0a";
      this.chart_ctx = null;
      this.chart_type_name = null;
      this.need_update = false;
    }

    Chart.prototype.initChart = function(node) {
      this.chart_canvas = node;
      return this.chart_ctx = node.getContext("2d");
    };

    Chart.prototype.getTitle = function() {
      return this.title;
    };

    Chart.prototype.update = function() {
      var query_type_data, type_name;
      Page.cmd("chartDbQuery", this.getChartQuery(), (function(_this) {
        return function(res) {
          var j, len, row;
          _this.line_data = [];
          for (j = 0, len = res.length; j < len; j++) {
            row = res[j];
            _this.line_data.push(row.value);
          }
          _this.line_data.reverse();
          return _this.updateChart();
        };
      })(this));
      query_type_data = "SELECT * FROM data\nWHERE\n type_id IN :type_ids AND\n date_added = (SELECT date_added FROM data ORDER BY data_id DESC LIMIT 1)";
      return Page.cmd("chartDbQuery", [
        query_type_data, {
          type_ids: (function() {
            var j, len, ref, results;
            ref = this.type_names;
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              type_name = ref[j];
              results.push(Page.page_stats.type_id_db[type_name]);
            }
            return results;
          }).call(this)
        }
      ], (function(_this) {
        return function(res) {
          var j, len, row, type_data;
          type_data = {};
          for (j = 0, len = res.length; j < len; j++) {
            row = res[j];
            type_data[Page.page_stats.type_name_db[row.type_id]] = row.value;
          }
          _this.details = typeof _this.formatDetails === "function" ? _this.formatDetails(type_data) : void 0;
          _this.value = typeof _this.formatValue === "function" ? _this.formatValue(type_data) : void 0;
          return Page.projector.scheduleRender();
        };
      })(this));
    };

    Chart.prototype.updateChart = function() {
      var data, data_max, data_min, gradient, i, j, len, line_y, ref, step, stroke;
      this.chart_ctx.clearRect(0, 0, this.chart_canvas.width, this.chart_canvas.height);
      stroke = this.chart_ctx.createLinearGradient(0, 0, 900, 0);
      stroke.addColorStop(0, this.chart_stroke[0]);
      stroke.addColorStop(1, this.chart_stroke[1]);
      this.chart_ctx.lineWidth = 4;
      this.chart_ctx.strokeStyle = stroke;
      this.chart_ctx.fillStyle = '#66666611';
      gradient = this.chart_ctx.createLinearGradient(0, 200, 0, 400);
      gradient.addColorStop(0, "#42324599");
      gradient.addColorStop(1, "#2C2E3700");
      this.chart_ctx.fillStyle = gradient;
      this.chart_ctx.beginPath();
      this.chart_ctx.moveTo(-10, 0);
      step = 900 / (this.line_data.length - 2);
      data_max = Math.max.apply(null, this.line_data);
      data_min = Math.min.apply(null, this.line_data);
      ref = this.line_data;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        data = ref[i];
        line_y = 250 - ((data - data_min) / (data_max - data_min)) * 120;
        this.chart_ctx.lineTo((i - 1) * step, line_y);
      }
      this.chart_ctx.lineTo((i + 1) * step, line_y);
      this.chart_ctx.lineTo(i * step, 450);
      this.chart_ctx.lineTo(0, 450);
      this.chart_ctx.fill();
      this.chart_ctx.stroke();
      return this.chart_ctx.shadowBlur = 0;
    };

    Chart.prototype.render = function() {
      if (this.need_update) {
        this.update();
        this.need_update = false;
      }
      return h("div.Chart", {
        style: "background-image: radial-gradient(at 29% top, #eaaeda05, " + this.colorize + ")"
      }, [
        h("div.titles", [
          h("div.title", this.getTitle()), h("div.value", this.value), h("div.details", this.details.map((function(_this) {
            return function(detail) {
              return [
                detail, h("br", {
                  key: detail
                })
              ];
            };
          })(this)))
        ]), h("canvas.canvas", {
          afterCreate: this.initChart,
          width: 900,
          height: 400
        })
      ]);
    };

    return Chart;

  })(Class);

  window.Chart = Chart;

}).call(this);

/* ---- PageStats/ChartBig.coffee ---- */


(function() {
  var ChartBig,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ChartBig = (function(superClass) {
    extend(ChartBig, superClass);

    function ChartBig() {
      this.render = bind(this.render, this);
      this.initChart = bind(this.initChart, this);
      this.storeCanvasNode = bind(this.storeCanvasNode, this);
      this.update = bind(this.update, this);
      var types;
      this.need_update = false;
      this.data = {};
      this.data_max = {};
      this.data_total = {};
      types = {};
    }

    ChartBig.prototype.update = function(cb) {
      var date_added_from, date_added_to, interval, query, query_group, query_select, step, type, type_ids;
      if (Page.params.interval === "1w") {
        interval = 60 * 60 * 24 * 7;
        step = 60 * 60;
        query_select = "MAX(date_added) AS date_added, type_id, SUM(value) AS value";
        query_group = "GROUP BY type_id, strftime('%Y-%m-%d %H', date_added, 'unixepoch', 'localtime')";
      } else {
        interval = 60 * 60 * 24;
        step = 60 * 5;
        query_select = "*";
        query_group = "";
      }
      if (Page.params.date_added_to) {
        date_added_to = (new Date(Page.params.date_added_to + " 23:59")).getTime() / 1000;
        date_added_from = date_added_to - interval;
      } else {
        date_added_to = Time.timestamp();
        date_added_from = Time.timestamp() - interval;
      }
      query = "SELECT " + query_select + " FROM data\nWHERE type_id IN :type_ids AND date_added >= :date_added_from AND date_added <= :date_added_to\n" + query_group + "\nORDER BY date_added";
      type_ids = (function() {
        var j, len, ref, results;
        ref = this.types;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          type = ref[j];
          results.push(Page.page_stats.type_id_db[type.name]);
        }
        return results;
      }).call(this);
      return Page.cmd("chartDbQuery", [
        query, {
          type_ids: type_ids,
          date_added_from: date_added_from,
          date_added_to: date_added_to
        }
      ], (function(_this) {
        return function(res) {
          var data_date_added, data_found, data_value, dataset, i, j, k, l, len, len1, len2, len3, len4, m, n, row, type_id, type_name;
          _this.logStart("Parse result");
          _this.data = {
            labels: []
          };
          _this.data_max = {};
          _this.data_total = {};
          for (j = 0, len = type_ids.length; j < len; j++) {
            type_id = type_ids[j];
            _this.data[type_id] = {};
            _this.data_max[Page.page_stats.type_name_db[type_id]] = 0;
            _this.data_total[Page.page_stats.type_name_db[type_id]] = 0;
          }
          for (k = 0, len1 = res.length; k < len1; k++) {
            row = res[k];
            type_name = Page.page_stats.type_name_db[row.type_id];
            _this.data[row.type_id][Math.ceil(row.date_added / step) * step] = row.value;
            _this.data_max[type_name] = Math.max(row.value, _this.data_max[type_name]);
            _this.data_total[type_name] += row.value;
          }
          _this.configuration.options.scales.yAxes[0].ticks.suggestedMax = Math.max(_this.data_max["file_bytes_sent"], _this.data_max["file_bytes_recv"]);
          _this.configuration.options.scales.yAxes[0].ticks.suggestedMin = 0 - _this.configuration.options.scales.yAxes[0].ticks.suggestedMax;
          _this.configuration.options.scales.yAxes[1].ticks.suggestedMax = Math.max(_this.data_max["request_num_sent"], _this.data_max["request_num_recv"]);
          _this.configuration.options.scales.yAxes[1].ticks.suggestedMin = 0 - _this.configuration.options.scales.yAxes[1].ticks.suggestedMax;
          for (i = l = 0, len2 = type_ids.length; l < len2; i = ++l) {
            type_id = type_ids[i];
            dataset = _this.configuration.data.datasets[_this.types[i].dataset_id];
            dataset.data.length = 0;
            dataset.data_i = 0;
          }
          _this.configuration.data.labels.length = 0;
          _this.configuration.data.labels_i = 0;
          data_date_added = Math.ceil(date_added_from / step) * step;
          while (data_date_added <= date_added_to) {
            if (!data_found) {
              for (i = m = 0, len3 = type_ids.length; m < len3; i = ++m) {
                type_id = type_ids[i];
                if (_this.data[type_id][data_date_added]) {
                  data_found = true;
                  break;
                }
              }
              if (!data_found) {
                data_date_added += step;
                continue;
              }
            }
            for (i = n = 0, len4 = type_ids.length; n < len4; i = ++n) {
              type_id = type_ids[i];
              data_value = _this.data[type_id][data_date_added];
              dataset = _this.configuration.data.datasets[_this.types[i].dataset_id];
              type = _this.types[i];
              if (type.negative) {
                data_value = 0 - data_value;
              }
              dataset.data[dataset.data_i] = data_value;
              dataset.data_i += 1;
            }
            _this.configuration.data.labels.push(data_date_added * 1000);
            _this.configuration.data.labels_i += 1;
            data_date_added += step;
          }
          _this.logEnd("Parse result", "labels: " + _this.configuration.data.labels.length);
          if (_this.chart) {
            _this.chart.update();
          } else {
            _this.initChart();
          }
          if (typeof cb === "function") {
            cb();
          }
          return Page.projector.scheduleRender();
        };
      })(this));
    };

    ChartBig.prototype.storeCanvasNode = function(node) {
      if (this.chart) {
        this.chart.clear();
        this.chart.destroy();
        this.chart = null;
      }
      node.parentNode.style.height = node.getBoundingClientRect().height + "px";
      this.ctx = node.getContext("2d");
      this.chart_node = node;
      return this.configuration != null ? this.configuration : this.configuration = this.getChartConfiguration();
    };

    ChartBig.prototype.initChart = function() {
      var timer_resize;
      this.log("initChart");
      this.chart = new Chart(this.ctx, this.configuration);
      setTimeout(((function(_this) {
        return function() {
          return _this.chart_node.parentNode.style.height = "";
        };
      })(this)), 100);
      timer_resize = null;
      return window.addEventListener("resize", (function(_this) {
        return function() {
          clearInterval(timer_resize);
          return setTimeout((function() {
            return _this.chart.resize();
          }), 300);
        };
      })(this));
    };

    ChartBig.prototype.testDataAddition = function() {
      var timer_i;
      timer_i = 0;
      return setInterval(((function(_this) {
        return function() {
          var data, dataset, i, j, k, len, len1, new_data, new_labels, type_id;
          new_labels = _this.configuration.data.labels.slice();
          new_data = _this.configuration.data.datasets[_this.types[0].dataset_id].data.slice();
          _this.configuration.data.labels = [];
          timer_i += 1;
          for (i = j = 0, len = type_ids.length; j < len; i = ++j) {
            type_id = type_ids[i];
            dataset = _this.configuration.data.datasets[_this.types[i].dataset_id];
            dataset.data.push(Math.round(Math.random() * 10));
            dataset.data.shift();
          }
          for (k = 0, len1 = new_data.length; k < len1; k++) {
            data = new_data[k];
            _this.configuration.data.datasets[_this.types[0].dataset_id].data.push(data);
          }
          _this.configuration.data.labels = new_labels;
          _this.configuration.data.labels.push(1000 * (Time.timestamp() + (timer_i * 60 * 5)));
          _this.configuration.data.labels.shift();
          return _this.chart.update();
        };
      })(this)), 5000);
    };

    ChartBig.prototype.createGradientStroke = function(stops) {
      var color, gradient, i, j, len;
      gradient = this.ctx.createLinearGradient(0, 0, 900, 0);
      for (i = j = 0, len = stops.length; j < len; i = ++j) {
        color = stops[i];
        gradient.addColorStop(i * (1 / (stops.length - 1)), color);
      }
      return gradient;
    };

    ChartBig.prototype.createGradientFill = function(stops, mode) {
      var color, gradient, i, j, len;
      if (mode == null) {
        mode = "normal";
      }
      if (mode === "lower") {
        gradient = this.ctx.createLinearGradient(0, 0, 0, 300);
      } else {
        gradient = this.ctx.createLinearGradient(0, 50, 0, 200);
      }
      for (i = j = 0, len = stops.length; j < len; i = ++j) {
        color = stops[i];
        gradient.addColorStop(i * (1 / (stops.length - 1)), color);
      }
      return gradient;
    };

    ChartBig.prototype.getChartConfiguration = function() {
      var configuration, gradient_fill, gradient_fill_down, gradient_fill_up, gradient_stroke, gradient_stroke_bgline_down, gradient_stroke_bgline_up, gradient_stroke_down, gradient_stroke_up;
      gradient_stroke = this.createGradientStroke(["#5A46DF", "#8F49AA", "#D64C57"]);
      gradient_stroke_bgline_up = this.createGradientStroke(["#EEAAFF11", "#EEAAFF33", "#2da3b366"]);
      gradient_stroke_bgline_down = this.createGradientStroke(["#EEAAFF11", "#EEAAFF33", "#80623f88"]);
      gradient_stroke_up = this.createGradientStroke(["#2b68d9", "#2f99be", "#1dfc59"]);
      gradient_stroke_down = this.createGradientStroke(["#bac735", "#c2a548", "#f1294b"]);
      gradient_fill = this.createGradientFill(["#50455DEE", "#26262C33"]);
      gradient_fill_up = this.createGradientFill(["#1dfc5922", "#2f373333"]);
      gradient_fill_down = this.createGradientFill(["#45353533", "#f1294b22"], "lower");
      configuration = {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              type: 'line',
              label: "Upload",
              borderColor: gradient_stroke_up,
              pointBorderColor: gradient_stroke_up,
              pointBackgroundColor: gradient_stroke_up,
              pointHoverBackgroundColor: gradient_stroke_up,
              pointHoverBorderColor: gradient_stroke_up,
              pointHoverRadius: 2,
              pointRadius: 0,
              steppedLine: true,
              fill: true,
              backgroundColor: gradient_fill_up,
              borderWidth: 1,
              lineTension: 0,
              data: []
            }, {
              type: 'line',
              label: "Download",
              borderColor: gradient_stroke_down,
              pointBorderColor: gradient_stroke_down,
              pointBackgroundColor: gradient_stroke_down,
              pointHoverBackgroundColor: gradient_stroke_down,
              pointHoverBorderColor: gradient_stroke_down,
              pointHoverRadius: 2,
              pointRadius: 0,
              steppedLine: true,
              fill: true,
              backgroundColor: gradient_fill_down,
              borderWidth: 1,
              lineTension: 0,
              data: []
            }, {
              type: 'line',
              label: "Sent",
              borderColor: gradient_stroke_bgline_up,
              backgroundColor: "rgba(255,255,255,0.0)",
              pointRadius: 0,
              borderWidth: 1,
              pointHoverRadius: 2,
              pointHoverBackgroundColor: gradient_stroke_bgline_up,
              pointHoverBorderColor: gradient_stroke_bgline_up,
              fill: true,
              yAxisID: 'Request',
              steppedLine: true,
              lineTension: 0,
              data: []
            }, {
              type: 'line',
              label: "Received",
              borderColor: gradient_stroke_bgline_down,
              backgroundColor: "rgba(255,255,255,0.0)",
              pointRadius: 0,
              borderWidth: 1,
              pointHoverRadius: 2,
              pointHoverBackgroundColor: gradient_stroke_bgline_down,
              pointHoverBorderColor: gradient_stroke_bgline_down,
              fill: true,
              yAxisID: 'Request',
              steppedLine: true,
              lineTension: 0,
              data: []
            }
          ]
        },
        options: {
          animation: {
            easing: "easeOutExpo",
            duration: 2000
          },
          legend: {
            display: false,
            position: "top",
            labels: {
              fontColor: 'white'
            }
          },
          title: {
            display: false
          },
          tooltips: {
            mode: "index",
            intersect: false,
            displayColors: false,
            xPadding: 10,
            yPadding: 10,
            cornerRadius: 0,
            caretPadding: 10,
            bodyFontColor: "rgba(255,255,255,0.6)",
            callbacks: {
              title: function(tootlip_items, data) {
                return Time.date(tootlip_items[0].xLabel, "long").replace(/:00$/, "");
              },
              label: function(tootlip_items, data) {
                if (data.datasets[tootlip_items.datasetIndex].yAxisID === "Request") {
                  return data.datasets[tootlip_items.datasetIndex].label + ": " + Math.abs(tootlip_items.yLabel) + " requests";
                } else {
                  return data.datasets[tootlip_items.datasetIndex].label + ": " + Text.formatSize(Math.abs(tootlip_items.yLabel));
                }
              }
            }
          },
          hover: {
            mode: "index",
            intersect: false
          },
          scales: {
            yAxes: [
              {
                id: 'Transfer',
                ticks: {
                  fontColor: "rgba(100,110,132,1)",
                  fontStyle: "bold",
                  beginAtZero: true,
                  suggestedMax: 30000000,
                  suggestedMin: -30000000,
                  display: true,
                  padding: 30,
                  callback: function(value) {
                    return Text.formatSize(Math.abs(value));
                  }
                },
                gridLines: {
                  drawTicks: true,
                  drawBorder: false,
                  display: true,
                  zeroLineColor: "rgba(255,255,255,0.1)",
                  tickMarkLength: 20,
                  zeroLineBorderDashOffset: 100,
                  color: "rgba(255,255,255,0.05)"
                }
              }, {
                id: 'Request',
                position: "right",
                ticks: {
                  beginAtZero: true,
                  maxTicksLimit: 5,
                  suggestedMax: 180,
                  suggestedMin: -180,
                  display: false
                },
                gridLines: {
                  display: false,
                  zeroLineColor: "rgba(255,255,255,0)",
                  drawBorder: false
                }
              }
            ],
            xAxes: [
              {
                type: "time",
                gridLines: {
                  color: "rgba(255,255,255,0.1)",
                  display: false,
                  offsetGridLines: true,
                  drawBorder: false
                },
                ticks: {
                  padding: 15,
                  fontColor: "rgba(100,110,132,1)",
                  fontStyle: "bold",
                  callback: (function(_this) {
                    return function(data_label, index) {
                      var back, parts;
                      if (_this.last_data_label == null) {
                        _this.last_data_label = "None 00 00:00";
                      }
                      if (_this.last_data_label.match(/.* /)[0] === data_label.match(/.* /)[0]) {
                        back = ["", data_label.replace(/.* /, "")];
                      } else {
                        parts = data_label.split(" ");
                        if (parts.length !== 3) {
                          return data_label;
                        }
                        back = [parts[0] + " " + parts[1], parts[2]];
                      }
                      _this.last_data_label = data_label;
                      return back;
                    };
                  })(this)
                },
                time: {
                  displayFormats: {
                    'second': 'MMM DD HH:mm',
                    'minute': 'MMM DD HH:mm',
                    'hour': 'MMM DD HH:mm',
                    'day': 'MMM DD HH:mm',
                    'week': 'MMM DD HH:mm',
                    'month': 'MMM DD HH:mm',
                    'quarter': 'MMM DD HH:mm',
                    'year': 'MMM DD HH:mm'
                  }
                }
              }
            ]
          }
        }
      };
      return configuration;
    };

    ChartBig.prototype.render = function() {
      if (this.need_update) {
        this.update();
        this.need_update = false;
      }
      return h("div.ChartBig", [
        h("canvas." + Page.params.interval, {
          width: 1350,
          height: 450,
          afterCreate: this.storeCanvasNode,
          updateAnimation: Animation.show,
          mode: Page.params.interval
        })
      ]);
    };

    return ChartBig;

  })(Class);

  window.ChartBig = ChartBig;

}).call(this);

/* ---- PageStats/ChartLegend.coffee ---- */


(function() {
  var ChartLegend,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ChartLegend = (function(superClass) {
    extend(ChartLegend, superClass);

    function ChartLegend() {
      this.renderItem = bind(this.renderItem, this);
      this.items_left = [];
      this.items_right = [];
    }

    ChartLegend.prototype.renderItem = function(item) {
      var hidden, value;
      this.i += 1;
      if (item.dot == null) {
        item.dot = "\u25CF";
      }
      value = item.getValue();
      hidden = !value;
      if (item.post) {
        value += " " + item.post;
      }
      if (item.type === "ratio") {
        return h("div.legend-item", {
          classes: {
            hidden: hidden
          }
        }, [
          h("div.title", item.title), h("div.value", [
            h("span", {
              updateAnimation: Animation.show,
              delay: this.i * 0.1
            }, Math.round(value * 10) / 10), h("div.dots-container", [
              h("span.dots.dots-fg", {
                style: "width: " + (Math.min(value, 5) * 11.5) + "px; color: " + item.color
              }, item.dot.repeat(5)), h("span.dots.dots-bg", item.dot.repeat(5))
            ])
          ])
        ]);
      } else {
        return h("div.legend-item", {
          classes: {
            hidden: hidden
          }
        }, [
          h("div.title", [
            h("span.dot", {
              style: "color: " + item.color
            }, item.dot + " "), item.title
          ]), h("div.value", {
            updateAnimation: Animation.show,
            delay: this.i * 0.1
          }, value)
        ]);
      }
    };

    ChartLegend.prototype.render = function() {
      this.i = 0;
      return h("div.ChartLegend", h("div.legend-items.align-left", this.items_left.map(this.renderItem)), h("div.legend-items.align-right", this.items_right.map(this.renderItem)));
    };

    return ChartLegend;

  })(Class);

  window.ChartLegend = ChartLegend;

}).call(this);

/* ---- PageStats/ChartRadar.coffee ---- */


(function() {
  var ChartRadar,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ChartRadar = (function(superClass) {
    extend(ChartRadar, superClass);

    function ChartRadar(id) {
      this.id = id;
      this.render = bind(this.render, this);
      this.renderLabel = bind(this.renderLabel, this);
      this.handleLegendClick = bind(this.handleLegendClick, this);
      this.initChart = bind(this.initChart, this);
      this.formatLabel = bind(this.formatLabel, this);
      this.getChartConfiguration = bind(this.getChartConfiguration, this);
      this.initCanvas = bind(this.initCanvas, this);
      this.update = bind(this.update, this);
      this.configuration = {};
      this.site_stats = [];
      this.need_update = false;
      this.order_by = "site_bw";
      this.legends = [
        {
          id: "site_bw",
          title: "Transferred data (last 7 days)",
          color: "#608DECDD"
        }, {
          id: "site_size",
          title: "Site size",
          color: "#9C27B0DD"
        }
      ];
    }

    ChartRadar.prototype.update = function() {
      var query, type_ids, type_name;
      query = "SELECT type_id, site_id, SUM(value) AS sum, value\nFROM data\nWHERE type_id IN :type_ids AND date_added > " + (Time.timestamp() - 60 * 60 * 24 * 7) + "\nGROUP BY type_id, site_id";
      type_ids = (function() {
        var j, len, ref, results;
        ref = ["site_bytes_sent", "site_bytes_recv", "site_size"];
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          type_name = ref[j];
          results.push(Page.page_stats.type_id_db[type_name]);
        }
        return results;
      })();
      return Page.cmd("chartDbQuery", [
        query, {
          type_ids: type_ids
        }
      ], (function(_this) {
        return function(res) {
          var address, data, i, j, k, len, len1, max_site_bw, max_site_size, ref, row, site, stat;
          _this.logStart("Parse result", res.length);
          data = {};
          for (j = 0, len = res.length; j < len; j++) {
            row = res[j];
            address = Page.page_stats.site_address_db[row.site_id];
            type_name = Page.page_stats.type_name_db[row.type_id];
            site = Page.site_list.sites_byaddress[address];
            if (!site) {
              continue;
            }
            if (data[address] == null) {
              data[address] = {
                address: address,
                site: site
              };
            }
            if (type_name === "site_size") {
              data[address][type_name] = row.value;
            } else {
              data[address][type_name] = row.sum || 0;
            }
          }
          _this.site_stats = [];
          for (address in data) {
            stat = data[address];
            stat.site_bw = stat.site_bytes_sent + stat.site_bytes_recv;
            _this.site_stats.push(stat);
          }
          _this.site_stats.sort(function(a, b) {
            return b[_this.order_by] - a[_this.order_by];
          });
          if (_this.site_stats.length > 8) {
            _this.site_stats.length = 8;
          }
          max_site_bw = Math.max.apply(null, (function() {
            var k, len1, ref, results;
            ref = this.site_stats;
            results = [];
            for (k = 0, len1 = ref.length; k < len1; k++) {
              stat = ref[k];
              results.push(stat.site_bw);
            }
            return results;
          }).call(_this));
          max_site_size = Math.max.apply(null, (function() {
            var k, len1, ref, results;
            ref = this.site_stats;
            results = [];
            for (k = 0, len1 = ref.length; k < len1; k++) {
              stat = ref[k];
              results.push(stat.site_size);
            }
            return results;
          }).call(_this));
          ref = _this.site_stats;
          for (i = k = 0, len1 = ref.length; k < len1; i = ++k) {
            stat = ref[i];
            _this.configuration.data.labels[i] = stat.site.row.content.title;
            _this.configuration.data.datasets[0].data[i] = Math.log(1 + (stat.site_bw / max_site_bw) * 100);
            _this.configuration.data.datasets[1].data[i] = Math.log(1 + (stat.site_size / max_site_size) * 100);
          }
          _this.logEnd("Parse result", "sites: " + _this.site_stats.length);
          Page.projector.scheduleRender();
          if (_this.chart) {
            return _this.chart.update();
          } else {
            return _this.initChart();
          }
        };
      })(this));
    };

    ChartRadar.prototype.initCanvas = function(node) {
      if (this.chart) {
        this.chart.clear();
        this.chart.destroy();
        this.chart = null;
      }
      this.ctx = node.getContext("2d");
      return this.configuration = this.getChartConfiguration();
    };

    ChartRadar.prototype.getChartConfiguration = function() {
      var fill, fill2, shadowed;
      fill = this.ctx.createLinearGradient(0, 0, 900, 0);
      fill.addColorStop(0, "#608DECCC");
      fill.addColorStop(1, "#9C27B0CC");
      fill2 = this.ctx.createLinearGradient(0, 0, 900, 0);
      fill2.addColorStop(0, "#9C27B0DD");
      fill2.addColorStop(1, "#608DECDD");
      shadowed = {
        beforeDatasetsDraw: function(chart, options) {
          chart.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          return chart.ctx.shadowBlur = 40;
        },
        afterDatasetsDraw: function(chart, options) {
          chart.ctx.shadowColor = 'rgba(0, 0, 0, 0)';
          return chart.ctx.shadowBlur = 0;
        }
      };
      return {
        type: 'radar',
        data: {
          labels: [],
          datasets: [
            {
              label: "Transferred data",
              backgroundColor: fill,
              borderColor: "transparent",
              borderWidth: 0,
              pointBorderWidth: 0,
              pointRadius: 0,
              data: []
            }, {
              label: "Site size",
              backgroundColor: fill2,
              borderColor: "transparent",
              borderWidth: 0,
              pointBorderWidth: 0,
              pointRadius: 0,
              data: []
            }
          ]
        },
        options: {
          legend: {
            display: false,
            position: "bottom",
            labels: {
              padding: 5
            }
          },
          scale: {
            ticks: {
              display: false,
              maxTicksLimit: 5,
              beginAtZero: true
            },
            angleLines: {
              color: "#99999911"
            },
            gridLines: {
              color: "#99999911",
              tickMarkLength: 1
            },
            tooltips: {
              enabled: true
            },
            pointLabels: {
              fontColor: "rgba(200,210,232,1)",
              fontSize: 14,
              fontFamily: "Roboto",
              fontStyle: "lighter",
              padding: 10,
              callback: this.formatLabel
            }
          }
        },
        plugins: [shadowed]
      };
    };

    ChartRadar.prototype.formatLabel = function() {
      return [""];
    };

    ChartRadar.prototype.initChart = function() {
      var timer_resize;
      this.chart = new Chart(this.ctx, this.configuration);
      timer_resize = null;
      return window.addEventListener("resize", (function(_this) {
        return function() {
          _this.log("resize");
          clearInterval(timer_resize);
          return setTimeout((function() {
            return _this.chart.resize();
          }), 300);
        };
      })(this));
    };

    ChartRadar.prototype.handleLegendClick = function(e) {
      this.order_by = e.currentTarget.getAttribute("href").replace("#", "");
      this.update();
      return false;
    };

    ChartRadar.prototype.renderLabel = function(stat, i) {
      var left, r, top;
      if (i % (this.site_stats.length / 2) === 0) {
        r = 37;
      } else {
        r = 40;
      }
      left = 50 + r * Math.sin(2 * Math.PI * i / this.site_stats.length);
      top = 50 - r * Math.cos(2 * Math.PI * i / this.site_stats.length);
      return h("div.radar-label", {
        key: stat.address + i,
        style: "left: " + left + "%; top: " + top + "%",
        enterAnimation: Animation.show,
        exitAnimation: Animation.hide,
        delay: i * 0.05
      }, h("a.title", {
        href: stat.site.getHref()
      }, stat.site.row.content.title), " ", h("span.value", " (" + (Text.formatSize(stat[this.order_by]) || "No data yet") + ")"));
    };

    ChartRadar.prototype.render = function() {
      var label_i;
      if (this.need_update) {
        this.update();
        this.need_update = false;
      }
      label_i = 0;
      return h("div.ChartRadar", [
        h("div.radar-container", [
          h("div.radar-labels", this.site_stats.map((function(_this) {
            return function(stat) {
              var label;
              label = _this.renderLabel(stat, label_i);
              label_i += 1;
              return label;
            };
          })(this))), h("div.canvas-container", h("canvas", {
            width: 600,
            height: 600,
            afterCreate: this.initCanvas
          }))
        ]), h("div.radar-legends", this.legends.map((function(_this) {
          return function(legend) {
            return h("a.radar-legend", {
              id: legend.id,
              classes: {
                active: _this.order_by === legend.id
              },
              onclick: _this.handleLegendClick,
              href: "#" + legend.id
            }, [
              h("div.legend-box", {
                style: "background-color: " + legend.color
              }), h("span.title", legend.title)
            ]);
          };
        })(this)))
      ]);
    };

    return ChartRadar;

  })(Class);

  window.ChartRadar = ChartRadar;

}).call(this);

/* ---- PageStats/ChartTimeline.coffee ---- */


(function() {
  var ChartTimeline,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ChartTimeline = (function(superClass) {
    extend(ChartTimeline, superClass);

    function ChartTimeline() {
      this.render = bind(this.render, this);
      this.update = bind(this.update, this);
      this.updateChart = bind(this.updateChart, this);
      this.initChart = bind(this.initChart, this);
      var i, j;
      this.items = [];
      for (i = j = 6; j >= 0; i = --j) {
        this.items.push({
          id: i,
          title: "\u200B",
          data: "\u200B",
          value: i,
          active: false
        });
      }
      this.active_id = 0;
      this.chart_ctx = null;
      this.need_update = false;
      this.line_data = null;
    }

    ChartTimeline.prototype.initChart = function(node) {
      this.chart_canvas = node;
      this.chart_ctx = node.getContext("2d");
      if (this.line_data) {
        return this.updateChart();
      }
    };

    ChartTimeline.prototype.updateChart = function() {
      var data, data_last_i, data_max, i, j, len, line_width, line_x, line_y, ref, val;
      this.chart_ctx.clearRect(0, 0, this.chart_canvas.width, this.chart_canvas.height);
      this.chart_ctx.lineWidth = 0;
      this.chart_ctx.fillStyle = '#EDC54B';
      this.chart_ctx.beginPath();
      this.chart_ctx.moveTo(-10, 0);
      data_max = Math.max.apply(null, this.line_data);
      data_last_i = ((function() {
        var j, len, ref, results;
        ref = this.line_data;
        results = [];
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          val = ref[i];
          if (val > 0) {
            results.push(i);
          }
        }
        return results;
      }).call(this)).pop();
      line_width = 1400 / this.line_data.length;
      if (data_last_i == null) {
        return;
      }
      ref = this.line_data;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        data = ref[i];
        line_x = i * line_width;
        line_y = parseInt(101 - (data / data_max) * 100);
        this.chart_ctx.lineTo(line_x, line_y);
        if (i === data_last_i) {
          break;
        }
      }
      this.chart_ctx.lineTo(line_x, 120);
      this.chart_ctx.lineTo(0, 120);
      this.chart_ctx.fill();
      if (data_last_i > 36) {
        this.chart_ctx.beginPath();
        this.chart_ctx.lineWidth = 0;
        this.chart_ctx.strokeStyle = '#EDC54B';
        this.chart_ctx.setLineDash([0, 1, 1]);
        this.chart_ctx.moveTo(line_x, line_y);
        this.chart_ctx.lineTo(1500, line_y);
        return this.chart_ctx.stroke();
      }
    };

    ChartTimeline.prototype.update = function() {
      var c, data, date_added_from, date_added_to, day_total, group_steps, interval_step, query, step, type_id;
      query = "SELECT\nMAX(date_added) AS date_added, AVG(value) AS avg, SUM(value) AS sum\nFROM data\nWHERE type_id = :type_id AND date_added >= :date_added_from AND date_added <= :date_added_to\nGROUP BY strftime('%Y-%m-%d %H', date_added, 'unixepoch', 'localtime')\nORDER BY date_added DESC";
      if (Page.params.interval === "1w") {
        c = new Date();
        c.setDate(c.getDate() - (c.getDay() || 7) + 7);
        date_added_to = c.setHours(23, 59, 59, 0) / 1000;
        interval_step = 60 * 60 * 24 * 7;
        date_added_from = date_added_to - interval_step * 7;
        group_steps = 6;
      } else if (Page.params.interval === "1m") {
        c = new Date();
        c.setDate(30);
        date_added_to = c.setHours(23, 59, 59, 0) / 1000;
        interval_step = 60 * 60 * 24 * 30;
        date_added_from = date_added_to - interval_step * 30;
        group_steps = 24 * 3;
      } else {
        date_added_to = (new Date()).setHours(23, 59, 59, 0) / 1000;
        interval_step = 60 * 60 * 24;
        date_added_from = date_added_to - interval_step * 7;
        group_steps = 2;
      }
      step = 60 * 60;
      type_id = Page.page_stats.type_id_db["file_bytes_sent"];
      data = {};
      day_total = {};
      return Page.cmd("chartDbQuery", [
        query, {
          type_id: type_id,
          date_added_from: date_added_from,
          date_added_to: date_added_to
        }
      ], (function(_this) {
        return function(res) {
          var data_date_added, data_from, data_to, day_data, day_from, day_name, day_string, day_to, group_step_data, i, j, k, l, len, m, n, ref, row, x;
          _this.logStart("Parse result", res.length);
          _this.line_data = [];
          for (j = 0, len = res.length; j < len; j++) {
            row = res[j];
            data[Math.ceil(row.date_added / step) * step] = row.sum;
            day_string = Time.dateIso(row.date_added * 1000);
            if (day_total[day_string] == null) {
              day_total[day_string] = 0;
            }
            day_total[day_string] += row.sum;
          }
          data_date_added = Math.ceil(date_added_from / step) * step;
          while (data_date_added <= date_added_to) {
            group_step_data = 0;
            for (i = k = 0, ref = group_steps; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
              group_step_data += data[data_date_added] || 0;
              data_date_added += step;
            }
            _this.line_data.push(group_step_data);
          }
          _this.items = [];
          for (i = l = 7; l >= 1; i = --l) {
            data_from = date_added_to - i * interval_step + 1;
            data_to = data_from + interval_step - 1;
            if (Page.params.interval === "1w") {
              day_data = 0;
              for (x = m = 0; m <= 6; x = ++m) {
                day_data += day_total[Time.dateIso(data_from + (60 * 60 * 24 * x))] || 0;
              }
              day_from = Time.date(data_from, "day");
              day_to = Time.date(data_from + interval_step - 1, "day");
              day_to = day_to.replace(day_from.split(" ")[0], "");
              day_name = day_from + " - " + day_to;
            } else if (Page.params.interval === "1m") {
              day_data = 0;
              for (x = n = 0; n <= 30; x = ++n) {
                day_data += day_total[Time.dateIso(data_from + (60 * 60 * 24 * x))] || 0;
              }
              day_name = Time.date(data_from, "month");
            } else {
              day_data = day_total[Time.dateIso(data_from)];
              day_name = Time.weekDay(data_from);
            }
            _this.items.push({
              id: i,
              title: day_name,
              data: day_data,
              value: data_to
            });
          }
          _this.logEnd("Parse result", "data: " + _this.line_data.length);
          Page.projector.scheduleRender();
          return _this.updateChart();
        };
      })(this));
    };

    ChartTimeline.prototype.renderItem = function(item) {
      var classes, date_added_to;
      date_added_to = Time.dateIso(item.value);
      if (item.value >= Time.timestamp()) {
        date_added_to = "";
      }
      classes = {
        active: (Page.params.date_added_to || "") === date_added_to
      };
      return h("a.timeline-item", {
        key: item.title,
        enterAnimation: Animation.show,
        delay: item.id * 0.05,
        href: Page.createUrl("date_added_to", date_added_to),
        onclick: Page.handleLinkClick,
        classes: classes
      }, h("span.title", item.title), h("span.data", Text.formatSize(item.data) || "0 MB"));
    };

    ChartTimeline.prototype.render = function() {
      var ref;
      if (this.need_update) {
        this.update();
        this.need_update = false;
      }
      return h("div.ChartTimeline", [
        h("div.timeline-borders", this.items.map((function(_this) {
          return function(item) {
            var date_added_to;
            date_added_to = Time.dateIso(item.value);
            if (item.value >= Time.timestamp()) {
              date_added_to = "";
            }
            return h("div.timeline-border", {
              key: item.id,
              classes: {
                active: (Page.params.date_added_to || "") === date_added_to
              }
            });
          };
        })(this))), h("canvas.chart", {
          afterCreate: this.initChart,
          width: 1400,
          height: 100,
          data: (ref = this.line_data) != null ? ref.length : void 0,
          delay: 0.3,
          updateAnimation: Animation.show
        }), h("div.timeline-items", this.items.map((function(_this) {
          return function(item) {
            return _this.renderItem(item);
          };
        })(this)))
      ]);
    };

    return ChartTimeline;

  })(Class);

  window.ChartTimeline = ChartTimeline;

}).call(this);

/* ---- PageStats/ChartWorld.coffee ---- */


(function() {
  var ChartWorld,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ChartWorld = (function(superClass) {
    extend(ChartWorld, superClass);

    function ChartWorld() {
      this.render = bind(this.render, this);
      this.initCanvas = bind(this.initCanvas, this);
      this.drawPoints = bind(this.drawPoints, this);
      this.update = bind(this.update, this);
      this.points = [];
      this.need_update = false;
    }

    ChartWorld.prototype.update = function() {

      /*
      		@points = [
      			{lat: 0, lon: 0},
      			{lat: 30, lon: 30},
      			{lat: 33.137551, lon: 129.902344},
      			{lat: 0.351560, lon: 115.136719},
      			{lat: 40.178873, lon: -8.261719},
      			{lat: 52.482780, lon: -0.878906},
      			{lat: 47.040182, lon: 19.511719},
      			{lat: 38.548165, lon: -76.113281},
      			{lat: 40.446947, lon: -122.871094}
      			{lat: -16.972741, lon: 46.582031}
      			{lat: -35.173808, lon: 19.511719}
      			{lat: -33.431441, lon: 116.542969}
      			{lat: -45.336702, lon: 168.222656}
      			{lat: -54.977614, lon: -67.412109}
      			{lat: 8.928487, lon: -62.314453}
      			{lat: 65.20515, lon: -14.670696}
      			{lat: 64.90863, lon: -21.70194625}
      		]
      		return false
       */
      return Page.cmd("chartGetPeerLocations", [], (function(_this) {
        return function(res) {
          var country, country_db, i, item, items, j, len, len1, name, num, num_others, point, ref, ref1;
          _this.points = res;
          country_db = {};
          items = Page.page_stats.country_list.items;
          items.length = 0;
          ref = _this.points;
          for (i = 0, len = ref.length; i < len; i++) {
            point = ref[i];
            if (country_db[name = point.country] == null) {
              country_db[name] = 0;
            }
            country_db[point.country] += 1;
          }
          for (country in country_db) {
            num = country_db[country];
            items.push({
              title: country,
              value: num
            });
          }
          items.sort(function(a, b) {
            return b.value - a.value;
          });
          if (items.length > 15) {
            num_others = 0;
            ref1 = items.slice(14);
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              item = ref1[j];
              num_others += item.value;
            }
            items.length = 14;
            items.push({
              title: "Other",
              value: num_others,
              type: "other"
            });
          }
          _this.drawPoints();
          return Page.projector.scheduleRender();
        };
      })(this));
    };

    ChartWorld.prototype.drawPoints = function() {
      var i, left, len, point, ref, results, top;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ref = this.points;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        point = ref[i];
        left = (47 + (point.lon / 3.65)) * this.canvas.width / 100;
        top = (59 - (point.lat / 1.52)) * this.canvas.height / 100;
        results.push(this.ctx.fillRect(left, top, 2, 2));
      }
      return results;
    };

    ChartWorld.prototype.initCanvas = function(node) {
      this.canvas = node;
      this.ctx = node.getContext("2d");
      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.fillStyle = '#30758e';
      return this.drawPoints();
    };

    ChartWorld.prototype.render = function() {
      if (this.need_update) {
        this.update();
        this.need_update = false;
      }
      return h("div.ChartWorld", [
        h("canvas.map-points", {
          width: 878,
          height: 371,
          afterCreate: this.initCanvas
        }), h("img.map", {
          src: "img/world.png"
        })
      ]);
    };

    return ChartWorld;

  })(Class);

  window.ChartWorld = ChartWorld;

}).call(this);

/* ---- PageStats/PageStats.coffee ---- */


(function() {
  var PageStats,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  PageStats = (function(superClass) {
    extend(PageStats, superClass);

    function PageStats() {
      this.render = bind(this.render, this);
      this.loadChartjs = bind(this.loadChartjs, this);
      this.update = bind(this.update, this);
      this.handleChartjsLoad = bind(this.handleChartjsLoad, this);
      this.need_update = false;
      this.need_load_chartjs = true;
      this.chartjs_loaded = false;
      this.chart_timeline = new ChartTimeline();
      this.chart_big = new ChartBig();
      this.chart_big.types = [
        {
          name: "file_bytes_sent",
          dataset_id: 0
        }, {
          name: "file_bytes_recv",
          dataset_id: 1,
          negative: true
        }, {
          name: "request_num_sent",
          dataset_id: 2,
          negative: true
        }, {
          name: "request_num_recv",
          dataset_id: 3
        }
      ];
      this.chart_legend = new ChartLegend();
      this.chart_legend.items_left = [
        {
          title: "Upload",
          getValue: ((function(_this) {
            return function() {
              return Text.formatSize(_this.chart_big.data_total.file_bytes_sent);
            };
          })(this)),
          color: "#1dfc59"
        }, {
          title: "Download",
          getValue: ((function(_this) {
            return function() {
              return Text.formatSize(_this.chart_big.data_total.file_bytes_recv);
            };
          })(this)),
          color: "#c94d47"
        }, {
          title: "Ratio",
          getValue: ((function(_this) {
            return function() {
              return _this.chart_big.data_total.file_bytes_sent / _this.chart_big.data_total.file_bytes_recv;
            };
          })(this)),
          type: "ratio",
          color: "#16ffe9"
        }
      ];
      this.chart_legend.items_right = [
        {
          title: "Sent",
          getValue: ((function(_this) {
            return function() {
              return _this.chart_big.data_total.request_num_sent;
            };
          })(this)),
          post: "requests",
          dot: "\u2500",
          color: "#2da3b3"
        }, {
          title: "Received",
          getValue: ((function(_this) {
            return function() {
              return _this.chart_big.data_total.request_num_recv;
            };
          })(this)),
          post: "requests",
          dot: "\u2500",
          color: "#80623f"
        }
      ];
      this.chart_radar = new ChartRadar();
      this.chart_connections = new Chart();
      this.chart_connections.title = "Connections";
      this.chart_connections.type_names = ["peer", "peer_onion", "connection", "connection_onion", "connection_in", "connection_ping_avg", "connection_ping_min"];
      this.chart_connections.formatValue = function(type_data) {
        return type_data.connection + " of " + type_data.peer + " peers";
      };
      this.chart_connections.formatDetails = function(type_data) {
        var back;
        back = [];
        back.push("Onion: " + type_data.peer_onion + " peers (" + (type_data.connection_onion || 0) + " connections)");
        back.push("Incoming: " + (Math.round(type_data.connection_in / type_data.connection * 100)) + "%");
        back.push("Ping avg: " + type_data.connection_ping_avg + "ms (min: " + type_data.connection_ping_min + "ms)");
        return back;
      };
      this.chart_connections.chart_stroke = ["#608DECAA", "#D74C58FF"];
      this.chart_connections.getChartQuery = function() {
        return "SELECT * FROM data WHERE type_id = " + Page.page_stats.type_id_db['connection'] + " ORDER BY date_added DESC LIMIT 50";
      };
      this.chart_size = new Chart();
      this.chart_size.getTitle = function() {
        return h("a", {
          href: Page.createUrl("bigchart", "size"),
          onclick: Page.handleLinkClick
        }, "Total size");
      };
      this.chart_size.chart_stroke = ["#F99739AA", "#51B8F2"];
      this.chart_size.type_names = ["size", "size_optional", "optional_limit", "optional_used", "content"];
      this.chart_size.formatValue = function(type_data) {
        return Text.formatSize(type_data.size) + (" in " + Page.site_list.sites.length + " sites");
      };
      this.chart_size.formatDetails = function(type_data) {
        var back;
        back = [];
        back.push("Content sources: " + type_data.content + " files");
        back.push("Optional downloaded: " + (Text.formatSize(type_data.optional_used) || '0 MB') + " of " + (Text.formatSize(type_data.size_optional) || '0 MB') + " (limit: " + (Text.formatSize(type_data.optional_limit)) + ")");
        return back;
      };
      this.chart_size.getChartQuery = function() {
        return "SELECT CAST(value AS FLOAT) / 1024 / 1024 AS value FROM data WHERE type_id = " + Page.page_stats.type_id_db['size'] + " GROUP BY ROUND(date_added / 10000) ORDER BY date_added DESC LIMIT 50";
      };
      this.chart_world = new ChartWorld();
      this.country_list = new StatList();
      this.type_name_db = {};
      this.type_id_db = {};
      this.site_address_db = {};
      this.site_id_db = {};
      setInterval(((function(_this) {
        return function() {
          _this.need_update = true;
          return Page.projector.scheduleRender();
        };
      })(this)), 5 * 60 * 1000);
    }

    PageStats.prototype.handleChartjsLoad = function() {
      this.chartjs_loaded = true;
      return Page.projector.scheduleRender();
    };

    PageStats.prototype.update = function() {
      Page.cmd("chartDbQuery", "SELECT * FROM type", (function(_this) {
        return function(res) {
          var i, len, results, row;
          _this.type_id_db = {};
          _this.type_name_db = {};
          results = [];
          for (i = 0, len = res.length; i < len; i++) {
            row = res[i];
            _this.type_id_db[row.name] = row.type_id;
            results.push(_this.type_name_db[row.type_id] = row.name);
          }
          return results;
        };
      })(this));
      return Page.cmd("chartDbQuery", "SELECT * FROM site", (function(_this) {
        return function(res) {
          var i, len, row, sites;
          sites = {};
          _this.sites_by_id = {};
          for (i = 0, len = res.length; i < len; i++) {
            row = res[i];
            _this.site_id_db[row.address] = row.site_id;
            _this.site_address_db[row.site_id] = row.address;
          }
          _this.chart_big.need_update = true;
          _this.chart_timeline.need_update = true;
          _this.chart_connections.need_update = true;
          _this.chart_size.need_update = true;
          _this.chart_radar.need_update = true;
          _this.chart_world.need_update = true;
          return Page.projector.scheduleRender();
        };
      })(this));
    };

    PageStats.prototype.loadChartjs = function() {
      var e;
      e = document.createElement("script");
      e.type = "text/javascript";
      e.src = "chartjs/chart.bundle.min.js";
      e.onload = this.handleChartjsLoad;
      return document.body.appendChild(e);
    };

    PageStats.prototype.render = function() {
      var intervals, ref;
      if (((ref = Page.server_info) != null ? ref.rev : void 0) < 3220) {
        return h("div#PageStats", h("div.empty", [h("h4", "Need update"), h("small", "You have to update to ZeroNet version 0.6.1 to use this feature.")]));
      }
      if (this.need_update) {
        this.update();
        this.need_update = false;
      }
      if (!this.need_update && document.body.className !== "loaded") {
        setTimeout((function() {
          return document.body.classList.add("loaded");
        }), 1000);
      }
      if (this.need_load_chartjs) {
        setTimeout(this.loadChartjs, 500);
        this.need_load_chartjs = false;
      }
      intervals = ["1w", "1d"];
      return h("div#PageStats", [
        h("div.intervals", intervals.map((function(_this) {
          return function(interval) {
            var interval_param;
            if (interval === "1d") {
              interval_param = void 0;
            } else {
              interval_param = interval;
            }
            return h("a.interval", {
              href: Page.createUrl("interval", interval_param),
              onclick: Page.handleLinkClick,
              classes: {
                active: interval_param === Page.params.interval
              }
            }, interval);
          };
        })(this))), this.chart_timeline.render(), this.chartjs_loaded ? [this.chart_big.render(), this.chart_legend.render(), this.chart_radar.render(), h("div.Charts", [this.chart_connections.render(), this.chart_size.render()]), this.chart_world.render(), this.country_list.render()] : void 0
      ]);
    };

    return PageStats;

  })(Class);

  window.PageStats = PageStats;

}).call(this);

/* ---- PageStats/StatList.coffee ---- */


(function() {
  var StatList,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  StatList = (function(superClass) {
    extend(StatList, superClass);

    function StatList() {
      this.render = bind(this.render, this);
      this.renderItem = bind(this.renderItem, this);
      this.items = [];
    }

    StatList.prototype.renderItem = function(item) {
      return h("div.stat-list-item", {
        key: item.title,
        classes: {
          other: item.type === "other"
        }
      }, h("div.title", item.title), h("div.value", item.value + " peers"));
    };

    StatList.prototype.render = function() {
      return h("div.StatList", [h("h4", "Top country"), h("div.stat-list-items", this.items.map(this.renderItem))]);
    };

    return StatList;

  })(Class);

  window.StatList = StatList;

}).call(this);

/* ---- utils/Animation.coffee ---- */


(function() {
  var Animation;

  Animation = (function() {
    function Animation() {}

    Animation.prototype.slideDown = function(elem, props) {
      var cstyle, h, margin_bottom, margin_top, padding_bottom, padding_top, transition;
      if ((elem.offsetTop > 1000 && elem.getBoundingClientRect().top > 1000) || props.animate_disable) {
        return;
      }
      h = elem.offsetHeight;
      cstyle = window.getComputedStyle(elem);
      margin_top = cstyle.marginTop;
      margin_bottom = cstyle.marginBottom;
      padding_top = cstyle.paddingTop;
      padding_bottom = cstyle.paddingBottom;
      transition = cstyle.transition;
      elem.style.boxSizing = "border-box";
      elem.style.overflow = "hidden";
      elem.style.transform = "scale(0.6)";
      elem.style.opacity = "0";
      elem.style.height = "0px";
      elem.style.marginTop = "0px";
      elem.style.marginBottom = "0px";
      elem.style.paddingTop = "0px";
      elem.style.paddingBottom = "0px";
      elem.style.transition = "none";
      setTimeout((function() {
        elem.className += " animate-inout";
        elem.style.height = h + "px";
        elem.style.transform = "scale(1)";
        elem.style.opacity = "1";
        elem.style.marginTop = margin_top;
        elem.style.marginBottom = margin_bottom;
        elem.style.paddingTop = padding_top;
        return elem.style.paddingBottom = padding_bottom;
      }), 1);
      return elem.addEventListener("transitionend", function() {
        elem.classList.remove("animate-inout");
        elem.style.transition = elem.style.transform = elem.style.opacity = elem.style.height = null;
        elem.style.boxSizing = elem.style.marginTop = elem.style.marginBottom = null;
        elem.style.paddingTop = elem.style.paddingBottom = elem.style.overflow = null;
        return elem.removeEventListener("transitionend", arguments.callee, false);
      });
    };

    Animation.prototype.slideUp = function(elem, remove_func, props) {
      if (elem.offsetTop > 1000 && elem.getBoundingClientRect().top > 1000) {
        return remove_func();
      }
      elem.className += " animate-back";
      elem.style.boxSizing = "border-box";
      elem.style.height = elem.offsetHeight + "px";
      elem.style.overflow = "hidden";
      elem.style.transform = "scale(1)";
      elem.style.opacity = "1";
      elem.style.pointerEvents = "none";
      setTimeout((function() {
        elem.style.height = "0px";
        elem.style.marginTop = "0px";
        elem.style.marginBottom = "0px";
        elem.style.paddingTop = "0px";
        elem.style.paddingBottom = "0px";
        elem.style.transform = "scale(0.8)";
        elem.style.borderTopWidth = "0px";
        elem.style.borderBottomWidth = "0px";
        return elem.style.opacity = "0";
      }), 1);
      return elem.addEventListener("transitionend", function(e) {
        if (e.propertyName === "opacity" || e.elapsedTime >= 0.6) {
          elem.removeEventListener("transitionend", arguments.callee, false);
          return remove_func();
        }
      });
    };

    Animation.prototype.slideUpInout = function(elem, remove_func, props) {
      elem.className += " animate-inout";
      elem.style.boxSizing = "border-box";
      elem.style.height = elem.offsetHeight + "px";
      elem.style.overflow = "hidden";
      elem.style.transform = "scale(1)";
      elem.style.opacity = "1";
      elem.style.pointerEvents = "none";
      setTimeout((function() {
        elem.style.height = "0px";
        elem.style.marginTop = "0px";
        elem.style.marginBottom = "0px";
        elem.style.paddingTop = "0px";
        elem.style.paddingBottom = "0px";
        elem.style.transform = "scale(0.8)";
        elem.style.borderTopWidth = "0px";
        elem.style.borderBottomWidth = "0px";
        return elem.style.opacity = "0";
      }), 1);
      return elem.addEventListener("transitionend", function(e) {
        if (e.propertyName === "opacity" || e.elapsedTime >= 0.6) {
          elem.removeEventListener("transitionend", arguments.callee, false);
          return remove_func();
        }
      });
    };

    Animation.prototype.showRight = function(elem, props) {
      elem.className += " animate";
      elem.style.opacity = 0;
      elem.style.transform = "TranslateX(-20px) Scale(1.01)";
      setTimeout((function() {
        elem.style.opacity = 1;
        return elem.style.transform = "TranslateX(0px) Scale(1)";
      }), 1);
      return elem.addEventListener("transitionend", function() {
        elem.classList.remove("animate");
        return elem.style.transform = elem.style.opacity = null;
      });
    };

    Animation.prototype.show = function(elem, props) {
      var delay, ref;
      delay = ((ref = arguments[arguments.length - 2]) != null ? ref.delay : void 0) * 1000 || 1;
      elem.style.opacity = 0;
      setTimeout((function() {
        return elem.className += " animate";
      }), 1);
      setTimeout((function() {
        return elem.style.opacity = 1;
      }), delay);
      return elem.addEventListener("transitionend", function() {
        elem.classList.remove("animate");
        elem.style.opacity = null;
        return elem.removeEventListener("transitionend", arguments.callee, false);
      });
    };

    Animation.prototype.hide = function(elem, remove_func, props) {
      var delay, ref;
      delay = ((ref = arguments[arguments.length - 2]) != null ? ref.delay : void 0) * 1000 || 1;
      elem.className += " animate";
      setTimeout((function() {
        return elem.style.opacity = 0;
      }), delay);
      return elem.addEventListener("transitionend", function(e) {
        if (e.propertyName === "opacity") {
          return remove_func();
        }
      });
    };

    Animation.prototype.addVisibleClass = function(elem, props) {
      return setTimeout(function() {
        return elem.classList.add("visible");
      });
    };

    return Animation;

  })();

  window.Animation = new Animation();

}).call(this);

/* ---- utils/Dollar.coffee ---- */


(function() {
  window.$ = function(selector) {
    if (selector.startsWith("#")) {
      return document.getElementById(selector.replace("#", ""));
    }
  };

}).call(this);

/* ---- utils/ItemList.coffee ---- */


(function() {
  var ItemList;

  ItemList = (function() {
    function ItemList(item_class1, key1) {
      this.item_class = item_class1;
      this.key = key1;
      this.items = [];
      this.items_bykey = {};
    }

    ItemList.prototype.sync = function(rows, item_class, key) {
      var current_obj, i, item, len, results, row;
      this.items.splice(0, this.items.length);
      results = [];
      for (i = 0, len = rows.length; i < len; i++) {
        row = rows[i];
        current_obj = this.items_bykey[row[this.key]];
        if (current_obj) {
          current_obj.row = row;
          results.push(this.items.push(current_obj));
        } else {
          item = new this.item_class(row, this);
          this.items_bykey[row[this.key]] = item;
          results.push(this.items.push(item));
        }
      }
      return results;
    };

    ItemList.prototype.deleteItem = function(item) {
      var index;
      index = this.items.indexOf(item);
      if (index > -1) {
        this.items.splice(index, 1);
      } else {
        console.log("Can't delete item", item);
      }
      return delete this.items_bykey[item.row[this.key]];
    };

    return ItemList;

  })();

  window.ItemList = ItemList;

}).call(this);

/* ---- utils/Menu.coffee ---- */


(function() {
  var Menu,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Menu = (function() {
    function Menu() {
      this.render = bind(this.render, this);
      this.getStyle = bind(this.getStyle, this);
      this.renderItem = bind(this.renderItem, this);
      this.handleClick = bind(this.handleClick, this);
      this.getDirection = bind(this.getDirection, this);
      this.storeNode = bind(this.storeNode, this);
      this.toggle = bind(this.toggle, this);
      this.hide = bind(this.hide, this);
      this.show = bind(this.show, this);
      this.visible = false;
      this.items = [];
      this.node = null;
      this.height = 0;
      this.direction = "bottom";
    }

    Menu.prototype.show = function() {
      var ref;
      if ((ref = window.visible_menu) != null) {
        ref.hide();
      }
      this.visible = true;
      window.visible_menu = this;
      return this.direction = this.getDirection();
    };

    Menu.prototype.hide = function() {
      return this.visible = false;
    };

    Menu.prototype.toggle = function() {
      if (this.visible) {
        this.hide();
      } else {
        this.show();
      }
      return Page.projector.scheduleRender();
    };

    Menu.prototype.addItem = function(title, cb, selected) {
      if (selected == null) {
        selected = false;
      }
      return this.items.push([title, cb, selected]);
    };

    Menu.prototype.storeNode = function(node) {
      this.node = node;
      if (this.visible) {
        node.className = node.className.replace("visible", "");
        setTimeout(((function(_this) {
          return function() {
            node.className += " visible";
            return node.attributes.style.value = _this.getStyle();
          };
        })(this)), 20);
        node.style.maxHeight = "none";
        this.height = node.offsetHeight;
        node.style.maxHeight = "0px";
        return this.direction = this.getDirection();
      }
    };

    Menu.prototype.getDirection = function() {
      if (this.node && this.node.parentNode.getBoundingClientRect().top + this.height + 60 > document.body.clientHeight && this.node.parentNode.getBoundingClientRect().top - this.height > 0) {
        return "top";
      } else {
        return "bottom";
      }
    };

    Menu.prototype.handleClick = function(e) {
      var cb, i, item, keep_menu, len, ref, selected, title;
      keep_menu = false;
      ref = this.items;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        title = item[0], cb = item[1], selected = item[2];
        if (title === e.currentTarget.textContent || e.currentTarget["data-title"] === title) {
          keep_menu = typeof cb === "function" ? cb(item) : void 0;
          break;
        }
      }
      if (keep_menu !== true && cb !== null) {
        this.hide();
      }
      return false;
    };

    Menu.prototype.renderItem = function(item) {
      var cb, classes, href, onclick, selected, title;
      title = item[0], cb = item[1], selected = item[2];
      if (typeof selected === "function") {
        selected = selected();
      }
      if (title === "---") {
        return h("div.menu-item-separator", {
          key: Time.timestamp()
        });
      } else {
        if (cb === null) {
          href = void 0;
          onclick = this.handleClick;
        } else if (typeof cb === "string") {
          href = cb;
          onclick = true;
        } else {
          href = "#" + title;
          onclick = this.handleClick;
        }
        classes = {
          "selected": selected,
          "noaction": cb === null
        };
        return h("a.menu-item", {
          href: href,
          onclick: onclick,
          "data-title": title,
          key: title,
          classes: classes
        }, title);
      }
    };

    Menu.prototype.getStyle = function() {
      var max_height, style;
      if (this.visible) {
        max_height = this.height;
      } else {
        max_height = 0;
      }
      style = "max-height: " + max_height + "px";
      if (this.direction === "top") {
        style += ";margin-top: " + (0 - this.height - 50) + "px";
      } else {
        style += ";margin-top: 0px";
      }
      return style;
    };

    Menu.prototype.render = function(class_name) {
      if (class_name == null) {
        class_name = "";
      }
      if (this.visible || this.node) {
        return h("div.menu" + class_name, {
          classes: {
            "visible": this.visible
          },
          style: this.getStyle(),
          afterCreate: this.storeNode
        }, this.items.map(this.renderItem));
      }
    };

    return Menu;

  })();

  window.Menu = Menu;

  document.body.addEventListener("mouseup", function(e) {
    var menu_node, menu_parents, ref, ref1;
    if (!window.visible_menu || !window.visible_menu.node) {
      return false;
    }
    menu_node = window.visible_menu.node;
    menu_parents = [menu_node, menu_node.parentNode];
    if ((ref = e.target.parentNode, indexOf.call(menu_parents, ref) < 0) && (ref1 = e.target.parentNode.parentNode, indexOf.call(menu_parents, ref1) < 0)) {
      window.visible_menu.hide();
      return Page.projector.scheduleRender();
    }
  });

}).call(this);

/* ---- utils/Prototypes.coffee ---- */


(function() {
  String.prototype.startsWith = function(s) {
    return this.slice(0, s.length) === s;
  };

  String.prototype.endsWith = function(s) {
    return s === '' || this.slice(-s.length) === s;
  };

  String.prototype.capitalize = function() {
    if (this.length) {
      return this[0].toUpperCase() + this.slice(1);
    } else {
      return "";
    }
  };

  String.prototype.repeat = function(count) {
    return new Array(count + 1).join(this);
  };

  window.isEmpty = function(obj) {
    var key;
    for (key in obj) {
      return false;
    }
    return true;
  };

}).call(this);

/* ---- utils/RateLimit.coffee ---- */


(function() {
  var call_after_interval, limits;

  limits = {};

  call_after_interval = {};

  window.RateLimit = function(interval, fn) {
    if (!limits[fn]) {
      call_after_interval[fn] = false;
      fn();
      return limits[fn] = setTimeout((function() {
        if (call_after_interval[fn]) {
          fn();
        }
        delete limits[fn];
        return delete call_after_interval[fn];
      }), interval);
    } else {
      return call_after_interval[fn] = true;
    }
  };

}).call(this);

/* ---- utils/RateLimitCb.coffee ---- */


(function() {
  var call_after_interval, calling, calling_iterval, last_time,
    slice = [].slice;

  last_time = {};

  calling = {};

  calling_iterval = {};

  call_after_interval = {};

  window.RateLimitCb = function(interval, fn, args) {
    var cb;
    if (args == null) {
      args = [];
    }
    cb = function() {
      var left;
      left = interval - (Date.now() - last_time[fn]);
      if (left <= 0) {
        delete last_time[fn];
        if (calling[fn]) {
          RateLimitCb(interval, fn, calling[fn]);
        }
        return delete calling[fn];
      } else {
        return setTimeout((function() {
          delete last_time[fn];
          if (calling[fn]) {
            RateLimitCb(interval, fn, calling[fn]);
          }
          return delete calling[fn];
        }), left);
      }
    };
    if (last_time[fn]) {
      return calling[fn] = args;
    } else {
      last_time[fn] = Date.now();
      return fn.apply(this, [cb].concat(slice.call(args)));
    }
  };

  window.RateLimit = function(interval, fn) {
    if (calling_iterval[fn] > interval) {
      clearInterval(calling[fn]);
      delete calling[fn];
    }
    if (!calling[fn]) {
      call_after_interval[fn] = false;
      fn();
      calling_iterval[fn] = interval;
      return calling[fn] = setTimeout((function() {
        if (call_after_interval[fn]) {
          fn();
        }
        delete calling[fn];
        return delete call_after_interval[fn];
      }), interval);
    } else {
      return call_after_interval[fn] = true;
    }
  };


  /*
  window.s = Date.now()
  window.load = (done, num) ->
    console.log "Loading #{num}...", Date.now()-window.s
    setTimeout (-> done()), 1000
  
  RateLimit 500, window.load, [0] # Called instantly
  RateLimit 500, window.load, [1]
  setTimeout (-> RateLimit 500, window.load, [300]), 300
  setTimeout (-> RateLimit 500, window.load, [600]), 600 # Called after 1000ms
  setTimeout (-> RateLimit 500, window.load, [1000]), 1000
  setTimeout (-> RateLimit 500, window.load, [1200]), 1200  # Called after 2000ms
  setTimeout (-> RateLimit 500, window.load, [3000]), 3000  # Called after 3000ms
   */

}).call(this);

/* ---- utils/Text.coffee ---- */


(function() {
  var MarkedRenderer, Text,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  MarkedRenderer = (function(superClass) {
    extend(MarkedRenderer, superClass);

    function MarkedRenderer() {
      return MarkedRenderer.__super__.constructor.apply(this, arguments);
    }

    MarkedRenderer.prototype.image = function(href, title, text) {
      return "<code>![" + text + "](" + href + ")</code>";
    };

    return MarkedRenderer;

  })(marked.Renderer);

  Text = (function() {
    function Text() {}

    Text.prototype.toColor = function(text, saturation, lightness) {
      var hash, i, j, ref;
      if (saturation == null) {
        saturation = 30;
      }
      if (lightness == null) {
        lightness = 50;
      }
      hash = 0;
      for (i = j = 0, ref = text.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        hash += text.charCodeAt(i) * i;
        hash = hash % 1777;
      }
      return "hsl(" + (hash % 360) + ("," + saturation + "%," + lightness + "%)");
    };

    Text.prototype.renderMarked = function(text, options) {
      if (options == null) {
        options = {};
      }
      options["gfm"] = true;
      options["breaks"] = true;
      options["sanitize"] = true;
      options["renderer"] = marked_renderer;
      text = marked(text, options);
      return this.fixHtmlLinks(text);
    };

    Text.prototype.emailLinks = function(text) {
      return text.replace(/([a-zA-Z0-9]+)@zeroid.bit/g, "<a href='?to=$1' onclick='return Page.message_create.show(\"$1\")'>$1@zeroid.bit</a>");
    };

    Text.prototype.fixHtmlLinks = function(text) {
      if (window.is_proxy) {
        return text.replace(/href="http:\/\/(127.0.0.1|localhost):43110/g, 'href="http://zero');
      } else {
        return text.replace(/href="http:\/\/(127.0.0.1|localhost):43110/g, 'href="');
      }
    };

    Text.prototype.fixLink = function(link) {
      var back;
      if (window.is_proxy) {
        back = link.replace(/http:\/\/(127.0.0.1|localhost):43110/, 'http://zero');
        return back.replace(/http:\/\/zero\/([^\/]+\.bit)/, "http://$1");
      } else {
        return link.replace(/http:\/\/(127.0.0.1|localhost):43110/, '');
      }
    };

    Text.prototype.toUrl = function(text) {
      return text.replace(/[^A-Za-z0-9]/g, "+").replace(/[+]+/g, "+").replace(/[+]+$/, "");
    };

    Text.prototype.getSiteUrl = function(address) {
      if (window.is_proxy) {
        if (indexOf.call(address, ".") >= 0) {
          return "http://" + address + "/";
        } else {
          return "http://zero/" + address + "/";
        }
      } else {
        return "/" + address + "/";
      }
    };

    Text.prototype.fixReply = function(text) {
      return text.replace(/(>.*\n)([^\n>])/gm, "$1\n$2");
    };

    Text.prototype.toBitcoinAddress = function(text) {
      return text.replace(/[^A-Za-z0-9]/g, "");
    };

    Text.prototype.jsonEncode = function(obj) {
      return unescape(encodeURIComponent(JSON.stringify(obj)));
    };

    Text.prototype.jsonDecode = function(obj) {
      return JSON.parse(decodeURIComponent(escape(obj)));
    };

    Text.prototype.fileEncode = function(obj) {
      if (typeof obj === "string") {
        return btoa(unescape(encodeURIComponent(obj)));
      } else {
        return btoa(unescape(encodeURIComponent(JSON.stringify(obj, void 0, '\t'))));
      }
    };

    Text.prototype.utf8Encode = function(s) {
      return unescape(encodeURIComponent(s));
    };

    Text.prototype.utf8Decode = function(s) {
      return decodeURIComponent(escape(s));
    };

    Text.prototype.distance = function(s1, s2) {
      var char, extra_parts, j, key, len, match, next_find, next_find_i, val;
      s1 = s1.toLocaleLowerCase();
      s2 = s2.toLocaleLowerCase();
      next_find_i = 0;
      next_find = s2[0];
      match = true;
      extra_parts = {};
      for (j = 0, len = s1.length; j < len; j++) {
        char = s1[j];
        if (char !== next_find) {
          if (extra_parts[next_find_i]) {
            extra_parts[next_find_i] += char;
          } else {
            extra_parts[next_find_i] = char;
          }
        } else {
          next_find_i++;
          next_find = s2[next_find_i];
        }
      }
      if (extra_parts[next_find_i]) {
        extra_parts[next_find_i] = "";
      }
      extra_parts = (function() {
        var results;
        results = [];
        for (key in extra_parts) {
          val = extra_parts[key];
          results.push(val);
        }
        return results;
      })();
      if (next_find_i >= s2.length) {
        return extra_parts.length + extra_parts.join("").length;
      } else {
        return false;
      }
    };

    Text.prototype.parseQuery = function(query) {
      var j, key, len, params, part, parts, ref, val;
      params = {};
      parts = query.split('&');
      for (j = 0, len = parts.length; j < len; j++) {
        part = parts[j];
        ref = part.split("="), key = ref[0], val = ref[1];
        if (val) {
          params[decodeURIComponent(key)] = decodeURIComponent(val);
        } else {
          params["url"] = decodeURIComponent(key);
        }
      }
      return params;
    };

    Text.prototype.encodeQuery = function(params) {
      var back, key, val;
      back = [];
      if (params.url) {
        back.push(params.url);
      }
      for (key in params) {
        val = params[key];
        if (!val || key === "url") {
          continue;
        }
        back.push((encodeURIComponent(key)) + "=" + (encodeURIComponent(val)));
      }
      return back.join("&");
    };

    Text.prototype.highlight = function(text, search) {
      var back, i, j, len, part, parts;
      if (!text) {
        return [""];
      }
      parts = text.split(RegExp(search, "i"));
      back = [];
      for (i = j = 0, len = parts.length; j < len; i = ++j) {
        part = parts[i];
        back.push(part);
        if (i < parts.length - 1) {
          back.push(h("span.highlight", {
            key: i
          }, search));
        }
      }
      return back;
    };

    Text.prototype.formatSize = function(size) {
      var size_mb;
      if (isNaN(parseInt(size))) {
        return "";
      }
      size_mb = size / 1024 / 1024;
      if (size_mb >= 1000) {
        return (size_mb / 1024).toFixed(1) + " GB";
      } else if (size_mb >= 100) {
        return size_mb.toFixed(0) + " MB";
      } else if (size / 1024 >= 1000) {
        return size_mb.toFixed(2) + " MB";
      } else {
        return (parseInt(size) / 1024).toFixed(2) + " KB";
      }
    };

    return Text;

  })();

  window.marked_renderer = new MarkedRenderer();

  window.is_proxy = document.location.host === "zero" || window.location.pathname === "/";

  window.Text = new Text();

}).call(this);

/* ---- utils/Time.coffee ---- */


(function() {
  var Time;

  Time = (function() {
    function Time() {}

    Time.prototype.since = function(timestamp) {
      var back, minutes, now, secs;
      now = +(new Date) / 1000;
      if (timestamp > 1000000000000) {
        timestamp = timestamp / 1000;
      }
      secs = now - timestamp;
      if (secs < 60) {
        back = "Just now";
      } else if (secs < 60 * 60) {
        minutes = Math.round(secs / 60);
        back = "" + minutes + " minutes ago";
      } else if (secs < 60 * 60 * 24) {
        back = (Math.round(secs / 60 / 60)) + " hours ago";
      } else if (secs < 60 * 60 * 24 * 3) {
        back = (Math.round(secs / 60 / 60 / 24)) + " days ago";
      } else {
        back = "on " + this.date(timestamp);
      }
      back = back.replace(/^1 ([a-z]+)s/, "1 $1");
      return back;
    };

    Time.prototype.dateIso = function(timestamp) {
      var tzoffset;
      if (timestamp == null) {
        timestamp = null;
      }
      if (!timestamp) {
        timestamp = window.Time.timestamp();
      }
      if (timestamp > 1000000000000) {
        timestamp = timestamp / 1000;
      }
      tzoffset = (new Date()).getTimezoneOffset() * 60;
      return (new Date((timestamp - tzoffset) * 1000)).toISOString().split("T")[0];
    };

    Time.prototype.date = function(timestamp, format) {
      var display, parts;
      if (timestamp == null) {
        timestamp = null;
      }
      if (format == null) {
        format = "short";
      }
      if (!timestamp) {
        timestamp = window.Time.timestamp();
      }
      if (timestamp > 1000000000000) {
        timestamp = timestamp / 1000;
      }
      parts = (new Date(timestamp * 1000)).toString().split(" ");
      if (format === "short") {
        display = parts.slice(1, 4);
      } else if (format === "day") {
        display = parts.slice(1, 3);
      } else if (format === "month") {
        display = [parts[1], parts[3]];
      } else if (format === "long") {
        display = parts.slice(1, 5);
      }
      return display.join(" ").replace(/( [0-9]{4})/, ",$1");
    };

    Time.prototype.weekDay = function(timestamp) {
      if (timestamp > 1000000000000) {
        timestamp = timestamp / 1000;
      }
      return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][(new Date(timestamp * 1000)).getDay()];
    };

    Time.prototype.timestamp = function(date) {
      if (date == null) {
        date = "";
      }
      if (date === "now" || date === "") {
        return parseInt(+(new Date) / 1000);
      } else {
        return parseInt(Date.parse(date) / 1000);
      }
    };

    return Time;

  })();

  window.Time = new Time;

}).call(this);

/* ---- utils/Translate.coffee ---- */


(function() {
  window._ = function(s) {
    return s;
  };

}).call(this);

/* ---- utils/ZeroFrame.coffee ---- */


(function() {
  var ZeroFrame,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ZeroFrame = (function(superClass) {
    extend(ZeroFrame, superClass);

    function ZeroFrame(url) {
      this.onCloseWebsocket = bind(this.onCloseWebsocket, this);
      this.onOpenWebsocket = bind(this.onOpenWebsocket, this);
      this.onRequest = bind(this.onRequest, this);
      this.onMessage = bind(this.onMessage, this);
      this.url = url;
      this.waiting_cb = {};
      this.wrapper_nonce = document.location.href.replace(/.*wrapper_nonce=([A-Za-z0-9]+).*/, "$1");
      this.connect();
      this.next_message_id = 1;
      this.history_state = {};
      this.init();
    }

    ZeroFrame.prototype.init = function() {
      return this;
    };

    ZeroFrame.prototype.connect = function() {
      this.target = window.parent;
      window.addEventListener("message", this.onMessage, false);
      this.cmd("innerReady");
      window.addEventListener("beforeunload", (function(_this) {
        return function(e) {
          _this.log("save scrollTop", window.pageYOffset);
          _this.history_state["scrollTop"] = window.pageYOffset;
          return _this.cmd("wrapperReplaceState", [_this.history_state, null]);
        };
      })(this));
      return this.cmd("wrapperGetState", [], (function(_this) {
        return function(state) {
          if (state != null) {
            _this.history_state = state;
          }
          _this.log("restore scrollTop", state, window.pageYOffset);
          if (window.pageYOffset === 0 && state) {
            return window.scroll(window.pageXOffset, state.scrollTop);
          }
        };
      })(this));
    };

    ZeroFrame.prototype.onMessage = function(e) {
      var cmd, message;
      message = e.data;
      cmd = message.cmd;
      if (cmd === "response") {
        if (this.waiting_cb[message.to] != null) {
          this.waiting_cb[message.to](message.result);
          return delete this.waiting_cb[message.to];
        } else {
          return this.log("Websocket callback not found:", message);
        }
      } else if (cmd === "wrapperReady") {
        return this.cmd("innerReady");
      } else if (cmd === "ping") {
        return this.response(message.id, "pong");
      } else if (cmd === "wrapperOpenedWebsocket") {
        return this.onOpenWebsocket();
      } else if (cmd === "wrapperClosedWebsocket") {
        return this.onCloseWebsocket();
      } else {
        return this.onRequest(cmd, message.params);
      }
    };

    ZeroFrame.prototype.onRequest = function(cmd, message) {
      return this.log("Unknown request", message);
    };

    ZeroFrame.prototype.response = function(to, result) {
      return this.send({
        "cmd": "response",
        "to": to,
        "result": result
      });
    };

    ZeroFrame.prototype.cmd = function(cmd, params, cb) {
      if (params == null) {
        params = {};
      }
      if (cb == null) {
        cb = null;
      }
      return this.send({
        "cmd": cmd,
        "params": params
      }, cb);
    };

    ZeroFrame.prototype.send = function(message, cb) {
      if (cb == null) {
        cb = null;
      }
      message.wrapper_nonce = this.wrapper_nonce;
      message.id = this.next_message_id;
      this.next_message_id += 1;
      this.target.postMessage(message, "*");
      if (cb) {
        return this.waiting_cb[message.id] = cb;
      }
    };

    ZeroFrame.prototype.onOpenWebsocket = function() {
      return this.log("Websocket open");
    };

    ZeroFrame.prototype.onCloseWebsocket = function() {
      return this.log("Websocket close");
    };

    return ZeroFrame;

  })(Class);

  window.ZeroFrame = ZeroFrame;

}).call(this);

/* ---- Head.coffee ---- */


(function() {
  var Head,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Head = (function(superClass) {
    extend(Head, superClass);

    function Head() {
      this.render = bind(this.render, this);
      this.handleModeClick = bind(this.handleModeClick, this);
      this.handleShutdownZeronetClick = bind(this.handleShutdownZeronetClick, this);
      this.handleUpdateZeronetClick = bind(this.handleUpdateZeronetClick, this);
      this.handleManageBlocksClick = bind(this.handleManageBlocksClick, this);
      this.handleTorClick = bind(this.handleTorClick, this);
      this.handleOrderbyClick = bind(this.handleOrderbyClick, this);
      this.handleUpdateAllClick = bind(this.handleUpdateAllClick, this);
      this.handleSettingsClick = bind(this.handleSettingsClick, this);
      this.handleBackupClick = bind(this.handleBackupClick, this);
      this.handleCreateSiteClick = bind(this.handleCreateSiteClick, this);
      this.renderMenuTheme = bind(this.renderMenuTheme, this);
      this.handleThemeClick = bind(this.handleThemeClick, this);
      this.renderMenuLanguage = bind(this.renderMenuLanguage, this);
      this.handleLanguageClick = bind(this.handleLanguageClick, this);
      this.menu_settings = new Menu();
    }

    Head.prototype.formatUpdateInfo = function() {
      if (parseFloat(Page.server_info.version.replace(".", "0")) < parseFloat(Page.latest_version.replace(".", "0"))) {
        return "New version available!";
      } else {
        return "Up to date!";
      }
    };

    Head.prototype.handleLanguageClick = function(e) {
      var lang;
      if (Page.server_info.rev < 1750) {
        return Page.cmd("wrapperNotification", ["info", "You need ZeroNet 0.5.1 to change the interface's language"]);
      }
      lang = e.target.hash.replace("#", "");
      Page.cmd("configSet", ["language", lang], function() {
        Page.server_info.language = lang;
        return top.location = "?Home";
      });
      return false;
    };

    Head.prototype.renderMenuLanguage = function() {
      var lang, langs, ref;
      langs = ["da", "de", "en", "es", "fa", "fr", "hu", "it", "nl", "pl", "pt", "pt-br", "ru", "sk", "tr", "uk", "zh", "zh-tw"];
      if (Page.server_info.language && (ref = Page.server_info.language, indexOf.call(langs, ref) < 0)) {
        langs.push(Page.server_info.language);
      }
      return h("div.menu-radio", h("div", "Language: "), (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = langs.length; i < len; i++) {
          lang = langs[i];
          results.push([
            h("a", {
              href: "#" + lang,
              onclick: this.handleLanguageClick,
              classes: {
                selected: Page.server_info.language === lang,
                long: lang.length > 2
              }
            }, lang), " "
          ]);
        }
        return results;
      }).call(this));
    };

    Head.prototype.handleThemeClick = function(e) {
      var DARK, mqDark, theme;
      if (Page.server_info.rev < 3670) {
        return Page.cmd("wrapperNotification", ["info", "You need ZeroNet 0.6.4 to change the interface's theme"]);
      }
      theme = e.target.hash.replace("#", "");
      if (theme === "system") {
        if (Page.server_info.rev < 4085) {
          return Page.cmd("wrapperNotification", ["info", "You need ZeroNet 0.7.0 to use system's theme"]);
        }
        DARK = "(prefers-color-scheme: dark)";
        mqDark = window.matchMedia(DARK);
      }
      Page.cmd("userGetGlobalSettings", [], function(user_settings) {
        if (theme === "system") {
          theme = mqDark.matches ? "dark" : "light";
          user_settings.use_system_theme = true;
        } else {
          user_settings.use_system_theme = false;
        }
        user_settings.theme = theme;
        Page.server_info.user_settings = user_settings;
        document.getElementById("style-live").innerHTML = "* { transition: all 0.5s ease-in-out }";
        Page.cmd("userSetGlobalSettings", [user_settings]);
        return setTimeout((function() {
          document.body.className = document.body.className.replace(/theme-[a-z]+/, "");
          document.body.className += " theme-" + theme;
          return setTimeout((function() {
            return document.getElementById("style-live").innerHTML = "";
          }), 1000);
        }), 300);
      });
      return false;
    };

    Head.prototype.renderMenuTheme = function() {
      var ref, theme_id, theme_selected, theme_title, themes;
      themes = {
        "system": _("system"),
        "light": _("light"),
        "dark": _("dark")
      };
      if (Page.server_info.user_settings.use_system_theme) {
        theme_selected = "system";
      } else {
        theme_selected = (ref = Page.server_info.user_settings) != null ? ref.theme : void 0;
        if (!theme_selected) {
          theme_selected = "system";
        }
      }
      return h("div.menu-radio.menu-themes", h("div", "Theme: "), (function() {
        var results;
        results = [];
        for (theme_id in themes) {
          theme_title = themes[theme_id];
          results.push([
            h("a", {
              href: "#" + theme_id,
              onclick: this.handleThemeClick,
              classes: {
                selected: theme_selected === theme_id,
                long: true
              }
            }, theme_title), " "
          ]);
        }
        return results;
      }).call(this));
    };

    Head.prototype.handleCreateSiteClick = function() {
      if (Page.server_info.rev < 1770) {
        return Page.cmd("wrapperNotification", ["info", "You need to update your ZeroNet client to use this feature"]);
      }
      return Page.cmd("siteClone", [Page.site_info.address, "template-new"]);
    };

    Head.prototype.handleBackupClick = function() {
      if (Page.server_info.rev < 2165) {
        return Page.cmd("wrapperNotification", ["info", "You need to update your ZeroNet client to use this feature"]);
      }
      Page.cmd("serverShowdirectory", "backup");
      return Page.cmd("wrapperNotification", ["info", "Backup <b>users.json</b> file to keep your identity safe."]);
    };

    Head.prototype.handleSettingsClick = function() {
      var base, orderby;
      if ((base = Page.settings).sites_orderby == null) {
        base.sites_orderby = "peers";
      }
      orderby = Page.settings.sites_orderby;
      this.menu_settings.items = [];
      this.menu_settings.items.push(["Update all sites", this.handleUpdateAllClick]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push([
        "Order sites by peers", ((function(_this) {
          return function() {
            return _this.handleOrderbyClick("peers");
          };
        })(this)), orderby === "peers"
      ]);
      this.menu_settings.items.push([
        "Order sites by update time", ((function(_this) {
          return function() {
            return _this.handleOrderbyClick("modified");
          };
        })(this)), orderby === "modified"
      ]);
      this.menu_settings.items.push([
        "Order sites by add time", ((function(_this) {
          return function() {
            return _this.handleOrderbyClick("addtime");
          };
        })(this)), orderby === "addtime"
      ]);
      this.menu_settings.items.push([
        "Order sites by size", ((function(_this) {
          return function() {
            return _this.handleOrderbyClick("size");
          };
        })(this)), orderby === "size"
      ]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push([this.renderMenuTheme(), null]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push([this.renderMenuLanguage(), null]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push(["Create new, empty site", this.handleCreateSiteClick]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push([[h("div.icon-mute", ""), "Manage blocked users and sites"], this.handleManageBlocksClick]);
      if (Page.server_info.plugins.indexOf("UiConfig") >= 0) {
        this.menu_settings.items.push([[h("div.icon-gear.emoji", "\u2699\uFE0E"), "Configuration"], "/Config"]);
      }
      if (Page.server_info.plugins.indexOf("UiPluginManager") >= 0) {
        this.menu_settings.items.push([[h("div.icon-gear.emoji", "\u2B21"), "Plugins"], "/Plugins"]);
      }
      this.menu_settings.items.push(["---"]);
      if (!Page.server_info.multiuser || Page.server_info.multiuser_admin) {
        this.menu_settings.items.push(["Show data directory", this.handleBackupClick]);
      }
      this.menu_settings.items.push(["Version " + Page.server_info.version + " (rev" + Page.server_info.rev + "): " + (this.formatUpdateInfo()), this.handleUpdateZeronetClick]);
      if (!Page.server_info.multiuser || Page.server_info.multiuser_admin) {
        this.menu_settings.items.push(["Shut down ZeroNet", this.handleShutdownZeronetClick]);
      }
      if (this.menu_settings.visible) {
        this.menu_settings.hide();
      } else {
        this.menu_settings.show();
      }
      return false;
    };

    Head.prototype.handleUpdateAllClick = function() {
      var i, len, ref, results, site;
      ref = Page.site_list.sites;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        site = ref[i];
        if (site.row.settings.serving) {
          results.push(Page.cmd("siteUpdate", {
            "address": site.row.address
          }));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Head.prototype.handleOrderbyClick = function(orderby) {
      Page.settings.sites_orderby = orderby;
      Page.site_list.reorder();
      return Page.saveSettings();
    };

    Head.prototype.handleTorClick = function() {
      return true;
    };

    Head.prototype.handleManageBlocksClick = function() {
      if (Page.server_info.rev < 1880) {
        return Page.cmd("wrapperNotification", ["info", "You need ZeroNet 0.5.2 to use this feature."]);
      }
      Page.projector.replace($("#MuteList"), Page.mute_list.render);
      return Page.mute_list.show();
    };

    Head.prototype.handleUpdateZeronetClick = function() {
      if (Page.server_info.updatesite) {
        Page.updateZeronet();
      } else {
        Page.cmd("wrapperConfirm", ["Update to latest development version?", "Update ZeroNet " + Page.latest_version], (function(_this) {
          return function() {
            return Page.updateZeronet();
          };
        })(this));
      }
      return false;
    };

    Head.prototype.handleShutdownZeronetClick = function() {
      return Page.cmd("wrapperConfirm", ["Are you sure?", "Shut down ZeroNet"], (function(_this) {
        return function() {
          return Page.cmd("serverShutdown");
        };
      })(this));
    };

    Head.prototype.handleModeClick = function(e) {
      if (Page.server_info.rev < 1700) {
        Page.cmd("wrapperNotification", ["info", "This feature requires ZeroNet version 0.5.0"]);
      } else {
        Page.handleLinkClick(e);
      }
      return false;
    };

    Head.prototype.render = function() {
      return h("div#Head", h("a.settings", {
        href: "#Settings",
        onmousedown: this.handleSettingsClick,
        onclick: Page.returnFalse
      }, ["\u22EE"]), this.menu_settings.render(), h("a.logo", {
        href: "?Home"
      }, [
        h("img", {
          src: 'img/logo.svg',
          width: 40,
          height: 40,
          onerror: "this.src='img/logo.png'; this.onerror=null;"
        }), h("span", ["Hello ZeroNet_"])
      ]), h("div.modes", [
        h("a.mode.sites", {
          href: "?",
          classes: {
            active: Page.mode === "Sites"
          },
          onclick: Page.handleLinkClick
        }, _("Sites")), h("a.mode.files", {
          href: "?Files",
          classes: {
            active: Page.mode === "Files"
          },
          onclick: Page.handleLinkClick
        }, _("Files")), h("a.mode.stats", {
          href: "?Stats",
          classes: {
            active: Page.mode === "Stats"
          },
          onclick: Page.handleLinkClick
        }, _("Stats"))
      ]));
    };

    return Head;

  })(Class);

  window.Head = Head;

}).call(this);

/* ---- ZeroHello.coffee ---- */


(function() {
  var ZeroHello,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  window.h = maquette.h;

  ZeroHello = (function(superClass) {
    extend(ZeroHello, superClass);

    function ZeroHello() {
      this.reloadAnnouncerStats = bind(this.reloadAnnouncerStats, this);
      this.reloadAnnouncerInfo = bind(this.reloadAnnouncerInfo, this);
      this.reloadServerErrors = bind(this.reloadServerErrors, this);
      this.reloadServerInfo = bind(this.reloadServerInfo, this);
      this.reloadSiteInfo = bind(this.reloadSiteInfo, this);
      this.onOpenWebsocket = bind(this.onOpenWebsocket, this);
      this.handleLinkClick = bind(this.handleLinkClick, this);
      return ZeroHello.__super__.constructor.apply(this, arguments);
    }

    ZeroHello.prototype.init = function() {
      this.params = {};
      this.site_info = null;
      this.server_info = null;
      this.announcer_info = null;
      this.announcer_stats = null;
      this.address = null;
      this.on_site_info = new Promise();
      this.on_server_info = new Promise();
      this.on_settings = new Promise();
      this.on_loaded = new Promise();
      this.settings = null;
      this.server_errors = [];
      this.latest_version = "0.7.1";
      this.latest_rev = 3616;
      this.mode = "Sites";
      this.change_timer = null;
      return document.body.id = "Body" + this.mode;
    };

    ZeroHello.prototype.addRenderer = function(node, renderer) {
      this.projector.replace(node, renderer);
      return this.renderers.push(renderer);
    };

    ZeroHello.prototype.detachRenderers = function() {
      var i, len, ref, renderer;
      ref = this.renderers;
      for (i = 0, len = ref.length; i < len; i++) {
        renderer = ref[i];
        this.projector.detach(renderer);
      }
      return this.renderers = [];
    };

    ZeroHello.prototype.setProjectorMode = function(mode) {
      this.log("setProjectorMode", mode);
      if (this.mode === mode) {
        return;
      }
      this.detachRenderers();
      if (mode === "Files") {
        this.addRenderer($("#PageFiles"), this.page_files.render);
        this.page_files.need_update = true;
      } else if (mode === "Stats") {
        this.addRenderer($("#PageStats"), this.page_stats.render);
        this.page_stats.need_update = true;
      } else {
        mode = "Sites";
        this.addRenderer($("#FeedList"), this.feed_list.render);
        this.addRenderer($("#SiteList"), this.site_list.render);
      }
      this.mode = mode;
      return setTimeout((function() {
        document.body.id = "Body" + mode;
        if (this.change_timer) {
          clearInterval(this.change_timer);
        }
        document.body.classList.add("changing");
        return this.change_timer = setTimeout((function() {
          return document.body.classList.remove("changing");
        }), 800);
      }), 60);
    };

    ZeroHello.prototype.createProjector = function() {
      var url;
      this.projector = maquette.createProjector();
      this.projectors = {};
      this.renderers = [];
      this.site_list = new SiteList();
      this.feed_list = new FeedList();
      this.page_files = new PageFiles();
      this.page_stats = new PageStats();
      this.head = new Head();
      this.dashboard = new Dashboard();
      this.mute_list = new MuteList();
      this.trigger = new Trigger();
      if (base.href.indexOf("?") === -1) {
        this.route("");
      } else {
        url = base.href.replace(/.*?\?/, "");
        this.route(url);
        this.history_state["url"] = url;
      }
      this.loadSettings();
      this.on_site_info.then((function(_this) {
        return function() {
          _this.projector.replace($("#Head"), _this.head.render);
          _this.projector.replace($("#Dashboard"), _this.dashboard.render);
          _this.projector.merge($("#Trigger"), _this.trigger.render);
          return _this.setProjectorMode(_this.mode);
        };
      })(this));
      return setInterval((function() {
        return Page.projector.scheduleRender();
      }), 60 * 1000);
    };

    ZeroHello.prototype.route = function(query) {
      this.params = Text.parseQuery(query);
      this.log("Route", this.params);
      this.setProjectorMode(this.params.url);
      if (this.mode === "Stats") {
        this.page_stats.need_update = true;
      } else if (this.mode === "Files") {
        this.page_files.need_update = true;
      }
      return this.projector.scheduleRender();
    };

    ZeroHello.prototype.createUrl = function(key, val) {
      var params, vals;
      params = JSON.parse(JSON.stringify(this.params));
      if (typeof key === "Object") {
        vals = key;
        for (key in keys) {
          val = keys[key];
          params[key] = val;
        }
      } else {
        params[key] = val;
      }
      return "?" + Text.encodeQuery(params);
    };

    ZeroHello.prototype.setUrl = function(url, mode) {
      if (mode == null) {
        mode = "replace";
      }
      url = url.replace(/.*?\?/, "");
      this.log("setUrl", this.history_state["url"], "->", url);
      if (this.history_state["url"] === url) {
        return false;
      }
      this.history_state["url"] = url;
      if (mode === "replace") {
        this.cmd("wrapperReplaceState", [this.history_state, "", url]);
      } else {
        this.cmd("wrapperPushState", [this.history_state, "", url]);
      }
      this.route(url);
      return false;
    };

    ZeroHello.prototype.handleLinkClick = function(e) {
      if (e.which === 2) {
        return true;
      } else {
        this.log("save scrollTop", window.pageYOffset);
        this.history_state["scrollTop"] = window.pageYOffset;
        this.cmd("wrapperReplaceState", [this.history_state, null]);
        window.scroll(window.pageXOffset, 0);
        this.history_state["scrollTop"] = 0;
        this.setUrl(e.currentTarget.search);
        return false;
      }
    };

    ZeroHello.prototype.loadSettings = function() {
      return this.on_site_info.then((function(_this) {
        return function() {
          return _this.cmd("userGetSettings", [], function(res) {
            var base1, base2, base3, base4, base5;
            if (!res || res.error) {
              return _this.loadLocalStorage();
            } else {
              _this.settings = res;
              if ((base1 = _this.settings).sites_orderby == null) {
                base1.sites_orderby = "peers";
              }
              if ((base2 = _this.settings).sites_section_hide == null) {
                base2.sites_section_hide = {};
              }
              if ((base3 = _this.settings).favorite_sites == null) {
                base3.favorite_sites = {};
              }
              if ((base4 = _this.settings).siteblocks_ignore == null) {
                base4.siteblocks_ignore = {};
              }
              if ((base5 = _this.settings).date_feed_visit == null) {
                base5.date_feed_visit = 1;
              }
              _this.feed_list.date_feed_visit = _this.settings.date_feed_visit;
              return _this.on_settings.resolve(_this.settings);
            }
          });
        };
      })(this));
    };

    ZeroHello.prototype.loadLocalStorage = function() {
      return this.cmd("wrapperGetLocalStorage", [], (function(_this) {
        return function(settings) {
          var base1, base2;
          _this.settings = settings;
          _this.log("Loaded localstorage");
          if (_this.settings == null) {
            _this.settings = {};
          }
          if ((base1 = _this.settings).sites_orderby == null) {
            base1.sites_orderby = "peers";
          }
          if ((base2 = _this.settings).favorite_sites == null) {
            base2.favorite_sites = {};
          }
          return _this.on_settings.resolve(_this.settings);
        };
      })(this));
    };

    ZeroHello.prototype.saveSettings = function(cb) {
      if (this.settings) {
        if (Page.server_info.rev > 2140) {
          return this.cmd("userSetSettings", [this.settings], (function(_this) {
            return function(res) {
              if (cb) {
                return cb(res);
              }
            };
          })(this));
        } else {
          return this.cmd("wrapperSetLocalStorage", this.settings, (function(_this) {
            return function(res) {
              if (cb) {
                return cb(res);
              }
            };
          })(this));
        }
      }
    };

    ZeroHello.prototype.onOpenWebsocket = function(e) {
      this.reloadServerInfo();
      this.reloadServerErrors();
      return this.reloadSiteInfo();
    };

    ZeroHello.prototype.reloadSiteInfo = function() {
      return this.cmd("siteInfo", {}, (function(_this) {
        return function(site_info) {
          _this.address = site_info.address;
          return _this.setSiteInfo(site_info);
        };
      })(this));
    };

    ZeroHello.prototype.reloadServerInfo = function(cb) {
      return this.cmd("serverInfo", {}, (function(_this) {
        return function(server_info) {
          _this.setServerInfo(server_info);
          return typeof cb === "function" ? cb(server_info) : void 0;
        };
      })(this));
    };

    ZeroHello.prototype.reloadServerErrors = function(cb) {
      return this.on_server_info.then((function(_this) {
        return function() {
          if (_this.server_info.multiuser && !_this.server_info.multiuser_admin) {
            return typeof cb === "function" ? cb(false) : void 0;
          }
          return _this.cmd("serverErrors", {}, function(server_errors) {
            _this.setServerErrors(server_errors);
            return typeof cb === "function" ? cb(server_errors) : void 0;
          });
        };
      })(this));
    };

    ZeroHello.prototype.reloadAnnouncerInfo = function(cb) {
      return this.cmd("announcerInfo", {}, (function(_this) {
        return function(announcer_info) {
          _this.setAnnouncerInfo(announcer_info);
          return typeof cb === "function" ? cb() : void 0;
        };
      })(this));
    };

    ZeroHello.prototype.reloadAnnouncerStats = function(cb) {
      return this.cmd("announcerStats", {}, (function(_this) {
        return function(announcer_stats) {
          _this.announcer_stats = announcer_stats;
          Page.projector.scheduleRender();
          return typeof cb === "function" ? cb() : void 0;
        };
      })(this));
    };

    ZeroHello.prototype.onRequest = function(cmd, params) {
      if (cmd === "setSiteInfo") {
        return this.setSiteInfo(params);
      } else if (cmd === "setServerInfo") {
        return this.setServerInfo(params);
      } else if (cmd === "setAnnouncerInfo") {
        return this.setAnnouncerInfo(params);
      } else {
        return this.log("Unknown command", params);
      }
    };

    ZeroHello.prototype.setSiteInfo = function(site_info) {
      var ref, ref1;
      if (site_info.address === this.address) {
        this.site_info = site_info;
        if (((ref = this.server_info) != null ? ref.rev : void 0) > 3530) {
          this.reloadAnnouncerStats();
        } else if (((ref1 = this.server_info) != null ? ref1.rev : void 0) > 3460) {
          this.reloadAnnouncerInfo();
        }
      }
      this.site_list.onSiteInfo(site_info);
      this.feed_list.onSiteInfo(site_info);
      this.page_files.onSiteInfo(site_info);
      return this.on_site_info.resolve();
    };

    ZeroHello.prototype.setServerInfo = function(server_info) {
      var ref;
      this.server_info = server_info;
      if (parseFloat(Page.server_info.version.replace(/\./g, "0")) < 700) {
        this.latest_version = "0.6.5";
      }
      this.projector.scheduleRender();
      if (((ref = server_info.event) != null ? ref[0] : void 0) === "log_event") {
        RateLimit(1000, (function(_this) {
          return function() {
            return _this.reloadServerErrors();
          };
        })(this));
      }
      return this.on_server_info.resolve();
    };

    ZeroHello.prototype.setServerErrors = function(server_errors) {
      var date_added, i, len, level, message, ref;
      this.server_errors = [];
      for (i = 0, len = server_errors.length; i < len; i++) {
        ref = server_errors[i], date_added = ref[0], level = ref[1], message = ref[2];
        this.server_errors.push({
          title: [Time.since(date_added), " - ", level],
          descr: message,
          href: "#ZeroNet:Console:Error"
        });
      }
      return this.projector.scheduleRender();
    };

    ZeroHello.prototype.setAnnouncerInfo = function(announcer_info) {
      this.announcer_info = announcer_info.stats;
      return this.projector.scheduleRender();
    };

    ZeroHello.prototype.returnFalse = function() {
      return false;
    };

    ZeroHello.prototype.updateZeronet = function() {
      if (this.server_info.updatesite) {
        return window.top.location = Text.getSiteUrl(this.server_info.updatesite);
      } else {
        Page.cmd("wrapperNotification", ["info", "Updating to latest version...<br>Please restart ZeroNet manually if it does not come back in the next few minutes.", 8000]);
        return Page.cmd("serverUpdate");
      }
    };

    return ZeroHello;

  })(ZeroFrame);

  window.Page = new ZeroHello();

  window.Page.createProjector();

}).call(this);