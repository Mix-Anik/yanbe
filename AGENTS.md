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
    node.js           # Node class — graph node with two ports
    port.js           # Port, InputPort, OutputPort
    connection.js     # Connection (permanent), PreviewConnection (drag ghost)
    menu.js           # ContextMenu (right-click)
    selection.js      # RectSelectTool (drag-to-select)

examples/             # Usage examples (basic, embedding, types)
testing/              # Local dev test page (gitignored, not committed)
dist/                 # Build output (yanbe.js ESM, yanbe.umd.cjs, yanbe.css)
```

---

## Public API (`src/lib.js`)

```js
import { Editor, Node, InputPort, OutputPort,
         Port, Connection, PreviewConnection, ContextMenu } from 'yanbe';
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
// options = { input: { allow: [], many: true }, output: { many: true } }
```

| Method | Notes |
|---|---|
| `create(editor)` | Called by `editor.addNode()` — builds DOM, creates ports |
| `connect(node)` | Creates a Connection from this node's output to `node`'s input |
| `disconnect(node)` | Removes that connection |
| `remove()` | Removes node from editor.nodes, removes ports & element |
| `redrawConnections()` | Calls `update()` on all connected Connection objects |
| `static move(instance, startPos)` | Smooth animated drag using rAF + lerp |

`Node.move()` is static. It sets `instance.wishPos` on each `mousemove` and interpolates `instance.x/y` toward it via `requestAnimationFrame`.

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
Event handlers identify element types via CSS classes, not `instanceof`:

```js
if (e.target.classList.contains('node')) { /* ... */ }
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

Node size is fixed at `120×60px` in CSS. Port circles are `14×14px`.

CSS classes used by components: `.node`, `.port`, `.input`, `.output`, `.connection`, `.preview-connection`, `.ctx-menu`, `.ctx-menu-btn`, `.selection`, `.active` (selected node), `.disabled` (non-connectable node).

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
