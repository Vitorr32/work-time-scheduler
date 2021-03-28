import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import createTransform from 'redux-persist/es/createTransform';
import { decode, encode } from '../utils/persistor';

import appointmentReducer from './appointment/appointment.reducer';
import periodReducer from './period/period.reducer';
import configurationReducer from './global-configuration/configuration.reducer';

const persistConfig = {
    key: 'root',
    storage,
    transforms: [createTransform(encode, decode)]
};

const rootReducer = combineReducers({
    period: periodReducer,
    appointment: appointmentReducer,
    config: configurationReducer
});

export default persistReducer(persistConfig, rootReducer);