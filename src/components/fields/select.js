import { Field } from '../field.js';

export class SelectField extends Field {
    static type = 'select';

    constructor(options = {}) {
        super(options);
        this.options = options.options ?? [];
        this.default = options.default ?? options.value ?? (this.options[0] ?? '');
        this.element = null;
    }

    create() {
        const row = this._createRow();
        this.element = document.createElement('select');
        for (const opt of this.options) {
            const optEl = document.createElement('option');
            optEl.value = opt;
            optEl.textContent = opt;
            this.element.appendChild(optEl);
        }
        this.element.value = this.default;
        this.element.addEventListener('mousedown', e => e.stopPropagation());
        row.appendChild(this.element);
        return row;
    }

    getValue() {
        return this.element.value;
    }

    setValue(value) {
        this.element.value = value;
    }

    toJSON() {
        return { ...super.toJSON(), options: this.options, default: this.default };
    }
}

Field.register(SelectField);
