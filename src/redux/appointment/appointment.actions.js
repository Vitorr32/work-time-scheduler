import * as types from './appointment.types';

export const addAppointment = appointment => ({
    type: types.ADD_APPOINTMENTS,
    payload: appointment
});

export const updateAppointment = appointmentAndIndex => ({
    type: types.UPDATED_APPOINTMENT,
    payload: appointmentAndIndex
})

export const addJob = job => ({
    type: types.ADD_JOB,
    payload: job
})