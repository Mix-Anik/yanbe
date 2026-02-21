import { Field } from '../field.js';

export class SelectField extends Field {
    static type = 'select';

    constructor(options = {}) {
        super(options);
        this.options = options.options ?? [];
        this.default = options.default ?? options.value ?? (this.options[0] ?? '');
    }

    render(onChange) {
        const row = this._createRow();
        const sel = document.createElement('select');
        for (const opt of this.options) {
            const el = document.createElement('option');
            el.value = opt;
            el.textContent = opt;
            sel.appendChild(el);
        }
        sel.value = this.default;
        sel.addEventListener('change', () => onChange(sel.value));
        sel.addEventListener('mousedown', e => e.stopPropagation());
        this._sel = sel;
        row.appendChild(sel);
        return row;
    }

    getValue()      { return this._sel.value; }
    setValue(value) { this._sel.value = value; }

    toJSON() {
        return { ...super.toJSON(), options: this.options, default: this.default };
    }
}

Field.register(SelectField);
