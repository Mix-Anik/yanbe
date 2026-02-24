import { Node } from '../components/node.js';

export class ContextMenuPlugin {
    constructor(editor) {
        this.editor = editor;
        this.buttons = [
            {label: 'Add Node', shortcut: null, handler: (e) => this.addNodeHandler(e), ctx: null},
            {label: 'Delete', shortcut: 'del', handler: () => this.deleteHandler(), ctx: ['node']}
        ];
        this.listeners = [];

        this._show = (e) => this.show(e);
        this._hide = () => this.hide();
        this._unsubDelete = editor.on('action:delete', () => this.deleteHandler());

        document.addEventListener('contextmenu', this._show);
        document.addEventListener('click', this._hide);
    }

    destroy() {
        document.removeEventListener('contextmenu', this._show);
        document.removeEventListener('click', this._hide);
        this._unsubDelete();
        this.hide();
    }

    show(e) {
        e.preventDefault();
        this.hide();

        this.element = document.createElement('div');
        this.element.className = 'ctx-menu';
        this.element.style.left = `${e.clientX}px`;
        this.element.style.top = `${e.clientY}px`;
        this.element.__ref = this;
        const btnList = document.createElement('ul');
        this.element.appendChild(btnList);

        for (let btn of this.buttons) {
            if (btn.ctx) {
                if (!btn.ctx.some(c => e.target.classList.contains(c)))
                    continue;

                this.editor.addToSelection(e.target.__ref);
            }

            const el = document.createElement('li');
            el.innerHTML = `
                <button type="button" class="ctx-menu-btn">
                    <div class="label">${btn.label}</div>
                    <kbd class="shortcut">${btn.shortcut ?? ''}</kbd>
                </button>
            `;
            el.addEventListener('click', btn.handler);
            this.listeners.push({element: el, type: 'click', handler: btn.handler});
            btnList.appendChild(el);
        }

        document.body.appendChild(this.element);
    }

    hide() {
        this.listeners.forEach(entry => entry.element.removeEventListener(entry.type, entry.handler));
        this.listeners = [];

        if (this.element)
            this.element.remove();
    }

    addNodeHandler(e) {
        const node = new Node('New Node', e.clientX, e.clientY);
        this.editor.addNode(node);
    }

    deleteHandler() {
        for (let obj of [...this.editor.selection]) {
            obj.remove();
        }
        this.editor.clearSelection();
    }
}
