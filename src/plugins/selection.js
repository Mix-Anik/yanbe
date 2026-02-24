import { roundToStep, animateToWishPos } from '../helpers.js';
import { GRID, DRAG_DEBOUNCE_MS, EVENTS } from '../constants.js';

export class SelectionPlugin {
    constructor(editor) {
        this.editor = editor;

        this._onClick = (e) => this.onClick(e);
        document.addEventListener('click', this._onClick);
        this._onMouseDown = (e) => this.onSelecting(e);
        document.addEventListener('mousedown', this._onMouseDown);

        this.boundsEl = document.createElement('div');
        this.boundsEl.className = 'selection-bounds';
        this.boundsEl.style.display = 'none';
        editor.viewport.appendChild(this.boundsEl);
        this.boundsEl.addEventListener('mousedown', (e) => this.onBoundsDragStart(e));

        this._unsubSelection = editor.on(EVENTS.SELECTION_CHANGE, ({ selection }) => this.updateBounds(selection));
        this._unsubMoved = editor.on(EVENTS.NODE_MOVED, () => this.updateBounds(editor.selection));
    }

    destroy() {
        document.removeEventListener('click', this._onClick);
        document.removeEventListener('mousedown', this._onMouseDown);
        this._unsubSelection();
        this._unsubMoved();
        this.boundsEl.remove();
    }

    onClick(e) {
        if (Date.now() - this.editor._lastDragTS < DRAG_DEBOUNCE_MS) return;
        if (e.target.classList.contains('port') || e.target.classList.contains('connection')) return;

        this.editor.clearSelection();

        const nodeEl = e.target.closest('.node');
        if (nodeEl) this.editor.addToSelection(nodeEl.__ref);
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
        };

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
                this.editor._lastDragTS = Date.now();
            }

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            element.remove();
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    onBoundsDragStart(e) {
        if (e.button !== 0) return;

        this.editor.isDragging = true;

        const startCanvasPos = this.editor.calcOffsetPos({x: e.clientX, y: e.clientY});
        const startPositions = this.editor.selection.map(node => ({node, x: node.x, y: node.y}));

        const onMouseMove = (e) => {
            const currentPos = this.editor.calcOffsetPos({x: e.clientX, y: e.clientY});
            const dx = currentPos.x - startCanvasPos.x;
            const dy = currentPos.y - startCanvasPos.y;
            const snap = this.editor.snapToGrid;

            for (const {node, x, y} of startPositions) {
                node.wishPos = {
                    x: snap ? roundToStep(x + dx, GRID.SIZE) : x + dx,
                    y: snap ? roundToStep(y + dy, GRID.SIZE) : y + dy
                };
                if (!node.animating) {
                    node.animating = true;
                    animateToWishPos(node, () => this.editor.emit(EVENTS.NODE_MOVED, { node }));
                }
            }
        };

        const onMouseUp = () => {
            this.editor.isDragging = false;
            this.editor._lastDragTS = Date.now();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    updateBounds(selection) {
        if (selection.length <= 1) {
            this.boundsEl.style.display = 'none';
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

        this.boundsEl.style.left = `${minX - padding}px`;
        this.boundsEl.style.top = `${minY - padding}px`;
        this.boundsEl.style.width = `${maxX - minX + padding * 2}px`;
        this.boundsEl.style.height = `${maxY - minY + padding * 2}px`;
        this.boundsEl.style.display = 'block';
    }
}
