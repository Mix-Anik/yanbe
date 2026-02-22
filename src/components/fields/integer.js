import { Field } from '../field.js';

export class IntegerField extends Field {
    static type = 'integer';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? 0;
        this.min     = options.min     ?? null;
        this.max     = options.max     ?? null;
        this.element = null;
    }

    create() {
        const row = this._createRow();
        this.element = document.createElement('input');
        this.element.type = 'number';
        this.element.step = '1';
        this.element.value = this.default;
        if (this.min !== null) this.element.min = this.min;
        if (this.max !== null) this.element.max = this.max;
        this.element.addEventListener('mousedown', e => e.stopPropagation());
        row.appendChild(this.element);
        return row;
    }

    getValue() {
        return Math.round(Number(this.element.value));
    }

    setValue(value) {
        this.element.value = value;
    }

    toJSON() {
        const base = super.toJSON();
        if (this.min !== null) base.min = this.min;
        if (this.max !== null) base.max = this.max;
        return { ...base, default: this.default };
    }
}

Field.register(IntegerField);
