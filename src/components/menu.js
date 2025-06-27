import { Node } from "./node";

export class ContextMenu {
    constructor(editor) {
        this.editor = editor;
        this.buttons = [
            {label: 'Add Node', shortcut: null, handler: (e) => this.addNodeHandler(e), ctx: null},
            {label: 'Delete', shortcut: 'del', handler: (ctx) => this.deleteHandler(ctx), ctx: ['node']}
        ];

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.hide();
            this.show(e);
        });

        document.addEventListener('click', () => {
            this.hide();
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
            if (btn.ctx && !btn.ctx.includes(e.target.className))
                continue;

            const el = document.createElement('li');
            el.innerHTML = `
                <button type="button" class="ctx-menu-btn">
                    <div class="label">${btn.label}</div>
                    <kbd class="shortcut">${btn.shortcut ?? ''}</kbd>
                </button>
            `;
            if (btn.ctx) el.addEventListener('click', () => btn.handler(e.target));
            else el.addEventListener('click', btn.handler);
            btnList.appendChild(el);
        }

        document.body.appendChild(this.element);
    }

    hide() {
        if (this.element) 
            this.element.remove();
    }

    addNodeHandler(e) {
        const node = new Node('New Node', e.clientX, e.clientY);
        this.editor.addNode(node);
    }

    deleteHandler(ctx) {
        ctx.__ref.remove();
    }
}
 