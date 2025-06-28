import { Node } from "./node.js";

export class ContextMenu {
    constructor(editor) {
        this.editor = editor;
        this.buttons = [
            {label: 'Add Node', shortcut: null, handler: (e) => this.addNodeHandler(e), ctx: null},
            {label: 'Delete', shortcut: 'del', handler: (ctx) => this.deleteHandler(ctx), ctx: ['node']}
        ];
        this.keysPressed = new Set();
        this.listeners = [];

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.hide();
            this.show(e);
        });

        document.addEventListener('click', () => {
            this.hide();
        });

        document.addEventListener('keydown', (e) => {
            e.preventDefault();
            this.keysPressed.add(e.key);

            if (this.keysPressed.has('Delete') && this.keysPressed.size == 1) {
                this.deleteHandler(e);
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key);
        });
    }

    show(e) {
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

        if (this.element)
            this.element.remove();
    }

    addNodeHandler(e) {
        const node = new Node('New Node', e.clientX, e.clientY);
        this.editor.addNode(node);
    }

    deleteHandler(e) {
        for (let obj of this.editor.selection) {
            obj.remove();
        }
    }
}