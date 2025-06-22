export class Connection {
    static strength = 100;

    constructor(from, to, svg) {
        this.from = from;
        this.to = to;
        this.svg = svg;
        this.path = null;
        this.create();
    }

    create() {
        this.path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.path.setAttribute('stroke', 'white');
        this.path.setAttribute('stroke-width', '4');
        this.path.setAttribute('fill', 'none');
        this.svg.appendChild(this.path);
        this.update();
    }

    update() {
        const { x: x1, y: y1 } = this.from.getCenter();
        const { x: x2, y: y2 } = this.to.getCenter();
        const d = `M ${x1} ${y1} C ${x1 + Connection.strength} ${y1}, ${x2 - Connection.strength} ${y2}, ${x2} ${y2}`;

        this.path.setAttribute('d', d);
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

        document.addEventListener('click', (e) => {
            if (!this.editor.activePort || e.target.classList.contains('port')) return;

            this.editor.activePort = null;
            this.hide();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.editor.activePort) return;

            const { x: x1, y: y1 } = this.editor.activePort.getCenter();
            const { x: x2, y: y2 } = this.editor.calcOffsetPos({x: e.clientX, y: e.clientY});
            const d = `M ${x1} ${y1} C ${x1 + Connection.strength} ${y1}, ${x2 - Connection.strength} ${y2}, ${x2} ${y2}`;
            this.element.setAttribute('d', d);
        });
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
        this.element.setAttribute('d', null);
    }
}