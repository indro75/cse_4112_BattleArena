/**
 * Behavior Tree Framework for AI Combat Decision Making.
 */

const BTState = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
  RUNNING: 'RUNNING'
};

class BTNode {
  constructor(name = 'Node') {
    this.name = name;
  }

  evaluate(context) {
    return BTState.SUCCESS;
  }
}

// Selector (Fallback) - Executes children in sequence until one succeeds
class BTSelector extends BTNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
  }

  evaluate(context) {
    for (const child of this.children) {
      const result = child.evaluate(context);
      if (result !== BTState.FAILURE) {
        context.activeNodeName = child.name;
        return result;
      }
    }
    return BTState.FAILURE;
  }
}

// Sequence - Executes children in sequence until one fails
class BTSequence extends BTNode {
  constructor(name, children = []) {
    super(name);
    this.children = children;
  }

  evaluate(context) {
    for (const child of this.children) {
      const result = child.evaluate(context);
      if (result !== BTState.SUCCESS) {
        context.activeNodeName = child.name;
        return result;
      }
    }
    return BTState.SUCCESS;
  }
}

// Condition Leaf Node
class BTCondition extends BTNode {
  constructor(name, fn) {
    super(name);
    this.fn = fn;
  }

  evaluate(context) {
    const passed = this.fn(context);
    return passed ? BTState.SUCCESS : BTState.FAILURE;
  }
}

// Action Leaf Node
class BTAction extends BTNode {
  constructor(name, fn) {
    super(name);
    this.fn = fn;
  }

  evaluate(context) {
    return this.fn(context);
  }
}
