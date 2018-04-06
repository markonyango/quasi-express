const fs = require('fs-extra')
const path = require('path')
const { quantileSeq } = require('mathjs')

function QAReport(projectDocument) {
  this.files = projectDocument.files
  this.savePath = projectDocument.savePath
  this.maxLength = 0
  this.maxReads = {}

  this.lengthDistribution = null
  this.phredDistribution = null
  this.baseDistribution = null
  this.boxplotDistribution = null
}

QAReport.prototype.generateReport = function() {
  let reportFile = path.join(this.savePath, 'report.txt')
  try {
    let buff = fs.readFileSync(reportFile, { encoding: 'utf-8', flag: 'r' })
    let json = JSON.parse(buff)
    this.lengthDistribution = json.lengthDistribution
    this.baseDistribution = json.baseDistribution
    this.phredDistribution = json.phredDistribution
    this.boxplotDistribution = json.boxplotDistribution
    this.maxLength = json.maxLength
    this.maxReads = json.maxReads
  } catch (error) {
    // maxLength is being calculated in readLengthDistribution only
    // so run this first
    this.lengthDistribution = this.readLengthDistribution()
    this.baseDistribution = this.readBaseDistribution()
    this.phredDistribution = this.readPhredDistribution()
    this.boxplotDistribution = this.readBoxplotDistribution()

    fs.writeFile(
      reportFile,
      JSON.stringify({
        lengthDistribution: this.lengthDistribution,
        baseDistribution: this.baseDistribution,
        phredDistribution: this.phredDistribution,
        boxplotDistribution: this.boxplotDistribution,
        maxLength: this.maxLength,
        maxReads: this.maxReads
      }),
      error => error ? console.log(error) : ''
    )
  }

  return {
    lengthDistribution: this.lengthDistribution,
    baseDistribution: this.baseDistribution,
    phredDistribution: this.phredDistribution,
    boxplotDistribution: this.boxplotDistribution,
    maxLength: this.maxLength,
    maxReads: this.maxReads
  }
}

QAReport.prototype.readLengthDistribution = function() {
  return this.files.map(file => {
    let buff = this.readResultFile(file, '-length_dist.txt')
    let data = buff
      .trim()
      .split(' ')
      .map(Number)
    let label = path.basename(file)
    this.maxLength < data.length ? (this.maxLength = data.length) : null

    return {
      label,
      data,
      borderWidth: 1,
      backgroundColor: backgroundColor()
    }
  })
}

QAReport.prototype.readPhredDistribution = function() {
  return this.files.map(file => {
    let buff = this.readResultFile(file, '-phred_dist.txt')
    let data = buff
      .trim()
      .split(' ')
      .map(Number)
    let A = data.splice(0, 61)
    let T = data.splice(0, 61)
    let G = data.splice(0, 61)
    let C = data.splice(0, 61)

    data = { A, T, G, C }

    let label = path.basename(file)

    return {
      label,
      data,
      backgroundColor: backgroundColor()
    }
  })
}

QAReport.prototype.readBaseDistribution = function() {
  return this.files.map(file => {
    let buff = this.readResultFile(file, '-base_dist.txt')
    // Turn this into a 2d array with 6 rows, representing A, T, G, C, N, GC frequencies respectively
    // Each row has max_read_length entries
    let data = buff
      .trim()
      .split('\n')
      .map(row =>
        row
          .trim()
          .split('\t')
          .map(Number)
      )
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

QAReport.prototype.readBoxplotDistribution = function() {
  return this.files.map(file => {
    let buff = this.readResultFile(file, '-boxplotdata.txt')
    let data = buff
      .trim()
      .split('\n')
      .map(row =>
        row
          .trim()
          .split(' ')
          .map(Number)
      )
    // Quality scores are represented by columns
    // Cycle is represented by rows
    data = transpose(data)
    data = data.map(scoreArr => {
      // scoreArr is being unpacked by .reduce() into a sorted array of numReads length
      let sortedArray = scoreArr.reduce((acc, quantity, index) => {
        return [...acc, ...Array.from({ length: quantity }, i => index)]
      }, [])

      // Update global maxNumReads variable
      this.maxReads[file] = sortedArray.length

      // Calculate quantiles here
      let quantiles = quantileSeq(sortedArray, [0.25, 0.5, 0.75], true)
      return {
        min: sortedArray[0],
        q1: quantiles[0],
        median: quantiles[1],
        q3: quantiles[2],
        max: sortedArray[sortedArray.length - 1],
        outliers: []
      }
    })

    let label = path.basename(file)

    return {
      label,
      data
    }
  })
}

QAReport.prototype.readResultFile = function(file, pattern) {
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
  return `rgba(${Math.floor(getRandom(0, 255))}, ${Math.floor(getRandom(0, 255))}, ${Math.floor(
    getRandom(0, 255)
  )}, 1)`
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

module.exports = QAReport
