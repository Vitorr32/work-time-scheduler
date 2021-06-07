import { Input, Form, Modal, InputNumber, DatePicker, Button, Checkbox, Tooltip, Select, TimePicker } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
import { addAppointment, addJob } from '../../redux/appointment/appointment.actions';
import moment from 'moment';

import './AppointmentForm.styles.scss';
import { JOB_IS_RECURRENT_EVENT, JOB_NOT_STARTED, SCHEDULE_FREE_TIME, SCHEDULE_FULL, SCHEDULE_WORK_ONLY } from '../../utils/constants';
import { CoffeeOutlined, FieldTimeOutlined, HourglassOutlined } from '@ant-design/icons';
import { createPeriodObject, getAllVacatedSpacesInPeriodUntilDueDate, getTotalHoursOfPeriods, mergeContinousAppointmentsInDifferentPeriods, verifyAppointmentDisponibility } from '../../utils/periods';

const { RangePicker } = TimePicker;

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
            isRecurrentEvent: false,
            appointmentPreview: null,
            appointmentPeriods: [],
            appointmentSuccessful: false,
            showTimeToDueDateInputField: false,
            showSpecificDateInput: false,
        }
    }

    resetFormState() {
        this.setState({
            isModalVisible: false,
            isFutherActionModalVisible: false,
            isRecurrentEvent: false,
            appointmentPreview: null,
            appointmentPeriods: [],
            appointmentSuccessful: false,
            showTimeToDueDateInputField: false,
            showSpecificDateInput: false,
        })
    }

    onFormSubmit(values) {
        const newJobId = moment().format('x');

        if (values.recurrentEvent) {
            this.onCreateRecurrentAppointment(newJobId, values);
        } else {
            this.onCreateJob(newJobId, values);
        }

        this.resetFormState();
        this.formRef.current.resetFields();
    }

    onCreateRecurrentAppointment(newJobId, { description, name, recurrentEndDate, recurrentPeriod, recurrentTimeFrame, weekDay: weeksDay, recurrentEventTime }) {
        const startHour = recurrentEventTime[0].get('hour');
        const endHour = recurrentEventTime[1].get('hour');
        const endDate = recurrentTimeFrame === 'date'
            ? recurrentEndDate
            : moment().startOf('day').add(recurrentPeriod, recurrentTimeFrame).set('hour', endHour)
        const appointmentsToCreate = this.createAppointmentsOfRecurrentJob(startHour, endHour, endDate, weeksDay)

        const newJob = {
            id: newJobId,
            name: name,
            appointments: appointmentsToCreate.map(appointment => appointment.id),
            description: description,
            dueDate: endDate,
            state: JOB_IS_RECURRENT_EVENT,
            recurrentEvent: true
        }

        // this.props.addJob(newJob);
        // this.props.addAppointments(appointmentsToCreate);
    }

    onCreateJob(newJobId, values) {
        const appointmentsToCreate = this.state.appointmentPeriods.map((period) => createPeriodObject(period, newJobId))

        const newJob = {
            id: newJobId,
            name: values.name,
            appointments: appointmentsToCreate.map(appointment => appointment.id),
            price: values.price,
            description: values.description,
            dueDate: values.dueDate
                ? values.dueDate.startOf('hour')
                : values.period && values.timeFrame
                    ? moment().add(values.period, values.timeFrame).startOf('hour')
                    : null,
            totalHours: values.hours,
            state: JOB_NOT_STARTED,
            recurrentEvent: false
        }

        this.props.addJob(newJob);
        this.props.addAppointments(appointmentsToCreate);
    }

    createAppointmentsOfRecurrentJob(startHour, endHour, finalDate, weekDays) {
        const iteratedDay = moment().startOf('day');
        const createdAppointments = [];

        while (iteratedDay.isSameOrBefore(finalDate)) {
            if (weekDays.includes(iteratedDay.isoWeekday())) {
                console.log("Is week of the day", iteratedDay.isoWeekday());
            }

            createdAppointments.push({
                start: iteratedDay.clone().set('hour', startHour),
                end: iteratedDay.clone().set('hour', endHour),
                hours: endHour - startHour
            })

            iteratedDay.add('day', 1);
        }

        return createdAppointments;
    }

    previewPeriods([lastChange], values) {
        const recurrentEvent = values.find(inputData => inputData.name.includes('recurrentEvent'));
        //No need to set the appointments preview to an recurrent event
        if (recurrentEvent.value) {
            return;
        }

        const hours = values.find(inputData => inputData.name.includes('hours'));
        const continuousPeriod = values.find(inputData => inputData.name.includes('continuousPeriod'));
        const dueDate = values.find(inputData => inputData.name.includes('dueDate'));
        const timeFrame = values.find(inputData => inputData.name.includes('timeFrame'));
        const period = values.find(inputData => inputData.name.includes('period'));

        const { appointments, workStart, workEnd, freeStart, freeEnd } = this.props;
        if (lastChange.name.includes('hours') || lastChange.name.includes('dueDate') || lastChange.name.includes('timeFrame') || lastChange.name.includes('period')) {

            const targetDate = this.configureTargetDate(dueDate, timeFrame, period);

            if (hours.value && targetDate) {
                const verifiedDisponibility = verifyAppointmentDisponibility(hours.value, targetDate, appointments, [workStart, workEnd], [freeStart, freeEnd], null, continuousPeriod.value);

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

    configureTargetDate(dueDate, period, timeFrame) {
        return dueDate && dueDate.value
            ? dueDate.value.startOf('hour')
            : period && period.value && timeFrame && timeFrame.value
                ? moment().add(period.value, timeFrame.value).startOf('hour')
                : null;
    }

    onFutherActionSet(shouldDelay) {
        const { appointments, workStart, workEnd, freeStart, freeEnd } = this.props;
        const { dueDate, hours, continuousPeriod } = this.formRef.current.getFieldsValue();

        const extraAppointments = getAllVacatedSpacesInPeriodUntilDueDate(
            shouldDelay ? Math.min(workStart, freeStart) : Math.max(workEnd, freeEnd),
            shouldDelay ? Math.max(workEnd, freeEnd) : Math.min(workStart, freeStart),
            shouldDelay ? dueDate.set('year', 9999).startOf('hour') : dueDate.startOf('hour'),
            [...appointments, ...this.state.appointmentPeriods],
            hours - getTotalHoursOfPeriods(this.state.appointmentPeriods),
            shouldDelay ? dueDate.startOf('hour') : moment().startOf('day').set('hour', Math.max(workEnd, freeEnd)),
            continuousPeriod
        )

        const finalAppointments = mergeContinousAppointmentsInDifferentPeriods([...extraAppointments, ...this.state.appointmentPeriods]);

        this.setState({
            appointmentPeriods: finalAppointments,
            appointmentSuccessful: true,
            appointmentPreview: '',
            isModalVisible: false,
            isFutherActionModalVisible: false
        }, () => this.onFormSubmit(this.formRef.current.getFieldsValue()))
    }

    allowFormToBeSubmitted() {
        const { workStart, workEnd, freeStart, freeEnd } = this.props;
        if (workStart && workEnd && freeStart && freeEnd) {
            return true;
        }

        return false;
    }

    validateDueDate(_, dueDate) {
        if (moment().isSameOrAfter(dueDate)) {
            return Promise.reject('The due date needs to be after now!')
        }

        return Promise.resolve();
    }

    render() {
        const enabledForm = this.allowFormToBeSubmitted();

        console.log(this.formRef);

        return (
            <React.Fragment>
                <Button type="primary" onClick={() => this.setState({ isModalVisible: true })}>Add Event</Button>

                <Modal title="Add Event"
                    visible={this.state.isModalVisible}
                    okText={"Submit"}
                    onCancel={this.resetFormState.bind(this)}
                    onOk={() => {
                        this.formRef.current.validateFields()
                            .then(values => {
                                if (this.state.appointmentSuccessful || this.state.isRecurrentEvent) {
                                    this.onFormSubmit(values);
                                } else {
                                    this.setState({ isFutherActionModalVisible: true })
                                }
                            })
                            .catch(info => {
                                console.log('Validate Failed:', info);
                            });
                    }}
                    okButtonProps={{ disabled: !enabledForm }}
                >

                    <Form
                        {...layout}
                        ref={this.formRef}
                        name="eventForm"
                        initialValues={{ continuousPeriod: true }}
                        onFinish={(values) => this.onFormSubmit(values)}
                        onFieldsChange={this.previewPeriods.bind(this)}

                    >
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{ required: true, message: 'The event name is required' }]}
                        >
                            <Input disabled={!enabledForm} />
                        </Form.Item>

                        <Form.Item
                            label="Recurrent Event"
                            name="recurrentEvent"
                            valuePropName='checked'
                        >
                            <Checkbox disabled={!enabledForm} onChange={(event) => this.setState({ isRecurrentEvent: event.target.checked })}></Checkbox>
                        </Form.Item>

                        <Form.Item
                            label="Description"
                            name="description"
                        >
                            <Input.TextArea disabled={!enabledForm} />
                        </Form.Item>

                        {
                            this.state.isRecurrentEvent
                                ?
                                <React.Fragment>
                                    <Form.Item
                                        label="Time"
                                        name="recurrentEventTime"
                                        rules={[{ required: true, message: 'The recurrent event time range is required!' }]}
                                    >
                                        <RangePicker format={"HH:00"} />
                                    </Form.Item>

                                    <Form.Item
                                        label="Week Days"
                                        name="weekDay"
                                        rules={[{ required: true, message: 'At least one day must be selected for the event to happen!' }]}>
                                        <Checkbox.Group
                                            options={[
                                                { label: 'Monday', value: 1 },
                                                { label: 'Tuesday', value: 2 },
                                                { label: 'Wednesday', value: 3 },
                                                { label: 'Thursday', value: 4 },
                                                { label: 'Friday', value: 5 },
                                                { label: 'Saturday', value: 6 },
                                                { label: 'Sunday', value: 7 }
                                            ]}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Recurrency Frequency">
                                        <Input.Group compact>
                                            {
                                                this.state.showSpecificDateInput
                                                    ?
                                                    <Form.Item
                                                        name={'recurrentEndDate'}
                                                        noStyle
                                                        rules={[{ required: true, message: 'The period value is required' }]}
                                                    >
                                                        <DatePicker disabled={!enabledForm} style={{ width: '50%' }} format={'DD/MM/YYYY HH:00'} showTime />
                                                    </Form.Item>
                                                    :
                                                    <Form.Item
                                                        name={'recurrentPeriod'}
                                                        noStyle
                                                        rules={[{ required: true, message: 'The period value is required' }]}
                                                    >
                                                        <InputNumber disabled={!enabledForm} style={{ width: '50%' }} placeholder="Period value" />
                                                    </Form.Item>
                                            }
                                            <Form.Item
                                                name={'recurrentTimeFrame'}
                                                noStyle
                                                rules={[{ required: true, message: 'Please select the time frame to be used' }]}
                                            >
                                                <Select
                                                    style={{ width: '50%' }}
                                                    disabled={!enabledForm}
                                                    placeholder="Time frame"
                                                    onChange={(value) => this.setState({ showSpecificDateInput: value === 'date' })}>
                                                    <Select.Option value="day">Week(s)</Select.Option>
                                                    <Select.Option value="month">Month(s)</Select.Option>
                                                    <Select.Option value="quarter">Quarter(s)</Select.Option>
                                                    <Select.Option value="semester">Semester(s)</Select.Option>
                                                    <Select.Option value="year">Year(s)</Select.Option>
                                                    <Select.Option value="date">Specifc Date</Select.Option>
                                                </Select>
                                            </Form.Item>
                                        </Input.Group>
                                    </Form.Item>

                                    <span className="message">
                                        The recurrent events will ignore jobs appointments when setting the event, so there may be some overlaps to be fixed manually
                                    </span>

                                </React.Fragment>
                                :
                                <React.Fragment>
                                    <Form.Item
                                        label="Price"
                                        name="price"
                                    >
                                        <InputNumber
                                            formatter={price => `$ ${price}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={price => price.replace(/\$\s?|(,*)/g, '')}
                                            min={0}
                                            precision={2}
                                            disabled={!enabledForm}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Estimated Hours"
                                        name="hours"
                                        rules={[{ required: true, message: 'The ETA is required to allow the scheduler to distribute time' }]}
                                    >
                                        <InputNumber
                                            disabled={!enabledForm}
                                            min={0} />
                                    </Form.Item>

                                    <div className="due-date-wrapper">
                                        {
                                            !this.state.showTimeToDueDateInputField
                                                ?
                                                <Form.Item
                                                    label="Due Date"
                                                    name="dueDate"
                                                    rules={[{ required: true, message: 'The dude date is required' }, { validator: this.validateDueDate }]}
                                                >
                                                    <DatePicker disabled={!enabledForm} format={'DD/MM/YYYY HH:00'} showTime />
                                                </Form.Item >
                                                :
                                                <Form.Item
                                                    label="Time to Due Date"
                                                >
                                                    <Input.Group compact>
                                                        <Form.Item
                                                            name={['timeFrame']}
                                                            noStyle
                                                            rules={[{ required: true, message: 'Please select the time frame to be used' }]}
                                                        >
                                                            <Select placeholder="Time frame">
                                                                <Select.Option value="hour">Hour(s)</Select.Option>
                                                                <Select.Option value="day">Day(s)</Select.Option>
                                                            </Select>
                                                        </Form.Item>
                                                        <Form.Item
                                                            name={['period']}
                                                            noStyle
                                                            rules={[{ required: true, message: 'The period value is required' }]}
                                                        >
                                                            <InputNumber style={{ width: '50%' }} placeholder="Period hours/days" />
                                                        </Form.Item>
                                                    </Input.Group>
                                                </Form.Item >
                                        }

                                        <Tooltip title="Change to the 'Time to due Date' input that allows you to insert the time to the due date instead of the specific date">
                                            <HourglassOutlined
                                                className="due-date-toogle"
                                                style={{ right: this.state.showTimeToDueDateInputField ? '20px' : '80px' }}
                                                onClick={() => this.setState({ showTimeToDueDateInputField: !this.state.showTimeToDueDateInputField })} />
                                        </Tooltip>
                                    </div>


                                    <Form.Item
                                        label="Continuous Priority"
                                        valuePropName='checked'
                                        name="continuousPeriod">
                                        <Tooltip title="Whether the Scheduler should focus on finding continuous periods or just distribute the event in the open periods avaliable">
                                            <Checkbox disabled={!enabledForm}></Checkbox>
                                        </Tooltip>
                                    </Form.Item>
                                </React.Fragment>
                        }

                        <span className="message">{this.state.appointmentPreview}</span>
                        {
                            !enabledForm ?
                                <span className="message">
                                    Please set the work and free period before attemping to add events to your schedule
                                </span> : null
                        }

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