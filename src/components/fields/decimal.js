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

    render(onChange) {
        const row = this._createRow();
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = this.step;
        inp.value = this.default;
        if (this.min !== null) inp.min = this.min;
        if (this.max !== null) inp.max = this.max;
        inp.addEventListener('input', () => onChange(Number(inp.value)));
        inp.addEventListener('mousedown', e => e.stopPropagation());
        this._inp = inp;
        row.appendChild(inp);
        return row;
    }

    getValue()      { return Number(this._inp.value); }
    setValue(value) { this._inp.value = value; }

    toJSON() {
        const base = super.toJSON();
        if (this.min !== null)  base.min  = this.min;
        if (this.max !== null)  base.max  = this.max;
        if (this.step !== 'any') base.step = this.step;
        return { ...base, default: this.default };
    }
}

Field.register(DecimalField);
