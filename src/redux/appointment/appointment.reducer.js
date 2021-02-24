import * as types from './appointment.types';
import { updateAppointmentOnList, updateJobtOnList } from './appointment.utils';

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
        case types.UPDATED_APPOINTMENT:
            return {
                ...state,
                appointments: updateAppointmentOnList(state.appointments, action.payload.appointment, action.payload.index)
            }
        case types.ADD_JOB:
            return {
                ...state,
                jobs: [...state.jobs, action.payload]
            }
        case types.UPDATE_JOB:
            return {
                ...state,
                jobs: updateJobtOnList(state.jobs, action.payload.job, action.payload.index)
            }
        default:
            return state;
    }
};

export default appointmentReducer;