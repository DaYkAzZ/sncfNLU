exports.randomHours = function () {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}:${minutes}`;
}
exports.randomSeats = function () {
    return Math.floor(Math.random() * 2000);
}

exports.randomTrainNumber = function () {
    return Math.floor(Math.random() * 9999);
}

exports.randomDeparture = function () {
    // -----   
}

exports.randomArrival = function () {
    // -----   
}