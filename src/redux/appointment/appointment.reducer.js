import * as types from './appointment.types';
import { deleteAppointment, deleteJobAndAssociatedAppointments, updateAppointmentOnList, updateJobOnList } from './appointment.utils';

const INITIAL_STATE = {
    appointments: [],
    jobs: [],
    history: []
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
                appointments: updateAppointmentOnList(state.appointments, action.payload)
            }
        case types.DELETE_APPOINTMENT:
            return {
                ...state,
                appointments: deleteAppointment(state.appointments, action.payload)
            }
        case types.ADD_JOB:
            return {
                ...state,
                jobs: [...state.jobs, action.payload]
            }
        case types.UPDATE_JOB:
            return {
                ...state,
                jobs: updateJobOnList(state.jobs, action.payload)
            }
        case types.DELETE_JOB:
            const { jobs, appointments } = deleteJobAndAssociatedAppointments(action.payload, state.jobs, state.appointments)
            return {
                ...state,
                jobs,
                appointments
            }
        default:
            return state;
    }
};

export default appointmentReducer;