import * as types from './configuration.types';

const INITIAL_STATE = {
    showSleepPeriod: true
};

const configurationReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.SET_SHOW_SLEEP_PERIOD_CONFIG:
            return {
                ...state,
                showSleepPeriod: action.payload
            };
        default:
            return state;
    }
};

export default configurationReducer;