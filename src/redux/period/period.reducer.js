import * as types from './period.types';

const INITIAL_STATE = {
    workStart: null,
    workEnd: null,
    freeStart: null,
    freeEnd: null
};

const periodReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.SET_WORK_PERIOD:
            return {
                ...state,
                workStart: action.payload.start,
                workEnd: action.payload.end
            };
        case types.SET_FREE_PERIOD:
            return {
                ...state,
                freeStart: action.payload.start,
                freeEnd: action.payload.end
            };
        default:
            return state;
    }
};

export default periodReducer;