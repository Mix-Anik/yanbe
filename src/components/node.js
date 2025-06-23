import { Port } from "./port.js";
import { Connection } from "./connection.js";
import { lerp, roundToStep } from "../helpers.js";
import { GRID } from "../constants.js";

export class Node {
    constructor(x, y, name, editor) {
        this.editor = editor;
        this.x = x;
        this.y = y;
        this.name = name;
        this.element = null;
        this.ports = null;
        this.animating = false;
        this.wishPos = {x: 0, y: 0};
        this.create();
    }

    create() {
        this.element = document.createElement('div');
        this.element.className = 'node';
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.element.textContent = this.name;
        this.ports = {
            input: new Port('input', this),
            output: new Port('output', this)
        };
        this.element.__ref = this;
        this.editor.viewport.appendChild(this.element);
    }

    connect(node) {
        const connection = new Connection(this.ports.output, node.ports.input, this.editor.svg);
        this.ports.output.connections.set(node.ports.input, connection);
        node.ports.input.connections.set(this.ports.output, connection);
    }

    disconnect(node) {
        this.ports.output.connections.delete(node.ports.input);
        node.ports.input.connections.delete(this.ports.output);
    }

    redrawConnections() {
        this.ports.input.connections.forEach(conn => conn.update());
        this.ports.output.connections.forEach(conn => conn.update());
    }

    static move(instance, startPos) {
        instance.element.classList.add('active');
        const startMousePos = instance.editor.calcOffsetPos(startPos);
        const nodeOffset = {x: startMousePos.x - instance.x, y: startMousePos.y - instance.y};
        const animate = () => {
            instance.x = lerp(instance.x, instance.wishPos.x, 0.2);
            instance.y = lerp(instance.y, instance.wishPos.y, 0.2);
            instance.element.style.left = `${instance.x}px`;
            instance.element.style.top = `${instance.y}px`;
            instance.redrawConnections();

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
            instance.element.classList.remove('active');
            instance.editor.nodeDragging = false;
        }, { once: true });
    }
}