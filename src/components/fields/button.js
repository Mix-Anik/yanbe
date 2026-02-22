import { Field } from '../field.js';

export class ButtonField extends Field {
    static type = 'button';

    constructor(options = {}) {
        super(options);
        this._onClick = options.onClick ?? null;
        this.element = null;
    }

    create() {
        this.element = document.createElement('button');
        this.element.textContent = this.label;
        this.element.className = 'field-button';
        if (this._onClick) {
            this.element.addEventListener('click', () => this._onClick(this._node));
        }
        this.element.addEventListener('mousedown', e => e.stopPropagation());
        return this.element;
    }

    // Buttons carry no serializable value.
    getValue() {
        return undefined;
    }

    setValue() {}

    toJSON() {
        // onClick is a function and cannot be serialized.
        const { key: _key, ...base } = super.toJSON();
        return base;
    }
}

Field.register(ButtonField);
