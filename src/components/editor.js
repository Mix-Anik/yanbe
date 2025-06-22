import { Node } from "./node.js";
import { PreviewConnection } from "./connection.js";
import { clamp } from "../helpers.js";

export class Editor {
    static gridSize = 20;
    static scaleFactor = 1.2;
    static minScale = 0.2;
    static maxScale = 3;

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.viewport = document.getElementById('viewport');
        this.svg = this.container.querySelector('svg');
        this.nodes = [];
        this.scale = 1;
        this.tx = 0;
        this.ty = 0;

        this.nodeDragging = false;
        this.activePort = null;
        this.previewConnection = new PreviewConnection(this);

        this.container.addEventListener('wheel', this.zoom);
        this.container.addEventListener('mousedown', this.pan);
    }

    addNode(x, y, name) {
        const node = new Node(x, y, name, this);
        this.nodes.push(node);
    }

    addNode(node) {
        this.nodes.push(node);
    }

    calcOffsetPos(pos) {
        return {
            x: (pos.x - this.container.offsetLeft - this.tx) / this.scale,
            y: (pos.y - this.container.offsetTop - this.ty) / this.scale
        };
    }

    zoom = (e) => {
        e.preventDefault();

        const prevScale = this.scale;
        const rect = this.viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.deltaY < 0)
            this.scale *= Editor.scaleFactor;
        else
            this.scale /= Editor.scaleFactor;

        this.scale = Math.round(clamp(this.scale, Editor.minScale, Editor.maxScale) * 100) / 100;

        const scaleDiff = this.scale / prevScale;
        const scaledGridSize = Editor.gridSize * this.scale;
        const gridPosOffset = (scaledGridSize / 2);
        this.tx -= (mouseX * (scaleDiff - 1));
        this.ty -= (mouseY * (scaleDiff - 1));

        this.viewport.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
        this.container.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
        this.container.style.backgroundPosition = `${this.tx + gridPosOffset}px ${this.ty + gridPosOffset}px`;
    }

    pan = (e) => {
        if (e.target != this.container || this.nodeDragging) return;

        let startMousePos = {x: e.clientX, y: e.clientY};

        const onDrag = (event) => {
            this.tx += event.clientX - startMousePos.x;
            this.ty += event.clientY - startMousePos.y;
            startMousePos = {x: event.clientX, y: event.clientY};
            const gridPosOffset = (Editor.gridSize * this.scale / 2);

            this.viewport.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
            this.container.style.backgroundPosition = `${this.tx + gridPosOffset}px ${this.ty + gridPosOffset}px`;
        }

        this.container.addEventListener('mousemove', onDrag);
        this.container.addEventListener('mouseup', () => {
            this.container.removeEventListener('mousemove', onDrag);
        }, { once: true });
    }
}