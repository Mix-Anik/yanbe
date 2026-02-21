# AGENTS.md — YANBE Codebase Guide

## Project Overview

**YANBE** (Yet Another Node-Based Editor) is a zero-dependency JavaScript library for building node-based visual editors (think Blender node editor, visual programming graphs). It renders an infinite grid canvas with pannable/zoomable nodes that can be connected with Bezier-curve wires.

**Tech stack:** Vanilla ES6 modules · Vite (build only) · Vanilla CSS · No runtime dependencies

---

## Required HTML Structure

The editor expects this exact DOM skeleton — IDs are hardcoded in `Editor`:

```html
<div id="editor">
  <div id="viewport">
    <svg id="connections"></svg>
  </div>
</div>
```

---

## Project Structure

```
src/
  lib.js              # Public export surface (import from here)
  constants.js        # GRID, PORT_TYPE, BEZIER_STRENGTH
  helpers.js          # lerp(), roundToStep(), clamp()
  styles.css          # All styles + CSS custom properties for theming
  components/
    editor.js         # Editor class — main orchestrator, owns event loop
    node.js           # Node class — graph node with ports + optional fields
    port.js           # Port, InputPort, OutputPort
    connection.js     # Connection (permanent), PreviewConnection (drag ghost)
    menu.js           # ContextMenu (right-click)
    selection.js      # RectSelectTool (drag-to-select), SelectionBounds
    field.js          # Field base class + type registry
    fields/           # Built-in field types (auto-registered on import)

examples/             # Usage examples (basic, embedding, types, fields)
testing/              # Local dev test page (gitignored, not committed)
dist/                 # Build output (yanbe.js ESM, yanbe.umd.cjs, yanbe.css)
```

---

## Public API (`src/lib.js`)

```js
import { Editor, Node, InputPort, OutputPort,
         Port, Connection, PreviewConnection, ContextMenu,
         Field, TextField, IntegerField, DecimalField,
         CheckboxField, SelectField, ButtonField } from 'yanbe';
```

Typical usage:

```js
const editor = new Editor('editor');
const a = new Node('Label A', x, y);
const b = new Node('Label B', x, y, { input: { allow: ['Label A'], many: false } });
editor.addNode(a);
editor.addNode(b);
a.connect(b);  // b.ports.input accepts connections from a.ports.output
```

---

## Component Responsibilities

### `Editor` (`src/components/editor.js`)
Central orchestrator. Created once per page.

| Property | Purpose |
|---|---|
| `this.nodes` | Array of all Node instances |
| `this.scale` | Current zoom level (clamped 0.2–3) |
| `this.tx / this.ty` | Viewport pan offset |
| `this.activePort` | OutputPort currently being dragged for connection |
| `this.selection` | Array of selected Node instances |
| `this.isDragging` | True while a node is being dragged (blocks rect-select) |
| `this.previewConnection` | PreviewConnection instance |
| `this.contextMenu` | ContextMenu instance |
| `this.selector` | RectSelectTool instance |

Key methods: `addNode(node)`, `calcOffsetPos(pos)`, `addToSelection(obj)`, `clearSelection()`, `highlightConnectable()`, `resetHighlighting()`

All persistent event listeners are attached to `document` (not specific elements) using class arrow-function methods or inline lambdas in the constructor.

### `Node` (`src/components/node.js`)
Represents one graph node. Always has exactly one `InputPort` and one `OutputPort`.

```js
new Node(type, x, y, options)
// options = {
//   input:  { allow: [], many: true },
//   output: { many: true },
//   fields: [ new IntegerField({...}), ... ]   // optional
// }
```

**DOM structure** (created in `create(editor)`):
```
<div class="node">          ← this.element, __ref = node, drag target = header only
  <div class="node-header"> ← this.headerElement, cursor: move, port anchor
    <span class="node-title">type</span>
    <div class="port input"></div>
    <div class="port output"></div>
  </div>
  <div class="node-body">   ← this.bodyElement, fields rendered here
    <div class="field-row">…</div>
  </div>
</div>
```

| Property | Notes |
|---|---|
| `node.fields` | Array of `Field` instances passed via options |
| `node.data` | Plain object, keyed by `field.key`, auto-synced on user input |

| Method | Notes |
|---|---|
| `create(editor)` | Called by `editor.addNode()` — builds DOM, renders fields, creates ports |
| `connect(node)` | Creates a Connection from this node's output to `node`'s input |
| `disconnect(node)` | Removes that connection |
| `remove()` | Removes node from editor.nodes, removes ports & element |
| `redrawConnections()` | Calls `update()` on all connected Connection objects |
| `static move(instance, startPos)` | Smooth animated drag using rAF + lerp |

`Node.move()` is static. It sets `instance.wishPos` on each `mousemove` and interpolates `instance.x/y` toward it via `requestAnimationFrame`.

**`toJSON()` output** now includes `data` (live field values) and `fields` (field definitions including `value` key for paste restoration). `editor.snapToGrid` (default `true`) can be toggled at runtime to disable 20px grid snapping.

