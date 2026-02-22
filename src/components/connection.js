import { BEZIER_STRENGTH } from "../constants.js";
import { cubicBezierPath } from "../helpers.js";

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
        this.element.setAttribute('class', 'connection');
        this.element.__ref = this;
        this.svg.appendChild(this.element);
        this.update();
    }

    update() {
        const { x: x1, y: y1 } = this.from.getCenter();
        const { x: x2, y: y2 } = this.to.getCenter();
        this.element.setAttribute('d', cubicBezierPath(x1, y1, x2, y2, BEZIER_STRENGTH));
    }

    remove() {
        this.from.node.disconnect(this.to.node);
        this.element.remove();
        this.element = null;
    }

    toJSON() {
        return { from: this.from.node.id, to: this.to.node.id };
    }
}


export class PreviewConnection {
    constructor(editor) {
        this.editor = editor;
        this.create();
    }

    create() {
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.element.setAttribute('class', 'preview-connection');
        this.element.style.display = 'none';
        this.editor.svg.appendChild(this.element);
    }

    update(mousePos) {
        const { x: x1, y: y1 } = this.editor.activePort.getCenter();
        const { x: x2, y: y2 } = this.editor.calcOffsetPos(mousePos);
        this.element.setAttribute('d', cubicBezierPath(x1, y1, x2, y2, BEZIER_STRENGTH));
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }
}
