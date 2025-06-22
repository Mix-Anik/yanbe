import { Editor } from "./editor.js";
import { Port } from "./port.js";
import { Connection } from "./connection.js";
import { lerp, roundToStep } from "../helpers.js";


export class Node {
    constructor(x, y, name, editor) {
        this.editor = editor;
        this.x = x;
        this.y = y;
        this.name = name;
        this.element = null;
        this.ports = null;
        this.inputs = [];
        this.outputs = [];
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
        this.editor.viewport.appendChild(this.element);
        this.element.addEventListener('mousedown', this.onMouseDown);
    }

    onMouseDown = (e) => {
        if (e.target.classList.contains('port')) return;

        this.editor.nodeDragging = true;
        this.element.classList.add('active');
        const startMousePos = this.editor.calcOffsetPos({x: e.clientX, y: e.clientY});
        const nodeOffset = {x: startMousePos.x - this.x, y: startMousePos.y - this.y};

        const onDrag = (event) => {
            const endMousePos = this.editor.calcOffsetPos({x: event.clientX, y: event.clientY});
            this.wishPos = {
                x: roundToStep((endMousePos.x - nodeOffset.x), Editor.gridSize),
                y: roundToStep((endMousePos.y - nodeOffset.y), Editor.gridSize)
            }

            if (!this.animating) {
                this.animating = true;
                requestAnimationFrame(this.animate);
            }
        }
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', onDrag);
            this.element.classList.remove('active');
            this.editor.nodeDragging = false;
        }, { once: true });
    }

    animate = () => {
        this.x = lerp(this.x, this.wishPos.x, 0.2);
        this.y = lerp(this.y, this.wishPos.y, 0.2);

        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        this.redrawConnections();

        if (Math.abs(this.x - this.wishPos.x) > 0.5 || Math.abs(this.y - this.wishPos.y) > 0.5)
            requestAnimationFrame(this.animate);
        else
            this.animating = false;
    }

    connect(node) {
        const connection = new Connection(this.ports.output, node.ports.input, this.editor.svg);
        this.outputs.push(connection);
        node.inputs.push(connection);
    }

    redrawConnections() {
        this.inputs.forEach(conn => conn.update());
        this.outputs.forEach(conn => conn.update());
    }
}