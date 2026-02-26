import { Field } from '../field.js';

export class NumberField extends Field {
    static type = 'number';

    constructor(options = {}) {
        super(options);
        this.integer = options.integer ?? false;
        this._value = options.value ?? options.default ?? 0;
        this.min = options.min ?? null;
        this.max = options.max ?? null;
        this.step = options.step ?? (this.integer ? 1 : 'any');
        this._input = null;
    }

    _createElement() {
        const wrapper = document.createElement('div');
        wrapper.className = 'number-input';

        const dec = document.createElement('button');
        dec.type = 'button';
        dec.className = 'number-btn';
        dec.textContent = '−';
        dec.tabIndex = -1;

        this._input = document.createElement('input');
        this._input.type = 'number';
        this._input.step = this.step;
        this._input.value = this._value;
        if (this.min !== null) this._input.min = this.min;
        if (this.max !== null) this._input.max = this.max;

        const inc = document.createElement('button');
        inc.type = 'button';
        inc.className = 'number-btn';
        inc.textContent = '+';
        inc.tabIndex = -1;

        dec.addEventListener('click', () => this.setValue(this._value - this.step));
        inc.addEventListener('click', () => this.setValue(this._value + this.step));
        wrapper.addEventListener('mousedown', e => e.stopPropagation());

        wrapper.appendChild(dec);
        wrapper.appendChild(this._input);
        wrapper.appendChild(inc);

        return wrapper;
    }

    getValue() {
        const v = Number(this._input.value);
        return this.integer ? Math.round(v) : v;
    }

    setValue(value) {
        this._value = Number(value);
        this._input.value = this._value;
    }

    toJSON() {
        return { ...super.toJSON(), integer: this.integer, min: this.min, max: this.max, step: this.step, value: this._value };
    }
}

Field.register(NumberField);
