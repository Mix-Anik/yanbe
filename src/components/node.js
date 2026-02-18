import { InputPort, OutputPort } from "./port.js";
import { lerp, roundToStep } from "../helpers.js";
import { GRID } from "../constants.js";

export class Node {
    constructor(type, x, y, options={}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.element = null;
        this.animating = false;
        this.wishPos = {x: 0, y: 0};
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
        this.element.textContent = this.type;
        this.element.__ref = this;
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
            instance.wishPos = {
                x: roundToStep((endMousePos.x - nodeOffset.x), GRID.SIZE),
                y: roundToStep((endMousePos.y - nodeOffset.y), GRID.SIZE)
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