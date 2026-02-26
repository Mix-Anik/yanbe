import { Field } from '../field.js';

export class TextField extends Field {
    static type = 'text';

    constructor(options = {}) {
        super(options);
        this._value = options.value ?? options.default ?? '';
        this.placeholder = options.placeholder ?? '';
        this.maxlength = options.maxlength ?? null;
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'text';
        el.value = this._value;
        if (this.placeholder) el.placeholder = this.placeholder;
        if (this.maxLength) el.maxLength = this.maxlength;
        el.addEventListener('input', () => { this._value = el.value; });
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
    }

    getValue() {
        return this._value;
    }

    setValue(value) {
        this._value = value;
        this.element.value = value;
    }

    toJSON() {
        return { ...super.toJSON(), placeholder: this.placeholder, maxlength: this.maxlength, value: this._value };
    }
}

Field.register(TextField);
