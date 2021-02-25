import { createStore } from 'redux';

import { persistStore } from 'redux-persist';
import rootReducer from './root_reducer';
import logger from 'redux-logger'
import { applyMiddleware } from '@reduxjs/toolkit';

const middlewares = []

if (process.env.NODE_ENV === 'development') {
    //Set Development only middlewares
    middlewares.push(logger)
}

export const store = createStore(rootReducer, applyMiddleware(...middlewares));

export const persistor = persistStore(store);