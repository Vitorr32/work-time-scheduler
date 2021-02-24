import { updateAppointment } from "./appointment.actions";

export function updateAppointmentOnList(appointmentList = [], toUpdateAppointment, indexOnList) {
    const updatedList = [...appointmentList];
    updatedList[indexOnList] = toUpdateAppointment;

    return updatedList;
}

export function updateJobtOnList(jobList = [], toUpdateJob, indexOnList) {
    const updatedList = [...jobList];
    updatedList[indexOnList] = toUpdateJob;

    return updatedList;
}