import { Input, Form, Modal, InputNumber, DatePicker, Button } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
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
            isModalVisible: false
        }
    }

    onFormSubmit(values) {
        console.log(values);
    }

    verifyAppointmentDisponibility(values, yolo) {
        console.log("SWAGGG", values);
        console.log('yolo', yolo);

    }

    validateDueDate(_, dueDate, callback) {
        if (moment().isSameOrAfter(dueDate)) {
            callback('The due date needs to be after now!');
            return;
        }

        callback();
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
                        onFieldsChange={this.verifyAppointmentDisponibility}
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
                                formatter={value => `${value} ${value ? value > 1 ? 'Hours' : 'Hour' : ''}`}
                                parser={value => value.replace('Hours', '')}
                                min={0} />
                        </Form.Item>

                        <Form.Item
                            label="Due Date"
                            name="dueDate"
                            rules={[{ required: true, message: 'The dude date is required' }, { validator: this.validateDueDate }]}
                        >
                            <DatePicker format={'DD/MM/YYYY HH:00'} showTime />
                        </Form.Item >
                    </Form>

                </Modal>
            </React.Fragment>
        )
    }
}

const mapStateToProps = (state) => ({
    appointments: state.appointment.appointments
})

export default connect(mapStateToProps)(AppointmentForm);