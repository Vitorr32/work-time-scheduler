import { Button, Form, Modal, TimePicker } from 'antd';
import React from 'react';
import { connect } from 'react-redux';
import { setFreePeriod, setWorkPeriod } from '../../redux/period/period.actions';
import { KeyboardTimePicker } from '@material-ui/pickers';
import * as PeriodType from '../../utils/PeriodType';
import moment from 'moment';

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
        switch (this.props.periodType) {
            case PeriodType.WORK_PERIOD:
                this.props.setWorkPeriod({ start: values.periodRange[0].get('hours'), end: values.periodRange[1].get('hours') })
                break;
            case PeriodType.FREE_PERIOD:
                this.props.setFreePeriod({ start: values.periodRange[0].get('hours'), end: values.periodRange[1].get('hours') })
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
                        initialValues={{
                            periodRange: [
                                moment().startOf('day').set('hours', this.props.start),
                                moment().startOf('day').set('hours', this.props.end)
                            ],
                            remember: true
                        }}
                        onFinish={(values) => this.onFormSubmit(values)}
                    >
                        <Form.Item
                            name="periodRange"
                            rules={[{ required: true, message: 'The range of the period is required!' }]}
                        >
                            <RangePicker format={"HH"} />
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
                start: new Number(state.period.workStart),
                end: new Number(state.period.workEnd)
            }
        case PeriodType.FREE_PERIOD:
            return {
                start: state.period.freeStart,
                end: state.period.freeEnd
            }
        default:
            return {

            }
    }
}

const mapDispatchToProps = dispatch => {
    return {
        setWorkPeriod: (payload) => dispatch(setWorkPeriod(payload)),
        setFreePeriod: (payload) => dispatch(setFreePeriod(payload))
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PeriodSetter);