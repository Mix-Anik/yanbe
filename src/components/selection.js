export class RectSelectTool {
    constructor(editor) {
        this.editor = editor;
        document.addEventListener('mousedown', (e) => this.onSelecting(e));
    }

    onSelecting(e) {
        if (e.button != 0 || this.editor.isDragging)
            return;

        this.editor.clearSelection();
        const element = document.createElement('div');
        this.editor.element.appendChild(element);
        element.className = 'selection';
        const startMousePos = {x: e.offsetX, y: e.offsetY}
        element.style.left = `${startMousePos.x}px`;
        element.style.top = `${startMousePos.y}px`;

        const onMouseMove = (e) => {
            element.style.left = `${Math.min(startMousePos.x, e.offsetX)}px`;
            element.style.top = `${Math.min(startMousePos.y, e.offsetY)}px`;
            element.style.width = `${Math.abs(startMousePos.x - e.offsetX)}px`;
            element.style.height = `${Math.abs(startMousePos.y - e.offsetY)}px`;
        }

        const onMouseUp = (e) => {
            const allElements = Array.from(this.editor.element.querySelectorAll('*'));
            //console.log(allElements);
            const selectionRect = element.getBoundingClientRect();
            //console.log(this.editor.nodes);

            this.editor.nodes.forEach(node => {
                const rect = node.element.getBoundingClientRect();
                const isInside = rect.left >= selectionRect.left &&
                                 rect.right <= selectionRect.right &&
                                 rect.top >= selectionRect.top &&
                                 rect.bottom <= selectionRect.bottom;
                if (isInside) this.editor.addToSelection(node);
                //console.log(isInside, node);
            });

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            element.remove();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}