import * as types from './appointment.types';

const INITIAL_STATE = {
    appointments: [],
    jobs: []
};

const appointmentReducer = (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case types.ADD_APPOINTMENTS:
            return {
                ...state,
                appointments: [...state.appointments, ...action.payload]
            };
        case types.ADD_JOB:
            return {
                ...state,
                jobs: [...state.jobs, action.payload]
            }
        default:
            return state;
    }
};

export default appointmentReducer;