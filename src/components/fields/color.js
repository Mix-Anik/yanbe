import { Field } from '../field.js';

export class ColorField extends Field {
    static type = 'color';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? '#ffffffff';
        this.element = null;
    }

    create() {
        const row = this._createRow();
        this.element = document.createElement('input');
        this.element.type = 'color';
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
        return { ...super.toJSON(), default: this.default };
    }
}

Field.register(ColorField);
