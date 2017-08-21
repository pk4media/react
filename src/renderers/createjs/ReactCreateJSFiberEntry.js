'use strict';

const createjs = require('createjs-cmd');
const invariant = require('fbjs/lib/invariant');
const emptyObject = require('fbjs/lib/emptyObject');
const React = require('react');
const ReactFiberReconciler = require('ReactFiberReconciler');
const ReactDOMFrameScheduling = require('ReactDOMFrameScheduling');

const { Component } = React;

const EVENT_TYPES = {
  onClick: 'click',
  onDragmove: 'pressmove',
  onDragend: 'pressup',
  onMouseOver: 'mouseover',
  onMouseOut: 'mouseout',
  onMouseDown: 'mousedown',
  onDblclick: 'dblclick',
  onRollout: 'rollout',
  onRollover: 'rollover',
};

const TYPES = {
  BITMAP: 'Bitmap',
  BITMAP_TEXT: 'BitmapText',
  CONTAINER: 'Container',
  SHAPE: 'Shape',
  SPRITE: 'Sprite',
  TEXT: 'Text',
};

const UPDATE_SIGNAL = emptyObject;

/** Helper Methods */

function childrenAsString(children) {
  if (!children) {
    return '';
  } else if (typeof children === 'string') {
    return children;
  } else if (children.length) {
    return children.join('');
  } else {
    return '';
  }
}

function destroyEventListeners(instance) {
  if (instance._subscriptions) {
    for (let type in instance._subscriptions) {
      instance.off(type, instance._subscriptions[type]);
    }
  }

  instance._subscriptions = null;
}

const applyProps = (availableProps, curProps, prevProps) => {
  return availableProps.reduce(
    (setProps, prop) => {
      if (curProps[prop] !== prevProps[prop]) {
        setProps[prop] = curProps[prop];
      }
      return setProps;
    },
    {}
  );
}

/** Render Methods */

