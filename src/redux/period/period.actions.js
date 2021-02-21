import * as types from './period.types';

export const setWorkPeriod = timeRange => ({
    type: types.SET_WORK_PERIOD,
    payload: timeRange
});

export const setFreePeriod = timeRange => ({
    type: types.SET_FREE_PERIOD,
    payload: timeRange
});