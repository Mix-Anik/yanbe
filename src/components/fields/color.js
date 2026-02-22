import { Field } from '../field.js';

export class ColorField extends Field {
    static type = 'color';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? '#ffffffff';
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'color';
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
        return { ...super.toJSON(), default: this.default };
    }
}

Field.register(ColorField);
