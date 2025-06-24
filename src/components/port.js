export class Port {
    constructor(type, node, options={}) {
        this.type = type;
        this.node = node;
        this.connections = new Map();
        this.element = null;
        this.allow = options.allow ?? [];
    }

    create() {
        this.element = document.createElement('div');
        this.element.classList.add('port', this.type);
        this.element.__ref = this;
        this.node.element.appendChild(this.element);
    }

    getCenter() {
        const rect = this.element.getBoundingClientRect();

        return this.node.editor.calcOffsetPos({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        });
    }

    canConnect(outputPort) {
        if (outputPort.node == this.node)
            return false;

        if (this.allow.length && !this.allow.includes(outputPort.node.type))
            return false;

        return true;
    }
}