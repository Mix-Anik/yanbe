import { Field } from '../field.js';

export class IntegerField extends Field {
    static type = 'integer';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? 0;
        this.min     = options.min     ?? null;
        this.max     = options.max     ?? null;
    }

    _createElement() {
        const el = document.createElement('input');
        el.type = 'number';
        el.step = '1';
        el.value = this.default;
        if (this.min !== null) el.min = this.min;
        if (this.max !== null) el.max = this.max;
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
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
