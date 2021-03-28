import React from 'react';

import Paper from '@material-ui/core/Paper';
import { EditingState, IntegratedEditing, ViewState } from '@devexpress/dx-react-scheduler';
import {
    Scheduler,
    DayView,
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
import { FieldTimeOutlined, DoubleRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DoubleLeftOutlined, LeftOutlined, RightOutlined, SplitCellsOutlined } from '@ant-design/icons';
import { addAppointment, deleteAppointment, deleteJob, updateAppointment, updateJob } from '../../redux/appointment/appointment.actions';
import { createPeriodObject, getAllVacatedSpacesInPeriodUntilDueDate, verifyAppointmentDisponibility } from '../../utils/periods';
import { Button, Form, Input } from 'antd';

import './Home.styles.scss';
import { Button as MaterialButton, Grid } from '@material-ui/core';
import { AccessTime, Lens } from '@material-ui/icons';
import Modal from 'antd/lib/modal/Modal';
import Checkbox from 'antd/lib/checkbox/Checkbox';
import { setShowSleepConfiguration } from '../../redux/global-configuration/configuration.actions';

class HomeComponent extends React.Component {
    partitionForm = React.createRef();

    constructor(props) {
        super(props);

        this.state = {
            currentDay: moment().startOf('week').toDate(),
            currentViewName: 'Day',
            appointmentUpdateInterval: null,
            isPartitionModalVisible: false,
            partitionAppointmentData: null,
            partitionHourValue: '',
            isRealocateModalVisible: false,
            realocatedState: {
                state: '',
                periods: [],
                appointment: null,
                job: null
            },
            isAppointmentTooltipVisible: false,
            appointmentTooltipMetadata: {
                target: null,
                data: {},
            },

        }

        this.toggleVisibility = () => {
            this.setState({ isAppointmentTooltipVisible: !this.state.isAppointmentTooltipVisible });
        };

        this.onAppointmentMetaChange = ({ data, target } = { data: {}, target: null }) => {
            this.setState({ appointmentTooltipMetadata: { data, target } });
        };
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

        const timeUntilNextHour = moment().add(1, 'hour').startOf('hour').add(1, 'second').diff(moment(), 'milliseconds');

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
                        {job.name}
                    </div>
                    {
                        job.price
                            ? <div className="value-wrapper">$ {job.price.toFixed(2)}</div>
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

        <SplitCellsOutlined />

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
                            {job.name}
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
                    job.description
                        ?
                        <p className="description">
                            {job.description}
                        </p>
                        :
                        null
                }


                <div className="tooltip-wrapper">
                    <Button
                        disabled={appointmentData.state === APPOINTMENT_STATE_COMPLETED}
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

            this.toggleVisibility();
            this.onAppointmentMetaChange();
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

        const newDistributedPeriods = verifyAppointmentDisponibility(
            appointment.hours,
            job.dueDate,
            appointments,
            [workStart, workEnd],
            [freeStart, freeEnd],
            appointment.endDate
        );

        if (newDistributedPeriods.state === SCHEDULE_FREE_TIME || newDistributedPeriods === SCHEDULE_FULL) {
            this.setState({
                realocatedState: { ...newDistributedPeriods, appointment, job },
                isRealocateModalVisible: true
            })

            this.toggleVisibility();
            this.onAppointmentMetaChange();
        } else {
            this.onConfirmationOfRealocation({ ...newDistributedPeriods, appointment, job })
        }
    }

    onConfirmationOfRealocation(directState = null) {
        const { periods, job, appointment } = directState || this.state.realocatedState;

        const newAppointments = periods.map(period => createPeriodObject(period, job.id))

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

        this.toggleVisibility();
        this.onAppointmentMetaChange();
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
                onClick={({ target, data }) => {
                    let targetElement = target;

                    while (true) {
                        targetElement = targetElement.parentElement;
                        if (targetElement.style.position === 'absolute') { break; }
                    }

                    this.onAppointmentMetaChange({ target: targetElement, data });
                    this.toggleVisibility();
                }}
            >
                {children}
            </Appointments.Appointment>
        )
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

            this.toggleVisibility();
            this.onAppointmentMetaChange();
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
                appointment.state = this.checkStateOfAppointment(appointment)

                this.props.updateAppointment(appointment);
            })
        }
    }

    onAppointmentPartitionSet({ hour }) {
        const { appointments, deleteAppointment, updateJob, addAppointments } = this.props;

        const appointment = this.state.partitionAppointmentData;

        const modifiedAppointments = appointments.slice();
        modifiedAppointments.splice(modifiedAppointments.findIndex(appo => appo.id === appointment.id), 1);
        const job = this.findJobOfAppointment(appointment);

        const newPeriods = getAllVacatedSpacesInPeriodUntilDueDate(
            appointment.startDate.get('hour'),
            appointment.endDate.get('hour'),
            appointment.endDate,
            modifiedAppointments,
            0,
            appointment.startDate,
            false,
            hour
        )

        let newAppointments = newPeriods.map(period => createPeriodObject(period, job.id));
        job.appointments.splice(job.appointments.findIndex(appo => appo === appointment.id), 1);
        job.appointments.push(...newAppointments.map(newAppo => newAppo.id));

        newAppointments = newAppointments.map(newAppointment => {
            const currentState = this.checkStateOfAppointment(newAppointment);

            if (newAppointment.state !== currentState) {
                newAppointment.state = currentState;
            }

            return newAppointment
        })

        deleteAppointment([appointment.id]);
        addAppointments(newAppointments);
        updateJob(job);


        this.setState({ partitionAppointmentData: null });
    }

    validateHourInserted(_, hours) {
        if (!hours) {
            return Promise.resolve();
        }

        try {
            parseInt(hours, 10);
        } catch (e) {
            return Promise.reject('The hours value need to be a number!')
        }

        if (this.state.partitionAppointmentData.hours <= hours) {
            return Promise.reject('You can\'t partition an appointment by the same or higher number of hours!')
        }

        if (hours <= 0) {
            return Promise.reject('The number of hour should be non-negative and non-zero!')
        }

        return Promise.resolve();
    }

    getToolbarFreeSpaceComponent() {
        return (
            <Toolbar.FlexibleSpace className="toolbar-flexible-space" >
                <Checkbox
                    checked={this.props.showSleepPeriod}
                    onChange={(event) => {
                        const { setShowSleepPeriod } = this.props;
                        const checked = event.target.checked

                        setShowSleepPeriod(checked);
                    }} >
                    Show Sleep Period
                </Checkbox>
            </Toolbar.FlexibleSpace>
        )
    }

    getViewSwitcherComponent(props) {
        return <ViewSwitcher.Switcher {...props} onChange={(viewName) => this.setState({ currentViewName: viewName })}></ViewSwitcher.Switcher >
    }

    getNavigatorRootComponent(props) {
        return <DateNavigator.Root className="date-navigator-root" {...props}></DateNavigator.Root>
    }

    getDateNavigatorComponent(props) {
        const isForward = props.type === 'forward'
        return (
            <div className={`navigation-pair-button-wrapper ${isForward ? '' : 'reverse'}`}>
                <button onClick={() => this.onNaviagateDate(props.type)}>
                    {isForward ? <RightOutlined /> : <LeftOutlined />}
                </button>
                {
                    this.state.currentViewName === 'Day'
                        ?
                        <button onClick={() => this.onNaviagateDate(props.type, true)}>
                            {props.type === 'forward' ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
                        </button>
                        :
                        null
                }
            </div>
        )
    }

    onNaviagateDate(direction, fastForward = false) {
        const currentDay = this.state.currentDay;

        switch (this.state.currentViewName) {
            case 'Day':
                this.setState({
                    currentDay: direction === 'forward'
                        ?
                        moment(currentDay).add(fastForward ? 7 : 1, 'day').toDate()
                        :
                        moment(currentDay).subtract(fastForward ? 7 : 1, 'day').toDate()
                })
                return
            case 'Month':
                this.setState({
                    currentDay: direction === 'forward'
                        ?
                        moment(currentDay).add(1, 'month').toDate()
                        :
                        moment(currentDay).subtract(1, 'month').toDate()
                })
                return;
        }
    }

    getHeaderComponent({ children, appointmentData, classes, ...restProps }) {
        return (
            <AppointmentTooltip.Header
                {...restProps}
                appointmentData={appointmentData}
            >
                <MaterialButton className="icon-button-wrapper" onClick={() => {
                    this.setState({ isPartitionModalVisible: true, partitionAppointmentData: appointmentData })
                    this.toggleVisibility();
                    this.onAppointmentMetaChange();
                }}>
                    <SplitCellsOutlined />
                </MaterialButton>
            </AppointmentTooltip.Header>
        )
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
                            currentDate={this.state.currentDay}
                            currentViewName={this.state.currentViewName}
                        />
                        <EditingState onCommitChanges={this.onAppointmentChangeCommited.bind(this)} />

                        <IntegratedEditing />
                        <ConfirmationDialog />

                        <DayView
                            displayName={'Week'}
                            cellDuration={60}
                            intervalCount={7}
                            startDayHour={this.props.calendarViewHourStart}
                            endDayHour={this.props.calendarViewHourEnd}
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </DayView>
                        <MonthView />

                        <Toolbar flexibleSpaceComponent={this.getToolbarFreeSpaceComponent.bind(this)} />
                        <ViewSwitcher switcherComponent={this.getViewSwitcherComponent.bind(this)} />
                        <DateNavigator
                            rootComponent={this.getNavigatorRootComponent.bind(this)}
                            navigationButtonComponent={this.getDateNavigatorComponent.bind(this)} />

                        <Appointments
                            appointmentComponent={this.getAppointmentComponet.bind(this)}
                            appointmentContentComponent={this.getCustomAppointmentContent.bind(this)}
                        />

                        <AppointmentTooltip
                            showCloseButton
                            showDeleteButton
                            headerComponent={this.getHeaderComponent.bind(this)}
                            visible={this.state.isAppointmentTooltipVisible}
                            appointmentMeta={this.state.appointmentTooltipMetadata}
                            onAppointmentMetaChange={this.onAppointmentMetaChange}
                            onVisibilityChange={() => this.setState({ isAppointmentTooltipVisible: false })}

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
                            <p style={{ marginTop: '20px' }}>
                                {
                                    this.state.realocatedState.state === SCHEDULE_FREE_TIME
                                        ?

                                        `The appointment submitted can't be concluded during your work period,
                                        do you want to allocate your free time for this appointment?`
                                        :
                                        `The appointment submitted can't be concluded during your work or free time,
                                        should the scheduler ignore your sleep period and allocate time in it?`
                                }
                            </p>
                        </Modal>
                        :
                        null
                }


                {
                    this.state.isPartitionModalVisible
                        ?
                        <Modal
                            visible={this.state.isPartitionModalVisible}
                            onOk={() => {
                                this.partitionForm.current.validateFields()
                                    .then(values => {
                                        this.onAppointmentPartitionSet(values);
                                        this.setState({ isPartitionModalVisible: false })
                                    })
                                    .catch(info => {
                                        console.log('Validate Failed:', info);
                                        this.setState({ isPartitionModalVisible: false })
                                    });
                            }}
                            onCancel={() => this.setState({ isPartitionModalVisible: false })}
                            className="hour-splitter-modal"
                        >
                            <h2>Appointment Partition Tool</h2>
                            <p>Input the number of maximum number of hours that each partition of this appointment should have,
                                the Scheduler will divide the appointment by the hour inputted </p>
                            <Form
                                ref={this.partitionForm}
                                name="partitionForm"
                            >
                                <Form.Item
                                    name="hour"
                                    rules={[{ required: true, message: 'You need to input a number of hours!' }, { validator: this.validateHourInserted.bind(this) }]}
                                >
                                    <Input
                                        placeholder="XX"
                                        type="number"
                                        prefix={<FieldTimeOutlined />}
                                        suffix={'Hours'}
                                    />
                                </Form.Item>

                            </Form>

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
    calendarViewHourStart: state.period.calendarViewHourStart,
    calendarViewHourEnd: state.period.calendarViewHourEnd,
    appointments: state.appointment.appointments,
    jobs: state.appointment.jobs,
    showSleepPeriod: state.config.showSleepPeriod
})

const mapDispatchToProps = dispatch => {
    return {
        addAppointments: (payload) => dispatch(addAppointment(payload)),
        updateAppointment: (payload) => dispatch(updateAppointment(payload)),
        deleteAppointment: (payload) => dispatch(deleteAppointment(payload)),
        updateJob: (payload) => dispatch(updateJob(payload)),
        deleteJob: (payload) => dispatch(deleteJob(payload)),
        setShowSleepPeriod: (payload) => dispatch(setShowSleepConfiguration(payload))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(HomeComponent);