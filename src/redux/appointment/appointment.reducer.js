import * as types from './appointment.types';

const INITIAL_STATE = {
    appointments: []
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