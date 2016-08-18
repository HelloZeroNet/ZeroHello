

/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/lib/Promise.coffee ---- */


(function() {
  var Promise,
    __slice = [].slice;

  Promise = (function() {
    Promise.when = function() {
      var args, num_uncompleted, promise, task, task_id, tasks, _fn, _i, _len;
      tasks = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      num_uncompleted = tasks.length;
      args = new Array(num_uncompleted);
      promise = new Promise();
      _fn = function(task_id) {
        return task.then(function() {
          args[task_id] = Array.prototype.slice.call(arguments);
          num_uncompleted--;
          if (num_uncompleted === 0) {
            return promise.complete.apply(promise, args);
          }
        });
      };
      for (task_id = _i = 0, _len = tasks.length; _i < _len; task_id = ++_i) {
        task = tasks[task_id];
        _fn(task_id);
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
      var back, callback, _i, _len, _ref;
      if (this.resolved) {
        return false;
      }
      this.resolved = true;
      this.data = arguments;
      if (!arguments.length) {
        this.data = [true];
      }
      this.result = this.data[0];
      _ref = this.callbacks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/lib/Property.coffee ---- */


(function() {
  Function.prototype.property = function(prop, desc) {
    return Object.defineProperty(this.prototype, prop, desc);
  };

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/lib/maquette.js ---- */


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



/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Animation.coffee ---- */


(function() {
  var Animation;

  Animation = (function() {
    function Animation() {}

    Animation.prototype.slideDown = function(elem, props) {
      var cstyle, h, margin_bottom, margin_top, padding_bottom, padding_top, transition;
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
        return elem.style.paddingTop = elem.style.paddingBottom = elem.style.overflow = null;
      });
    };

    Animation.prototype.slideUp = function(elem, remove_func, props) {
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
        if (e.propertyName === "height") {
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
      var delay, _ref;
      delay = ((_ref = arguments[arguments.length - 2]) != null ? _ref.delay : void 0) * 1000 || 1;
      elem.className += " animate";
      elem.style.opacity = 0;
      setTimeout((function() {
        return elem.style.opacity = 1;
      }), delay);
      return elem.addEventListener("transitionend", function() {
        elem.classList.remove("animate");
        return elem.style.opacity = null;
      });
    };

    Animation.prototype.hide = function(elem, remove_func, props) {
      var delay, _ref;
      delay = ((_ref = arguments[arguments.length - 2]) != null ? _ref.delay : void 0) * 1000 || 1;
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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Class.coffee ---- */


(function() {
  var Class,
    __slice = [].slice;

  Class = (function() {
    function Class() {}

    Class.prototype.trace = true;

    Class.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
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
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!this.trace) {
        return;
      }
      this.logtimers || (this.logtimers = {});
      this.logtimers[name] = +(new Date);
      if (args.length > 0) {
        this.log.apply(this, ["" + name].concat(__slice.call(args), ["(started)"]));
      }
      return this;
    };

    Class.prototype.logEnd = function() {
      var args, ms, name;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      ms = +(new Date) - this.logtimers[name];
      this.log.apply(this, ["" + name].concat(__slice.call(args), ["(Done in " + ms + "ms)"]));
      return this;
    };

    return Class;

  })();

  window.Class = Class;

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Dollar.coffee ---- */


(function() {
  window.$ = function(selector) {
    if (selector.startsWith("#")) {
      return document.getElementById(selector.replace("#", ""));
    }
  };

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/ItemList.coffee ---- */


(function() {
  var ItemList;

  ItemList = (function() {
    function ItemList(_at_item_class, _at_key) {
      this.item_class = _at_item_class;
      this.key = _at_key;
      this.items = [];
      this.items_bykey = {};
    }

    ItemList.prototype.sync = function(rows, item_class, key) {
      var current_obj, item, row, _i, _len, _results;
      this.items.splice(0, this.items.length);
      _results = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        current_obj = this.items_bykey[row[this.key]];
        if (current_obj) {
          current_obj.row = row;
          _results.push(this.items.push(current_obj));
        } else {
          item = new this.item_class(row, this);
          this.items_bykey[row[this.key]] = item;
          _results.push(this.items.push(item));
        }
      }
      return _results;
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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Menu.coffee ---- */


(function() {
  var Menu,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Menu = (function() {
    function Menu() {
      this.render = __bind(this.render, this);
      this.renderItem = __bind(this.renderItem, this);
      this.handleClick = __bind(this.handleClick, this);
      this.storeNode = __bind(this.storeNode, this);
      this.toggle = __bind(this.toggle, this);
      this.hide = __bind(this.hide, this);
      this.show = __bind(this.show, this);
      this.visible = false;
      this.items = [];
      this.node = null;
    }

    Menu.prototype.show = function() {
      var _ref;
      if ((_ref = window.visible_menu) != null) {
        _ref.hide();
      }
      this.visible = true;
      return window.visible_menu = this;
    };

    Menu.prototype.hide = function() {
      return this.visible = false;
    };

    Menu.prototype.toggle = function() {
      if (this.visible) {
        return this.hide();
      } else {
        return this.show();
      }
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
        return setTimeout((function() {
          return node.className += " visible";
        }), 10);
      }
    };

    Menu.prototype.handleClick = function(e) {
      var cb, keep_menu, title, _i, _len, _ref, _ref1;
      keep_menu = false;
      _ref = this.items;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], title = _ref1[0], cb = _ref1[1];
        if (title === e.target.textContent) {
          keep_menu = cb();
        }
      }
      if (keep_menu !== true) {
        this.hide();
      }
      return false;
    };

    Menu.prototype.renderItem = function(item) {
      var cb, href, onclick, selected, title;
      title = item[0], cb = item[1], selected = item[2];
      if (title === "---") {
        return h("div.menu-item-separator");
      } else {
        if (typeof cb === "string") {
          href = cb;
          onclick = true;
        } else {
          href = "#" + title;
          onclick = this.handleClick;
        }
        return h("a.menu-item", {
          href: href,
          onclick: onclick,
          key: title,
          classes: {
            "selected": selected
          }
        }, [title]);
      }
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
          afterCreate: this.storeNode
        }, this.items.map(this.renderItem));
      }
    };

    return Menu;

  })();

  window.Menu = Menu;

  document.body.addEventListener("mouseup", function(e) {
    if (!window.visible_menu || !window.visible_menu.node) {
      return false;
    }
    if (e.target.parentNode !== window.visible_menu.node.parentNode && e.target.parentNode !== window.visible_menu.node && e.target.parentNode.parentNode !== window.visible_menu.node.parentNode) {
      window.visible_menu.hide();
      return Page.projector.scheduleRender();
    }
  });

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Prototypes.coffee ---- */


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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/RateLimitCb.coffee ---- */


(function() {
  var calling, last_time,
    __slice = [].slice;

  last_time = {};

  calling = {};

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
      return fn.apply(this, [cb].concat(__slice.call(args)));
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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Text.coffee ---- */


(function() {
  var Text,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Text = (function() {
    function Text() {}

    Text.prototype.toColor = function(text, saturation, lightness) {
      var hash, i, _i, _ref;
      if (saturation == null) {
        saturation = 30;
      }
      if (lightness == null) {
        lightness = 50;
      }
      hash = 0;
      for (i = _i = 0, _ref = text.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
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
      options["renderer"] = marked_renderer;
      text = this.fixReply(text);
      text = marked(text, options);
      text = this.emailLinks(text);
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
        if (__indexOf.call(address, ".") >= 0) {
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
      var char, extra_parts, key, match, next_find, next_find_i, val, _i, _len;
      s1 = s1.toLocaleLowerCase();
      s2 = s2.toLocaleLowerCase();
      next_find_i = 0;
      next_find = s2[0];
      match = true;
      extra_parts = {};
      for (_i = 0, _len = s1.length; _i < _len; _i++) {
        char = s1[_i];
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
        var _results;
        _results = [];
        for (key in extra_parts) {
          val = extra_parts[key];
          _results.push(val);
        }
        return _results;
      })();
      if (next_find_i >= s2.length) {
        return extra_parts.length + extra_parts.join("").length;
      } else {
        return false;
      }
    };

    Text.prototype.parseQuery = function(query) {
      var key, params, part, parts, val, _i, _len, _ref;
      params = {};
      parts = query.split('&');
      for (_i = 0, _len = parts.length; _i < _len; _i++) {
        part = parts[_i];
        _ref = part.split("="), key = _ref[0], val = _ref[1];
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
      var back, i, part, parts, _i, _len;
      parts = text.split(RegExp(search, "i"));
      back = [];
      for (i = _i = 0, _len = parts.length; _i < _len; i = ++_i) {
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

    return Text;

  })();

  window.is_proxy = document.location.host === "zero" || window.location.pathname === "/";

  window.Text = new Text();

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/Time.coffee ---- */


(function() {
  var Time;

  Time = (function() {
    function Time() {}

    Time.prototype.since = function(timestamp) {
      var back, now, secs;
      now = +(new Date) / 1000;
      if (timestamp > 1000000000000) {
        timestamp = timestamp / 1000;
      }
      secs = now - timestamp;
      if (secs < 60) {
        back = "Just now";
      } else if (secs < 60 * 60) {
        back = (Math.round(secs / 60)) + " minutes ago";
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

    Time.prototype.date = function(timestamp, format) {
      var display, parts;
      if (format == null) {
        format = "short";
      }
      if (timestamp > 1000000000000) {
        timestamp = timestamp / 1000;
      }
      parts = (new Date(timestamp * 1000)).toString().split(" ");
      if (format === "short") {
        display = parts.slice(1, 4);
      } else {
        display = parts.slice(1, 5);
      }
      return display.join(" ").replace(/( [0-9]{4})/, ",$1");
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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/utils/ZeroFrame.coffee ---- */


(function() {
  var ZeroFrame,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  ZeroFrame = (function(_super) {
    __extends(ZeroFrame, _super);

    function ZeroFrame(url) {
      this.onCloseWebsocket = __bind(this.onCloseWebsocket, this);
      this.onOpenWebsocket = __bind(this.onOpenWebsocket, this);
      this.onRequest = __bind(this.onRequest, this);
      this.onMessage = __bind(this.onMessage, this);
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
          return this.waiting_cb[message.to](message.result);
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


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/Dashboard.coffee ---- */


(function() {
  var Dashboard,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Dashboard = (function(_super) {
    __extends(Dashboard, _super);

    function Dashboard() {
      this.render = __bind(this.render, this);
      this.handleBrowserwarningClick = __bind(this.handleBrowserwarningClick, this);
      this.handleNewversionClick = __bind(this.handleNewversionClick, this);
      this.handleLogoutClick = __bind(this.handleLogoutClick, this);
      this.handleDonateClick = __bind(this.handleDonateClick, this);
      this.handleMultiuserClick = __bind(this.handleMultiuserClick, this);
      this.handlePortRecheckClick = __bind(this.handlePortRecheckClick, this);
      this.handlePortClick = __bind(this.handlePortClick, this);
      this.handleDisableAlwaysTorClick = __bind(this.handleDisableAlwaysTorClick, this);
      this.handleEnableAlwaysTorClick = __bind(this.handleEnableAlwaysTorClick, this);
      this.handleTorClick = __bind(this.handleTorClick, this);
      this.menu_newversion = new Menu();
      this.menu_tor = new Menu();
      this.menu_port = new Menu();
      this.menu_multiuser = new Menu();
      this.menu_donate = new Menu();
      this.menu_browserwarning = new Menu();
      this.port_checking = false;
    }

    Dashboard.prototype.isTorAlways = function() {
      return Page.server_info.fileserver_ip === "127.0.0.1";
    };

    Dashboard.prototype.getTorTitle = function() {
      return Page.server_info.tor_status.replace(/\((.*)\)/, "").trim();
    };

    Dashboard.prototype.handleTorClick = function() {
      var _ref;
      this.menu_tor.items = [];
      this.menu_tor.items.push(["Status: " + ((_ref = Page.server_info) != null ? _ref.tor_status : void 0), "http://zeronet.readthedocs.org/en/latest/faq/#how-to-make-zeronet-work-with-tor-under-linux"]);
      if (this.getTorTitle() !== "OK") {
        this.menu_tor.items.push(["How to make Tor connection work?", "http://zeronet.readthedocs.org/en/latest/faq/#how-to-make-zeronet-work-with-tor-under-linux"]);
      }
      this.menu_tor.items.push(["How to use ZeroNet in Tor Browser?", "http://zeronet.readthedocs.org/en/latest/faq/#how-to-use-zeronet-in-tor-browser"]);
      if (this.getTorTitle() === "OK") {
        this.menu_tor.items.push(["---"]);
        if (this.isTorAlways()) {
          this.menu_tor.items.push(["Disable always Tor mode", this.handleDisableAlwaysTorClick]);
        } else {
          this.menu_tor.items.push(["Enable Tor for every connection (slower)", this.handleEnableAlwaysTorClick]);
        }
      }
      this.menu_tor.toggle();
      return false;
    };

    Dashboard.prototype.handleEnableAlwaysTorClick = function() {
      return Page.cmd("configSet", ["tor", "always"], (function(_this) {
        return function(res) {
          return Page.cmd("wrapperNotification", ["done", "Tor always mode enabled, please restart your ZeroNet to make it work.<br>For your privacy switch to Tor browser and start a new profile by renaming the data directory."]);
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
      this.menu_port.items = [];
      if (Page.server_info.ip_external) {
        this.menu_port.items.push(["Nice! Your port " + Page.server_info.fileserver_port + " is opened.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]);
      } else if (this.isTorAlways()) {
        this.menu_port.items.push(["Good, your port is always closed when using ZeroNet in Tor always mode.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]);
      } else if (this.getTorTitle() === "OK") {
        this.menu_port.items.push(["Your port " + Page.server_info.fileserver_port + " is closed, but your Tor gateway is running well.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]);
      } else {
        this.menu_port.items.push(["Your port " + Page.server_info.fileserver_port + " is closed. You are still fine, but for faster experience try open it.", "http://zeronet.readthedocs.org/en/latest/faq/#do-i-need-to-have-a-port-opened"]);
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
      this.menu_donate.items.push(["Help to keep this project alive", "https://zeronet.readthedocs.org/en/latest/help_zeronet/donate/"]);
      this.menu_donate.toggle();
      return false;
    };

    Dashboard.prototype.handleLogoutClick = function() {
      return Page.cmd("uiLogout");
    };

    Dashboard.prototype.handleNewversionClick = function() {
      this.menu_newversion.items = [];
      this.menu_newversion.items.push([
        "Update and restart ZeroNet", (function() {
          Page.cmd("wrapperNotification", ["info", "Updating to latest version...<br>Please restart ZeroNet manually if it does not come back in the next few minutes.", 8000]);
          return Page.cmd("serverUpdate");
        })
      ]);
      this.menu_newversion.toggle();
      return false;
    };

    Dashboard.prototype.handleBrowserwarningClick = function() {
      this.menu_browserwarning.items = [];
      this.menu_browserwarning.items.push(["Internet Explorer is not fully supported browser by ZeroNet, please consider switching to Chrome or Firefox", "http://browsehappy.com/"]);
      this.menu_browserwarning.toggle();
      return false;
    };

    Dashboard.prototype.render = function() {
      var tor_title;
      if (Page.server_info) {
        tor_title = this.getTorTitle();
        return h("div#Dashboard", navigator.userAgent.match(/(\b(MS)?IE\s+|Trident\/7.0)/) ? h("a.port.dashboard-item.browserwarning", {
          href: "http://browsehappy.com/",
          onmousedown: this.handleBrowserwarningClick,
          onclick: Page.returnFalse
        }, [h("span", "Unsupported browser")]) : void 0, this.menu_browserwarning.render(".menu-browserwarning"), parseFloat(Page.server_info.version.replace(".", "0")) < parseFloat(Page.latest_version.replace(".", "0")) ? h("a.newversion.dashboard-item", {
          href: "#Update",
          onmousedown: this.handleNewversionClick,
          onclick: Page.returnFalse
        }, "New ZeroNet version: " + Page.latest_version) : void 0, this.menu_newversion.render(".menu-newversion"), h("a.port.dashboard-item.donate", {
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
        ]) : void 0, Page.server_info.multiuser ? this.menu_multiuser.render(".menu-multiuser") : void 0, __indexOf.call(Page.server_info.plugins, "UiPassword") >= 0 ? h("a.port.dashboard-item.logout", {
          href: "#Logout",
          onmousedown: this.handleLogoutClick,
          onclick: Page.returnFalse
        }, [h("span", "Logout")]) : void 0, h("a.port.dashboard-item.port", {
          href: "#Port",
          classes: {
            bounce: this.port_checking
          },
          onmousedown: this.handlePortClick,
          onclick: Page.returnFalse
        }, [h("span", "Port: "), this.port_checking ? h("span.status", "Checking") : Page.server_info.ip_external === null ? h("span.status", "Checking") : Page.server_info.ip_external === true ? h("span.status.status-ok", "Opened") : this.isTorAlways ? h("span.status.status-ok", "Closed") : tor_title === "OK" ? h("span.status.status-warning", "Closed") : h("span.status.status-bad", "Closed")]), this.menu_port.render(".menu-port"), h("a.tor.dashboard-item.tor", {
          href: "#Tor",
          onmousedown: this.handleTorClick,
          onclick: Page.returnFalse
        }, [h("span", "Tor: "), tor_title === "OK" ? this.isTorAlways() ? h("span.status.status-ok", "Always") : h("span.status.status-ok", "Available") : h("span.status.status-warning", tor_title)]), this.menu_tor.render(".menu-tor"));
      } else {
        return h("div#Dashboard");
      }
    };

    return Dashboard;

  })(Class);

  window.Dashboard = Dashboard;

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/FeedList.coffee ---- */


(function() {
  var FeedList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  FeedList = (function(_super) {
    __extends(FeedList, _super);

    function FeedList() {
      this.onSiteInfo = __bind(this.onSiteInfo, this);
      this.render = __bind(this.render, this);
      this.renderWelcome = __bind(this.renderWelcome, this);
      this.renderFeed = __bind(this.renderFeed, this);
      this.exitAnimation = __bind(this.exitAnimation, this);
      this.enterAnimation = __bind(this.enterAnimation, this);
      this.handleSearchKeyup = __bind(this.handleSearchKeyup, this);
      this.handleSearchInput = __bind(this.handleSearchInput, this);
      this.storeNodeSearch = __bind(this.storeNodeSearch, this);
      this.search = __bind(this.search, this);
      this.update = __bind(this.update, this);
      this.displayRows = __bind(this.displayRows, this);
      this.feeds = null;
      this.searching = null;
      this.searched = null;
      this.searched_info = null;
      this.loading = false;
      Page.on_local_storage.then((function(_this) {
        return function() {
          return _this.update();
        };
      })(this));
      this;
    }

    FeedList.prototype.displayRows = function(rows, search) {
      var last_row, row, row_group, _i, _len;
      this.feeds = [];
      if (!rows) {
        return false;
      }
      rows.sort(function(a, b) {
        return a.date_added + (a.type === "mention" ? 1 : 0) - b.date_added - (b.type === "mention" ? 1 : 0);
      });
      row_group = {};
      last_row = {};
      rows.reverse();
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        if (last_row.body === row.body && last_row.date_added === row.date_added) {
          continue;
        }
        if (row_group.title === row.title && row_group.type === row.type && row.url === row_group.url) {
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
          this.feeds.push(row);
          row_group = row;
        }
        last_row = row;
      }
      this.log(rows);
      return Page.projector.scheduleRender();
    };

    FeedList.prototype.update = function(cb) {
      return Page.cmd("feedQuery", [], (function(_this) {
        return function(rows) {
          _this.displayRows(rows);
          if (cb) {
            return cb();
          }
        };
      })(this));
    };

    FeedList.prototype.search = function(search, cb) {
      if (Page.server_info.rev < 1230) {
        this.displayRows([]);
        if (cb) {
          cb();
        }
        return;
      }
      this.loading = true;
      return Page.cmd("feedSearch", search, (function(_this) {
        return function(res) {
          _this.loading = false;
          _this.displayRows(res["rows"], search);
          delete res["rows"];
          _this.searched_info = res;
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
          var _ref, _ref1;
          if ((_ref = e.charCode) === 0 || _ref === 32) {
            return;
          }
          if (((_ref1 = document.activeElement) != null ? _ref1.tagName : void 0) !== "INPUT") {
            return node.focus();
          }
        };
      })(this);
    };

    FeedList.prototype.handleSearchInput = function(e) {
      var delay;
      if (this.searching && this.searching.length > 3) {
        delay = 100;
      } else if (this.searching) {
        delay = 300;
      } else {
        delay = 600;
      }
      this.searching = e.target.value;
      if (Page.server_info.rev < 1230) {
        this.feeds = [];
      }
      if (e.target.value === "") {
        delay = 1;
      }
      clearInterval(this.input_timer);
      setTimeout((function(_this) {
        return function() {
          return _this.loading = true;
        };
      })(this));
      this.input_timer = setTimeout(((function(_this) {
        return function() {
          return RateLimitCb(delay, function(cb_done) {
            _this.loading = false;
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
      return false;
    };

    FeedList.prototype.formatTitle = function(title) {
      if (this.searching && this.searching.length > 1) {
        return Text.highlight(title, this.searching);
      } else {
        return title;
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
        if (this.searching && this.searching.length > 1) {
          body = Text.highlight(body, this.searching);
          if (body[0].length > 60 && body.length > 1) {
            body[0] = "..." + body[0].slice(body[0].length - 50, +(body[0].length - 1) + 1 || 9e9);
          }
          return [h("b", Text.highlight(username_formatted, this.searching)), body];
        } else {
          body = body.slice(0, 201);
          return [h("b", [username_formatted]), body];
        }
      } else {
        body = body.replace(/\n/g, " ");
        if (this.searching && this.searching.length > 1) {
          body = Text.highlight(body, this.searching);
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
      var err, site, type_formatted;
      try {
        site = Page.site_list.item_list.items_bykey[feed.site];
        type_formatted = this.formatType(feed.type, feed.title);
        return h("div.feed." + feed.type, {
          key: feed.site + feed.type + feed.title + feed.feed_id,
          enterAnimation: this.enterAnimation,
          exitAnimation: this.exitAnimation
        }, [
          h("div.details", [
            h("a.site", {
              href: site.getHref()
            }, [site.row.content.title]), h("div.added", [Time.since(feed.date_added)])
          ]), h("div.circle", {
            style: "border-color: " + (Text.toColor(feed.type + site.row.address, 60, 60))
          }), type_formatted ? h("span.type", type_formatted) : void 0, h("a.title", {
            href: site.getHref() + feed.url
          }, this.formatTitle(feed.title)), h("div.body", {
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
      } catch (_error) {
        err = _error;
        this.log(err);
        return h("div");
      }
    };

    FeedList.prototype.renderWelcome = function() {
      return h("div.welcome", [
        h("img", {
          src: "img/logo_big.png",
          height: 150
        }), h("h1", ["Welcome to ", h("span.zeronet", "ZeroNet")]), h("h2", ["Let's build a decentralized Internet together!"]), h("div.served", ["This site currently served by ", h("b.peers", Page.site_info["peers"] || "n/a"), " peers, without any central server."]), h("div.sites", [
          h("h3", "Some sites we created:"), h("a.site.site-zeroboard", {
            href: Text.getSiteUrl("Board.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroBoard"]), h("div.description", ["Simple messaging board"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zerotalk", {
            href: Text.getSiteUrl("Talk.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroTalk"]), h("div.description", ["Reddit-like, decentralized forum"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zeroblog", {
            href: Text.getSiteUrl("Blog.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroBlog"]), h("div.description", ["Microblogging platform"]), h("div.visit", ["Activate \u2501"])]), h("a.site.site-zeromail", {
            href: Text.getSiteUrl("Mail.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroMail"]), h("div.description", ["End-to-end encrypted mailing"]), h("div.visit", ["Activate \u2501"])]), Page.server_info.rev >= 1400 ? h("a.site.site-zerome", {
            href: Text.getSiteUrl("Me.ZeroNetwork.bit")
          }, [h("div.title", ["ZeroMe"]), h("div.description", ["P2P social network"]), h("div.visit", ["Activate \u2501"])]) : void 0
        ])
      ]);
    };

    FeedList.prototype.render = function() {
      if (this.feeds && Page.site_list.loaded && document.body.className !== "loaded") {
        document.body.className = "loaded";
      }
      return h("div.FeedContainer", this.feeds === null || !Page.site_list.loaded ? h("div.loading") : this.feeds.length > 0 || this.searching !== null ? [
        h("div.feeds-line"), h("div.feeds-search", {
          classes: {
            "searching": this.searching
          }
        }, h("div.icon-magnifier"), this.loading ? h("div.loader", {
          enterAnimation: Animation.show,
          exitAnimation: Animation.hide
        }, h("div.arc")) : void 0, h("input", {
          type: "text",
          placeholder: "Search in connected sites",
          value: this.searching,
          onkeyup: this.handleSearchKeyup,
          oninput: this.handleSearchInput,
          afterCreate: this.storeNodeSearch
        }), this.searched && this.searched_info && !this.loading ? h("div.search-info", {
          enterAnimation: Animation.show,
          exitAnimation: Animation.hide
        }, this.searched_info.num + " results from " + this.searched_info.sites + " sites in " + (this.searched_info.taken.toFixed(2)) + "s") : void 0, Page.server_info.rev < 1230 && this.searching ? h("div.search-noresult", {
          enterAnimation: Animation.show
        }, [
          "You need to ", h("a", {
            href: "#Update",
            onclick: Page.head.handleUpdateZeronetClick
          }, "update"), " your ZeroNet client to use the search feature!"
        ]) : this.feeds.length === 0 && this.searched ? h("div.search-noresult", {
          enterAnimation: Animation.show
        }, "No results for " + this.searched) : void 0), h("div.FeedList." + (this.searching !== null ? "search" : "newsfeed"), {
          classes: {
            loading: this.loading
          }
        }, this.feeds.slice(0, 31).map(this.renderFeed))
      ] : this.renderWelcome());
    };

    FeedList.prototype.onSiteInfo = function(site_info) {
      var _ref, _ref1, _ref2;
      if (((_ref = site_info.event) != null ? _ref[0] : void 0) === "file_done" && ((_ref1 = site_info.event) != null ? _ref1[1].endsWith(".json") : void 0) && !((_ref2 = site_info.event) != null ? _ref2[1].endsWith("content.json") : void 0)) {
        if (!this.searching) {
          return RateLimitCb(5000, this.update);
        }
      }
    };

    return FeedList;

  })(Class);

  window.FeedList = FeedList;

}).call(this);



/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/Head.coffee ---- */


(function() {
  var Head,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  Head = (function(_super) {
    __extends(Head, _super);

    function Head() {
      this.render = __bind(this.render, this);
      this.handleShutdownZeronetClick = __bind(this.handleShutdownZeronetClick, this);
      this.handleUpdateZeronetClick = __bind(this.handleUpdateZeronetClick, this);
      this.handleTorClick = __bind(this.handleTorClick, this);
      this.handleOrderbyModified = __bind(this.handleOrderbyModified, this);
      this.handleOrderbyPeers = __bind(this.handleOrderbyPeers, this);
      this.handleUpdateAllClick = __bind(this.handleUpdateAllClick, this);
      this.handleSettingsClick = __bind(this.handleSettingsClick, this);
      this.menu_settings = new Menu();
    }

    Head.prototype.formatUpdateInfo = function() {
      if (parseFloat(Page.server_info.version.replace(".", "0")) < parseFloat(Page.latest_version.replace(".", "0"))) {
        return "New version avalible!";
      } else {
        return "Up to date!";
      }
    };

    Head.prototype.handleSettingsClick = function() {
      var orderby, _base;
      if ((_base = Page.local_storage).sites_orderby == null) {
        _base.sites_orderby = "peers";
      }
      orderby = Page.local_storage.sites_orderby;
      this.menu_settings.items = [];
      this.menu_settings.items.push(["Update all sites", this.handleUpdateAllClick]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push(["Order sites by peers", this.handleOrderbyPeers, orderby === "peers"]);
      this.menu_settings.items.push(["Order sites by update time", this.handleOrderbyModified, orderby === "modified"]);
      this.menu_settings.items.push(["---"]);
      this.menu_settings.items.push(["Version " + Page.server_info.version + " (rev" + Page.server_info.rev + "): " + (this.formatUpdateInfo()), this.handleUpdateZeronetClick]);
      this.menu_settings.items.push(["Shut down ZeroNet", this.handleShutdownZeronetClick]);
      if (this.menu_settings.visible) {
        this.menu_settings.hide();
      } else {
        this.menu_settings.show();
      }
      return false;
    };

    Head.prototype.handleUpdateAllClick = function() {
      var site, _i, _len, _ref, _results;
      _ref = Page.site_list.sites;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        site = _ref[_i];
        if (site.row.settings.serving) {
          _results.push(Page.cmd("siteUpdate", {
            "address": site.row.address
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Head.prototype.handleOrderbyPeers = function() {
      Page.local_storage.sites_orderby = "peers";
      Page.site_list.reorder();
      return Page.saveLocalStorage();
    };

    Head.prototype.handleOrderbyModified = function() {
      Page.local_storage.sites_orderby = "modified";
      Page.site_list.reorder();
      return Page.saveLocalStorage();
    };

    Head.prototype.handleTorClick = function() {
      return true;
    };

    Head.prototype.handleUpdateZeronetClick = function() {
      Page.cmd("wrapperConfirm", ["Update to latest development version?", "Update ZeroNet " + Page.latest_version], (function(_this) {
        return function() {
          Page.cmd("wrapperNotification", ["info", "Updating to latest version...<br>Please restart ZeroNet manually if it does not come back in the next few minutes.", 8000]);
          Page.cmd("serverUpdate");
          return _this.log("Updating...");
        };
      })(this));
      return false;
    };

    Head.prototype.handleShutdownZeronetClick = function() {
      return Page.cmd("wrapperConfirm", ["Are you sure?", "Shut down ZeroNet"], (function(_this) {
        return function() {
          return Page.cmd("serverShutdown");
        };
      })(this));
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
          src: 'img/logo.png',
          width: 50,
          height: 50
        }), h("span", ["Hello ZeroNet_"])
      ]));
    };

    return Head;

  })(Class);

  window.Head = Head;

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/Site.coffee ---- */


(function() {
  var Site,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Site = (function(_super) {
    __extends(Site, _super);

    function Site(row, _at_item_list) {
      this.item_list = _at_item_list;
      this.render = __bind(this.render, this);
      this.handleSettingsClick = __bind(this.handleSettingsClick, this);
      this.handleDeleteClick = __bind(this.handleDeleteClick, this);
      this.handleCloneClick = __bind(this.handleCloneClick, this);
      this.handlePauseClick = __bind(this.handlePauseClick, this);
      this.handleResumeClick = __bind(this.handleResumeClick, this);
      this.handleUpdateClick = __bind(this.handleUpdateClick, this);
      this.handleUnfavoriteClick = __bind(this.handleUnfavoriteClick, this);
      this.handleFavoriteClick = __bind(this.handleFavoriteClick, this);
      this.deleted = false;
      this.show_errors = false;
      this.message_visible = false;
      this.message = null;
      this.message_class = "";
      this.message_collapsed = false;
      this.message_timer = null;
      this.favorite = Page.local_storage.favorite_sites[row.address];
      this.key = row.address;
      this.setRow(row);
      this.menu = new Menu();
    }

    Site.prototype.setRow = function(row) {
      var _ref, _ref1, _ref2;
      if (((_ref = row.event) != null ? _ref[0] : void 0) === "updated" && row.content_updated !== false) {
        this.setMessage("Updated!", "done");
      } else if (((_ref1 = row.event) != null ? _ref1[0] : void 0) === "updating") {
        this.setMessage("Updating...");
      } else if (row.tasks > 0) {
        this.setMessage("Updating: " + row.tasks + " left");
      } else if (row.bad_files > 0) {
        this.setMessage(row.bad_files + " file update failed", "error");
      } else if (row.content_updated === false) {
        if (row.peers <= 1) {
          this.setMessage("No peers", "error");
        } else {
          this.setMessage("Update failed", "error");
        }
      } else if (row.tasks === 0 && ((_ref2 = this.row) != null ? _ref2.tasks : void 0) > 0) {
        this.setMessage("Updated!", "done");
      }
      return this.row = row;
    };

    Site.prototype.setMessage = function(message, _at_message_class) {
      this.message_class = _at_message_class != null ? _at_message_class : "";
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
      var _ref;
      return this.row.tasks > 0 || ((_ref = this.row.event) != null ? _ref[0] : void 0) === "updating";
    };

    Site.prototype.handleFavoriteClick = function() {
      this.favorite = true;
      this.menu = new Menu();
      Page.local_storage.favorite_sites[this.row.address] = true;
      Page.saveLocalStorage();
      Page.site_list.reorder();
      return false;
    };

    Site.prototype.handleUnfavoriteClick = function() {
      this.favorite = false;
      this.menu = new Menu();
      delete Page.local_storage.favorite_sites[this.row.address];
      Page.saveLocalStorage();
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

    Site.prototype.handleDeleteClick = function() {
      if (this.row.settings.own) {
        Page.cmd("wrapperNotification", ["error", "Sorry, you can't delete your own site.<br>Please remove the directory manually."]);
      } else {
        Page.cmd("wrapperConfirm", ["Are you sure? <b>" + this.row.content.title + "</b>", "Delete"], (function(_this) {
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
      if (this.row.settings.serving) {
        this.menu.items.push(["Pause", this.handlePauseClick]);
      } else {
        this.menu.items.push(["Resume", this.handleResumeClick]);
      }
      if (this.row.content.cloneable === true) {
        this.menu.items.push(["Clone", this.handleCloneClick]);
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

    Site.prototype.getHref = function() {
      var has_plugin, href, _ref, _ref1;
      has_plugin = (((_ref = Page.server_info) != null ? _ref.plugins : void 0) != null) && (__indexOf.call(Page.server_info.plugins, "Zeroname") >= 0 || __indexOf.call(Page.server_info.plugins, "Dnschain") >= 0 || __indexOf.call(Page.server_info.plugins, "Zeroname-local") >= 0);
      if (has_plugin && ((_ref1 = this.row.content) != null ? _ref1.domain : void 0)) {
        href = Text.getSiteUrl(this.row.content.domain);
      } else {
        href = Text.getSiteUrl(this.row.address);
      }
      return href;
    };

    Site.prototype.render = function() {
      var now;
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
        title: this.row.content.title.length > 20 ? this.row.content.title : void 0
      }, [
        h("span.title", [this.row.content.title]), h("div.details", [h("span.modified", [h("div.icon-clock"), h("span.value", [Time.since(this.row.settings.modified)])]), h("span.peers", [h("div.icon-profile"), h("span.value", [Math.max((this.row.settings.peers ? this.row.settings.peers : 0), this.row.peers)])])]), this.row.demo ? h("div.details.demo", "Activate \u00BB") : void 0, h("div.message", {
          classes: {
            visible: this.message_visible,
            done: this.message_class === 'done',
            error: this.message_class === 'error',
            collapsed: this.message_collapsed
          }
        }, [this.message])
      ]), h("a.settings", {
        href: "#",
        onmousedown: this.handleSettingsClick,
        onclick: Page.returnFalse
      }, ["\u22EE"]), this.menu.render());
    };

    return Site;

  })(Class);

  window.Site = Site;

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/SiteList.coffee ---- */


(function() {
  var SiteList,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  SiteList = (function(_super) {
    __extends(SiteList, _super);

    function SiteList() {
      this.onSiteInfo = __bind(this.onSiteInfo, this);
      this.render = __bind(this.render, this);
      this.renderMergedSites = __bind(this.renderMergedSites, this);
      this.reorder = __bind(this.reorder, this);
      this.reorderTimer = __bind(this.reorderTimer, this);
      this.item_list = new ItemList(Site, "address");
      this.sites = this.item_list.items;
      this.sites_byaddress = this.item_list.items_bykey;
      this.inactive_demo_sites = null;
      this.loaded = false;
      this.schedule_reorder = false;
      this.merged_db = {};
      setInterval(this.reorderTimer, 10000);
      Page.on_local_storage.then((function(_this) {
        return function() {
          _this.update();
          return Page.cmd("channelJoinAllsite", {
            "channel": "siteChanged"
          });
        };
      })(this));
    }

    SiteList.prototype.reorderTimer = function() {
      if (!this.schedule_reorder) {
        return;
      }
      if (!document.querySelector('.left:hover') && !document.querySelector(".working")) {
        this.reorder();
        return this.schedule_reorder = false;
      }
    };

    SiteList.prototype.reorder = function() {
      if (Page.local_storage.sites_orderby === "modified") {
        this.item_list.items.sort(function(a, b) {
          return b.row.settings.modified - a.row.settings.modified;
        });
      } else {
        this.item_list.items.sort(function(a, b) {
          return Math.max(b.row.peers, b.row.settings.peers) - Math.max(a.row.peers, a.row.settings.peers);
        });
      }
      return Page.projector.scheduleRender();
    };

    SiteList.prototype.update = function() {
      Page.cmd("siteList", {}, (function(_this) {
        return function(site_rows) {
          var favorite_sites;
          favorite_sites = Page.local_storage.favorite_sites;
          if (Page.local_storage.sites_orderby === "modified") {
            site_rows.sort(function(a, b) {
              return b.settings.modified - a.settings.modified;
            });
          } else {
            site_rows.sort(function(a, b) {
              return Math.max(b.peers, b.settings.peers) - Math.max(a.peers, a.settings.peers);
            });
          }
          _this.item_list.sync(site_rows);
          if (_this.inactive_demo_sites === null) {
            _this.updateInactiveDemoSites();
          }
          Page.projector.scheduleRender();
          return _this.loaded = true;
        };
      })(this));
      return this;
    };

    SiteList.prototype.updateInactiveDemoSites = function() {
      var demo_site_rows, site_row, _i, _len, _results;
      demo_site_rows = [
        {
          address: "1Gfey7wVXXg1rxk751TBTxLJwhddDNfcdp",
          demo: true,
          content: {
            title: "ZeroBoard",
            domain: "Board.ZeroNetwork.bit"
          },
          settings: {}
        }, {
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
          address: "1Gif7PqWTzVWDQ42Mo7np3zXmGAo3DXc7h",
          demo: true,
          content: {
            title: "GIF Time"
          },
          settings: {}
        }, {
          address: "186THqMWuptrZxq1rxzpguAivK3Bs6z84o",
          demo: true,
          content: {
            title: "More sites @ 0list",
            domain: "0list.bit"
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
      _results = [];
      for (_i = 0, _len = demo_site_rows.length; _i < _len; _i++) {
        site_row = demo_site_rows[_i];
        if (!this.sites_byaddress[site_row.address]) {
          _results.push(this.inactive_demo_sites.push(new Site(site_row)));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    SiteList.prototype.renderMergedSites = function() {
      var back, merged_db, merged_sites, merged_type, site, _i, _len, _name, _ref;
      merged_db = {};
      _ref = this.sites;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        site = _ref[_i];
        if (!site.row.content.merged_type) {
          continue;
        }
        if (merged_db[_name = site.row.content.merged_type] == null) {
          merged_db[_name] = [];
        }
        merged_db[site.row.content.merged_type].push(site);
      }
      back = [];
      for (merged_type in merged_db) {
        merged_sites = merged_db[merged_type];
        back.push([
          h("h2.more", {
            key: "Merged: " + merged_type
          }, "Merged: " + merged_type), h("div.SiteList", merged_sites.map(function(item) {
            return item.render();
          }))
        ]);
      }
      return back;
    };

    SiteList.prototype.render = function() {
      var site;
      if (!this.loaded) {
        return h("div");
      }
      this.sites_favorited = (function() {
        var _i, _len, _ref, _results;
        _ref = this.sites;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          site = _ref[_i];
          if (site.favorite && !site.row.content.merged_type) {
            _results.push(site);
          }
        }
        return _results;
      }).call(this);
      this.sites_connected = (function() {
        var _i, _len, _ref, _results;
        _ref = this.sites;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          site = _ref[_i];
          if (!site.favorite && !site.row.content.merged_type) {
            _results.push(site);
          }
        }
        return _results;
      }).call(this);
      return h("div", [
        this.sites_favorited.length > 0 ? h("h2.favorited", "Favorited sites:") : void 0, h("div.SiteList.favorited", this.sites_favorited.map(function(item) {
          return item.render();
        })), h("h2.connected", "Connected sites:"), h("div.SiteList.connected", this.sites_connected.map(function(item) {
          return item.render();
        })), this.renderMergedSites(), this.inactive_demo_sites !== null && this.inactive_demo_sites.length > 0 ? [
          h("h2.more", {
            key: "More"
          }, "More sites:"), h("div.SiteList.more", this.inactive_demo_sites.map(function(item) {
            return item.render();
          }))
        ] : void 0
      ]);
    };

    SiteList.prototype.onSiteInfo = function(site_info) {
      var _ref;
      if ((_ref = this.item_list.items_bykey[site_info.address]) != null) {
        _ref.setRow(site_info);
      }
      this.schedule_reorder = true;
      return Page.projector.scheduleRender();
    };

    return SiteList;

  })(Class);

  window.SiteList = SiteList;

}).call(this);


/* ---- /1HeLLo4uzjaLetFx6NH3PMwFP3qbRbTf3D/js/ZeroHello.coffee ---- */


(function() {
  var ZeroHello,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __hasProp = {}.hasOwnProperty;

  window.h = maquette.h;

  ZeroHello = (function(_super) {
    __extends(ZeroHello, _super);

    function ZeroHello() {
      this.reloadServerInfo = __bind(this.reloadServerInfo, this);
      this.reloadSiteInfo = __bind(this.reloadSiteInfo, this);
      this.onOpenWebsocket = __bind(this.onOpenWebsocket, this);
      return ZeroHello.__super__.constructor.apply(this, arguments);
    }

    ZeroHello.prototype.init = function() {
      this.params = {};
      this.site_info = null;
      this.server_info = null;
      this.address = null;
      this.on_site_info = new Promise();
      this.on_local_storage = new Promise();
      this.local_storage = null;
      return this.latest_version = "0.4.0";
    };

    ZeroHello.prototype.createProjector = function() {
      this.projector = maquette.createProjector();
      this.site_list = new SiteList();
      this.feed_list = new FeedList();
      this.head = new Head();
      this.dashboard = new Dashboard();
      if (base.href.indexOf("?") === -1) {
        this.route("");
      } else {
        this.route(base.href.replace(/.*?\?/, ""));
      }
      this.loadLocalStorage();
      this.on_site_info.then((function(_this) {
        return function() {
          _this.projector.replace($("#SiteList"), _this.site_list.render);
          _this.projector.replace($("#FeedList"), _this.feed_list.render);
          _this.projector.replace($("#Head"), _this.head.render);
          return _this.projector.replace($("#Dashboard"), _this.dashboard.render);
        };
      })(this));
      return setInterval((function() {
        return Page.projector.scheduleRender();
      }), 60 * 1000);
    };

    ZeroHello.prototype.route = function(query) {
      this.params = Text.parseQuery(query);
      this.log("Route", this.params);
      if (this.params.to) {
        this.on_site_info.then((function(_this) {
          return function() {
            return _this.message_create.show(_this.params.to);
          };
        })(this));
        this.cmd("wrapperReplaceState", [{}, "", this.createUrl("to", "")]);
      }
      if (this.params.url === "Sent") {
        return this.leftbar.folder_active = "sent";
      }
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

    ZeroHello.prototype.loadLocalStorage = function() {
      return this.on_site_info.then((function(_this) {
        return function() {
          _this.log("Loading localstorage");
          return _this.cmd("wrapperGetLocalStorage", [], function(_at_local_storage) {
            var _base, _base1;
            _this.local_storage = _at_local_storage;
            _this.log("Loaded localstorage");
            if (_this.local_storage == null) {
              _this.local_storage = {};
            }
            if ((_base = _this.local_storage).sites_orderby == null) {
              _base.sites_orderby = "peers";
            }
            if ((_base1 = _this.local_storage).favorite_sites == null) {
              _base1.favorite_sites = {};
            }
            return _this.on_local_storage.resolve(_this.local_storage);
          });
        };
      })(this));
    };

    ZeroHello.prototype.saveLocalStorage = function(cb) {
      if (this.local_storage) {
        return this.cmd("wrapperSetLocalStorage", this.local_storage, (function(_this) {
          return function(res) {
            if (cb) {
              return cb(res);
            }
          };
        })(this));
      }
    };

    ZeroHello.prototype.onOpenWebsocket = function(e) {
      this.reloadSiteInfo();
      return this.reloadServerInfo();
    };

    ZeroHello.prototype.reloadSiteInfo = function() {
      return this.cmd("siteInfo", {}, (function(_this) {
        return function(site_info) {
          _this.address = site_info.address;
          return _this.setSiteInfo(site_info);
        };
      })(this));
    };

    ZeroHello.prototype.reloadServerInfo = function() {
      return this.cmd("serverInfo", {}, (function(_this) {
        return function(server_info) {
          return _this.setServerInfo(server_info);
        };
      })(this));
    };

    ZeroHello.prototype.onRequest = function(cmd, params) {
      if (cmd === "setSiteInfo") {
        return this.setSiteInfo(params);
      } else {
        return this.log("Unknown command", params);
      }
    };

    ZeroHello.prototype.setSiteInfo = function(site_info) {
      if (site_info.address === this.address) {
        this.site_info = site_info;
      }
      this.site_list.onSiteInfo(site_info);
      this.feed_list.onSiteInfo(site_info);
      return this.on_site_info.resolve();
    };

    ZeroHello.prototype.setServerInfo = function(server_info) {
      this.server_info = server_info;
      return this.projector.scheduleRender();
    };

    ZeroHello.prototype.returnFalse = function() {
      return false;
    };

    return ZeroHello;

  })(ZeroFrame);

  window.Page = new ZeroHello();

  window.Page.createProjector();

}).call(this);