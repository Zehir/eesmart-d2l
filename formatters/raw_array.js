const date = require('../libs/date')

module.exports = function (data) {

    // Convert horloge
    if (data._HORLOGE !== undefined) {
        data._HORLOGE = date.clockToDate(parseInt(data._HORLOGE, 10))
    }

    return data;
}
