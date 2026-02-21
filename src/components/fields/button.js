import { Field } from '../field.js';

export class ButtonField extends Field {
    static type = 'button';

    constructor(options = {}) {
        super(options);
        this._onClick = options.onClick ?? null;
    }

    render(_onChange) {
        const btn = document.createElement('button');
        btn.textContent = this.label;
        btn.className = 'field-button';
        if (this._onClick) {
            btn.addEventListener('click', () => this._onClick(this._node));
        }
        btn.addEventListener('mousedown', e => e.stopPropagation());
        return btn;
    }

    // Buttons carry no serializable value.
    getValue()      { return undefined; }
    setValue()      {}

    toJSON() {
        // onClick is a function and cannot be serialized.
        const { key: _key, ...base } = super.toJSON();
        return base;
    }
}

Field.register(ButtonField);
