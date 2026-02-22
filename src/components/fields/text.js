import { Field } from '../field.js';

export class TextField extends Field {
    static type = 'text';

    constructor(options = {}) {
        super(options);
        this.default     = options.default     ?? options.value ?? '';
        this.placeholder = options.placeholder ?? '';
        this.maxlength   = options.maxlength   ?? null;
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'text';
        el.value = this.default;
        if (this.placeholder) el.placeholder = this.placeholder;
        if (this.maxlength !== null) el.maxLength = this.maxlength;
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
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
