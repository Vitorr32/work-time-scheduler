export function updateAppointmentOnList(appointmentList = [], toUpdateAppointment) {
    const indexOnList = appointmentList.findIndex(appointment => appointment.id === toUpdateAppointment.id);

    if (indexOnList === -1) {
        console.error("The update operation on appointments failed, no appointment with id " + toUpdateAppointment.id + " found");
        return appointmentList;
    }

    const updatedList = [...appointmentList];
    updatedList[indexOnList] = toUpdateAppointment;

    return updatedList;
}

export function updateJobOnList(jobList = [], toUpdateJob) {
    const indexOnList = jobList.findIndex(job => job.id === toUpdateJob.id);

    if (indexOnList === -1) {
        console.error("The update operation on jobs failed, no job with id " + toUpdateJob.id + " found");
        return jobList;
    }

    const updatedList = [...jobList];
    updatedList[indexOnList] = toUpdateJob;

    return updatedList;
}

export function deleteAppointment(appointmentList = [], toDeleteIDs = []) {
    const indexesOnList = toDeleteIDs.map(id => appointmentList.findIndex(appointment => appointment.id === id));

    const updatedList = [...appointmentList];
    indexesOnList.forEach(index => updatedList.splice(index, 1))

    return updatedList;
}

export function deleteJobAndAssociatedAppointments(toDeletejob, jobList = [], appointmentList = []) {
    const indexOnList = jobList.findIndex(job => job.id === toDeletejob.id);

    const updatedJobList = [...jobList];
    updatedJobList.splice(indexOnList, 1);

    const updatedAppointmentList = [...appointmentList];
    toDeletejob.appointments.forEach(appointmentOfJobID => {
        const indexOnAppointmentList = updatedAppointmentList.findIndex(appointment => appointment.id === appointmentOfJobID);
        updatedAppointmentList.splice(indexOnAppointmentList, 1);
    });

    return { jobs: updatedJobList, appointments: updatedAppointmentList }
}