### `Port / InputPort / OutputPort` (`src/components/port.js`)
Ports are connection endpoints on a node.

- `this.connections` — `Map<Port, Connection>` where the key is the *other* port
- `getCenter()` — returns canvas-space coordinates (calls `editor.calcOffsetPos`)

**InputPort options:**
- `allow: string[]` — if non-empty, only nodes whose `type` is in this list can connect
- `many: boolean` — whether multiple incoming connections are allowed (default `true`)

**OutputPort options:**
- `many: boolean` — whether multiple outgoing connections are allowed (default `true`)

`canConnect()` is called by `Editor.onPortClick()` before creating a connection.

### `Connection` (`src/components/connection.js`)
An SVG `<path>` representing a permanent wire between two ports.

- Constructor: `new Connection(fromOutputPort, toInputPort, svgElement)`
- `update()` — redraws the cubic Bezier using `BEZIER_STRENGTH = 100` px control offset
- `remove()` — calls `node.disconnect()` and removes the SVG element
- `this.element.__ref = this` — allows click handler to retrieve Connection from DOM event

### `PreviewConnection` (`src/components/connection.js`)
Ghost wire shown while dragging from a port. Shares the same SVG and Bezier formula as `Connection`. Hidden by default (`display: none`). Toggled via `show()` / `hide()`.

### `ContextMenu` (`src/components/menu.js`)
Right-click menu. Built fresh on each `contextmenu` event and destroyed on `click` or next right-click. Tracks `keysPressed` as a `Set` to handle keyboard shortcuts (`Delete` key deletes selected nodes). Cleans up button `click` listeners in `hide()` to prevent leaks.

To add a new menu item:
```js
this.buttons.push({
  label: 'My Action',
  shortcut: 'X',         // displayed in <kbd>, null if none
  handler: (e) => { /* ... */ },
  ctx: ['node']          // restrict to CSS classes, null = always visible
});
```

### `RectSelectTool` (`src/components/selection.js`)
Drag-to-select on left-click. Creates a `.selection` div overlay, then on `mouseup` checks which nodes are fully inside using `getBoundingClientRect()`. Only activates when `editor.isDragging` is false.

### `SelectionBounds` (`src/components/selection.js`)
Renders a dashed bounding rectangle around all selected nodes when `selection.length > 1`. Supports group drag from the bounds element itself (uses the same lerp animation as single-node drag).

### `Field` (`src/components/field.js`) + built-in types (`src/components/fields.js`)
Abstract base class for node field types. Each subclass implements `render(onChange)`, `getValue()`, `setValue(value)`, and `toJSON()`.

**Base class API:**
```js
Field.register(MyFieldClass)         // register for fromJSON() reconstruction
Field.fromJSON(savedData)            // → new instance from serialized definition
field._createRow()                   // helper: <div class="field-row"> + <label>
```

**Constructor options (shared by all fields):**
- `label: string` — display label (also auto-generates `key` if not given)
- `key: string` — property name on `node.data` (defaults to label lowercased/underscored)
- `inline: boolean` — `true` (default) = label + control side-by-side; `false` = label above

**Built-in types:**

| Class | `type` string | Notes |
|---|---|---|
| `TextField` | `'text'` | options: `placeholder`, `maxlength` |
| `IntegerField` | `'integer'` | options: `min`, `max` |
| `DecimalField` | `'decimal'` | options: `min`, `max`, `step` |
| `CheckboxField` | `'checkbox'` | value is `true`/`false` |
| `SelectField` | `'select'` | requires `options: string[]` |
| `ButtonField` | `'button'` | `onClick(node)` callback; no serialized value |

All built-in types are auto-registered when `fields.js` is imported (which `lib.js` does).

**Custom field type template:**
```js
class MyField extends Field {
    static type = 'my-field';   // unique string for JSON round-trips

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? <defaultValue>;
    }

    render(onChange) {
        const row = this._createRow();
        // build DOM, wire onChange, store input ref on this._inp
        this._inp.addEventListener('mousedown', e => e.stopPropagation());
        return row;
    }

    getValue()      { return this._inp.value; }
    setValue(value) { this._inp.value = value; }
    toJSON()        { return { ...super.toJSON(), default: this.default }; }
}

Field.register(MyField);
```

**Important:** always call `e.stopPropagation()` on `mousedown` of any interactive element inside `render()` to prevent focus-related issues with the editor.

---

## Critical Code Conventions

### `__ref` pattern
Every DOM element that represents a class instance has `element.__ref = this` set on it. Event handlers use this to retrieve the instance from `e.target`:

```js
const node = e.target.__ref;   // e.g. in editor.js onClick
const port = e.target.__ref;   // in onPortClick
const connection = e.target.__ref;  // in onConnectionClick
```

Always set `__ref` when creating a new element that needs to be clickable.

### CSS class-based dispatch
Event handlers identify element types via CSS classes plus `closest()` traversal:

