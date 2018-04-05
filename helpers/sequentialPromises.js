/**
 * Runs Promises from the input array in a chained manner.
 * This code was taken from: 
 * https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
 * and modified to return all Promise results instead of just the last one.
 *
 * @param {array} promiseArray - Array of Promises
 * @return {Promise} Promise of Array with resolved Promises
 */
module.exports = function (promiseArray) {
    let array = []
    return promiseArray.reduce((promiseChain, currentPromise) => {
        return promiseChain.then(() => {
            return currentPromise()
                .then((res) => {
                    array.push(res)
                    return res
                })
                .catch(error => {throw new Error(error)})
        })
    }, Promise.resolve())
        .then(() => { return array })
}