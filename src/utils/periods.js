import { SCHEDULE_FREE_TIME, SCHEDULE_FULL, SCHEDULE_WORK_ONLY } from "./constants";
import moment from 'moment';

export function verifyAppointmentDisponibility(totalHoursNeeded, dueDate, currentAppointments, [workStart, workEnd], [freeStart, freeEnd]) {
    if (!workStart || !workEnd) {
        console.error("There was no work period start or end configured!");
        return;
    }

    const vacatedWorkPeriods = getAllVacatedSpacesInPeriodUntilDueDate(
        workStart,
        workEnd,
        dueDate,
        currentAppointments,
        totalHoursNeeded
    )

    const currentDistributedHours = getTotalHoursOfPeriods(vacatedWorkPeriods)

    //If we already allocated all the nescessary time in the work period, finish the function, otherwise allocate to free time
    if (vacatedWorkPeriods.length != 0 && currentDistributedHours >= totalHoursNeeded) {
        return {
            state: SCHEDULE_WORK_ONLY,
            periods: vacatedWorkPeriods
        }
    }

    if (!freeStart || !freeEnd) {
        console.error("It was nescessary to use free time, but there was no free period start or end configured!");
        return;
    }

    const currentlyRemainingHours = totalHoursNeeded - currentDistributedHours;

    const vacatedFreePeriods = getAllVacatedSpacesInPeriodUntilDueDate(
        freeStart,
        freeEnd,
        dueDate,
        currentAppointments,
        totalHoursNeeded
    )

    const distributedHoursInFreePeriod = getTotalHoursOfPeriods(vacatedFreePeriods);
    const mergedPeriods = mergeContinousAppointmentsInDifferentPeriods([...vacatedWorkPeriods, ...vacatedFreePeriods])

    if (vacatedFreePeriods.length != 0 && currentDistributedHours + distributedHoursInFreePeriod >= totalHoursNeeded) {
        return {
            state: SCHEDULE_FREE_TIME,
            periods: mergedPeriods
        }
    }

    return {
        state: SCHEDULE_FULL,
        periods: mergedPeriods
    }
}

export function getAllVacatedSpacesInPeriodUntilDueDate(periodStart, periodEnd, dueDate, appointments, hoursNeeded = 0) {
    const allContinuousPeriods = [];
    //Start with the period
    let currentTimestamp = moment().add(1, 'day').startOf('day').set('hour', periodStart);
    let currentContinuousPeriod = {
        start: null,
        end: null,
        hours: 0
    }

    while (currentTimestamp.isBefore(dueDate)) {
        /*  Check if the periods already obtained already are enough for the appointment, so theres no 
            to continue the while loop*/
        if (hoursNeeded != 0) {
            if (currentContinuousPeriod.start) {
                if (getTotalHoursOfPeriods([...allContinuousPeriods, { hours: 1 + currentContinuousPeriod.hours }]) >= hoursNeeded) {
                    currentContinuousPeriod.end = currentTimestamp.clone();
                    currentContinuousPeriod.hours++;

                    //Add the finished continuous period to the array.
                    allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));

                    currentContinuousPeriod = {
                        start: null,
                        end: null,
                        hours: 0
                    }
                    break;
                }
            } else if (getTotalHoursOfPeriods(allContinuousPeriods) >= hoursNeeded) {
                break;
            }
        }

        //Try to find an appointment that contains the current iterated hour.
        const appointment = appointments.find(appointment => {
            //Check if the current timestamp is between this appointment period
            if (currentTimestamp.get('day') === appointment.startDate.get('day') &&
                currentTimestamp.get('hour') >= appointment.startDate.get('hour') &&
                currentTimestamp.get('hour') < appointment.endDate.get('hour')) {
                return true;
            }

            return false;
        })

        //If there's already an appointment in the current timestamp iterated, skip to the end of the appointment
        if (appointment) {
            //If there's an current period that has been stopped thanks to this appointment, save in the array.
            if (currentContinuousPeriod.start) {
                currentContinuousPeriod.end = currentTimestamp.clone();
                currentContinuousPeriod.hours++;

                //Add the finished continuous period to the array.
                allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));

                currentContinuousPeriod = {
                    start: null,
                    end: null,
                    hours: 0
                }
            }

            if (appointment.endDate.get('hour') >= periodEnd) {
                currentTimestamp = currentTimestamp.add(1, 'day').set('hour', periodStart);
            } else {
                currentTimestamp = currentTimestamp.set('hour', appointment.endDate.get('hour'));
            }
            continue;
        }

        //If the current timestamp is beyond or just reached the dueDate
        if (currentTimestamp.isSame(dueDate, 'day') && currentTimestamp.get('hour') >= dueDate.get('hour')) {
            if (currentContinuousPeriod.start) {
                currentContinuousPeriod.end = currentTimestamp.clone();
                currentContinuousPeriod.hours++;

                allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));
            }

            break;
        }

        //If the current hour is the final hour of the period, end the continuous period
        if (currentTimestamp.get('hour') >= periodEnd) {
            if (currentContinuousPeriod.start) {
                currentContinuousPeriod.end = currentTimestamp.clone();
                currentContinuousPeriod.hours++;

                //Add the finished continuous period to the array.
                allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));

                currentContinuousPeriod = {
                    start: null,
                    end: null,
                    hours: 0
                }
            }

            currentTimestamp = currentTimestamp.add(1, 'day').set('hour', periodStart);
            continue;
        }


        //If there's no appointment, this is a free hour to add to the current continuous period
        if (currentContinuousPeriod.start) {
            currentContinuousPeriod.end = currentTimestamp.clone();
            currentContinuousPeriod.hours++;
        } else {
            currentContinuousPeriod.start = currentTimestamp.clone();
        }

        currentTimestamp = currentTimestamp.add(1, 'hour');
    }

    return allContinuousPeriods;
}

export function mergeContinousAppointmentsInDifferentPeriods(appointments) {
    const mergedAppointment = [];
    const indexesToIgnore = [];
    appointments.forEach((appointment, index) => {
        if (indexesToIgnore.includes(index)) {
            return;
        }

        const appointmentToMergeIndex = appointments.findIndex(appointmentToCompare => appointment.end === appointmentToCompare.start);
        if (appointmentToMergeIndex != -1) {
            indexesToIgnore.push(appointmentToMergeIndex);

            appointment.end = appointments[appointmentToMergeIndex].end;
            appointment.hours = appointment.end.get('hours') - appointment.start.get('hours');
        }

        mergedAppointment.push(appointment);
    })

    return mergedAppointment;
}

export function getTotalHoursOfPeriods(periods) {
    return periods.reduce((sum, period) => ({ hours: sum.hours + period.hours }), { hours: 0 }).hours;
}
