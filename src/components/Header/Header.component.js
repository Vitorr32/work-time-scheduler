import React from 'react';
import { AppointmentForm } from '../AppointmentForm/AppointmentForm.component';
import PeriodSetter from '../PeriodSetter/PeriodSetter.component';
import * as PeriodType from '../../utils/PeriodType';

import './Header.styles.scss';

export class Header extends React.Component {
    constructor(props) {
        super(props)
    }

    onFormSubmit() {
    }

    render() {
        return (
            <header>
                <h2>Work Scheduler</h2>

                <div className="button-group">
                    <PeriodSetter periodType={PeriodType.WORK_PERIOD} />
                    <PeriodSetter periodType={PeriodType.FREE_PERIOD} />
                    <PeriodSetter periodType={PeriodType.SLEEP_PERIOD} />

                    <AppointmentForm />
                </div>
            </header>
        )
    }
}