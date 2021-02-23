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
                    <div className="value-wrapper">$ 24.00</div>
                    <div className="hour-wrapper">
                        <span>{formatDate(data.startDate, { hour: 'numeric', minute: 'numeric' })}</span>
                        <span style={{ padding: "0px 3px" }}> - </span>
                        <span>{formatDate(data.endDate, { hour: 'numeric', minute: 'numeric' })}</span>
                    </div>

                    <div className="description">
                        asdasidhisadbasid asjd asidaid adia diasd asidbasudbasudbad asida dia diadsyb
                    </div>
                </div>
            </Appointments.AppointmentContent>
        )
    }

    getTooltipContent(props) {
        console.log("appointmentTooltipProps", props);
        return (
            <AppointmentTooltip.Content {...props}>
                <div>
                    Yolo
                </div>
            </AppointmentTooltip.Content>
        )
    }

    getAppointmentComponet(props) {
        const { children, style } = props;

        console.log("appointmentProps", props);

        return (
            <Appointments.Appointment
                {...props}
                style={{
                    ...style,
                    backgroundColor: '#FFC107',
                    borderRadius: '8px',
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
                            appointmentComponent={this.getAppointmentComponet}
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

export default connect(mapStateToProps)(HomeComponent);