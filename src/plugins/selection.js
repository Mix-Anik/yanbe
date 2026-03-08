import { DRAG_DEBOUNCE_MS, EVENTS } from '../constants.js';
import { Draggable } from '../mixins/draggable.js';

export class SelectionPlugin {

    constructor(editor) {
        this.editor = editor;
        editor.selection = [];

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

        this._unsubNodeRemoved = editor.on(EVENTS.NODE_REMOVED, ({ node }) => {
            if (editor.selection.includes(node))
                this.removeFromSelection(node);
        });

        this._unsubPaste = editor.on(EVENTS.ACTION_PASTE, ({ nodes }) => {
            this.clearSelection();
            for (const node of nodes)
                this.addToSelection(node);
        });

        this._unsubSelect = editor.on(EVENTS.ACTION_SELECT, ({ obj }) => {
            if (!editor.selection.includes(obj))
                this.clearSelection();
            this.addToSelection(obj);
        });
    }

    destroy() {
        document.removeEventListener('click', this._onClick);
        document.removeEventListener('mousedown', this._onMouseDown);
        this._unsubSelection();
        this._unsubMoved();
        this._unsubNodeRemoved();
        this._unsubPaste();
        this._unsubSelect();
        this.boundsEl.remove();
    }

    addToSelection(obj) {
        if (!obj || obj.element.classList.contains('active') || this.editor.selection.includes(obj))
            return;

        obj.element.classList.add('active');
        this.editor.selection.push(obj);
        this.editor.emit(EVENTS.SELECTION_CHANGE, { selection: this.editor.selection });
    }

    removeFromSelection(obj) {
        obj.element.classList.remove('active');
        const idx = this.editor.selection.indexOf(obj);
        this.editor.selection.splice(idx, 1);
        this.editor.emit(EVENTS.SELECTION_CHANGE, { selection: this.editor.selection });
    }

    clearSelection() {
        if (!this.editor.selection.length) return;

        for (const obj of this.editor.selection)
            obj.element.classList.remove('active');

        this.editor.selection = [];
        this.editor.emit(EVENTS.SELECTION_CHANGE, { selection: [] });
    }

    onClick(e) {
        if (Date.now() - this.editor._lastDragTS < DRAG_DEBOUNCE_MS) return;
        if (e.target.classList.contains('port') || e.target.classList.contains('connection')) return;

        this.clearSelection();

        const nodeEl = e.target.closest('.node');
        if (nodeEl) this.addToSelection(nodeEl.__ref);
    }

    onSelecting(e) {
        if (e.button != 0 || this.editor.isDragging) return;
        if (e.target.classList.contains('port') || e.target.classList.contains('connection')) return;
        if (!this.editor.element.contains(e.target)) return;

        this.clearSelection();
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
                    if (isInside) this.addToSelection(node);
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
        const targets = this.editor.selection.map(node => ({ item: node, x: node.x, y: node.y }));
        Draggable.startGroup(this.editor, { x: e.clientX, y: e.clientY }, targets);
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
