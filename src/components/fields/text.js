import { Field } from '../field.js';

export class TextField extends Field {
    static type = 'text';

    constructor(options = {}) {
        super(options);
        this.default     = options.default     ?? options.value ?? '';
        this.placeholder = options.placeholder ?? '';
        this.maxlength   = options.maxlength   ?? null;
        this.element = null;
    }

    create() {
        const row = this._createRow();
        this.element = document.createElement('input');
        this.element.type = 'text';
        this.element.value = this.default;
        if (this.placeholder) this.element.placeholder = this.placeholder;
        if (this.maxlength !== null) this.element.maxLength = this.maxlength;
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
        const base = super.toJSON();
        if (this.placeholder) base.placeholder = this.placeholder;
        if (this.maxlength !== null) base.maxlength = this.maxlength;
        return { ...base, default: this.default };
    }
}

Field.register(TextField);
