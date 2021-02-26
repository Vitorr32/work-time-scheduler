import { SCHEDULE_FREE_TIME, SCHEDULE_FULL, SCHEDULE_WORK_ONLY } from "./constants";
import moment from 'moment';

export function verifyAppointmentDisponibility(totalHoursNeeded, dueDate, currentAppointments, [workStart, workEnd], [freeStart, freeEnd], startDate = null) {
    if (!workStart || !workEnd) {
        console.error("There was no work period start or end configured!");
        return;
    }

    const vacatedWorkPeriods = getAllVacatedSpacesInPeriodUntilDueDate(
        workStart,
        workEnd,
        dueDate,
        currentAppointments,
        totalHoursNeeded,
        startDate
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

    // console.log(currentlyRemainingHours);

    const vacatedFreePeriods = getAllVacatedSpacesInPeriodUntilDueDate(
        freeStart,
        freeEnd,
        dueDate,
        currentAppointments,
        currentlyRemainingHours,
        startDate
    )

    // console.log(vacatedFreePeriods);

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

export function getAllVacatedSpacesInPeriodUntilDueDate(periodStart, periodEnd, dueDate, appointments, hoursNeeded, startDate) {
    const allContinuousPeriods = [];
    const allPeriods = [];

    // console.log("startDate", startDate);
    //Start with the period
    let currentTimestamp = startDate ? startDate.clone() : moment().add(1, 'day').startOf('day').set('hour', periodStart);
    let currentContinuousPeriod = {
        start: null,
        end: null,
        hours: 0
    }

    // console.log("periodStar", periodStart);
    // console.log("periodEnd", periodEnd)

    // console.log('currentTimestamp', currentTimestamp);
    // console.log('dueDate', dueDate);

    while (currentTimestamp.isBefore(dueDate)) {
        // console.log(currentTimestamp.format("DD/MM HH:mm"))
        /*  Check if the periods already obtained already are enough for the appointment, so theres no 
            to continue the while loop*/
        if (hoursNeeded != 0) {
            if (currentContinuousPeriod.start) {
                if (getTotalHoursOfPeriods([...allContinuousPeriods, { hours: 1 + currentContinuousPeriod.hours }]) >= hoursNeeded) {

                    // console.log("SKipping due to reached hours");
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
            if (currentTimestamp.isBetween(appointment.startDate, appointment.endDate, undefined, "[)")) {
                return true;
            }

            return false;
        })

        //If there's already an appointment in the current timestamp iterated, skip to the end of the appointment
        if (appointment) {
            // console.log("SKipping due to conflicting appointment");
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

            if (appointment.endDate.isSameOrAfter(appointment.endDate.clone().startOf('day').set('hour', periodEnd))) {
                currentTimestamp = currentTimestamp.add(1, 'day').set('hour', periodStart);
            } else {
                currentTimestamp = currentTimestamp.set('hour', appointment.endDate.get('hour'));
            }
            continue;
        }

        //If the current timestamp is beyond or just reached the dueDate
        if (currentTimestamp.isSameOrAfter(dueDate)) {
            // console.log("SKipping by due date reached");
            if (currentContinuousPeriod.start) {
                currentContinuousPeriod.end = currentTimestamp.clone();
                currentContinuousPeriod.hours++;

                allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));
            }

            break;
        }

        //If the current hour is the final hour of the period, end the continuous period
        if (currentTimestamp.isSameOrAfter(currentTimestamp.clone().set('hour', periodEnd))) {
            // console.log("SKipping by period end");
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

        const appointmentToMergeIndex = appointments.findIndex(appointmentToCompare => appointment.end.isSame(appointmentToCompare.start));
        if (appointmentToMergeIndex !== -1) {
            indexesToIgnore.push(appointmentToMergeIndex);

            appointment.end = appointments[appointmentToMergeIndex].end;
            appointment.hours = appointment.end.diff(appointment.start, 'hours');
        }

        mergedAppointment.push(appointment);
    })

    return mergedAppointment;
}

export function getTotalHoursOfPeriods(periods) {
    return periods.reduce((sum, period) => ({ hours: sum.hours + period.hours }), { hours: 0 }).hours;
}
