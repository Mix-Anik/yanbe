export class Field {
    static type = null;
    static #registry = new Map();

    static register(cls) {
        Field.#registry.set(cls.type, cls);
    }

    static registeredTypes() {
        return Field.#registry;
    }

    static fromJSON(data) {
        const cls = Field.#registry.get(data.type);
        if (!cls)
            throw new Error(`Unknown field type: "${data.type}". Did you forget to call Field.register()?`);
        return new cls(data);
    }

    constructor(options = {}) {
        this.label  = options.label  ?? '';
        this.inline = options.inline ?? false;
        this.element = null;
        this.row = null;
        this.node = null;
    }

    // Builds the row wrapper, calls _createElement(), stores result in this.element.
    create(node) {
        this.node = node;
        this.row = this.#createRow();
        this.row.__field = this;
        this.element = this._createElement();
        this.row.appendChild(this.element);
        return this.row;
    }

    destroy() {
        const idx = this.node.fields.indexOf(this);
        if (idx !== -1) this.node.fields.splice(idx, 1);
        this.row.remove();
    }

    // Override in subclass. Create and return the bare control element (no row).
    _createElement() {
        throw new Error(`${this.constructor.name}._createElement() is not implemented.`);
    }

    getValue() {
        throw new Error(`${this.constructor.name}.getValue() is not implemented.`);
    }

    setValue(value) {
        throw new Error(`${this.constructor.name}.setValue() is not implemented.`);
    }

    toJSON() {
        return { type: this.constructor.type, label: this.label, inline: this.inline };
    }

    // Creates a row wrapper with an optional label element.
    // Non-inline: .field-row uses display:contents so children become grid items.
    // Inline: .field-row--inline is a flex column (label above input).
    #createRow() {
        const row = document.createElement('div');
        row.className = this.inline ? 'field-row field-row--inline' : 'field-row';
        if (this.label) {
            const lbl = document.createElement('label');
            lbl.textContent = this.label;
            row.appendChild(lbl);
        }
        return row;
    }
}
