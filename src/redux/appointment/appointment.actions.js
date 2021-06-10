import * as types from './appointment.types';

export const addAppointment = appointment => ({
    type: types.ADD_APPOINTMENTS,
    payload: appointment
});

export const updateAppointment = appointment => ({
    type: types.UPDATED_APPOINTMENT,
    payload: appointment
})

export const deleteAppointment = ids => ({
    type: types.DELETE_APPOINTMENT,
    payload: ids
})

export const addJob = job => ({
    type: types.ADD_JOB,
    payload: job
})

export const updateJob = job => ({
    type: types.UPDATE_JOB,
    payload: job
})

export const deleteJob = job => ({
    type: types.DELETE_JOB,
    payload: job
})

export const addToHistory = job => ({
    type: types.ADD_TO_HISTORY,
    payload: job
})
