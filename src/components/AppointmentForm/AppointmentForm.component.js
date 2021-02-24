import { Input, Form, Modal, InputNumber, DatePicker, Button } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
import { addAppointment, addJob } from '../../redux/appointment/appointment.actions';
import moment from 'moment';

import './AppointmentForm.styles.scss';
import { APPOINTMENT_STATE_NOT_STARTED, SCHEDULE_FREE_TIME, SCHEDULE_FULL, SCHEDULE_WORK_ONLY } from '../../utils/constants';
import { CoffeeOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { getAllVacatedSpacesInPeriodUntilDueDate, getTotalHoursOfPeriods, mergeContinousAppointmentsInDifferentPeriods, verifyAppointmentDisponibility } from '../../utils/periods';
import { Tooltip } from '@material-ui/core';

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
            isFutherActionModalVisible: false,
            appointmentPreview: null,
            appointmentPeriods: [],
            appointmentSuccessful: false
        }
    }

    onFormSubmit(values) {
        const newJobId = this.props.jobs.length;

        const appointmentsToCreate = this.state.appointmentPeriods.map((period, index) => ({
            startDate: period.start,
            endDate: period.end,
            title: values.name,
            price: values.price,
            description: values.description,
            state: APPOINTMENT_STATE_NOT_STARTED,
            hours: period.hours,
            id: 'job_' + newJobId + 'app_' + index,
            jobId: newJobId
        }))

        const newJob = {
            id: newJobId,
            name: values.name,
            appointments: appointmentsToCreate,
            price: values.price,
            description: values.description,
            dueDate: values.dueDate,
            totalHours: values.hours
        }


        this.props.addJob(newJob);
        this.props.addAppointments(appointmentsToCreate);
    }

    previewPeriods([lastChange], [_, __, ___, hours, dueDate]) {
        const { appointments, workStart, workEnd, freeStart, freeEnd } = this.props;
        if (lastChange.name.includes('hours') || lastChange.name.includes('dueDate')) {
            if (hours.value && dueDate.value) {
                const verifiedDisponibility = verifyAppointmentDisponibility(hours.value, dueDate.value, appointments, [workStart, workEnd], [freeStart, freeEnd]);

                if (!verifiedDisponibility) {
                    console.error("Error on saving the periods")
                    return;
                }

                switch (verifiedDisponibility.state) {
                    case SCHEDULE_WORK_ONLY:
                        this.setState({
                            appointmentPreview: 'The job can be sucessfully distributed in the work period',
                            appointmentPeriods: verifiedDisponibility.periods,
                            appointmentSuccessful: true
                        })
                        break;
                    case SCHEDULE_FREE_TIME:
                        this.setState({
                            appointmentPreview: 'The job will invade some of your free time period',
                            appointmentPeriods: verifiedDisponibility.periods,
                            appointmentSuccessful: true
                        })
                        break;
                    case SCHEDULE_FULL:
                        this.setState({
                            appointmentPreview: 'The job could not be distributed into your work/free time, further action will be required on submit',
                            appointmentPeriods: verifiedDisponibility.periods,
                            appointmentSuccessful: false
                        })
                        break;
                }
            } else {
                this.setState({
                    appointmentPreview: '',
                    appointmentPeriods: []
                })
            }
        }
    }

    onFutherActionSet(shouldDelay) {
        const { appointments, workStart, workEnd, freeStart, freeEnd } = this.props;
        const { dueDate, hours } = this.formRef.current.getFieldsValue();

        const extraAppointments = getAllVacatedSpacesInPeriodUntilDueDate(
            shouldDelay ? Math.min(workStart, freeStart) : Math.max(workEnd, freeEnd),
            shouldDelay ? Math.max(workEnd, freeEnd) : Math.min(workStart, freeStart),
            shouldDelay ? dueDate.set('year', 9999) : dueDate,
            [...appointments, ...this.state.appointmentPeriods],
            hours - getTotalHoursOfPeriods(this.state.appointmentPeriods),
            shouldDelay ? dueDate : moment().startOf('day').set('hour', Math.max(workEnd, freeEnd))
        )

        const finalAppointments = mergeContinousAppointmentsInDifferentPeriods(extraAppointments, this.state.appointmentPeriods);

        this.setState({
            appointmentPeriods: finalAppointments,
            appointmentSuccessful: true,
            appointmentPreview: '',
            isModalVisible: false,
            isFutherActionModalVisible: false
        }, () => this.onFormSubmit(this.formRef.current.getFieldsValue()))
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
                                if (this.state.appointmentSuccessful) {
                                    this.onFormSubmit(values);
                                    this.setState({ isModalVisible: false });
                                } else {
                                    this.setState({ isFutherActionModalVisible: true })
                                }
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
                        onFieldsChange={this.previewPeriods.bind(this)}
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
                            label="Price"
                            name="price"
                        >
                            <InputNumber
                                formatter={price => `$ ${price}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={price => price.replace(/\$\s?|(,*)/g, '')}
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

                <Modal
                    visible={this.state.isFutherActionModalVisible}
                    footer={[
                        <Tooltip key="delay" title="Delay">
                            <Button type="primary" onClick={() => this.onFutherActionSet(true)} icon={<FieldTimeOutlined />}></Button>
                        </Tooltip>,
                        <Tooltip key="overwrite_sleep" title="Overwrite Sleep">
                            <Button type="primary" onClick={() => this.onFutherActionSet(false)} icon={<CoffeeOutlined />}></Button>
                        </Tooltip>,
                        <Button key="back" onClick={() => this.setState({ isFutherActionModalVisible: false })}>
                            Cancel
                        </Button>
                    ]}>
                    <p>The appointment submitted can't be concluded during your work and free period, what should the scheduler do to allow for this job to be scheduled?</p>
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
    appointments: state.appointment.appointments,
    jobs: state.appointment.jobs
})

const mapDispatchToProps = dispatch => {
    return {
        addAppointments: (payload) => dispatch(addAppointment(payload)),
        addJob: (payload) => dispatch(addJob(payload))
    }
}


export default connect(mapStateToProps, mapDispatchToProps)(AppointmentForm);