import { Field } from '../field.js';

export class DecimalField extends Field {
    static type = 'decimal';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? 0;
        this.min     = options.min     ?? null;
        this.max     = options.max     ?? null;
        this.step    = options.step    ?? 'any';
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'number';
        el.step = this.step;
        el.value = this.default;
        if (this.min !== null) el.min = this.min;
        if (this.max !== null) el.max = this.max;
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
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
