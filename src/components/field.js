export class Field {
    static type = null;
    static #registry = new Map();

    static register(cls) {
        Field.#registry.set(cls.type, cls);
    }

    static fromJSON(data) {
        const cls = Field.#registry.get(data.type);
        if (!cls)
            throw new Error(`Unknown field type: "${data.type}". Did you forget to call Field.register()?`);
        return new cls(data);
    }

    constructor(options = {}) {
        this.label  = options.label  ?? '';
        this.key    = options.key    ?? this.label.toLowerCase().replace(/\s+/g, '_');
        this.inline = options.inline ?? false;
    }

    // Override in subclass. Return root DOM element; store any input refs on `this`.
    create() {
        throw new Error(`${this.constructor.name}.create() is not implemented.`);
    }

    getValue() {
        throw new Error(`${this.constructor.name}.getValue() is not implemented.`);
    }

    setValue(value) {
        throw new Error(`${this.constructor.name}.setValue() is not implemented.`);
    }

    toJSON() {
        return { type: this.constructor.type, label: this.label, key: this.key, inline: this.inline };
    }

    // Creates a row wrapper with an optional label element.
    // Non-inline: .field-row uses display:contents so children become grid items.
    // Inline: .field-row--inline is a flex column (label above input).
    _createRow() {
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
