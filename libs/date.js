module.exports = {dateToClock, clockToDate, horodateToDate, getHorodateValue};

function dateToClock(date) {
    let now = date - Date.UTC(2016, 0); // eeSmart timestamp origin is not 1/1/1970 it's 1/1/2016
    return Math.round(now / 1000);
}


function clockToDate(clock) {
    return new Date(Date.UTC(2016, 0) + clock * 1000);
}

function horodateToDate(horodate) {
    let data = {}

    // Ajout des zero si la date ne comprend pas de minutes ni secondes
    horodate = horodate.padEnd(13, '0')

    let date = Date.UTC(
        parseInt("20" + horodate.substring(1, 3)),
        parseInt(horodate.substring(3, 5)) - 1,
        parseInt(horodate.substring(5, 7)),
        parseInt(horodate.substring(7, 9)),
        parseInt(horodate.substring(9, 11)),
        parseInt(horodate.substring(11, 13)),
    );

    // Ajustement selon la saison, UTC +2 en été et +1 en hiver
    let saison = horodate.substring(0, 1);
    switch (saison.toUpperCase()) {
        case "E":
            data.date = new Date(date - 2 * 60 * 60 * 1000)
            break;
        case "H":
            data.date = new Date(date - 60 * 60 * 1000)
            break;
    }

    // Si la saison est en miniscule l'heure est dégradée (imprécise)
    data.date_degrade = saison === saison.toLowerCase();

    return data;
}


function getHorodateValue(value, transformFunction, ...theArgs) {
    if (value === undefined || value === "|") {
        return undefined;
    }

    const parts = value.split('|');
    let data = horodateToDate(parts[0])
    data.valeur = parts[1]

    if (typeof transformFunction === "function") {
        data.valeur = transformFunction(data.valeur, ...theArgs)
    }

    return data;

}



