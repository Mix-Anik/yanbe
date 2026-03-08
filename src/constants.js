export const GRID = {
    SIZE:           20,
    SCALE_FACTOR:   1.2,
    MIN_SCALE:      0.2,
    MAX_SCALE:      3
};

export const NODE = {
    DEFAULT_WIDTH:  160,
    DEFAULT_HEIGHT: 60
};

export const PORT_TYPE = {
    OUTPUT: 'output',
    INPUT:  'input'
};

export const BEZIER_STRENGTH = 100;

export const ANIMATION = {
    LERP_FACTOR:    0.2,
    STOP_THRESHOLD: 0.5
};

export const DRAG_DEBOUNCE_MS = 50;

export const EVENTS = {
    NODE_ADD:          'node:add',
    NODE_MOVED:        'node:moved',
    NODE_REMOVED:      'node:removed',
    SELECTION_CHANGE:  'selection:change',
    ACTION_COPY:       'action:copy',
    ACTION_DELETE:     'action:delete',
    ACTION_PASTE:      'action:paste',
    ACTION_SELECT:     'action:select',
};

export const PERMISSIONS = {
    ADD_FIELDS:    1 << 0,  // 1
    REMOVE_FIELDS: 1 << 1,  // 2
};