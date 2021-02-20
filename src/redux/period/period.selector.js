import { createSelector } from 'reselect';

import * as PeriodType from '../../utils/PeriodType';

// const getPeriod = (state, props) => {
//     console.log(props);
//     switch (props.periodType) {
//         case PeriodType.FREE_PERIOD:
//             return 'Free';
//         case PeriodType.WORK_PERIOD:
//             return 'Work';
//         case PeriodType.SLEEP_PERIOD:
//             return 'Sleep'
//     }
// };
// const getWorkStart = state => state.workStart;
// const getWorkEnd = state => state.workEnd;

// export const selectWorkStart = createSelector(
//     [getPeriod],
//     (period) => period.workStart
// );

// export const selectWorkEnd = createSelector(
//     [getPeriod],
//     (period) => period.workEnd
// );