import * as types from './appointment.types';
import moment from 'moment';

const INITIAL_STATE = {
    appointments: [
        { startDate: moment().set('hour', 0).set('minute', 0), endDate: moment().set('hour', 8).set('minute', 0), title: 'Sleep' },
        { startDate: moment().set('hour', 8).set('minute', 0), endDate: moment().set('hour', 16).set('minute', 0), title: 'Work' },
        { startDate: moment().set('hour', 16).set('minute', 0), endDate: moment().set('hour', 24).set('minute', 0), title: 'Fun' },
    ]
};

const appointmentReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.SET_APPOINTMENTS:
            return {
                ...state,
                appointments: action.payload
            };
        default:
            return state;
    }
};

export default appointmentReducer;