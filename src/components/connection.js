import { BEZIER_STRENGTH, EVENTS } from "../constants.js";
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

        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            const editor = this.from.node.editor;
            editor.emit(EVENTS.ACTION_SELECT, { obj: this });
        });

        this.element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const editor = this.from.node.editor;
            editor.activePort = this.from;
            editor.previewConnection.update({ x: e.clientX, y: e.clientY });
            editor.previewConnection.show();
            this.destroy();
            editor.highlightConnectable();
        });
    }

    update() {
        const { x: x1, y: y1 } = this.from.getCenter();
        const { x: x2, y: y2 } = this.to.getCenter();
        this.element.setAttribute('d', cubicBezierPath(x1, y1, x2, y2, BEZIER_STRENGTH));
    }

    destroy() {
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

        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.element.setAttribute('class', 'preview-connection');
        this.element.style.display = 'none';
        editor.svg.appendChild(this.element);

        this._onMouseMove = (e) => {
            editor.cursorPos = editor.calcOffsetPos({ x: e.clientX, y: e.clientY });
            if (editor.activePort)
                this.update({ x: e.clientX, y: e.clientY });
        };
        document.addEventListener('mousemove', this._onMouseMove);

        this._onCancelClick = (e) => {
            if (!editor.activePort)
                return;

            if (e.target.classList.contains('port') || e.target.classList.contains('connection'))
                return;

            editor.activePort = null;
            this.hide();
            editor.resetHighlighting();
        };
        document.addEventListener('click', this._onCancelClick);
    }

    destroy() {
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('click', this._onCancelClick);
        this.element.remove();
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
