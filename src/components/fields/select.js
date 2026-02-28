import { Field } from '../field.js';

export class SelectField extends Field {
    static type = 'select';

    constructor(options = {}) {
        super(options);
        this.options = options.options ?? [];
        this._value  = options.value ?? options.default ?? '';
        this._popup = null;
        this._valueEl = null;
    }

    _createElement() {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'select-trigger';

        this._valueEl = document.createElement('span');
        this._valueEl.className   = 'select-trigger-value';
        this._valueEl.textContent = this._value;

        const arrow = document.createElement('span');
        arrow.className   = 'select-trigger-arrow';
        arrow.textContent = '▾';

        btn.appendChild(this._valueEl);
        btn.appendChild(arrow);

        btn.addEventListener('mousedown', e => e.stopPropagation());
        btn.addEventListener('click', e => {
            e.stopPropagation();
            this.#showDropdown(btn);
        });

        return btn;
    }

    #showDropdown(anchor) {
        this.#hideDropdown();

        const rect = anchor.getBoundingClientRect();

        this._popup = document.createElement('div');
        this._popup.className = 'select-dropdown';
        this._popup.style.left = `${rect.left}px`;
        this._popup.style.top = `${rect.bottom}px`;
        this._popup.style.minWidth = `${rect.width}px`;

        const ul = document.createElement('ul');
        this._popup.appendChild(ul);

        for (const opt of this.options) {
            const li  = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'select-option' + (opt === this._value ? ' select-option--selected' : '');
            btn.textContent = opt;
            btn.addEventListener('click', () => {
                this.#hideDropdown();
                this.setValue(opt);
            });
            li.appendChild(btn);
            ul.appendChild(li);
        }

        document.body.appendChild(this._popup);

        this._closeHandler = () => this.#hideDropdown();
        setTimeout(() => document.addEventListener('click', this._closeHandler, { once: true }), 0);
    }

    #hideDropdown() {
        document.removeEventListener('click', this._closeHandler);
        if (this._popup) {
            this._popup.remove();
            this._popup = null;
        }
    }

    getValue() {
        return this._value;
    }

    setValue(value) {
        this._value = value;
        this._valueEl.textContent = value;
    }

    toJSON() {
        return { ...super.toJSON(), options: this.options, value: this._value };
    }
}

Field.register(SelectField);
