import { InputPort, OutputPort } from "./port.js";
import { animateToWishPos } from "../helpers.js";
import { EVENTS } from "../constants.js";
import { Draggable } from "../mixins/draggable.js";

export class Node extends Draggable {
    static _nextId = 0;

    static resetIdCounter() { Node._nextId = 0; }

    constructor(type, x, y, options={}) {
        super();
        this.id = options.id ?? Node._nextId++;
        this.x = x;
        this.y = y;
        this.type = type;
        this.element = null;
        this.headerElement = null;
        this.bodyElement = null;
        this.animating = false;
        this.wishPos = {x: 0, y: 0};
        this.fields = options.fields ?? [];
        this.ports = {
            input: new InputPort(this, options.input ?? {}),
            output: new OutputPort(this, options.output ?? {})
        };
    }

    create(editor) {
        this.editor = editor;

        this.element = document.createElement('div');
        this.element.className = 'node';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.__ref = this;

        // Header — drag handle and port anchor
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'node-header';
        const title = document.createElement('span');
        title.className = 'node-title';
        title.textContent = this.type;
        this.headerElement.appendChild(title);
        this.element.appendChild(this.headerElement);
        this.headerElement.addEventListener('mousedown', (e) => {
            editor.isDragging = true;
            editor.emit(EVENTS.NODE_HOLD, { node: this });
            this.startDrag({ x: e.clientX, y: e.clientY });
        });

        // Body — fields
        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'node-body';
        this.element.appendChild(this.bodyElement);

        for (const field of this.fields) {
            this.bodyElement.appendChild(field.create(this));
        }

        this.editor.viewport.appendChild(this.element);
        this.ports.input.create();
        this.ports.output.create();
    }

    destroy() {
        const idx = this.editor.nodes.indexOf(this);
        this.editor.nodes.splice(idx, 1);
        this.editor.emit(EVENTS.NODE_REMOVED, { node: this });
        this.ports.input.destroy();
        this.ports.output.destroy();
        this.element.remove();
    }

    connect(node) {
        if (!this.element || !node.element)
            throw ReferenceError('Nodes should be added to Editor before creating a connection.');

        node.ports.input.createConnection(this.ports.output);
    }

    disconnect(node) {
        node.ports.input.removeConnection(this.ports.output);
    }

    redrawConnections() {
        this.ports.input.connections.forEach(conn => conn.update());
        this.ports.output.connections.forEach(conn => conn.update());
    }

    toJSON() {
        const fields = this.fields.map(f => {
            const def = f.toJSON();
            if (f.key && f.getValue) def.value = f.getValue();
            return def;
        });

        return {
            id: this.id,
            type: this.type,
            x: Math.round(this.x),
            y: Math.round(this.y),
            fields,
            ports: {
                input: this.ports.input.toJSON(),
                output: this.ports.output.toJSON()
            }
        };
    }

    moveTo(x, y) {
        this.wishPos = { x, y };
        if (!this.animating) {
            this.animating = true;
            animateToWishPos(this, () => this.editor.emit(EVENTS.NODE_MOVED, { node: this }));
        }
    }

}
