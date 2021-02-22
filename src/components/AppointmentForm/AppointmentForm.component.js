import { Input, Form, Modal, InputNumber, DatePicker, Button } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
import { updateAppointments } from '../../redux/appointment/appointment.actions';
import moment from 'moment';

import './AppointmentForm.styles.scss';

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

class AppointmentForm extends React.Component {
    formRef = React.createRef();

    constructor(props) {
        super(props);

        this.state = {
            isModalVisible: false,
            appointmentPreview: null,
            appointmentPeriods: []
        }
    }

    onFormSubmit(values) {
        const finalAppointmentsList = [...this.props.appointments]

        console.log("appointments periods", this.state.appointmentPeriods);

        this.state.appointmentPeriods.forEach(appointmentPeriod => {
            finalAppointmentsList.push({
                startDate: appointmentPeriod.start,
                endDate: appointmentPeriod.end,
                title: values.name
            })
        })

        this.props.updateAppointments(finalAppointmentsList);
    }

    verifyAppointmentDisponibility([lastChange], [_, __, ___, hours, dueDate]) {
        if (lastChange.name.includes('hours') || lastChange.name.includes('dueDate')) {
            if (hours.value && dueDate.value) {
                console.log(hours.value);
                const vacatedWorkPeriods = this.getAllVacatedSpacesInPeriodUntilDueDate(
                    this.props.workStart,
                    this.props.workEnd,
                    dueDate.value,
                    this.props.appointments,
                    hours.value
                )

                const currentDistributedHours = this.getTotalHoursOfPeriods(vacatedWorkPeriods)

                if (vacatedWorkPeriods.length != 0 && currentDistributedHours >= hours.value) {
                    this.setState({
                        appointmentPreview: 'The appointment will be sucessfully distributed in the work period',
                        appointmentPeriods: vacatedWorkPeriods
                    })
                    return;
                }

                const currentlyRemainingHours = hours.value - currentDistributedHours;

                const vacatedFreePeriods = this.getAllVacatedSpacesInPeriodUntilDueDate(
                    this.props.freeStart,
                    this.props.freeEnd,
                    dueDate.value,
                    this.props.appointments,
                    currentlyRemainingHours
                )

                if (vacatedFreePeriods.length != 0 && currentDistributedHours + currentlyRemainingHours >= hours.value) {
                    this.setState({ appointmentPreview: 'The appointment will invade some of the free time to be completed' })
                    return;
                }

            }
        }
    }

    getAllVacatedSpacesInPeriodUntilDueDate(periodStart, periodEnd, dueDate, appointments, hoursNeeded = 0) {
        const allContinuousPeriods = [];
        //Start with the period
        let currentTimestamp = moment().add(1, 'day').startOf('day').set('hour', periodStart);
        let currentContinuousPeriod = {
            start: null,
            end: null,
            hours: 0
        }

        while (currentTimestamp.isBefore(dueDate)) {
            /*  Check if the periods already obtained already are enough for the appointment, so theres no 
                to continue the while loop*/
            if (hoursNeeded != 0) {
                if (currentContinuousPeriod.start && this.getTotalHoursOfPeriods([...allContinuousPeriods, currentContinuousPeriod]) >= hoursNeeded) {
                    currentContinuousPeriod.end = currentTimestamp.clone();
                    currentContinuousPeriod.hours++;

                    //Add the finished continuous period to the array.
                    allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));

                    currentContinuousPeriod = {
                        start: null,
                        end: null,
                        hours: 0
                    }

                    break;
                } else if (this.getTotalHoursOfPeriods(allContinuousPeriods) >= hoursNeeded) {
                    break;
                }
            }

            //Try to find an appointment that contains the current iterated hour.
            const appointment = appointments.find(appointment => {
                //Check if the current timestamp is between this appointment period
                if (currentTimestamp.get('day') === appointment.startDate.get('day') &&
                    currentTimestamp.get('hour') >= appointment.startDate.get('hour') &&
                    currentTimestamp.get('hour') < appointment.endDate.get('hour')) {
                    return true;
                }

                return false;
            })

            //If there's already an appointment in the current timestamp iterated, skip to the end of the appointment
            if (appointment) {
                //If there's an current period that has been stopped thanks to this appointment, save in the array.
                if (currentContinuousPeriod.start) {
                    currentContinuousPeriod.end = currentTimestamp.clone();
                    currentContinuousPeriod.hours++;

                    //Add the finished continuous period to the array.
                    allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));

