import { Field } from '../components/field.js';
import { Connection } from '../components/connection.js';
import { Node } from '../components/node.js';
import { EVENTS } from '../constants.js';

export class InspectorPlugin {
    static #views = new Map();

    static registerView(cls, fn) {
        InspectorPlugin.#views.set(cls, fn);
    }

    constructor(editor) {
        this.editor = editor;
        this._item = null;
        this._dropdown = null;

        this._panel = this._createPanel();
        document.body.appendChild(this._panel);

        this._unsubSelection = editor.on(EVENTS.SELECTION_CHANGE, ({ selection }) => {
            if (selection.length === 1) {
                this._openItem(selection[0]);
            } else {
                this._close();
            }
        });
    }

    destroy() {
        this._unsubSelection();
        this._closeDropdown();
        this._panel.remove();
    }

    _createPanel() {
        const panel = document.createElement('div');
        panel.className = 'inspector-panel';
        panel.addEventListener('mousedown', e => e.stopPropagation());
        panel.addEventListener('click', e => e.stopPropagation());
        panel.style.display = 'none';
        return panel;
    }

    _openItem(item) {
        this._item = item;
        this._closeDropdown();
        this._panel.style.display = '';
        this._render();
    }

    _close() {
        this._item = null;
        this._closeDropdown();
        this._panel.style.display = 'none';
        this._panel.innerHTML = '';
    }

    _render() {
        this._panel.innerHTML = '';
        for (const [Cls, fn] of InspectorPlugin.#views) {
            if (this._item instanceof Cls) { fn(this); return; }
        }
    }

    _renderNodeView() {
        const node = this._item;

        const section = document.createElement('div');
        section.className = 'inspector-section';

        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'inspector-section-label';
        sectionLabel.textContent = 'Fields';
        section.appendChild(sectionLabel);

        for (const field of node.fields)
            section.appendChild(this._makeFieldItem(field));

        this._panel.appendChild(section);

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'inspector-add-btn';
        addBtn.textContent = '+ Add field';
        addBtn.addEventListener('click', () => this._showAddDropdown(addBtn));
        this._panel.appendChild(addBtn);
    }

    _makeFieldItem(field) {
        const item = document.createElement('div');
        item.className = 'inspector-field-item';

        const label = document.createElement('span');
        label.className = 'inspector-label';
        label.textContent = field.label || '(no label)';

        const type = document.createElement('span');
        type.className = 'inspector-value';
        type.textContent = field.constructor.type;

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'inspector-delete-btn';
        del.textContent = '×';
        del.addEventListener('click', () => {
            this._item.removeField(field);
            this._render();
        });

        item.appendChild(label);
        item.appendChild(type);
        item.appendChild(del);
        return item;
    }

    _renderConnectionView() {
        const conn = this._item;

        const section = document.createElement('div');
        section.className = 'inspector-section';

        const sectionLabel = document.createElement('div');
        sectionLabel.className = 'inspector-section-label';
        sectionLabel.textContent = 'Connection';
        section.appendChild(sectionLabel);

        const info = document.createElement('div');
        info.className = 'inspector-field-item';
        info.textContent = `${conn.from.node.type} → ${conn.to.node.type}`;
        section.appendChild(info);

        this._panel.appendChild(section);
    }

    _showAddDropdown(anchor) {
        this._closeDropdown();
        const rect = anchor.getBoundingClientRect();

        const popup = document.createElement('div');
        popup.className = 'select-dropdown';
        popup.style.position = 'fixed';
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom}px`;
        popup.style.minWidth = `${rect.width}px`;

        const ul = document.createElement('ul');
        popup.appendChild(ul);

        for (const [type, FieldClass] of Field.registeredTypes()) {
            const li  = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'select-option';
            btn.textContent = type;
            btn.addEventListener('click', () => {
                this._closeDropdown();
                this._item.addField(new FieldClass());
                this._render();
            });
            li.appendChild(btn);
            ul.appendChild(li);
        }

        document.body.appendChild(popup);
        this._dropdown = popup;

        // Close on next outside click; setTimeout avoids closing on this same click
        this._dropdownClose = () => this._closeDropdown();
        setTimeout(() => document.addEventListener('click', this._dropdownClose, { once: true }), 0);
    }

    _closeDropdown() {
        if (this._dropdownClose) {
            document.removeEventListener('click', this._dropdownClose);
            this._dropdownClose = null;
        }
        this._dropdown?.remove();
        this._dropdown = null;
    }
}

InspectorPlugin.registerView(Node, insp => insp._renderNodeView());
InspectorPlugin.registerView(Connection, insp => insp._renderConnectionView());
