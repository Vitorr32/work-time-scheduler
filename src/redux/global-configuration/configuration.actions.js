import * as types from './configuration.types';

export const setShowSleepConfiguration = checked => ({
    type: types.SET_SHOW_SLEEP_PERIOD_CONFIG,
    payload: checked
});