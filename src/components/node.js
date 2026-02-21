import { InputPort, OutputPort } from "./port.js";
import { lerp, roundToStep } from "../helpers.js";
import { GRID } from "../constants.js";

export class Node {
    static _nextId = 0;

    constructor(type, x, y, options={}) {
        this.id = Node._nextId++;
        this.x = x;
        this.y = y;
        this.type = type;
        this.element = null;
        this.headerElement = null;
        this.bodyElement = null;
        this.animating = false;
        this.wishPos = {x: 0, y: 0};
        this.fields = options.fields ?? [];
        this.data = {};
        for (const field of this.fields) {
            if (field.key)
                this.data[field.key] = field.getValue !== undefined
                    ? (typeof field.default !== 'undefined' ? field.default : undefined)
                    : undefined;
        }
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

        // Body — fields
        this.bodyElement = document.createElement('div');
        this.bodyElement.className = 'node-body';
        this.element.appendChild(this.bodyElement);

        for (const field of this.fields) {
            const onChange = (value) => {
                if (field.key) this.data[field.key] = value;
            };
            // Link button fields back to this node instance for onClick
            if (field._onClick !== undefined) field._node = this;
            const el = field.render(onChange);
            this.bodyElement.appendChild(el);
            // Initialize data from rendered element
            if (field.key && field.getValue) {
                this.data[field.key] = field.getValue();
            }
        }

        this.editor.viewport.appendChild(this.element);
        this.ports.input.create();
        this.ports.output.create();
    }

    remove() {
        const idx = this.editor.nodes.indexOf(this);
        this.editor.nodes.splice(idx, 1);
        this.ports.input.remove();
        this.ports.output.remove();
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
            data: { ...this.data },
            fields,
            ports: {
                input: this.ports.input.toJSON(),
                output: this.ports.output.toJSON()
            }
        };
    }

    static move(instance, startPos) {
        const startMousePos = instance.editor.calcOffsetPos(startPos);
        const nodeOffset = {x: startMousePos.x - instance.x, y: startMousePos.y - instance.y};
        const animate = () => {
            instance.x = lerp(instance.x, instance.wishPos.x, 0.2);
            instance.y = lerp(instance.y, instance.wishPos.y, 0.2);
            instance.element.style.left = `${instance.x}px`;
            instance.element.style.top = `${instance.y}px`;
            instance.redrawConnections();
            instance.editor.updateSelectionBounds();

            if (Math.abs(instance.x - instance.wishPos.x) > 0.5 || Math.abs(instance.y - instance.wishPos.y) > 0.5)
                requestAnimationFrame(animate);
            else
                instance.animating = false;
        }
        const onDrag = (event) => {
            const endMousePos = instance.editor.calcOffsetPos({x: event.clientX, y: event.clientY});
            const snap = instance.editor.snapToGrid;
            instance.wishPos = {
                x: snap ? roundToStep((endMousePos.x - nodeOffset.x), GRID.SIZE) : endMousePos.x - nodeOffset.x,
                y: snap ? roundToStep((endMousePos.y - nodeOffset.y), GRID.SIZE) : endMousePos.y - nodeOffset.y
            }

            if (!instance.animating) {
                instance.animating = true;
                requestAnimationFrame(animate);
            }
        }

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onDrag);
            instance.editor.isDragging = false;
        }, { once: true });
    }
}
