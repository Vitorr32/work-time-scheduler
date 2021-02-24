import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import appointmentReducer from './appointment/appointment.reducer';

import periodReducer from './period/period.reducer';

const persistConfig = {
    key: 'root',
    storage
};

const rootReducer = combineReducers({
    period: periodReducer,
    appointment: appointmentReducer
});

export default persistReducer(persistConfig, rootReducer);