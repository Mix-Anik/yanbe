import { Node } from "./node.js";
import { PreviewConnection } from "./connection.js";
import { clamp } from "../helpers.js";
import { GRID, PORT_TYPE, EVENTS } from '../constants.js';

export class Editor {
    _listeners = new Map();
    _plugins = [];

    constructor(containerId, options = {}) {
        this.element = document.getElementById(containerId);
        this.viewport = document.getElementById('viewport');
        this.svg = this.element.querySelector('svg');
        this.nodes = [];
        this.scale = 1;
        this.tx = 0;
        this.ty = 0;

        this.isDragging = false;
        this.activePort = null;
        this._lastDragTS = 0;
        this._cursorPos = {x: 0, y: 0};
        this.snapToGrid = true;

        this.element.addEventListener('wheel', this.zoom);
        this.element.addEventListener('mousedown', this.pan);

        this._onConnectionClick = (e) => this.onConnectionClick(e);
        this._onPortClick = (e) => this.onPortClick(e);
        this._onActivePortClick = (e) => this.onActivePortClick(e);
        this._onNodeHold = (e) => this.onNodeHold(e);
        this._onMouseMove = (e) => this.onMouseMove(e);

        document.addEventListener('click', this._onConnectionClick);
        document.addEventListener('click', this._onPortClick);
        document.addEventListener('click', this._onActivePortClick);
        document.addEventListener('mousedown', this._onNodeHold);
        document.addEventListener('mousemove', this._onMouseMove);

        this.previewConnection = new PreviewConnection(this);

        for (const PluginClass of (options.plugins ?? [])) {
            this.addPlugin(PluginClass);
        }
    }

    on(event, fn) {
        if (!this._listeners.has(event)) this._listeners.set(event, new Set());
        this._listeners.get(event).add(fn);
        return () => this.off(event, fn);
    }

    off(event, fn) {
        this._listeners.get(event)?.delete(fn);
    }

    emit(event, data) {
        this._listeners.get(event)?.forEach(fn => fn(data));
    }

    addPlugin(cls) {
        const instance = new cls(this);
        this._plugins.push(instance);
        return instance;
    }

    destroy() {
        this.element.removeEventListener('wheel', this.zoom);
        this.element.removeEventListener('mousedown', this.pan);
        document.removeEventListener('click', this._onConnectionClick);
        document.removeEventListener('click', this._onPortClick);
        document.removeEventListener('click', this._onActivePortClick);
        document.removeEventListener('mousedown', this._onNodeHold);
        document.removeEventListener('mousemove', this._onMouseMove);
        for (const plugin of this._plugins) plugin.destroy?.();
        this._listeners.clear();
    }

    addNode(node) {
        this.nodes.push(node);
        node.create(this);
        this.emit(EVENTS.NODE_ADD, { node });
    }

    calcOffsetPos(pos) {
        return {
            x: (pos.x - this.element.offsetLeft - this.tx) / this.scale,
            y: (pos.y - this.element.offsetTop - this.ty) / this.scale
        };
    }

    zoom = (e) => {
        e.preventDefault();

        const prevScale = this.scale;
        const rect = this.viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.deltaY < 0)
            this.scale *= GRID.SCALE_FACTOR;
        else
            this.scale /= GRID.SCALE_FACTOR;

        this.scale = Math.round(clamp(this.scale, GRID.MIN_SCALE, GRID.MAX_SCALE) * 100) / 100;

        const scaleDiff = this.scale / prevScale;
        const scaledGridSize = GRID.SIZE * this.scale;
        const gridPosOffset = (scaledGridSize / 2);
        this.tx -= (mouseX * (scaleDiff - 1));
        this.ty -= (mouseY * (scaleDiff - 1));

        this.viewport.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
        this.element.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
        this.element.style.backgroundPosition = `${this.tx + gridPosOffset}px ${this.ty + gridPosOffset}px`;
    }

    pan = (e) => {
        if (e.button != 1 || e.target != this.element || this.isDragging) return;

        let startMousePos = {x: e.clientX, y: e.clientY};

        const onDrag = (event) => {
            this.tx += event.clientX - startMousePos.x;
            this.ty += event.clientY - startMousePos.y;
            startMousePos = {x: event.clientX, y: event.clientY};
            const gridPosOffset = (GRID.SIZE * this.scale / 2);

            this.viewport.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
            this.element.style.backgroundPosition = `${this.tx + gridPosOffset}px ${this.ty + gridPosOffset}px`;
        }

        this.element.addEventListener('mousemove', onDrag);
        this.element.addEventListener('mouseup', () => {
            this.element.removeEventListener('mousemove', onDrag);
        }, { once: true });
    }

    onConnectionClick(e) {
        if (!e.target.classList.contains('connection')) return;

        const connection = e.target.__ref;
        this.activePort = connection.from;
        this.previewConnection.update({x: e.clientX, y: e.clientY});
        this.previewConnection.show();
        connection.remove();
        this.highlightConnectable();
    }

    onPortClick(e) {
        if (!e.target.classList.contains('port')) return;

        const port = e.target.__ref;
        if (port.type === PORT_TYPE.OUTPUT && port.canConnect()) {
            this.activePort = port;
            this.previewConnection.update({x: e.clientX, y: e.clientY});
            this.previewConnection.show();
            this.highlightConnectable();
        } else if (port.type === PORT_TYPE.INPUT && this.activePort && port.canConnect(this.activePort)) {
            this.activePort.node.connect(port.node);
            this.activePort = null;
            this.previewConnection.hide();
            this.resetHighlighting();
        }
    }

    onActivePortClick(e) {
        if (!this.activePort || e.target.classList.contains('port') || e.target.classList.contains('connection')) return;

        this.activePort = null;
        this.previewConnection.hide();
        this.resetHighlighting();
    }

    onMouseMove(e) {
        this._cursorPos = this.calcOffsetPos({x: e.clientX, y: e.clientY});

        if (!this.activePort) return;
        this.previewConnection.update({x: e.clientX, y: e.clientY});
    }

    highlightConnectable() {
        this.resetHighlighting();

        for (const node of this.nodes) {
            if (!node.ports.input.canConnect(this.activePort) && node != this.activePort.node)
                node.element.classList.add('disabled');
        }
    }

    resetHighlighting() {
        for (const node of this.nodes) {
            node.element.classList.remove('disabled');
        }
    }

    onNodeHold(e) {
        const header = e.target.closest('.node-header');
        if (!header) return;

        const nodeEl = header.closest('.node');
        if (!nodeEl) return;

        const node = nodeEl.__ref;
        this.isDragging = true;
        this.emit(EVENTS.NODE_HOLD, { node });
        Node.move(node, {x: e.clientX, y: e.clientY});
    }

    toJSON() {
        const connections = [];
        for (const node of this.nodes) {
            node.ports.output.connections.forEach(conn => connections.push(conn.toJSON()));
        }

        return {
            viewport: {
                scale: this.scale,
                snapping: this.snapToGrid,
                tx: this.tx,
                ty: this.ty
            },
            nodes: this.nodes.map(node => node.toJSON()),
            connections
        };
    }
}
