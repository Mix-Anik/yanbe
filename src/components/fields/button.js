import { Field } from '../field.js';

export class ButtonField extends Field {
    static type = 'button';

    constructor(options = {}) {
        super(options);
        this.onClick = options.onClick ?? null;
        this.text = options.text ?? null;
    }

    _createElement() {
        const el = document.createElement('button');
        el.textContent = this.text;
        el.className = 'field-button';
        if (this.onClick) {
            el.addEventListener('click', () => this.onClick(this.node));
        }
        el.addEventListener('mousedown', e => e.stopPropagation());
        return el;
    }

    getValue() {
        return undefined;
    }

    setValue() {}

    toJSON() {
        const { key: _key, ...base } = super.toJSON();
        return base;
    }
}

Field.register(ButtonField);
