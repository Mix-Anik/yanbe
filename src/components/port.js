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
        this.node.element.appendChild(this.element);
    }

    remove() {
        for (let connection of this.connections.values()) {
            connection.remove();
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
}

export class InputPort extends Port {
    constructor(node, options={}) {
        super(PORT_TYPE.INPUT, node);
        this.allow = options.allow ?? [];
        this.many = options.many ?? true;
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

    canConnect() {
        if (!this.many && this.connections.size)
            return false;

        return true;
    }
}