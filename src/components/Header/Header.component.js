import { Button } from 'antd';
import React from 'react';
import { AppointmentForm } from '../AppointmentForm/AppointmentForm.component';

import './Header.styles.scss';

export class Header extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isModalVisible: false,
        }
    }

    onFormSubmit() {

    }

    render() {
        return (
            <header>
                <h2>Work Scheduler</h2>

                <div className="button-group">
                    <Button type="primary" onClick={() => this.setState({ isModalVisible: true })}>Add Event</Button>

                    <AppointmentForm isModalVisible={this.state.isModalVisible} onCloseModal={() => this.setState({ isModalVisible: false })} />
                </div>
            </header>
        )
    }
}