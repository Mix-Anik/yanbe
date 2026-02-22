import { Field } from '../field.js';

export class SelectField extends Field {
    static type = 'select';

    constructor(options = {}) {
        super(options);
        this.options = options.options ?? [];
        this.default = options.default ?? options.value ?? (this.options[0] ?? '');
    }

    _createElement() {
        const el = document.createElement('select');
        for (const opt of this.options) {
            const optEl = document.createElement('option');
            optEl.value = opt;
            optEl.textContent = opt;
            el.appendChild(optEl);
        }
        el.value = this.default;
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
        return { ...super.toJSON(), options: this.options, default: this.default };
    }
}

Field.register(SelectField);
