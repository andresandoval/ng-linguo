const utils = {

    isNullOrUndefined: (any) => {
        return any === undefined || any === null;
    },

    isNullOrEmpty: (string) => {
        if (utils.isNullOrUndefined(string)) {
            return true;
        }
        return string.toString().trim().length <= 0;
    },
    trimToNull: (string) => {
        if (utils.isNullOrEmpty(string)) {
            return null;
        }
        return string.toString().trim();
    }
};


module.exports = utils;