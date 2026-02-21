import { Field } from '../field.js';

export class TextField extends Field {
    static type = 'text';

    constructor(options = {}) {
        super(options);
        this.default     = options.default     ?? options.value ?? '';
        this.placeholder = options.placeholder ?? '';
        this.maxlength   = options.maxlength   ?? null;
    }

    render(onChange) {
        const row = this._createRow();
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.value = this.default;
        if (this.placeholder) inp.placeholder = this.placeholder;
        if (this.maxlength !== null) inp.maxLength = this.maxlength;
        inp.addEventListener('input', () => onChange(inp.value));
        inp.addEventListener('mousedown', e => e.stopPropagation());
        this._inp = inp;
        row.appendChild(inp);
        return row;
    }

    getValue()      { return this._inp.value; }
    setValue(value) { this._inp.value = value; }

    toJSON() {
        const base = super.toJSON();
        if (this.placeholder) base.placeholder = this.placeholder;
        if (this.maxlength !== null) base.maxlength = this.maxlength;
        return { ...base, default: this.default };
    }
}

Field.register(TextField);
