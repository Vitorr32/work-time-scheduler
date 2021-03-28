import * as types from './period.types';
import * as configTypes from '../global-configuration/configuration.types';

const INITIAL_STATE = {
    workStart: null,
    workEnd: null,
    freeStart: null,
    freeEnd: null,
    calendarViewHourStart: 0,
    calendarViewHourEnd: 24
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
        case configTypes.SET_SHOW_SLEEP_PERIOD_CONFIG:
            return {
                ...state,
                calendarViewHourStart: action.payload ? 0 : Math.min(state.workStart, state.freeStart),
                calendarViewHourEnd: action.payload ? 24 : Math.max(state.workEnd, state.freeEnd)
            }
        default:
            return state;
    }
};

export default periodReducer;