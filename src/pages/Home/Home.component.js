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
import { APPOINTMENT_STATE_NOT_STARTED } from '../../utils/constants';
import { FieldTimeOutlined, DoubleRightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { updateAppointment } from '../../redux/appointment/appointment.actions';
import { getAllVacatedSpacesInPeriodUntilDueDate } from '../../utils/periods';
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
        console.log("appointmentTooltipProps", props);

        return (
            <AppointmentTooltip.Content {...props}>
                <div className="tooltip-wrapper">
                    <Button
                        onClick={() => this.onCompleteTheAppointment(props.data)}
                        icon={<CheckCircleOutlined />}
                        size={'large'}>
                        Complete
                        </Button>
                    <Button
                        onClick={() => this.onCompleteTheAppointment(props.data)}
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

        this.props.updateAppointment({ appointment, index: indexOnList });
    }

    onDelayTheAppointment(appointment) {
        const job = this.findJobOfAppointment(appointment);

        getAllVacatedSpacesInPeriodUntilDueDate()
    }

    getAppointmentComponet(props) {
        const { children, style, data } = props;

        let className;

        if (this.isAppointmentNow(data)) {
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

    isAppointmentOnTime(appointment) {
        return moment().isBefore(appointment.startDate);
    }

    isAppointmentNow(appointment) {
        return moment().isSameOrAfter(appointment.startDate) && moment().isSameOrBefore(appointment.endDate)
    }

    isAppointmentLate(appointment) {
        return moment().isAfter(appointment.endDate) && appointment.state === APPOINTMENT_STATE_NOT_STARTED
    }

    findJobOfAppointment(appointment) {
        return this.props.jobs.find(job => job.id === appointment.jobId);
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
                            // startDayHour={this.getStartDayHour()}
                            // endDayHour={this.getEndDayHour()}
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </DayView>
                        <WeekView
                            // startDayHour={this.getStartDayHour()}
                            // endDayHour={this.getEndDayHour()}
                            timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </WeekView>
                        <MonthView />

                        <Appointments
                            appointmentComponent={this.getAppointmentComponet.bind(this)}
                            appointmentContentComponent={this.getCustomAppointmentContent}
                        />

                        <AppointmentTooltip
                            showCloseButton
                            showOpenButton
                            contentComponent={this.getTooltipContent}
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
        updateAppointment: (payload) => dispatch(updateAppointment(payload))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(HomeComponent);