import { Button, Form, Modal, TimePicker } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
import { setFreePeriod, setSleepPeriod, setWorkPeriod } from '../../redux/period/period.actions';
import { KeyboardTimePicker } from '@material-ui/pickers';
import * as PeriodType from '../../utils/PeriodType';

import './PeriodSetter.styles.scss';

const { RangePicker } = TimePicker;

class PeriodSetter extends React.Component {
    formRef = React.createRef();

    constructor(props) {
        super(props);

        this.state = {
            isModalVisible: false
        }
    }

    onFormSubmit(values) {
        console.log(values);
        switch (this.props.periodType) {
            case PeriodType.WORK_PERIOD:
                this.props.setWorkPeriod({ start: values.periodRange[0], end: values.periodRange[1] })
                break;
            case PeriodType.FREE_PERIOD:
                this.props.setFreePeriod({ start: values.periodRange[0], end: values.periodRange[1] })
                break;
            case PeriodType.SLEEP_PERIOD:
                break;

            default:
                break;
        }
    }

    getPeriodLabel(periodType) {
        switch (periodType) {
            case PeriodType.FREE_PERIOD:
                return 'Free';
            case PeriodType.WORK_PERIOD:
                return 'Work';
            case PeriodType.SLEEP_PERIOD:
                return 'Sleep'
        }
    }

    render() {
        return (
            <div>
                <Button onClick={() => this.setState({ isModalVisible: true })}>{this.getPeriodLabel(this.props.periodType)} Period</Button>

                <Modal
                    title={`${this.getPeriodLabel(this.props.periodType)} Period`}
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
                        name="periodForm"
                        initialValues={{ periodRange: [this.props.start, this.props.end], remember: true }}
                        onFinish={(values) => this.onFormSubmit(values)}
                    >
                        <Form.Item
                            name="periodRange"
                            rules={[{ required: true, message: 'The range of the period is required!' }]}
                        >
                            <RangePicker format={"HH:mm"} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    switch (ownProps.periodType) {
        case PeriodType.WORK_PERIOD:
            return {
                start: state.period.workStart,
                end: state.period.workEnd
            }
        case PeriodType.FREE_PERIOD:
            return {
                start: state.period.freeStart,
                end: state.period.freeEnd
            }
        case PeriodType.SLEEP_PERIOD:
            return {
                start: state.period.sleepStart,
                end: state.period.sleepEnd
            }
        default:
            break;
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setWorkPeriod: (payload) => dispatch(setWorkPeriod(payload)),
        setFreePeriod: (payload) => dispatch(setFreePeriod(payload)),
        setSleepPeriod: (payload) => dispatch(setSleepPeriod(payload))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PeriodSetter);