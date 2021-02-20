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
} from '@devexpress/dx-react-scheduler-material-ui';
import { Header } from '../../components/Header/Header.component';
import { connect } from 'react-redux';
import moment from 'moment';

import './Home.styles.scss';

class HomeComponent extends React.Component {

    TableTimeCellRenderer(input, type) {
        const { workStart, workEnd, freeStart, freeEnd } = this.props;

        const startDate = moment(input.startDate);
        const endDate = moment(input.endDate);

        let className = "sleep-period";

        if (startDate.isBetween(workStart, workEnd) && endDate.isBetween(workStart, workEnd)) {
            className = "work-period"
        } else if (startDate.isBetween(freeStart, freeEnd) && endDate.isBetween(freeStart, freeEnd)) {
            className = "free-period"
        }

        switch (type) {
            case 'DAY':
                return <DayView.TimeTableCell {...input} className={className}></DayView.TimeTableCell>
            case 'WEEK':
                return <WeekView.TimeTableCell {...input} className={className}></WeekView.TimeTableCell>
            default:
                return <DayView.TimeTableCell {...input} className={className}></DayView.TimeTableCell>
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

                        <DayView timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </DayView>
                        <WeekView timeTableCellComponent={this.TableTimeCellRenderer.bind(this)}>
                        </WeekView>
                        <MonthView />

                        <Toolbar />
                        <ViewSwitcher />
                        <Appointments />
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
    appointments: state.appointment.appointments
})

export default connect(mapStateToProps)(HomeComponent);