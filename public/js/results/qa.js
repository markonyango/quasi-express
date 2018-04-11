import Carousel from '../carousel.js';

(() => {
  let resultDiv = document.getElementById('results')
  let getResultsButton = document.getElementById('getResultsButton')

  let baseDistribution, lengthDistribution, phredDistribution, boxplotDistribution
  let maxLength, maxReads

  writeMaxReadsToList(window.Report.QAReport.maxReads)
  getResultsButton.style.display = 'block'

  getResultsButton.addEventListener('click', function() {
    Promise.resolve(window.Report)
      .then(({ QAReport }) => {
        ({
          baseDistribution,
          lengthDistribution,
          phredDistribution,
          boxplotDistribution,
          maxLength,
          maxReads
        } = QAReport)
      })
      .then(() => createBaseDistributionGraphs(baseDistribution, maxLength))
      .then(() => createLengthDistributionGraphs(lengthDistribution, maxLength))
      .then(() => createPhredDistributionGraphs(phredDistribution, maxLength))
      .then(() => createBoxplotGraphs(boxplotDistribution, maxLength))
      .then(() => {
        let carousels = document.querySelectorAll('.carousel')
        carousels.forEach(carousel => new Carousel(carousel))
      })
      .catch(error => console.log('Error while creating QAReport charts: ' + error.message))

    getResultsButton.style.display = 'none'
  })

  function makeCanvas(parentDiv) {
    let canvasDiv = document.createElement('div')
    let canvas = document.createElement('canvas')

    canvasDiv.classList.add('carousel-item')
    //canvas.classList.add('d-block', 'w-80')

    canvasDiv.appendChild(canvas)
    parentDiv.appendChild(canvasDiv)

    return canvas
  }

  function makeChart(canvas, type) {
    let ctx = canvas.getContext('2d')
    return new Chart(ctx, {
      type: type,
      options: {
        responsive: true,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    })
  }

  function makeDiv(id) {
    let card = document.createElement('div')
    let cardBody = document.createElement('div')
    let cardHeader = document.createElement('div')
    let rowDiv = document.createElement('div')
    let colLeft = document.createElement('div')
    let colMid = document.createElement('div')
    let colRight = document.createElement('div')
    let carousel = document.createElement('div')
    let carouselInner = document.createElement('div')

    // Set up the rowDiv where the arrow buttons and the canvas will be shown
    rowDiv.classList.add('row')
    colLeft.classList.add('col-1', 'left', 'align-self-center', 'justify-self-center', 'carousel-ctrl-left')
    colRight.classList.add('col-1', 'right', 'align-self-center', 'justify-self-center', 'carousel-ctrl-right')
    colMid.classList.add('col-10')

    // Set up the card itself
    // Card Header can be any of the following
    switch (id) {
      case 'baseDiv':
        cardHeader.innerText = 'Base Distributions'
        break
      case 'lengthDiv':
        cardHeader.innerText = 'Length Distributions'
        break
      case 'phredDiv':
        cardHeader.innerText = 'Phredscore Distributions'
        break
      case 'boxplotDiv':
        cardHeader.innerText = 'Boxplot of quality scores per cycle'
    }
    cardHeader.classList.add('card-header')
    cardBody.id = id
    card.classList.add('card', 'project-details')
    cardBody.classList.add('card-body')
    carousel.classList.add('carousel')
    carouselInner.classList.add('carousel-inner')

    // Create carousel controls
    // Left arrow button
    colLeft.innerHTML = `<i class="fas fa-arrow-left"></i><span class="sr-only">Previous</span>`

    // Right arrow button
    colRight.innerHTML = `<i class="fas fa-arrow-right"></i><span class="sr-only">Next</span>`

    // Append divs to their respective parents
    carousel.appendChild(carouselInner)
    colMid.appendChild(carousel)

    rowDiv.appendChild(colLeft)
    rowDiv.appendChild(colMid)
    rowDiv.appendChild(colRight)

    cardBody.appendChild(rowDiv)
    card.appendChild(cardHeader)
    card.appendChild(cardBody)

    resultDiv.appendChild(card)

    return carouselInner
  }

  function createBaseDistributionGraphs(baseDistribution, maxLength) {
    let baseDiv = makeDiv('baseDiv')
    baseDistribution.map((file, index) => {
      let canvas = makeCanvas(baseDiv)
      let chart = makeChart(canvas, 'line')

      // If it is the first canvas we need to set its class to active
      if (index === 0) canvas.parentElement.classList.add('active')

      chart.data.labels = Array(maxLength)
        .fill(0)
        .map((value, index) => index + 1)
      chart.options.layout.padding = { left: 10, right: 30 }
      chart.options.scales.xAxes[0] = {
        ticks: {
          callback: function(value, index, values) {
            let retVal = (x, gap) => (value % gap === 0 ? value : null)
            if (values.length > 100) return retVal(value, 10)
            else if (values.length > 50) return retVal(value, 5)
            else if (values.length > 20) return retVal(value, 2)
            else return value
          }
        }
      }
      chart.options.title.text = 'Base Distributions per Cycle for ' + file.label
      chart.options.title.display = true

      chart.data.datasets = Object.entries(file.data).map(base => ({
        label: base[0],
        data: base[1]
      }))
      let colors = [
        'rgba(255,0,0,0.75)',
        'rgba(0,255,0,0.75)',
        'rgba(0,0,255,0.75)',
        'rgba(255,175,0,0.75)',
        'rgba(0,0,0,0.75)'
      ]
      chart.data.datasets = chart.data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: colors[index]
      }))

      chart.update()
    })
  }

  function createLengthDistributionGraphs(lengthDistribution, maxLength) {
    let lengthDiv = makeDiv('lengthDiv')
    let canvas = makeCanvas(lengthDiv)
    let chart = makeChart(canvas, 'bar')

    // There will be only one canvas but we still need to set its parents class to active
    canvas.parentElement.classList.add('active')

    chart.data.labels = Array(maxLength)
      .fill(0)
      .map((value, index) => index + 1)
    chart.options.layout.padding = { left: 10, right: 30 }
    chart.options.scales.xAxes[0] = {
      ticks: {
        callback: function(value, index, values) {
          let retVal = (x, gap) => (value % gap === 0 ? value : null)
          if (values.length > 100) return retVal(value, 10)
          else if (values.length > 50) return retVal(value, 5)
          else if (values.length > 20) return retVal(value, 2)
          else return value
        }
      }
    }
    chart.options.title.text = 'Readlength Distributions'
    chart.options.title.display = true

    lengthDistribution.map(file => {
      chart.data.datasets.push({
        label: file.label,
        data: file.data,
        backgroundColor: file.backgroundColor
      })
    })

    chart.update()
  }

  function createPhredDistributionGraphs(phredDistribution, maxLength) {
    let phredDiv = makeDiv('phredDiv')

    phredDistribution.map((file, index) => {
      let canvas = makeCanvas(phredDiv)
      let chart = makeChart(canvas, 'bar')
      let maxPhredScore = Math.max(
        ...Object.values(file.data).map(arr =>
          arr.reduce((max, val, index) => (index > max && val !== 0 ? index : max), 0)
        )
      )

      // If it is the first canvas we need to set its class to active
      if (index === 0) canvas.parentElement.classList.add('active')

      chart.options.title.text = 'Phred Score Distributions per base for ' + file.label
      chart.options.title.display = true

      chart.data.labels = Array(maxPhredScore + 2)
        .fill(0)
        .map((val, index) => index)

      chart.data.datasets = Object.entries(file.data).map(base => ({
        label: base[0],
        data: base[1],
        categoryPercentage: 0.9
      }))
      let colors = [
        'rgba(255,0,0,1.0)',
        'rgba(0,255,0,1.0)',
        'rgba(0,0,255,1.0)',
        'rgba(255,175,0,1.0)'
      ]
      chart.data.datasets = chart.data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: colors[index]
      }))

      chart.update()
    })
  }

  function createBoxplotGraphs(boxplotDistribution, maxLength) {
    let boxplotDiv = makeDiv('boxplotDiv')

    boxplotDistribution.map((file, index) => {
      let canvas = makeCanvas(boxplotDiv)
      let chart = makeChart(canvas, 'boxplot')
      window.chart = chart

      // If it is the first canvas we need to set its class to active
      if (index === 0) canvas.parentElement.classList.add('active')

      chart.options.title.text = 'Qualityscore distribution per cycle for ' + file.label
      chart.options.title.display = true

      chart.data.labels = Array.from({ length: maxLength }, (v, i) => i + 1)
      chart.data.datasets = [
        {
          data: file.data,
          label: file.label,
          backgroundColor: 'rgba(133,44,55,0.75)',
          padding: 0.1
        }
      ]
      chart.update()
    })
  }

  function writeMaxReadsToList(maxReads) {
    let fileList = document.getElementById('fileList')

    for (let child of fileList.children) {
      let text = child.innerText
      let numReads = maxReads[text]
      child.innerText += ` ${numReads} reads`
    }
  }
})()