```js
// Node drag: only from the header
const header = e.target.closest('.node-header');
const nodeEl = header?.closest('.node');

// Node selection: anywhere on the node
const nodeEl = e.target.closest('.node');

// Port / connection: direct class check (they are leaf elements)
if (e.target.classList.contains('port')) { /* ... */ }
if (e.target.classList.contains('connection')) { /* ... */ }
```

### Coordinate systems
- **Screen/client coords** — raw `e.clientX / e.clientY` from mouse events
- **Canvas coords** — use `editor.calcOffsetPos({x, y})` to convert

Always convert mouse positions before using them as node/canvas positions.

### Smooth animation
Node dragging uses `requestAnimationFrame` + `lerp(current, target, 0.2)`. The loop stops when `|current - target| <= 0.5`. The `node.animating` flag prevents duplicate rAF loops.

### Grid snapping
`roundToStep(value, GRID.SIZE)` (20px grid) is applied to node positions in `Node.move()`.

---

## Styling & Theming (`src/styles.css`)

All visual configuration is via CSS custom properties on `:root`:

| Variable | Default | Purpose |
|---|---|---|
| `--accent` | `#d4a017` | Gold accent |
| `--bg` | `#1a1a1a` | Editor background |
| `--bg-pattern` | `#4e4e4e` | Grid dot color |
| `--n-bg` | `#145d6473` | Node background |
| `--n-border` | `#aaa` | Node border |
| `--n-text` | `white` | Node label color |
| `--p-bg` | `white` | Port circle fill |
| `--ctx-menu-bg` | `#145d64aa` | Context menu background |

Node width is `140px`; height is `auto` (grows with fields). The header is fixed at `36px`. Port circles are `14×14px` (input = circle, output = rotated square/diamond).

CSS classes used by components:

| Class | Element |
|---|---|
| `.node` | Outer node wrapper |
| `.node-header` | Drag handle + port anchor |
| `.node-title` | Type label inside header |
| `.node-body` | Field container (hidden when empty) |
| `.field-row` | Inline label+control row |
| `.field-row--block` | Block label-above-control row |
| `.field-button` | Button field element |
| `.port` | Port div (also `.input` or `.output`) |
| `.active` | Selected node |
| `.disabled` | Non-connectable node (dimmed) |
| `.connection` | SVG path for a permanent wire |
| `.preview-connection` | SVG path for the drag ghost wire |
| `.selection` | Rect-select overlay div |
| `.selection-bounds` | Multi-select bounding rectangle |
| `.ctx-menu`, `.ctx-menu-btn` | Context menu |

---

## Development Workflow

```bash
npm install       # install Vite dev dependency
npm run dev       # dev server → auto-opens /testing/index.html with hot reload
npm run build     # outputs dist/yanbe.js (ESM), dist/yanbe.umd.cjs, dist/yanbe.css
```

The `testing/` directory is gitignored. Create `testing/index.html` locally for development (see `ReadMe.md` for template).

---

## Constants (`src/constants.js`)

```js
GRID.SIZE = 20           // grid snap size in px
GRID.SCALE_FACTOR = 1.2  // zoom step multiplier
GRID.MIN_SCALE = 0.2     // minimum zoom
GRID.MAX_SCALE = 3       // maximum zoom
PORT_TYPE.INPUT = 'input'
PORT_TYPE.OUTPUT = 'output'
BEZIER_STRENGTH = 100    // Bezier control point offset in px
```

Always import from `constants.js` — never hardcode these values.

---

## Common Pitfalls

- **Nodes must be added to Editor before calling `connect()`** — `create(editor)` must run first or `connect()` throws a `ReferenceError`.
- **`Port.connections` is a `Map`, not an Array** — use `.set()`, `.get()`, `.delete()`, `.forEach()`.
- **The viewport transform order matters** — always `translate(tx, ty) scale(s)`, not the reverse.
- **ContextMenu creates a new DOM element on every `show()` call** — do not cache `this.element` across show/hide cycles; the old one is destroyed in `hide()`.
- **`RectSelectTool` attaches to `document` mousedown**, so it fires even on node clicks. It is guarded by `editor.isDragging` which `Editor.onNodeHold()` sets to `true` before `Node.move()`.
- **Node drag only fires from `.node-header`** — `Editor.onNodeHold()` uses `e.target.closest('.node-header')`. Clicks on the body or fields will NOT drag the node.
- **Field `render()` must stop mousedown propagation on interactive elements** — call `inp.addEventListener('mousedown', e => e.stopPropagation())` on any `<input>`, `<select>`, or `<button>` inside `render()`.
- **Custom field types must call `Field.register(MyField)`** before any paste operation that would reconstruct them — otherwise `Field.fromJSON()` will throw.
- **`ButtonField.onClick` is not serialized** — on paste, the button renders but is inert. If onClick matters post-paste, use a node type registry pattern instead.
- **`node.data` is initialized from `field.default`, not `field.getValue()`** — the DOM hasn't been created yet at construction time. After `editor.addNode()` (which calls `create()`), `node.data` is updated from the rendered elements.
