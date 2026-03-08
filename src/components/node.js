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
        this.titleElement = null;
        this.bodyElement = null;
        this.animating = false;
        this.collapsed = options.collapsed ?? false;
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

        if (this.collapsed)
            this.element.classList.add('collapsed');

        // Header — drag handle and port anchor
        this.headerElement = document.createElement('div');
        this.headerElement.className = 'node-header';
        this.titleElement = document.createElement('span');
        this.titleElement.className = 'node-title';
        this.titleElement.textContent = this.type;
        this.headerElement.appendChild(this.titleElement);
        this.element.appendChild(this.headerElement);
        this.headerElement.addEventListener('mousedown', (e) => {
            editor.isDragging = true;
            editor.emit(EVENTS.NODE_HOLD, { node: this });
            this.startDrag({ x: e.clientX, y: e.clientY });
        });
        this.headerElement.addEventListener('dblclick', () => this.rename());

        // Body — fields
        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'node-body';
        this.element.appendChild(this.bodyElement);

        for (const field of this.fields)
            this.bodyElement.appendChild(field.create(this));

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

    addField(field) {
        this.fields.push(field);
        this.bodyElement.appendChild(field.create(this));
    }

    removeField(field) {
        field.destroy();
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
        return {
            id: this.id,
            type: this.type,
            x: Math.round(this.x),
            y: Math.round(this.y),
            fields: this.fields.map(f => f.toJSON()),
            ports: {
                input: this.ports.input.toJSON(),
                output: this.ports.output.toJSON()
            }
        };
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        const body = this.bodyElement;

        if (this.collapsed) {
            body.style.height = `${body.scrollHeight}px`;
            body.offsetHeight; // force reflow so transition fires
            this.element.classList.add('collapsed');
            body.style.height = '0';
        } else {
            this.element.classList.remove('collapsed');
            body.style.height = `${body.scrollHeight}px`;
            const onEnd = (e) => {
                if (e.propertyName !== 'height') return;
                body.style.height = '';
                body.removeEventListener('transitionend', onEnd);
            };
            body.addEventListener('transitionend', onEnd);
        }
    }

    rename() {
        const input = document.createElement('input');
        input.type      = 'text';
        input.className = 'node-title-input';
        input.value     = this.type;

        let cancelled = false;
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter')  input.blur();
            if (e.key === 'Escape') { cancelled = true; input.blur(); }
        });
        input.addEventListener('blur', () => {
            const newName = cancelled ? this.type : (input.value.trim() || this.type);
            this.type = newName;
            this.titleElement.textContent = newName;
            input.replaceWith(this.titleElement);
        });

        this.titleElement.replaceWith(input);
        input.focus();
        input.select();
    }

    moveTo(x, y) {
        this.wishPos = { x, y };
        if (!this.animating) {
            this.animating = true;
            animateToWishPos(this, () => this.editor.emit(EVENTS.NODE_MOVED, { node: this }));
        }
    }

}
