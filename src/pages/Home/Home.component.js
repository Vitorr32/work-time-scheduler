import * as React from 'react';

import Paper from '@material-ui/core/Paper';
import { ViewState } from '@devexpress/dx-react-scheduler';
import {
    Scheduler,
    DayView,
    WeekView,
    Appointments,
    Toolbar,
    ViewSwitcher,
    MonthView,
    AppointmentTooltip
} from '@devexpress/dx-react-scheduler-material-ui';
import { Header } from '../../components/Header/Header.component';
import { connect } from 'react-redux';
import moment from 'moment';

import './Home.styles.scss';
import { APPOINTMENT_STATE_COMPLETED, APPOINTMENT_STATE_NOT_STARTED } from '../../utils/constants';
import { FieldTimeOutlined, DoubleRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { updateAppointment, updatedJob, updateJob } from '../../redux/appointment/appointment.actions';
import { getAllVacatedSpacesInPeriodUntilDueDate, verifyAppointmentDisponibility } from '../../utils/periods';
import { Button } from 'antd';

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
                        //onClick={() => this.onCompleteTheAppointment(props.data)}
                        icon={<DoubleRightOutlined />}
                        size={'large'}>
                        Finish
                        </Button>
                </div>
            </AppointmentTooltip.Content>
        )
    }

    onCompleteTheAppointment(appointment) {
        const indexOnList = this.props.appointments.findIndex(toCompare => toCompare === appointment);

        if (indexOnList === -1) {
            console.error("Unknown appointment was completed!");
            return;
        }

        const jobIndex = this.findJobOfAppointment(this.props.appointments[indexOnList], true);

        const updatedAppointment = Object.assign({}, this.props.appointments[indexOnList]);
        updatedAppointment.state = APPOINTMENT_STATE_COMPLETED;

        this.props.updateAppointment({ appointment: updatedAppointment, index: indexOnList });
        this.props.updateJob({ job: this.onUpdateAppointmentOnJob(this.props.jobs[jobIndex], updatedAppointment), index: jobIndex });
    }

    onUpdateAppointmentOnJob(job, updatedAppointment) {
        const appointmentIndex = job.appointments.findIndex(appointment => appointment.id === updatedAppointment.id);
        job.appointments[appointmentIndex] = updatedAppointment;

        return job;
    }

    onDelayTheAppointment(appointment) {
        const { workStart, workEnd, freeStart, freeEnd, appointments, jobs } = this.props;

        const jobIndex = this.findJobOfAppointment(appointment, true);

        const periodOfDelay = verifyAppointmentDisponibility(
            appointment.hours,
            moment().startOf('day').set('year', 9999),
            appointments,
            [workStart, workEnd],
            [freeStart, freeEnd],
            jobs[jobIndex].dueDate
        );
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
        return moment().isAfter(appointment.endDate) && appointment.state === APPOINTMENT_STATE_NOT_STARTED
    }

    findJobOfAppointment(appointment, index = false) {
        return index
            ?
            this.props.jobs.findIndex(job => job.id === appointment.jobId)
            :
            this.props.jobs.find(job => job.id === appointment.jobId);
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

                        <DayView
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </DayView>
                        <WeekView
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </WeekView>
                        <MonthView />

                        <Appointments
                            appointmentComponent={this.getAppointmentComponet.bind(this)}
                            appointmentContentComponent={this.getCustomAppointmentContent}
                        />

                        <AppointmentTooltip
                            showCloseButton
                            contentComponent={this.getTooltipContent.bind(this)}
                        />

                        <Toolbar />
                        <ViewSwitcher />
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
        updateAppointment: (payload) => dispatch(updateAppointment(payload)),
        updateJob: (payload) => dispatch(updateJob(payload))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(HomeComponent);