import * as types from './appointment.types';

export const addAppointments = appointments => ({
    type: types.ADD_APPOINTMENTS,
    payload: appointments
});

export const addJob = job => ({
    type: types.ADD_JOB,
    payload: job
})