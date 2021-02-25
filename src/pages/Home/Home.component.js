import * as React from 'react';

import Paper from '@material-ui/core/Paper';
import { EditingState, IntegratedEditing, ViewState } from '@devexpress/dx-react-scheduler';
import {
    Scheduler,
    DayView,
    WeekView,
    Appointments,
    Toolbar,
    ViewSwitcher,
    MonthView,
    AppointmentTooltip,
    DateNavigator,
    ConfirmationDialog,
    DragDropProvider
} from '@devexpress/dx-react-scheduler-material-ui';
import { Header } from '../../components/Header/Header.component';
import { connect } from 'react-redux';
import moment from 'moment';
import { APPOINTMENT_STATE_COMPLETED, APPOINTMENT_STATE_TO_DO, JOB_COMPLETED, JOB_NOT_STARTED, JOB_ON_GOING } from '../../utils/constants';
import { FieldTimeOutlined, DoubleRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { addAppointment, deleteAppointment, deleteJob, updateAppointment, updateJob } from '../../redux/appointment/appointment.actions';
import { verifyAppointmentDisponibility } from '../../utils/periods';
import { Button } from 'antd';

import './Home.styles.scss';

class HomeComponent extends React.Component {
    constructor(props) {
        super(props);
    }

    TableTimeCellRenderer(input) {
        const { workStart, workEnd, freeStart, freeEnd } = this.props;

        const startDate = moment(input.startDate);
        const endDate = moment(input.endDate);

        let className = "sleep-period";

        if (this.isHoursBetween(workStart, workEnd, startDate, endDate)) {
            className = "work-period"
        } else if (this.isHoursBetween(freeStart, freeEnd, startDate, endDate)) {
            className = "free-period"
        }

        return <DayView.TimeTableCell {...input} className={className}></DayView.TimeTableCell>
    }

    isHoursBetween(periodStart, periodEnd, checkStart, checkEnd) {
        const periodStartDate = checkStart.clone().startOf('day').set('hour', periodStart);
        const periodEndDate = checkEnd.clone().startOf('day').set('hour', periodEnd);

        return checkStart.isBetween(periodStartDate, periodEndDate, undefined, "[)") &&
            checkEnd.isBetween(periodStartDate, periodEndDate, undefined, "(]")

    }

    getCustomAppointmentContent(props) {
        const { data, formatDate } = props;
        return (
            <Appointments.AppointmentContent {...props} style={{ height: '100%' }}>
                <div className="app-appointment-content">
                    <div className="title">
                        {data.title}
                    </div>
                    <div className="value-wrapper">$ {data.price}</div>
                    <div className="hour-wrapper">
                        <span>{formatDate(data.startDate, { hour: 'numeric', minute: 'numeric' })}</span>
                        <span style={{ padding: "0px 3px" }}> - </span>
                        <span>{formatDate(data.endDate, { hour: 'numeric', minute: 'numeric' })}</span>
                    </div>

                    {
                        data.description
                            ?
                            <div className="description">
                                {data.description}
                            </div>
                            :
                            null
                    }

                </div>
            </Appointments.AppointmentContent>
        )
    }

    getTooltipContent(props) {
        return (
            <AppointmentTooltip.Content {...props}>
                <div className="tooltip-wrapper">
                    <Button
                        onClick={() => this.onCompleteTheAppointment(props.appointmentData)}
                        icon={<CheckCircleOutlined />}
                        size={'large'}>
                        Complete
                        </Button>
                    <Button
                        onClick={() => this.onDelayTheAppointment(props.appointmentData)}
                        icon={<FieldTimeOutlined />}
                        size={'large'}>
                        Delay
                        </Button>
                    <Button
                        onClick={() => this.onFinishTheAppointment(props.appointmentData)}
                        icon={<DoubleRightOutlined />}
                        size={'large'}>
                        Finish
                        </Button>
                </div>
            </AppointmentTooltip.Content>
        )
    }

    onCompleteTheAppointment(appointment) {
        const { appointments, jobs } = this.props;

        const updatedListOfAppointments = [...appointments];
        const indexOnList = updatedListOfAppointments.findIndex(toCompare => toCompare.id === appointment.id);

        if (indexOnList === -1) {
            console.error("Unknown appointment was completed!");
            return;
        }

        updatedListOfAppointments[indexOnList].state = APPOINTMENT_STATE_COMPLETED;
        const associatedJob = jobs.find(job => job.id === appointment.jobId);

        //Check that with the conclusion of this appointment, the job was completed entirely
        if (this.shouldDeleteJob(associatedJob, updatedListOfAppointments)) {
            this.props.deleteJob(associatedJob);
        } else {
            this.props.updateAppointment(updatedListOfAppointments[indexOnList]);
            this.props.updateJob(this.onUpdateJobStateOnAppointmentChange(associatedJob, updatedListOfAppointments));
        }
    }

    onUpdateJobStateOnAppointmentChange(job, allAppointments) {
        const jobAppointments = allAppointments.filter(appointment => job.appointments.includes(appointment.id));

        //If no appointment is still in the state to do, means that the job is fully completed and should be removed
        if (jobAppointments.filter(appointment => appointment.state === APPOINTMENT_STATE_TO_DO).length === 0) {
            job.state = JOB_COMPLETED
            //Else if not a single appointment has started, that means the job is still on hold
        } else if (jobAppointments.filter(appointment => appointment.state === APPOINTMENT_STATE_COMPLETED).length === 0) {
            job.state = JOB_NOT_STARTED
        } else {
            job.state = JOB_ON_GOING
        }

        return job;
    }

    shouldDeleteJob(job, allAppointments) {
        const jobAppointments = allAppointments.filter(appointment => job.appointments.includes(appointment.id));

        return jobAppointments.filter(appointment => appointment.state === APPOINTMENT_STATE_TO_DO).length === 0;
    }

    onDelayTheAppointment(appointment) {
        const { workStart, workEnd, freeStart, freeEnd, appointments } = this.props;

        const job = this.findJobOfAppointment(appointment);

        const newDistributedPeriods = verifyAppointmentDisponibility(
            appointment.hours,
            moment().startOf('day').set('year', 9999),
            appointments,
            [workStart, workEnd],
            [freeStart, freeEnd],
            appointment.endDate
        );

        const newAppointments = newDistributedPeriods.periods.map((period, index) => ({
            startDate: period.start,
            endDate: period.end,
            title: job.name,
            price: job.price,
            description: job.description,
            state: APPOINTMENT_STATE_TO_DO,
            hours: period.hours,
            id: 'job_' + job.id + '_app_' + (job.appointments.length + index),
            jobId: job.id
        }));

        //Removed old appointment and insert new ids from the job object
        const indexOfAppointment = job.appointments.findIndex(appoID => appoID === appointment.id);
        job.appointments.splice(indexOfAppointment, 1, ...newAppointments.map(app => app.id))

        this.props.updateJob(job);
        this.props.deleteAppointment([appointment.id]);
        this.props.addAppointments(newAppointments);
    }

    onFinishTheAppointment(appointment) {
        const job = this.findJobOfAppointment(appointment);

        this.props.deleteJob(job);
    }

    getAppointmentComponet(props) {
        const { children, style, data } = props;

        let className;

        if (this.isAppointmentDone(data)) {
            className = "appointment-done"
        }
        else if (this.isAppointmentNow(data)) {
            className = "appointment-active";
        } else if (this.isAppointmentLate(data)) {
            className = "appointment-late"
        }

        return (
            <Appointments.Appointment
                {...props}
                className={className}
                style={{
                    ...style
                }}
            >
                {children}
            </Appointments.Appointment>
        )
    }

    getStartDayHour() {
        if (this.props.workStart && this.props.freeStart) {
            return Math.min(this.props.workStart, this.props.freeStart);
        }
        return 0;
    }

    getEndDayHour() {
        if (this.props.workEnd && this.props.freeEnd) {
            return Math.max(this.props.workEnd, this.props.freeEnd);
        }

        return 24;
    }

    isAppointmentDone(appointment) {
        return appointment.state === APPOINTMENT_STATE_COMPLETED
    }

    isAppointmentNow(appointment) {
        return moment().isSameOrAfter(appointment.startDate) && moment().isSameOrBefore(appointment.endDate)
    }

    isAppointmentLate(appointment) {
        return moment().isAfter(appointment.endDate) && appointment.state === APPOINTMENT_STATE_TO_DO
    }

    findJobOfAppointment(appointment, index = false) {
        return index
            ?
            this.props.jobs.findIndex(job => job.id === appointment.jobId)
            :
            this.props.jobs.find(job => job.id === appointment.jobId);
    }

    onAppointmentChangeCommited(props) {
        const { appointments } = this.props;

        if (props.deleted) {
            const appointment = appointments.find(appo => appo.id === props.deleted);
            const job = this.findJobOfAppointment(appointment);

            const previewedDeletionAppointments = [...appointments];
            previewedDeletionAppointments.splice(previewedDeletionAppointments.findIndex(appo => appo.id === props.deleted), 1)

            if (this.shouldDeleteJob(job, previewedDeletionAppointments)) {
                this.props.deleteJob(job);
            } else {
                job.appointments.splice(job.appointments.findIndex(appo => appo === props.deleted), 1);

                this.props.deleteAppointment([props.deleted]);
                this.props.updateJob(job);
            }
        }

        if (props.changed) {
            Object.keys(props.changed).forEach(changedId => {
                const { endDate, startDate } = props.changed[changedId];

                const appointment = appointments.find(appo => appo.id === changedId);

                appointment.startDate = moment(startDate);
                appointment.endDate = moment(endDate);

                this.props.updateAppointment(appointment);
            })
        }
    }

    render() {
        return (
            <div id="home-wrapper">
                <Header></Header>
                <Paper>
                    <Scheduler
                        locale={"en-UK"}
                        data={this.props.appointments}>
                        <ViewState
                            defaultCurrentViewName="Week"
                        />
                        <EditingState onCommitChanges={this.onAppointmentChangeCommited.bind(this)} />

                        <IntegratedEditing />
                        <ConfirmationDialog />

                        <DayView
                            cellDuration={60}
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </DayView>
                        <WeekView
                            cellDuration={60}
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </WeekView>
                        <MonthView />

                        <Toolbar />
                        <ViewSwitcher />
                        <DateNavigator />

                        <Appointments
                            appointmentComponent={this.getAppointmentComponet.bind(this)}
                            appointmentContentComponent={this.getCustomAppointmentContent}
                        />

                        <AppointmentTooltip
                            showCloseButton
                            showDeleteButton

                            contentComponent={this.getTooltipContent.bind(this)}
                        />

                        <DragDropProvider
                            allowResize={() => false}
                        />

                    </Scheduler>
                </Paper>
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    workStart: state.period.workStart,
    workEnd: state.period.workEnd,
    freeStart: state.period.freeStart,
    freeEnd: state.period.freeEnd,
    appointments: state.appointment.appointments,
    jobs: state.appointment.jobs
})

const mapDispatchToProps = dispatch => {
    return {
        addAppointments: (payload) => dispatch(addAppointment(payload)),
        updateAppointment: (payload) => dispatch(updateAppointment(payload)),
        deleteAppointment: (payload) => dispatch(deleteAppointment(payload)),
        updateJob: (payload) => dispatch(updateJob(payload)),
        deleteJob: (payload) => dispatch(deleteJob(payload))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(HomeComponent);