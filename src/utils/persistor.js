import moment from 'moment';

const replacer = (_, value) => value instanceof moment ? value.toISOString() : value

const reviver = (_, value) =>
    (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/))
        ? moment(value)
        : value

export const encode = toDeshydrate => JSON.stringify(toDeshydrate, replacer)

export const decode = toRehydrate => JSON.parse(toRehydrate, reviver)