                    currentContinuousPeriod = {
                        start: null,
                        end: null,
                        hours: 0
                    }
                }

                if (appointment.endDate.get('hour') + 1 >= periodEnd) {
                    currentTimestamp = currentTimestamp.add(1, 'day').set('hour', periodStart);
                } else {
                    currentTimestamp = currentTimestamp.set('hour', appointment.endDate.get('hour'));
                }
                continue;
            }

            //If the current hour is the final hour of the period, end the continuous period
            if (currentTimestamp.get('hour') >= periodEnd ||
                (currentTimestamp.get('day') === dueDate.get('day') && currentTimestamp.get('hour') === dueDate.get('hour'))) {
                console.log('currentTimestamp', Object.assign({}, currentTimestamp));
                console.log('currentContinuousPeriod', Object.assign({}, currentContinuousPeriod))
                if (currentContinuousPeriod.start) {
                    currentContinuousPeriod.end = currentTimestamp.clone();
                    currentContinuousPeriod.hours++;

                    //Add the finished continuous period to the array.
                    allContinuousPeriods.push(Object.assign({}, currentContinuousPeriod));

                    currentContinuousPeriod = {
                        start: null,
                        end: null,
                        hours: 0
                    }
                }

                currentTimestamp = currentTimestamp.add(1, 'day').set('hour', periodStart);
                continue;
            }


            //If there's no appointment, this is a free hour to add to the current continuous period
            if (currentContinuousPeriod.start) {
                currentContinuousPeriod.end = currentTimestamp.clone();
                currentContinuousPeriod.hours++;
            } else {
                currentContinuousPeriod.start = currentTimestamp.clone();
            }

            currentTimestamp = currentTimestamp.add(1, 'hour');
        }

        return allContinuousPeriods;
    }

    getTotalHoursOfPeriods(periods) {
        return periods.reduce((sum, period) => ({ hours: sum.hours + period.hours }), { hours: 0 }).hours;
    }

    mergeContinousAppointmentsInDifferentPeriods(appointments) {
        const mergedAppointment = [];
        const indexesToIgnore = [];
        appointments.forEach((appointment, index) => {
            if (indexesToIgnore.includes(index)) {
                return;
            }

            const appointmentToMergeIndex = appointments.findIndex(appointmentToCompare => appointment.end === appointmentToCompare.start);
            if (appointmentToMergeIndex != -1) {
                indexesToIgnore.push(appointmentToMergeIndex);

                appointment.end = appointments[appointmentToMergeIndex].end;
                appointment.hours = appointment.end.get('hours') - appointment.start.get('hours');
            }

            mergedAppointment.push(appointment);
        })

        return mergedAppointment;
    }

    validateDueDate(_, dueDate) {
        if (moment().isSameOrAfter(dueDate)) {
            return Promise.reject('The due date needs to be after now!')
        }

        return Promise.resolve();
    }

    render() {
        return (
            <React.Fragment>
                <Button type="primary" onClick={() => this.setState({ isModalVisible: true })}>Add Event</Button>

                <Modal title="Add Event"
                    visible={this.state.isModalVisible}
                    okText={"Submit"}
                    onCancel={() => this.setState({ isModalVisible: false })}
                    onOk={() => {
                        this.formRef.current.validateFields()
                            .then(values => {
                                this.formRef.current.resetFields();
                                this.onFormSubmit(values);
                                this.setState({ isModalVisible: false });
                            })
                            .catch(info => {
                                console.log('Validate Failed:', info);
                            });
                    }}
                >

                    <Form
                        {...layout}
                        ref={this.formRef}
                        name="eventForm"
                        initialValues={{ remember: true }}
                        onFinish={(values) => this.onFormSubmit(values)}
                        onFieldsChange={this.verifyAppointmentDisponibility.bind(this)}
                    >
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: 'The event name is required' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Description"
                            name="description"
                        >
                            <Input.TextArea />
                        </Form.Item>

                        <Form.Item
                            label="Value"
                            name="value"
                        >
                            <InputNumber
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                min={0}
                                precision={2}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Estimated Hours"
                            name="hours"
                            rules={[{ required: true, message: 'The ETA is required to allow the scheduler to distribute time' }]}
                        >
                            <InputNumber
                                min={0} />
                        </Form.Item>

                        <Form.Item
                            label="Due Date"
                            name="dueDate"
                            rules={[{ required: true, message: 'The dude date is required' }, { validator: this.validateDueDate }]}
                        >
                            <DatePicker format={'DD/MM/YYYY HH:00'} showTime />
                        </Form.Item >


                        <span className="message">{this.state.appointmentPreview}</span>
                    </Form>

                </Modal>
            </React.Fragment>
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

const mapDispatchToProps = dispatch => {
    return {
        updateAppointments: (payload) => dispatch(updateAppointments(payload))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(AppointmentForm);