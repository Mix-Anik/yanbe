import { BEZIER_STRENGTH } from "../constants.js";

export class Connection {
    constructor(from, to, svg) {
        this.from = from;
        this.to = to;
        this.svg = svg;
        this.element = null;
        this.create();
    }

    create() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.element.setAttribute('stroke', 'white');
        this.element.setAttribute('stroke-width', '4');
        this.element.setAttribute('fill', 'none');
        this.element.setAttribute('class', 'connection');
        this.element.__ref = this;
        this.svg.appendChild(this.element);
        this.update();
    }

    update() {
        const { x: x1, y: y1 } = this.from.getCenter();
        const { x: x2, y: y2 } = this.to.getCenter();
        const d = `M ${x1} ${y1} C ${x1 + BEZIER_STRENGTH} ${y1}, ${x2 - BEZIER_STRENGTH} ${y2}, ${x2} ${y2}`;

        this.element.setAttribute('d', d);
    }

    remove() {
        this.from.node.disconnect(this.to.node);
        this.element.remove();
        this.element = null;
    }
}


export class PreviewConnection {
    constructor(editor) {
        this.editor = editor;
        this.create();
    }

    create() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.element.setAttribute('stroke', 'gray');
        this.element.setAttribute('stroke-width', '4');
        this.element.setAttribute('stroke-dasharray', '4,4');
        this.element.setAttribute('fill', 'none');
        this.element.style.display = 'none';
        this.editor.svg.appendChild(this.element);
    }

    update(mousePos) {
        const { x: x1, y: y1 } = this.editor.activePort.getCenter();
        const { x: x2, y: y2 } = this.editor.calcOffsetPos(mousePos);
        const d = `M ${x1} ${y1} C ${x1 + BEZIER_STRENGTH} ${y1}, ${x2 - BEZIER_STRENGTH} ${y2}, ${x2} ${y2}`;

        this.element.setAttribute('d', d);
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
        this.element.setAttribute('d', null);
    }
}