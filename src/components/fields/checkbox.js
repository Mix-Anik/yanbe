import { Field } from '../field.js';

export class CheckboxField extends Field {
    static type = 'checkbox';

    constructor(options = {}) {
        super(options);
        this._value = options.value ?? options.default ?? false;
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'checkbox';
        el.checked = this._value;
        el.addEventListener('change', () => { this._value = el.checked; });
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
    }

    getValue() {
        return this.element.checked;
    }

    setValue(value) {
        this._value = value
        this.element.checked = value;
    }

    toJSON() {
        return { ...super.toJSON(), value: this._value };
    }
}

Field.register(CheckboxField);
