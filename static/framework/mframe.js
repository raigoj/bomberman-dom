// Create an Mframe element to use in render
function createElement(type, props, ...children) {
  // Return an Object representation of a DOM node
  return {
    type: type,
    props: {
      ...props,
      children: children.flat().map(c => typeof c === 'object' ? c : createTextElement(c))
    }
  };
}

// Create an inner html element, that holds text
function createTextElement(text) {
  // This is used for textual representation
  return {
    type: "INNER_TEXT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

/**
 * Create a new DOM node based on the type of the given fiber.
 * If the fiber type is "INNER_TEXT", create a new text node using document.createTextNode("").
 * Otherwise, create a new element node using document.createElement(fiber.type).
 * Then call updateDom() to update the properties and event listeners of the new node with the props of the fiber.
 * Finally, return the new node.
 * @param {Object} fiber - The fiber object representing the current element in the fiber tree.
 * @returns {Node} - The newly created DOM node.
 */

function createDom(fiber) {
  // Check if the fiber represents a text node or an element node and create the appropriate node using document.createTextNode() or document.createElement().
  const dom = fiber.type === "INNER_TEXT" ? document.createTextNode("") : document.createElement(fiber.type);

  // Call the updateDom() function to update the properties and event listeners of the new node with the props of the fiber.
  updateDom(dom, {}, fiber.props);
  return dom;
}

// These utility functions help determine whether a given property or event is new, gone, or needs updating.

// This function checks if a given key is an event listener (starts with "on")
const isEvent = key => key.startsWith("on");

// This function checks if a given key is a property (not "children" or an event listener).
const isProperty = key => key !== "children" && !isEvent(key);

// This function checks if a property or event listener has changed from its previous value to its current value.
const isNew = (prev, next) => key => prev[key] !== next[key];

// This function checks if a property or event listener has been removed in the new props.
const isGone = (prev, next) => key => !(key in next);

/**
 * Update the properties and event listeners of a DOM element according to the changes 
 * in the previous and next props objects.
 *
 * @param {HTMLElement} dom - The element to update.
 * @param {Object} prevProps - The previous set of properties for the element.
 * @param {Object} nextProps - The new set of properties for the element.
 */

function updateDom(dom, prevProps, nextProps) {
  // Remove event listeners that no longer exist or have changed.
  Object.keys(prevProps).filter(isEvent).filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key)).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.removeEventListener(eventType, prevProps[name]);
  });

  // Remove properties that no longer exist in the new props.
  Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(name => {
    dom[name] = "";
  });

  // Add new or changed properties and event listeners.
  Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(name => {
    if (name === 'style') {
      transformDomStyle(dom, nextProps.style);
    } else if (name === 'classname') {
      prevProps.className && dom.classList.remove(...prevProps.className.split(/\s+/));
      dom.classList.add(...nextProps.className.split(/\s+/));
    } else {
      dom[name] = nextProps[name];
    }
  });
  Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps, nextProps)).forEach(name => {
    const eventType = name.toLowerCase().substring(2);
    dom.addEventListener(eventType, nextProps[name]);
  });
}
const reg = /[A-Z]/g;

//Transforms a style object to a string that can be applied to a DOM element. It converts camelCase style names to dash-separated names 
function transformDomStyle(dom, style) {
  dom.style = Object.keys(style).reduce((acc, styleName) => {
    const key = styleName.replace(reg, function (v) {
      return '-' + v.toLowerCase();
    });
    acc += `${key}: ${style[styleName]};`;
    return acc;
  }, '');
}
function commitRoot() {
  // Remove deleted nodes from the DOM
  deletions.forEach(commitWork);

  // Add or update new and changed nodes
  commitWork(wipRoot.child);

  // Set current root to wip root and clear wip root
  currentRoot = wipRoot;
  wipRoot = null;
}

/**
 * Commits the changes made to the DOM by a given fiber node and its children.
 *
 * @param {FiberNode} fiber - The fiber node to commit the changes for.
 */

function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    // We don't want to commit parentless children to DOM
    return;
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

/**
 * Renders the given element into a container node with the specified ID or reference to a node.
 *
 * @param {Element} elem - The element to render.
 * @param {string|Node} nid - The ID or reference to the container node.
 * @throws {string} Throws an error if the container node is not found.
 */

function render(elem, nid) {
  // Check if nid is a Node (that means it can use as is) or is an id to an HTML element
  let container = nid instanceof Node ? nid : document.getElementById(nid);

  // document.getElementById returns a null if not found
  if (container === null) {
    // Perhaps create the element instead of throwing?
    throw "Mframe.render: non valid container ID";
  }
  if (elem instanceof Function) {
    throw "Mframe.render: cannot use function for rendering, call the function";
  }

  //keep track of the root of the fiber tree
  wipRoot = {
    dom: container,
    props: {
      children: [elem]
    },
    alternate: currentRoot
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

//declare different variables

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

/**
Function that runs a loop to perform work on the fiber tree. The work to be done is executed until either there is no more work left or until the deadline to complete the work has passed.
@param {Object} deadline - The deadline object representing the time by which the work should be completed.
*/

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

//Schedules the work loop to be executed the next time the browser's event loop is idle.
requestIdleCallback(workLoop);

/**
Function that performs the next unit of work in the fiber tree.
This involves:
Creating a new DOM node if it doesn't exist for the given fiber.
Creating new fibers for each child element.
Returning the next unit of work.
@param {Object} fiber - The fiber object representing the current element in the fiber tree.
@returns {Object} - The next unit of work to be performed.
*/

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}
let wipFiber = null;
let hookIndex = null;
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState(initial) {
  const oldHook = wipFiber ? wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex] : null;
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  };
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    if (typeof action === "function") {
      hook.state = action(hook.state)
    } else {
      hook.state = action
    }
  });
  const setState = action => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };
  
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

/**
Function that updates or adds new fibers for child elements in the given fiber.Count: 
This function also marks fibers that have been removed for deletion and stores them in a deletion list.
@param {Object} wipFiber - The work in progress fiber object representing the current element in the fiber tree.
@param {Array} elements - The array of child elements.
*/

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (index < elements.length || oldFiber != null) {
    let element = elements[index];
    if (element && !element.type && index === 0) {
      // Does it have children?
      if (element.props && element.props.children && element.props.children.length) {
        // Add them to elements
        elements = elements.concat(element.props.children);
        elements.splice(index, 1);
        element = elements[index];
      }
    }
    while (Array.isArray(element)) {
      // Join the array with elements and remove it
      elements = elements.concat(element);
      elements.splice(index, 1);
      element = elements[index];
    }
    let newFiber = null;
    const sameType = oldFiber && element && element.type == oldFiber.type;
    if (sameType) {
      //update node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }
    if (element && !sameType) {
      //add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }
    if (oldFiber && !sameType) {
      //delete the oldFiber's node
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

// Export as object
export const Mframe = {
  createElement,
  render,
  useState
};

// Re-export as default
export default Mframe;