import { Field } from '../field.js';

export class ColorField extends Field {
    static type = 'color';

    constructor(options = {}) {
        super(options);
        this._value = options.value ?? options.default ?? '#ffffff';
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'color';
        el.value = this._value;
        el.addEventListener('input', () => { this._value = el.value; });
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
    }

    getValue() {
        return this.element.value;
    }

    setValue(value) {
        this._value = value;
        this.element.value = value;
    }

    toJSON() {
        return { ...super.toJSON(), value: this._value };
    }
}

Field.register(ColorField);
