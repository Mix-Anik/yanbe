import { Node } from '../components/node.js';
import { Field } from '../components/field.js';
import { NODE, EVENTS } from '../constants.js';

export class ClipboardPlugin {
    constructor(editor) {
        this.editor = editor;
        this._unsubCopy = editor.on(EVENTS.ACTION_COPY, () => this.copy());
        this._onPaste = (e) => this.onPaste(e);
        document.addEventListener('paste', this._onPaste);
    }

    destroy() {
        this._unsubCopy();
        document.removeEventListener('paste', this._onPaste);
    }

    copy() {
        if (!this.editor.selection.length) return;

        const selectedSet = new Set(this.editor.selection);
        const connections = [];
        for (const node of this.editor.selection) {
            node.ports.output.connections.forEach(conn => {
                if (selectedSet.has(conn.to.node))
                    connections.push(conn.toJSON());
            });
        }

        const data = {
            nodes: this.editor.selection.map(node => node.toJSON()),
            connections
        };
        navigator.clipboard.writeText(JSON.stringify(data));
    }

    onPaste(e) {
        const text = e.clipboardData?.getData('text/plain');
        if (!text) return;

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            return;
        }

        if (!data.nodes || !data.connections) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of data.nodes) {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + NODE.DEFAULT_WIDTH);
            maxY = Math.max(maxY, n.y + NODE.DEFAULT_HEIGHT);
        }
        const dx = this.editor.cursorPos.x - (minX + maxX) / 2;
        const dy = this.editor.cursorPos.y - (minY + maxY) / 2;

        const idMap = new Map();
        const newNodes = [];

        try {
            for (const nodeData of data.nodes) {
                const fields = (nodeData.fields ?? []).map(f => Field.fromJSON(f));

                const node = new Node(nodeData.type, nodeData.x + dx, nodeData.y + dy, {
                    fields,
                    input: { allow: nodeData.ports.input.allow, many: nodeData.ports.input.many },
                    output: { many: nodeData.ports.output.many }
                });
                idMap.set(nodeData.id, node);
                newNodes.push(node);
                this.editor.addNode(node);

                for (let i = 0; i < fields.length; i++) {
                    const saved = nodeData.fields[i];
                    if (saved.value !== undefined)
                        fields[i].setValue(saved.value);
                }
            }

            for (const connData of data.connections) {
                const fromNode = idMap.get(connData.from);
                const toNode = idMap.get(connData.to);
                if (fromNode && toNode)
                    fromNode.connect(toNode);
            }
        } catch (err) {
            console.error('Paste failed, rolling back.', err);
            for (const node of newNodes)
                node.destroy();
            return;
        }

        this.editor.emit(EVENTS.ACTION_PASTE, { nodes: newNodes });
    }
}
