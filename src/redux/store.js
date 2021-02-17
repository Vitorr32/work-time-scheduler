import { createStore } from 'redux';

import { persistStore } from 'redux-persist';
import rootReducer from './root_reducer';

if (process.env.NODE_ENV === 'development') {
    //Set Development only middlewares
}

export const store = createStore(rootReducer);

export const persistor = persistStore(store);