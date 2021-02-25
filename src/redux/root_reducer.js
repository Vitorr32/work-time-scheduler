import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import appointmentReducer from './appointment/appointment.reducer';
import createTransform from 'redux-persist/es/createTransform';
import { decode, encode } from '../utils/persistor';

import periodReducer from './period/period.reducer';

const persistConfig = {
    key: 'root',
    storage,
    transforms: [createTransform(encode, decode)]
};

const rootReducer = combineReducers({
    period: periodReducer,
    appointment: appointmentReducer
});

export default persistReducer(persistConfig, rootReducer);