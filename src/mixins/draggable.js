import { roundToStep } from '../helpers.js';
import { GRID } from '../constants.js';

export class Draggable {
    /**
     * Drag this single object. Delegates to startGroup with [this] as the only target.
     * Requires this.editor and this.x / this.y to be set before calling.
     *
     * @param {{x: number, y: number}} startPos - client coords at drag start
     */
    startDrag(startPos) {
        Draggable.startGroup(this.editor, startPos, [{ item: this, x: this.x, y: this.y }]);
    }

    /**
     * Override in subclasses to apply the new position.
     * Default: instant teleport.
     */
    moveTo(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Drag one or more objects together.
     * Each target records the object and its canvas position at drag start.
     * Calls item.moveTo(x, y) on each target as the mouse moves.
     *
     * @param {Editor} editor
     * @param {{x: number, y: number}} startPos - client coords at drag start
     * @param {Array<{item: Draggable, x: number, y: number}>} targets
     */
    static startGroup(editor, startPos, targets) {
        editor.isDragging = true;
        const startCanvasPos = editor.calcOffsetPos(startPos);

        const onMouseMove = (e) => {
            const pos = editor.calcOffsetPos({ x: e.clientX, y: e.clientY });
            const dx = pos.x - startCanvasPos.x;
            const dy = pos.y - startCanvasPos.y;
            const snap = editor.snapToGrid;

            for (const { item, x, y } of targets) {
                item.moveTo(
                    snap ? roundToStep(x + dx, GRID.SIZE) : x + dx,
                    snap ? roundToStep(y + dy, GRID.SIZE) : y + dy
                );
            }
        };

        const onMouseUp = () => {
            editor.isDragging = false;
            editor._lastDragTS = Date.now();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}
