import { APPOINTMENT_STATE_NOT_STARTED } from '../../utils/constants';
import * as types from './appointment.types';

import moment from 'moment';

const INITIAL_STATE = {
    appointments: [
        {
            startDate: moment().startOf('day').subtract(1, 'day').set('hour', 9),
            endDate: moment().startOf('day').subtract(1, 'day').set('hour', 12),
            title: 'Late Assigment',
            price: 420.69,
            description: 'An late assignment',
            state: APPOINTMENT_STATE_NOT_STARTED
        },
        {
            startDate: moment().subtract(1, 'hour'),
            endDate: moment().add(1, 'hour'),
            title: 'Current Assingment',
            price: 69.69,
            description: 'An assignment ocurring now',
            state: APPOINTMENT_STATE_NOT_STARTED
        },
        {
            startDate: moment().add(1, 'day').subtract(1, 'hour'),
            endDate: moment().add(1, 'day').add(1, 'hour'),
            title: 'Assignment in the Future',
            price: 14.88,
            description: 'An assignment that still have not happened yet',
            state: APPOINTMENT_STATE_NOT_STARTED
        }
    ],
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