import { Input, Form, Modal, InputNumber, DatePicker, Button } from 'antd';
import React from 'react';

import './AppointmentForm.styles.scss';

export class AppointmentForm extends React.Component {
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
                        ref={this.formRef}
                        name="eventForm"
                        initialValues={{ remember: true }}
                        onFinish={(values) => this.onFormSubmit(values)}
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
                                defaultValue={0.00}
                                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Estimated Hours"
                            name="hours"
                        >
                            <InputNumber
                                defaultValue={0}
                                rules={[{ required: true, message: 'The event name is required' }]}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Due Date"
                            name="dueDate"
                        >
                            <DatePicker showTime rules={[
                                {
                                    validator: (rule, value, callback) => {
                                        value.length < 3 ? callback("too short") : callback();
                                    }
                                }
                            ]} />
                        </Form.Item >
                    </Form>

                </Modal>
            </React.Fragment>
        )
    }
}