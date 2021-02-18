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
import moment from 'moment';
import './Home.styles.scss';

const schedulerData = [
    { startDate: moment().set('hour', 0).set('minute', 0), endDate: moment().set('hour', 8).set('minute', 0), title: 'Sleep' },
    { startDate: moment().set('hour', 8).set('minute', 0), endDate: moment().set('hour', 16).set('minute', 0), title: 'Work' },
    { startDate: moment().set('hour', 16).set('minute', 0), endDate: moment().set('hour', 24).set('minute', 0), title: 'Fun' },
];

export default class HomeComponent extends React.Component {

    render() {
        return (
            <div id="home-wrapper">
                <Header></Header>
                <Paper>
                    <Scheduler
                        locale={"en-UK"}
                        data={schedulerData}>
                        <ViewState
                            defaultCurrentViewName="Week"
                        />

                        <DayView />
                        <WeekView />
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