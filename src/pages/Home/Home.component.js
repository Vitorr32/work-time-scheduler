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
} from '@devexpress/dx-react-scheduler-material-ui';
import './Home.styles.scss';

const currentDate = '2018-11-01';
const schedulerData = [
    { startDate: '2018-11-01T09:45', endDate: '2018-11-01T11:00', title: 'Meeting' },
    { startDate: '2018-11-01T12:00', endDate: '2018-11-01T13:30', title: 'Go to a gym' },
];

export default class HomeComponent extends React.Component {

    render() {
        return (
            <div id="home-wrapper">
                <Paper>
                    <Scheduler
                        data={schedulerData}
                    >
                        <ViewState
                            defaultCurrentDate="2018-07-25"
                            defaultCurrentViewName="Week"
                        />
                        <DayView
                            startDayHour={9}
                            endDayHour={18}
                        />
                        <WeekView
                            startDayHour={10}
                            endDayHour={19}
                        />
                        <Toolbar />
                        <ViewSwitcher />
                        <Appointments />
                    </Scheduler>
                </Paper>
            </div>
        )
    }
}