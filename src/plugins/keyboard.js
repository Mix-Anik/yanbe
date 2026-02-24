export class KeyboardPlugin {
    constructor(editor) {
        this.editor = editor;
        this._onKeyDown = (e) => this.onKeyDown(e);
        document.addEventListener('keydown', this._onKeyDown);
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeyDown);
    }

    onKeyDown(e) {
        if (e.ctrlKey && e.key.toLowerCase() === 'c')
            this.editor.emit('action:copy');

        if (e.key === 'Delete') {
            const tag = document.activeElement?.tagName;
            if (tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
                e.preventDefault();
                this.editor.emit('action:delete');
            }
        }
    }
}
