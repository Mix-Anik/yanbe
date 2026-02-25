import { PreviewConnection } from "./connection.js";
import { clamp } from "../helpers.js";
import { GRID, EVENTS } from '../constants.js';

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
        this.cursorPos = {x: 0, y: 0};
        this.snapToGrid = true;

        this.element.addEventListener('wheel', this.zoom);
        this.element.addEventListener('mousedown', this.pan);

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
        for (const node of [...this.nodes])
            node.destroy();

        this.element.removeEventListener('wheel', this.zoom);
        this.element.removeEventListener('mousedown', this.pan);
        this.previewConnection.destroy();

        for (const plugin of this._plugins)
            plugin.destroy?.();

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
