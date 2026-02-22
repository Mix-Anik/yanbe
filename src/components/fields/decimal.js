import { Field } from '../field.js';

export class DecimalField extends Field {
    static type = 'decimal';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? 0;
        this.min     = options.min     ?? null;
        this.max     = options.max     ?? null;
        this.step    = options.step    ?? 'any';
        this.element = null;
    }

    create() {
        const row = this._createRow();
        this.element = document.createElement('input');
        this.element.type = 'number';
        this.element.step = this.step;
        this.element.value = this.default;
        if (this.min !== null) this.element.min = this.min;
        if (this.max !== null) this.element.max = this.max;
        this.element.addEventListener('mousedown', e => e.stopPropagation());
        row.appendChild(this.element);
        return row;
    }

    getValue() {
        return Number(this.element.value);
    }

    setValue(value) {
        this.element.value = value;
    }

    toJSON() {
        const base = super.toJSON();
        if (this.min !== null)  base.min  = this.min;
        if (this.max !== null)  base.max  = this.max;
        if (this.step !== 'any') base.step = this.step;
        return { ...base, default: this.default };
    }
}

Field.register(DecimalField);
