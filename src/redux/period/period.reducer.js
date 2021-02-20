import * as types from './period.types';
import moment from 'moment';

const INITIAL_STATE = {
    workStart: moment().set('hours', 9),
    workEnd: moment().set('hours', 18),
    freeStart: moment().set('hours', 18),
    freeEnd: moment().set('hours', 24),
    sleepStart: null,
    sleepEnd: null
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
        case types.SET_SLEEP_PERIOD:
            return {
                ...state,
                sleepStart: action.payload.start,
                sleepEnd: action.payload.end
            };
        default:
            return state;
    }
};

export default periodReducer;