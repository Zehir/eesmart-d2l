module.exports = {injector, extractor, pathExist}

function injector(data, path, value, parserMethod, ...parserArgs) {
    if (value === undefined || value.length === 0) {
        return;
    }

    let result = parserMethod === undefined ? value : parserMethod(value, ...parserArgs);

    if (result === undefined || parserMethod === parseInt && isNaN(result)) {
        return;
    }

    (function addProps(obj, arr, val) {
        if (typeof arr == 'string')
            arr = arr.split(".");
        obj[arr[0]] = obj[arr[0]] || {};
        let tmpObj = obj[arr[0]];
        if (arr.length > 1) {
            arr.shift();
            addProps(tmpObj, arr, val);
        } else
            obj[arr[0]] = val;
        return obj;
    })(data, path, result);
}


function extractor(data, path) {
    function getNested(obj, level, ...rest) {
        if (obj === undefined) return false
        if (rest.length === 0 && obj.hasOwnProperty(level)) return obj[level]
        return getNested(obj[level], ...rest)
    }

    return getNested(data, ...(path.split(".")));
}

function pathExist(data, path) {
    function checkNested(obj, level, ...rest) {
        if (obj === undefined) return false
        if (rest.length === 0 && obj.hasOwnProperty(level)) return true
        return checkNested(obj[level], ...rest)
    }

    return checkNested(data, ...(path.split(".")));
}