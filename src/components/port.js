import { Connection } from './connection.js';

export class Port {
    constructor(type, node) {
        this.type = type;
        this.node = node;
        this.element = null;
        this.create();
    }

    create() {
        this.element = document.createElement('div');
        this.element.classList.add('port', this.type);
        this.node.element.appendChild(this.element);
        this.element.addEventListener('click', (e) => this.onClick(e));
    }

    getCenter() {
        const rect = this.element.getBoundingClientRect();

        return this.node.editor.calcOffsetPos({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
    }

    onClick(e) {
        if (this.type === 'output') {
            this.node.editor.activePort = this;
            this.node.editor.previewConnection.show();
        } else if (this.type === 'input' && this.node.editor.activePort) {
            const connection = new Connection(this.node.editor.activePort, this, this.node.editor.svg);
            this.node.editor.activePort.node.outputs.push(connection);
            this.node.inputs.push(connection);
            this.node.editor.activePort = null;
            this.node.editor.previewConnection.hide();
        }
    }
}