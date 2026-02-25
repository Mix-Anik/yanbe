import { Field } from '../field.js';

export class NumberField extends Field {
    static type = 'number';

    constructor(options = {}) {
        super(options);
        this.integer = options.integer ?? false;
        this.default = options.default ?? options.value ?? 0;
        this.min     = options.min     ?? null;
        this.max     = options.max     ?? null;
        this.step    = options.step    ?? (this.integer ? 1 : 'any');
    }

    _createElement() {
        const wrapper = document.createElement('div');
        wrapper.className = 'number-input';

        const dec = document.createElement('button');
        dec.type = 'button';
        dec.className = 'number-btn';
        dec.textContent = '−';
        dec.tabIndex = -1;

        const input = document.createElement('input');
        input.type = 'number';
        input.step = this.step;
        input.value = this.default;
        if (this.min !== null) input.min = this.min;
        if (this.max !== null) input.max = this.max;

        const inc = document.createElement('button');
        inc.type = 'button';
        inc.className = 'number-btn';
        inc.textContent = '+';
        inc.tabIndex = -1;

        dec.addEventListener('click', () => input.stepDown());
        inc.addEventListener('click', () => input.stepUp());
        wrapper.addEventListener('mousedown', e => e.stopPropagation());

        wrapper.appendChild(dec);
        wrapper.appendChild(input);
        wrapper.appendChild(inc);

        this._input = input;
        return wrapper;
    }

    getValue() {
        const v = Number(this._input.value);
        return this.integer ? Math.round(v) : v;
    }

    setValue(value) {
        this._input.value = value;
    }

    clone() {
        return new NumberField(this.toJSON());
    }

    toJSON() {
        const base = super.toJSON();
        if (this.integer) base.integer = true;
        if (this.min !== null) base.min = this.min;
        if (this.max !== null) base.max = this.max;
        const defaultStep = this.integer ? 1 : 'any';
        if (this.step !== defaultStep) base.step = this.step;
        return { ...base, default: this.default };
    }
}

Field.register(NumberField);
