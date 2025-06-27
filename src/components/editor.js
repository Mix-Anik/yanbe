import { Node } from "./node.js";
import { PreviewConnection } from "./connection.js";
import { ContextMenu } from "./menu.js";
import { clamp } from "../helpers.js";
import { GRID, PORT_TYPE } from '../constants.js';

export class Editor {
    constructor(containerId) {
        this.element = document.getElementById(containerId);
        this.viewport = document.getElementById('viewport');
        this.svg = this.element.querySelector('svg');
        this.nodes = [];
        this.scale = 1;
        this.tx = 0;
        this.ty = 0;

        this.nodeDragging = false;
        this.activePort = null;
        this.previewConnection = new PreviewConnection(this);
        this.contextMenu = new ContextMenu(this);
        this.selection = [];

        this.element.addEventListener('wheel', this.zoom);
        this.element.addEventListener('mousedown', this.pan);
        document.addEventListener('click', (e) => this.onClick(e));
        document.addEventListener('click', (e) => this.onConnectionClick(e));
        document.addEventListener('click', (e) => this.onPortClick(e));
        document.addEventListener('click', (e) => this.onActivePortClick(e));
        document.addEventListener('mousedown', (e) => this.onNodeHold(e));
        document.addEventListener('mousemove', (e) => this.onActivePortMove(e));
    }

    addNode(node) {
        this.nodes.push(node);
        node.create(this);
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
        if (e.target != this.element || this.nodeDragging) return;

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

    onClick(e) {
        this.clearSelection();

        if (e.target.classList.contains('node'))
            this.addToSelection(e.target.__ref);
    }

    onActivePortMove(e) {
        if (!this.activePort) return;

        this.previewConnection.update({x: e.clientX, y: e.clientY});
    }

    onNodeHold(e) {
        if (!e.target.classList.contains('node')) return;

        const node = e.target.__ref;
        this.addToSelection(node);
        this.nodeDragging = true;
        Node.move(node, {x: e.clientX, y: e.clientY});
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

    addToSelection(obj) {
        if (!obj || obj.element.classList.contains('active') || this.selection.includes(obj))
            return;

        obj.element.classList.add('active');
        this.selection.push(obj);
    }

    removeFromSelection(obj) {
        obj.element.classList.remove('active');
        const idx = this.selection.indexOf(obj);
        this.selection.splice(idx, 1);
    }

    clearSelection() {
        if (!this.selection)
            return;

        for (let obj of this.selection)
            obj.element.classList.remove('active');

        this.selection = [];
    }
}