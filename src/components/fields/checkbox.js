import { Field } from '../field.js';

export class CheckboxField extends Field {
    static type = 'checkbox';

    constructor(options = {}) {
        super(options);
        this.default = options.default ?? options.value ?? false;
    }

    render(onChange) {
        const row = this._createRow();
        const inp = document.createElement('input');
        inp.type = 'checkbox';
        inp.checked = this.default;
        inp.addEventListener('change', () => onChange(inp.checked));
        inp.addEventListener('mousedown', e => e.stopPropagation());
        this._inp = inp;
        row.appendChild(inp);
        return row;
    }

    getValue()      { return this._inp.checked; }
    setValue(value) { this._inp.checked = value; }

    toJSON() {
        return { ...super.toJSON(), default: this.default };
    }
}

Field.register(CheckboxField);
