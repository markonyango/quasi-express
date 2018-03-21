const fs = require('fs-extra')
const path = require('path')

function QAReport(projectDocument) {
    this.files = projectDocument.files
    this.savePath = projectDocument.savePath
    this.maxLength = 0

    this.lengthDistribution = null
    this.phredDistribution = null
    this.baseDistribution = null
}

QAReport.prototype.generateReport = function () {
    // maxLength is being calculated in readLengthDistribution only
    // so run this first
    this.lengthDistribution = this.readLengthDistribution()
    this.baseDistribution = this.readBaseDistribution()
    this.phredDistribution = this.readPhredDistribution()

    return {
        lengthDistribution: this.lengthDistribution,
        baseDistribution: this.baseDistribution,
        phredDistribution: this.phredDistribution
    }
}

QAReport.prototype.readLengthDistribution = function () {

    return this.files.map(file => {
        let buff = this.readResultFile(file, '-length_dist.txt')
        let data = buff.trim().split(' ').map(Number)
        let label = path.basename(file)
        this.maxLength < data.length ? this.maxLength = data.length : null

        return {
            label,
            data,
            borderWidth: 1,
            backgroundColor: backgroundColor()
        }
    })
}

QAReport.prototype.readPhredDistribution = function () {

    return this.files.map(file => {
        let buff = this.readResultFile(file, '-phred_dist.txt')
        let data = buff.trim().split(' ').map(Number)
            data = toMatrix(data, 4) // Turn it into a (readLength x 4) matrix
            data = transpose(data) // Transpose so each row resembles qualities per A,T,G,C respectively

        let label = path.basename(file)

        return {
            label,
            data,
            borderWidth: 1,
            backgroundColor: backgroundColor()
        }
    })
}

QAReport.prototype.readBaseDistribution = function () {
    return this.files.map(file => {
        let buff = this.readResultFile(file, '-base_dist.txt')
        // Turn this into a 2d array with 6 rows, representing A, T, G, C, N, GC frequencies respectively
        // Each row has max_read_length entries
        let data = buff.trim().split('\n').map(row => row.trim().split('\t').map(Number))
            data = transpose(data)

        let [A, T, G, C, N, GC] = data
        data = { A, T, G, C, N, GC }

        let label = path.basename(file)

        return {
            label,
            data,
            borderWidth: 1,
            backgroundColor: backgroundColor()
        }
    })
}

QAReport.prototype.readResultFile = function (file, pattern) {
    let filename = path.join(this.savePath, `${file}${pattern}`)
    return fs.readFileSync(filename, 'utf-8')
}

/**
 * Draw random numbers from the interval set by [min,max]
 * @param {number} min Low end of the interval from which to draw random numbers
 * @param {number} max High end of the interval from which to draw random numbers
 * @returns {number} Random number between min and max
 */
function getRandom(min, max) {
    return Math.random() * (max - min) + min
}

/**
 * Set a random color to use on the frontend when plotting with Chart.js
 * @returns {string} rgba-function call with random values and opacity 1 as string
 */
function backgroundColor() {
    return `rgba(${Math.floor(getRandom(0, 255))}, ${Math.floor(getRandom(0, 255))}, ${Math.floor(getRandom(0, 255))}, 1)`
}

/**
 * Transposes the array using map.
 * Code taken from: http://www.codesuck.com/2012/02/transpose-javascript-array-in-one-line.html
 * @param {array} a Array to be transposed
 * @returns {array} Transposed array
 */
function transpose(a) {
    return a[0].map((_, c) => a.map(r => r[c]))
}

/**
 * Turns a 1d array into a 2d array with width columns.
 * Code taken from: https://stackoverflow.com/a/39838921
 * @param {array} arr 1d array to be turned into 2d array
 * @param {number} width Number of columns of the 2d array
 * @returns {Array.<Array.<any>>} 2d array with width columns
 */
function toMatrix(arr, width) {
    return arr.reduce((rows, key, index) => (index % width == 0 ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows, [])
}

module.exports = QAReport