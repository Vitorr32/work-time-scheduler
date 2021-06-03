import { APPOINTMENT_STATE_TO_DO, SCHEDULE_FREE_TIME, SCHEDULE_FULL, SCHEDULE_WORK_ONLY } from "./constants";
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export function verifyAppointmentDisponibility(totalHoursNeeded, dueDate, currentAppointments, [workStart, workEnd], [freeStart, freeEnd], startDate = null, continuosPeriodPriorization = false) {
    if (!workStart || !workEnd) {
        console.error("There was no work period start or end configured!");
        return;
    }

    const vacatedWorkPeriods = pickBestContinuosPeriods(getAllVacatedSpacesInPeriodUntilDueDate(
        workStart,
        workEnd,
        dueDate,
        currentAppointments,
        totalHoursNeeded,
        startDate,
        continuosPeriodPriorization
    ), totalHoursNeeded)

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

    const vacatedFreePeriods = pickBestContinuosPeriods(getAllVacatedSpacesInPeriodUntilDueDate(
        freeStart,
        freeEnd,
        dueDate,
        currentAppointments,
        currentlyRemainingHours,
        startDate,
        continuosPeriodPriorization
    ), currentlyRemainingHours)

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

export function getAllVacatedSpacesInPeriodUntilDueDate(periodStart, periodEnd, dueDate, appointments, hoursNeeded, startDate, getAllPeriods = false, maxPeriodHours = 0) {
    const allContinuousPeriods = [];

    // console.log("startDate", startDate);
    //Start with the period
    let currentTimestamp = startDate ? startDate.clone() : moment().add(1, 'day').startOf('day').set('hour', periodStart);
    //Check if the period end is on the same day as period start, or if the values of the hours wrap up to the next day
    let currentPeriondEnd = periodEnd > periodStart
        ? currentTimestamp.clone().set('hour', periodEnd)
        : currentTimestamp.clone().add(1, 'day').set('hour', periodEnd);
    //The period start is always in the same day, so the above conditional value is not necessary 
    let currentPeriodStart = currentTimestamp.clone().set('hour', periodStart)
    // let currentPeriodStart = periodEnd > periodStart
    //     ? currentTimestamp.clone().startOf('day').set('hour', periodStart)
    //     : currentTimestamp.clone().subtract(1, 'day').startOf('day').set('hour', periodStart)

    let currentContinuousPeriod = {
        start: null,
        end: null,
        hours: 0
    }

    // console.log("periodStar", currentPeriodStart);
    // console.log("periodEnd", currentPeriondEnd)

    // console.log('currentTimestamp', currentTimestamp);
    // console.log('dueDate', dueDate.format("DD/MM/YYYY HH:mm"));

    while (currentTimestamp.isSameOrBefore(dueDate)) {
        // console.log(currentTimestamp.format("DD/MM HH:mm"))
        // console.log('currentContinuousPeriod', Object.assign({}, currentContinuousPeriod))
        /*  Check if the periods already obtained already are enough for the appointment, so theres no 
            to continue the while loop*/
        if (maxPeriodHours !== 0 && currentContinuousPeriod.start && currentContinuousPeriod.hours + 1 >= maxPeriodHours) {

            currentContinuousPeriod.end = currentTimestamp.clone();
            currentContinuousPeriod.hours++;

            allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));
            currentContinuousPeriod = {
                start: null,
                end: null,
                hours: 0
            }
        }

        if (!getAllPeriods && hoursNeeded != 0) {
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
                // console.log("SKipping due to total reached hours");
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

            if (appointment.endDate.isSameOrAfter(currentPeriondEnd)) {
                currentPeriondEnd = currentPeriondEnd.add(1, 'day');
                currentPeriodStart = currentPeriodStart.add(1, 'day');
                currentTimestamp = currentPeriodStart.clone();
            } else {
                currentTimestamp = currentTimestamp.set('hour', appointment.endDate.get('hour'));
            }
            continue;
        }

        //If the current timestamp is beyond or just reached the dueDate
        // console.log('dueDate', dueDate.format('DD/MM HH:mm'))
        // console.log('currentTimestamp', currentTimestamp.format('DD/MM HH:mm'))
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
        if (currentTimestamp.isSameOrAfter(currentPeriondEnd)) {
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

            currentPeriondEnd = currentPeriondEnd.add(1, 'day');
            currentPeriodStart = currentPeriodStart.add(1, 'day');
            currentTimestamp = currentPeriodStart.clone();
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
        // console.log("Reached the end of loop")
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

export function pickBestContinuosPeriods(periods, neededHours) {
    //If the periods are not, or just barely, enough to contain the event, just return the array as it is
    if (getTotalHoursOfPeriods(periods) <= neededHours) {
        return periods;
    }

    //Sort the periods by hours and then by earliest
    periods.sort((a, b) =>
        (a.hours > b.hours || a.hours === neededHours)
            ? -1
            : (b.hours > a.hours)
                ? 1
                : a.start.isBefore(b.start)
                    ? -1
                    : b.start.isBefore(a.start)
                        ? 1
                        : 0
    );

    let remainingHours = neededHours;
    const currentPeriods = []

    for (let i = 0; i < periods.length; i++) {
        const currentPeriod = periods[i];
        if (currentPeriod.hours === remainingHours) {
            currentPeriods.push(currentPeriod);
            break;
        }
        else if (currentPeriod.hours > remainingHours) {
            //Remove from the period the extra hours and put it in the array of periods.
            const hourDifference = currentPeriod.hours - remainingHours;

            currentPeriod.hours = currentPeriod.hours - hourDifference;
            currentPeriod.end = currentPeriod.end.subtract(hourDifference, 'hours');
            currentPeriods.push(currentPeriod);

            break;
        } else {
            currentPeriods.push(currentPeriod);
            remainingHours -= currentPeriod.hours;
        }
    }

    return currentPeriods;
}

export function getTotalHoursOfPeriods(periods) {
    return periods.reduce((sum, period) => ({ hours: sum.hours + period.hours }), { hours: 0 }).hours;
}

export function createPeriodObject({ start, end, hours }, jobId) {
    return {
        startDate: start,
        endDate: end,
        state: APPOINTMENT_STATE_TO_DO,
        hours: hours,
        id: 'job_' + jobId + '_app_' + uuidv4(),
        jobId: jobId
    }
}
