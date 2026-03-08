import { Connection } from "./connection.js";
import { PORT_TYPE } from "../constants.js";

export class Port {
    constructor(type, node) {
        this.type = type;
        this.node = node;
        this.connections = new Map();
        this.element = null;
    }

    create() {
        this.element = document.createElement('div');
        this.element.classList.add('port', this.type);
        this.element.__ref = this;
        this.node.headerElement.appendChild(this.element);
    }

    destroy() {
        for (let connection of [...this.connections.values()]) {
            connection.destroy();
        }
        this.element.remove();
        this.element = null;
    }

    getCenter() {
        const rect = this.element.getBoundingClientRect();

        return this.node.editor.calcOffsetPos({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
    }

    createConnection(outputPort) {
        const connection = new Connection(outputPort, this, this.node.editor.svg);
        this.connections.set(outputPort, connection);
        outputPort.connections.set(this, connection);
    }

    removeConnection(outputPort) {
        this.connections.delete(outputPort);
        outputPort.connections.delete(this);
    }

    toJSON() {
        return { type: this.type };
    }
}

export class InputPort extends Port {
    constructor(node, options={}) {
        super(PORT_TYPE.INPUT, node);
        this.allow = options.allow ?? [];
        this.many = options.many ?? true;
    }

    create() {
        super.create();
        this.element.addEventListener('click', () => {
            const editor = this.node.editor;

            if (editor.activePort) {
                if (!this.canConnect(editor.activePort))
                    return;

                editor.activePort.node.connect(this.node);
                editor.activePort = null;
                editor.previewConnection.hide();
                editor.resetHighlighting();
            } else if (this.connections.size === 1) {
                const [[outputPort, connection]] = this.connections;
                editor.activePort = outputPort;
                connection.destroy();
                editor.previewConnection.show();
                editor.highlightConnectable();
            }
        });
    }

    toJSON() {
        return { ...super.toJSON(), allow: this.allow, many: this.many };
    }

    canConnect(outputPort) {
        if (outputPort.node == this.node)
            return false;

        if (this.allow.length && !this.allow.includes(outputPort.node.type))
            return false;

        if (!this.many && this.connections.size)
            return false;

        return true;
    }
}

export class OutputPort extends Port {
    constructor(node, options={}) {
        super(PORT_TYPE.OUTPUT, node);
        this.many = options.many ?? true;
    }

    create() {
        super.create();
        this.element.addEventListener('click', (e) => {
            if (!this.canConnect())
                return;

            const editor = this.node.editor;
            editor.activePort = this;
            editor.previewConnection.show();
            editor.highlightConnectable();
        });
    }

    toJSON() {
        return { ...super.toJSON(), many: this.many };
    }

    canConnect() {
        if (!this.many && this.connections.size)
            return false;

        return true;
    }
}