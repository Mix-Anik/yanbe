import { lerp, roundToStep } from '../helpers.js';
import { GRID } from '../constants.js';

export class SelectionBounds {
    constructor(editor) {
        this.editor = editor;
        this.element = document.createElement('div');
        this.element.className = 'selection-bounds';
        this.element.style.display = 'none';
        this.editor.viewport.appendChild(this.element);

        this.element.addEventListener('mousedown', (e) => this.onDragStart(e));
    }

    onDragStart(e) {
        if (e.button !== 0) return;

        this.editor.isDragging = true;

        const startCanvasPos = this.editor.calcOffsetPos({x: e.clientX, y: e.clientY});
        const startPositions = this.editor.selection.map(node => ({node, x: node.x, y: node.y}));

        const animateNode = (node) => {
            const step = () => {
                node.x = lerp(node.x, node.wishPos.x, 0.2);
                node.y = lerp(node.y, node.wishPos.y, 0.2);
                node.element.style.left = `${node.x}px`;
                node.element.style.top = `${node.y}px`;
                node.redrawConnections();
                this.editor.updateSelectionBounds();

                if (Math.abs(node.x - node.wishPos.x) > 0.5 || Math.abs(node.y - node.wishPos.y) > 0.5)
                    requestAnimationFrame(step);
                else
                    node.animating = false;
            };
            requestAnimationFrame(step);
        };

        const onMouseMove = (e) => {
            const currentPos = this.editor.calcOffsetPos({x: e.clientX, y: e.clientY});
            const dx = currentPos.x - startCanvasPos.x;
            const dy = currentPos.y - startCanvasPos.y;

            for (const {node, x, y} of startPositions) {
                node.wishPos = {
                    x: roundToStep(x + dx, GRID.SIZE),
                    y: roundToStep(y + dy, GRID.SIZE)
                };
                if (!node.animating) {
                    node.animating = true;
                    animateNode(node);
                }
            }
        };

        const onMouseUp = () => {
            this.editor.isDragging = false;
            this.editor._suppressNextClick = true;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    update(selection) {
        if (selection.length <= 1) {
            this.element.style.display = 'none';
            return;
        }

        const padding = 8;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const node of selection) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.element.offsetWidth);
            maxY = Math.max(maxY, node.y + node.element.offsetHeight);
        }

        this.element.style.left = `${minX - padding}px`;
        this.element.style.top = `${minY - padding}px`;
        this.element.style.width = `${maxX - minX + padding * 2}px`;
        this.element.style.height = `${maxY - minY + padding * 2}px`;
        this.element.style.display = 'block';
    }
}

export class RectSelectTool {
    constructor(editor) {
        this.editor = editor;
        document.addEventListener('mousedown', (e) => this.onSelecting(e));
    }

    onSelecting(e) {
        if (e.button != 0 || this.editor.isDragging) return;
        if (e.target.classList.contains('port') || e.target.classList.contains('connection')) return;
        if (!this.editor.element.contains(e.target)) return;

        this.editor.clearSelection();
        const element = document.createElement('div');
        this.editor.element.appendChild(element);
        element.className = 'selection';

        const editorRect = this.editor.element.getBoundingClientRect();
        const startMousePos = {
            x: e.clientX - editorRect.left,
            y: e.clientY - editorRect.top
        };
        element.style.left = `${startMousePos.x}px`;
        element.style.top = `${startMousePos.y}px`;

        let hasDragged = false;

        const onMouseMove = (e) => {
            hasDragged = true;
            const x = e.clientX - editorRect.left;
            const y = e.clientY - editorRect.top;
            element.style.left = `${Math.min(startMousePos.x, x)}px`;
            element.style.top = `${Math.min(startMousePos.y, y)}px`;
            element.style.width = `${Math.abs(startMousePos.x - x)}px`;
            element.style.height = `${Math.abs(startMousePos.y - y)}px`;
        }

        const onMouseUp = () => {
            if (hasDragged) {
                const selectionRect = element.getBoundingClientRect();
                this.editor.nodes.forEach(node => {
                    const rect = node.element.getBoundingClientRect();
                    const isInside = rect.left >= selectionRect.left &&
                                     rect.right <= selectionRect.right &&
                                     rect.top >= selectionRect.top &&
                                     rect.bottom <= selectionRect.bottom;
                    if (isInside) this.editor.addToSelection(node);
                });
                this.editor._suppressNextClick = true;
            }

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            element.remove();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}