const displayObjectProps = [
  'alpha',
  'cacheID',
  'compositeOperation',
  'cursor',
  'filters',
  'hitArea',
  'id',
  'mask',
  'mouseEnabled',
  'name',
  'regX',
  'regY',
  'rotation',
  'scaleX',
  'scaleY',
  'shadow',
  'skewX',
  'skewY',
  'snapToPixel',
  'tickEnabled',
  'transformMatrix',
  'visible',
  'x',
  'y',
];
function applyDisplayObjectProps(instance, props, prevProps = {}) {
  for (let type in EVENT_TYPES) {
    const eventType = EVENT_TYPES[type];
    if (prevProps[type] && props[type] !== prevProps[type]) {
      instance.off(eventType, prevProps[type]);
    }

    if (props[type] && props[type] !== prevProps[type]) {
      instance.on(eventType, props[type]);
    }
  }

  const setProps = applyProps(displayObjectProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

const containerProps = ['mouseChildren', 'tickChildren'];
function applyContainerProps(instance, props, prevProps = {}) {
  applyDisplayObjectProps(instance, props, prevProps);

  const setProps = applyProps(containerProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

const bitmapProps = ['image', 'sourceRect'];
function applyBitmapProps(instance, props, prevProps = {}) {
  applyDisplayObjectProps(instance, props, prevProps);

  const setProps = applyProps(bitmapProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

const bitmapTextProps = [
  'letterSpacing',
  'lineHeight',
  'spaceWidth',
  'spriteSheet',
  'text',
];
function applyBitmapTextProps(instance, props, prevProps = {}) {
  applyDisplayObjectProps(instance, props, prevProps);

  const setProps = applyProps(bitmapTextProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

const shapeProps = [
  'graphics',
];
function applyShapeProps(instance, props, prevProps = {}) {
  applyDisplayObjectProps(instance, props, prevProps);

  const setProps = applyProps(shapeProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

const spriteProps = [
  'currentAnimationFrame',
  'framerate',
  'paused',
];
function applySpriteProps(instance, props, prevProps = {}) {
  applyDisplayObjectProps(instance, props, prevProps);

  const setProps = applyProps(spriteProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

const textProps = [
  'color',
  'font',
  'lineHeight',
  'lineWidth',
  'maxWidth',
  'outline',
  'text',
  'textAlign',
  'textBaseline',
];
function applyTextProps(instance, props, prevProps = {}) {
  applyDisplayObjectProps(instance, props, prevProps);

  const setProps = applyProps(textProps, props, prevProps);

  if (Object.keys(setProps).length > 0) {
    instance.set(setProps);
  }
}

/** React Components */

class Stage extends Component {

  componentDidMount() {
    const { height, width, enableMouseOver } = this.props;

    this._stage = new createjs.Stage(this._tagRef);
    createjs.Touch.enable(this._stage);
    createjs.Ticker.addEventListener("tick", this._stage);

    if (typeof enableMouseOver === "number") {
      this._stage.enableMouseOver(enableMouseOver);
    } else if (typeof enableMouseOver === "boolean") {
      enableMouseOver ?
        this._stage.enableMouseOver() :
        this._stage.enableMouseOver(0);
    }

    this._mountNode = CreateJSRenderer.createContainer(this._stage);
    CreateJSRenderer.updateContainer(
      this.props.children,
      this._mountNode,
      this,
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const { enableMouseOver } = this.props;

    if (typeof enableMouseOver === "number") {
      this._stage.enableMouseOver(enableMouseOver);
    } else if (typeof enableMouseOver === "boolean") {
      enableMouseOver ?
        this._stage.enableMouseOver() :
        this._stage.enableMouseOver(0);
    }

    CreateJSRenderer.updateContainer(
      this.props.children,
      this._mountNode,
      this,
    );

    if (this._stage.update) {
      this._stage.update();
    }
  }

  componentWillUnmount() {
    CreateJSRenderer.updateContainer(
      null,
      this._mountNode,
      this,
    );

    createjs.Touch.disable(this._stage);
    createjs.Ticker.removeEventListener("tick", this._stage);
  }

  render() {
    const props = this.props;

    return (
      <canvas
        ref={(ref) => this._tagRef = ref}
        accessKey={props.accessKey}
        className={props.className}
        width={props.width}
        height={props.height}
        role={props.role}
        style={props.style}
        tabIndex={props.tabIndex}
      />
    );
  }

}

/** ART Renderer */

const CreateJSRenderer = ReactFiberReconciler({
  appendChild(parentInstance, child) {
    if (child.parent === parentInstance) {
      parentInstance.removeChild(child);
    }

    parentInstance.addChild(child);
  },

  appendChildToContainer(parentInstance, child) {
    if (child.parent === parentInstance) {
      parentInstance.removeChild(child);
    }

    parentInstance.addChild(child);
  },

  appendInitialChild(parentInstance, child) {
    if (typeof child === 'string') {
      // Noop for string children of Text (eg <Text>{'foo'}{'bar'}</Text>)
      invariant(false, 'Text children should already be flattened.');
      return;
    }

    parentInstance.addChild(child);
  },

  commitTextUpdate(textInstance, oldText, newText) {
    // Noop
  },

  commitMount(instance, type, newProps) {
    // Noop
  },

  commitUpdate(instance, updatePayload, type, oldProps, newProps) {
    instance._applyProps(instance, newProps, oldProps);
  },

  createInstance(type, props, internalInstanceHandle) {
    let instance;

    switch (type) {
      case TYPES.BITMAP:
        instance = new createjs.Bitmap(props.image);
        instance._applyProps = applyBitmapProps;
        break;
      case TYPES.BITMAP_TEXT:
        instance = new createjs.BitmapText(props.children, props.spriteSheet);
        instance._applyProps = applyBitmapTextProps;
        break;
      case TYPES.CONTAINER:
        instance = new createjs.Container();
        instance._applyProps = applyContainerProps;
        break;
      case TYPES.SHAPE:
        instance = new createjs.Shape(props.graphics);
        instance._applyProps = applyShapeProps;
        break;
      case TYPES.SPRITE:
        instance = new createjs.Sprite(props.spriteSheet, props.initialFrame || props.initialAnimation);
        instance._applyProps = applySpriteProps;
        break;
      case TYPES.TEXT:
        instance = new createjs.Text(props.children, props.font, props.color);
        instance._applyProps = applyTextProps;
        break;
    }

    invariant(instance, 'ReactCreateJS does not support the type "%s"', type);

    instance._applyProps(instance, props);

    return instance;
  },

  createTextInstance(text, rootContainerInstance, internalInstanceHandle) {
    return text;
  },

  finalizeInitialChildren(domElement, type, props) {
    return false;
  },

  getPublicInstance(instance) {
    return instance;
  },

  insertBefore(parentInstance, child, beforeChild) {
    invariant(
      child !== beforeChild,
      'ReactCreateJS: Can not insert node before itself'
    );

    parentInstance.addChildAt(
      child,
      parentInstance.getChildIndex(beforeChild),
    );
  },

  insertInContainerBefore(parentInstance, child, beforeChild) {
    invariant(
      child !== beforeChild,
      'ReactCreateJS: Can not insert node before itself'
    );

    parentInstance.addChildAt(
      child,
      parentInstance.getChildIndex(beforeChild),
    );
  },

  prepareForCommit() {
    // Noop
  },

  prepareUpdate(domElement, type, oldProps, newProps) {
    return UPDATE_SIGNAL;
  },

  removeChild(parentInstance, child) {
    destroyEventListeners(child);
    parentInstance.removeChild(child);
  },

  removeChildFromContainer(parentInstance, child) {
    destroyEventListeners(child);
    parentInstance.removeChild(child);
  },

  resetAfterCommit() {
    // Noop
  },

  resetTextContent(domElement) {
    // Noop
  },

  shouldDeprioritizeSubtree(type, props) {
    return false;
  },

  getRootHostContext() {
    return emptyObject;
  },

  getChildHostContext() {
    return emptyObject;
  },

  scheduleDeferredCallback: ReactDOMFrameScheduling.rIC,

  shouldSetTextContent(type, props) {
    return (
      typeof props.children === 'string' || typeof props.children === 'number'
    );
  },

  useSyncScheduling: true,
});

/** API */

module.exports = {
  AlphaMapFilter: createjs.AlphaMapFilter,
  AlphaMaskFilter: createjs.AlphaMaskFilter,
  Bitmap: TYPES.BITMAP,
  BitmapText: function BitmapText(props) {
    const T = TYPES.BITMAP_TEXT;
    return <T {...props}>{childrenAsSTring(props.children)}</T>;
  },
  BlurFilter: createjs.BlurFilter,
  ColorFilter: createjs.ColorFilter,
  ColorMatrixFilter: createjs.ColorMatrixFilter,
  Container: TYPES.CONTAINER,
  Graphics: createjs.Graphics,
  Matrix2D: createjs.Matrix2D,
  Point: createjs.Point,
  Rectangle: createjs.Rectangle,
  Shadow: createjs.Shadow,
  Shape: TYPES.SHAPE,
  Sprite: TYPES.SPRITE,
  SpriteSheet: createjs.SpriteSheet,
  Stage,
  Text: function Text(props) {
    // TODO: This means you can't have children that render into strings.
    const T = TYPES.TEXT;
    return <T {...props}>{childrenAsString(props.children)}</T>;
  },
};
