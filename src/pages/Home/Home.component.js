import React from 'react';

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
import { APPOINTMENT_STATE_COMPLETED, APPOINTMENT_STATE_CURRENT, APPOINTMENT_STATE_DELAY, APPOINTMENT_STATE_LATE, APPOINTMENT_STATE_TO_DO, JOB_COMPLETED, JOB_NOT_STARTED, JOB_ON_GOING, SCHEDULE_FREE_TIME, SCHEDULE_FULL } from '../../utils/constants';
import { FieldTimeOutlined, DoubleRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { addAppointment, deleteAppointment, deleteJob, updateAppointment, updateJob } from '../../redux/appointment/appointment.actions';
import { verifyAppointmentDisponibility } from '../../utils/periods';
import { Button } from 'antd';

import './Home.styles.scss';
import { Grid } from '@material-ui/core';
import { AccessTime, Lens } from '@material-ui/icons';
import Modal from 'antd/lib/modal/Modal';

class HomeComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            appointmentUpdateInterval: null,
            isRealocateModalVisible: false,
            realocatedState: {
                state: '',
                periods: [],
                appointment: null,
                job: null
            }
        }
    }

    componentDidMount() {
        this.onUpdateAppointmentsState();
    }

    componentWillUnmount() {
        if (this.state.appointmentUpdateInterval) {
            clearTimeout(this.state.appointmentUpdateInterval)
            this.setState({ appointmentUpdateInterval: null })
        }
    }

    onUpdateAppointmentsState() {
        const { appointments } = this.props;

        appointments.forEach(appointment => {
            const currentState = this.checkStateOfAppointment(appointment)
            if (appointment.state !== currentState) {

                console.log("New state" + currentState + "for appoitnment" + appointment.id);

                appointment.state = currentState;

                this.props.updateAppointment(appointment);
            }
        })

        const timeUntilNextHour = moment().add(1, 'hour').startOf('hour').diff(moment(), 'milliseconds');

        this.setState({
            appointmentUpdateInterval: setTimeout(() => this.onUpdateAppointmentsState(), timeUntilNextHour)
        })
    }

    checkStateOfAppointment(appointment) {
        //Once completed, the state is not supposed to be changed anymore
        if (appointment.state === APPOINTMENT_STATE_COMPLETED) {
            return APPOINTMENT_STATE_COMPLETED;
        }

        const job = this.findJobOfAppointment(appointment);
        if (appointment.startDate.isAfter(job.dueDate)) {
            return APPOINTMENT_STATE_DELAY
        }

        //If the appointment has ended before the current date, then it's late
        if (appointment.endDate.isBefore(moment())) {
            return APPOINTMENT_STATE_LATE;
        }

        //If the appointment start is later than now, then it is still to do
        if (appointment.startDate.isAfter(moment())) {
            return APPOINTMENT_STATE_TO_DO;
        }

        //Otherwise, the appointment is occuring currrently
        return APPOINTMENT_STATE_CURRENT;
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

        const job = this.findJobOfAppointment(data);

        return (
            <Appointments.AppointmentContent {...props} style={{ height: '100%' }}>
                <div className="app-appointment-content">
                    <div className="title">
                        {data.title}
                    </div>
                    {
                        data.price
                            ? <div className="value-wrapper">$ {data.price.toFixed(2)}</div>
                            : null
                    }
                    <span>Due to: {job.dueDate.format('DD/MM/YYYY HH:00')}</span>
                    <div className="hour-wrapper">
                        <span>{formatDate(data.startDate, { hour: 'numeric', minute: 'numeric' })}</span>
                        <span style={{ padding: "0px 3px" }}> - </span>
                        <span>{formatDate(data.endDate, { hour: 'numeric', minute: 'numeric' })}</span>
                    </div>
                </div>
            </Appointments.AppointmentContent>
        )
    }

    getTooltipContent(props) {
        const { appointmentData, formatDate } = props;

        const job = this.findJobOfAppointment(appointmentData);
        if (!job) { return null; }

        return (
            <div className="tooltip-content">
                <Grid container alignItems="flex-start" className="meta">
                    <Grid item xs={2} style={{ display: 'flex', justifyContent: 'center' }} >
                        <Lens className="lens" style={{
                            color: appointmentData.state === APPOINTMENT_STATE_TO_DO
                                ? '#1890ff'
                                : appointmentData.state === APPOINTMENT_STATE_COMPLETED
                                    ? '#a4b1db'
                                    : appointmentData.state === APPOINTMENT_STATE_CURRENT
                                        ? 'green'
                                        : appointmentData.state === APPOINTMENT_STATE_LATE
                                            ? 'orange'
                                            : 'crimson'
                        }} />
                    </Grid>
                    <Grid item xs={10}>
                        <div className="title" >
                            {appointmentData.title}
                        </div>
                        <div >
                            {appointmentData.startDate.format('dddd, DD MMMM YYYY')}
                        </div>
                    </Grid>
                </Grid>
                <Grid container alignItems="center" style={{ marginTop: '10px' }}>
                    <Grid item xs={2} style={{ display: 'flex', justifyContent: 'center', color: 'gray' }} >
                        <ExclamationCircleOutlined style={{ fontSize: '24px' }} />
                    </Grid>
                    <Grid item xs={10}>
                        <div >
                            {`${formatDate(appointmentData.startDate, { hour: 'numeric', minute: 'numeric' })}
                            - ${formatDate(appointmentData.endDate, { hour: 'numeric', minute: 'numeric' })}`}
                        </div>
                    </Grid>
                </Grid>

                <Grid container alignItems="center" >
                    <Grid item xs={2} style={{ display: 'flex', justifyContent: 'center', color: 'gray' }} >
                        <AccessTime style={{ fontSize: '24px' }} />
                    </Grid>
                    <Grid item xs={10}>
                        <span>Due at {job.dueDate.format('dddd, DD MMMM YYYY HH:00')}</span>
                    </Grid>
                </Grid>

                {
                    appointmentData.description
                        ?
                        <p className="description">
                            {appointmentData.description}
                        </p>
                        :
                        null
                }


                <div className="tooltip-wrapper">
                    <Button
                        onClick={() => this.onCompleteTheAppointment(appointmentData)}
                        icon={<CheckCircleOutlined />}
                        size={'large'}>
                        Complete
                        </Button>
                    <Button
                        onClick={() => this.onDelayTheAppointment(appointmentData)}
                        icon={<FieldTimeOutlined />}
                        size={'large'}>
                        Delay
                        </Button>
                    <Button
                        onClick={() => this.onFinishTheAppointment(appointmentData)}
                        icon={<DoubleRightOutlined />}
                        size={'large'}>
                        Finish
                        </Button>
                </div>
            </div>
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
        if (jobAppointments.filter(appointment =>
            appointment.state === APPOINTMENT_STATE_TO_DO ||
            appointment.state === APPOINTMENT_STATE_CURRENT ||
            appointment.state === APPOINTMENT_STATE_DELAY ||
            appointment.state === APPOINTMENT_STATE_LATE).length === 0) {
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

        return jobAppointments.filter(appointment =>
            appointment.state === APPOINTMENT_STATE_TO_DO ||
            appointment.state === APPOINTMENT_STATE_CURRENT ||
            appointment.state === APPOINTMENT_STATE_DELAY ||
            appointment.state === APPOINTMENT_STATE_LATE
        ).length === 0;
    }

    onDelayTheAppointment(appointment) {
        const { workStart, workEnd, freeStart, freeEnd, appointments } = this.props;

        const job = this.findJobOfAppointment(appointment);

        console.log("appointment.endDate", appointment.endDate.format("DD/MM/YYYY HH:mm"))

        const newDistributedPeriods = verifyAppointmentDisponibility(
            appointment.hours,
            job.dueDate,
            appointments,
            [workStart, workEnd],
            [freeStart, freeEnd],
            appointment.endDate
        );

        console.log(newDistributedPeriods);

        if (newDistributedPeriods.state === SCHEDULE_FREE_TIME || newDistributedPeriods === SCHEDULE_FULL) {
            this.setState({
                realocatedState: { ...newDistributedPeriods, appointment, job },
                isRealocateModalVisible: true
            })
        } else {
            this.onConfirmationOfRealocation({ ...newDistributedPeriods, appointment, job })
        }
    }

    onConfirmationOfRealocation(directState = null) {
        const { periods, state, job, appointment } = directState || this.state.realocatedState;

        const newAppointments = periods.map((period, index) => ({
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

        this.setState({
            isRealocateModalVisible: false,
            realocatedState: null
        })
    }

    onFinishTheAppointment(appointment) {
        const job = this.findJobOfAppointment(appointment);

        this.props.deleteJob(job);
    }

    getAppointmentComponet(props) {
        const { children, style, data } = props;

        let className;

        if (data.state === APPOINTMENT_STATE_COMPLETED) {
            className = "appointment-done"
        }
        else if (data.state === APPOINTMENT_STATE_CURRENT) {
            className = "appointment-active";
        } else if (data.state === APPOINTMENT_STATE_LATE) {
            className = "appointment-late"
        } else if (data.state === APPOINTMENT_STATE_DELAY) {
            className = "appointment-delay"
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

                let newStartDate = moment(startDate);
                let newEndDate = moment(endDate);

                if (newEndDate.diff(newStartDate, 'hours') === 24) {
                    newStartDate.set('hour', this.props.workStart);
                    newEndDate = newStartDate.clone().set('hour', this.props.workStart + appointment.hours);
                }

                appointment.startDate = newStartDate;
                appointment.endDate = newEndDate;

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
                            appointmentContentComponent={this.getCustomAppointmentContent.bind(this)}
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

                {
                    this.state.realocatedState
                        ?
                        <Modal
                            visible={this.state.isRealocateModalVisible}
                            onOk={() => this.onConfirmationOfRealocation()}
                            onCancel={() => this.setState({ isRealocateModalVisible: false, realocatedState: null })}>
                            {
                                this.state.realocatedState.state === SCHEDULE_FREE_TIME
                                    ?
                                    <p>
                                        The appointment submitted can't be concluded during your work period,
                                        do you want to allocate your free time for this appointment?
                            </p>
                                    :
                                    <p>
                                        The appointment submitted can't be concluded during your work or free time,
                                        should the scheduler ignore your sleep period and allocate time in it?
                            </p>
                            }

                        </Modal>
                        :
                        null
                }

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