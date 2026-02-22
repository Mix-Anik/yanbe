import { Field } from '../field.js';

export class CheckboxField extends Field {
    static type = 'checkbox';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? false;
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'checkbox';
        el.checked = this.default;
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
    }

    getValue() {
        return this.element.checked;
    }

    setValue(value) {
        this.element.checked = value;
    }

    toJSON() {
        return { ...super.toJSON(), default: this.default };
    }
}

Field.register(CheckboxField);
