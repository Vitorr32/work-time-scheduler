import * as types from './appointment.types';

export const updateAppointments = appointments => ({
    type: types.SET_APPOINTMENTS,
    payload: appointments
});