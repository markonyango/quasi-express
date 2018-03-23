let resultDiv = document.getElementById('results')

function makeCanvas(parentDiv) {
  let canvasDiv = document.createElement('div')
  let canvas = document.createElement('canvas')

  canvasDiv.classList.add('carousel-item')
  canvas.classList.add('d-block', 'w-100')

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

function makeDiv(id, classes = []) {
  let div = document.createElement('div')
  div.id = id
  div.classList.add(...classes)
  div.classList.add('carousel', 'slide')
  let carouselInner = document.createElement('div')
  carouselInner.classList.add('carousel-inner')
  div.appendChild(carouselInner)

  // Create carousel controls
  // Left arrow button
  let leftArrow = document.createElement('a')
  leftArrow.classList.add('carousel-control-prev')
  leftArrow.setAttribute('role', 'button')
  leftArrow.setAttribute('data-slide', 'prev')
  leftArrow.setAttribute('href', '#' + id)
  leftArrow.innerHTML = `<span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="sr-only">Previous</span>`

  // Right arrow button
  let rightArrow = document.createElement('a')
  rightArrow.classList.add('carousel-control-next')
  rightArrow.setAttribute('role', 'button')
  rightArrow.setAttribute('data-slide', 'next')
  rightArrow.setAttribute('href', '#' + id)
  rightArrow.innerHTML = `<span class="carousel-control-next-icon" aria-hidden="true"></span><span class="sr-only">Next</span>`

  // Append both arrow buttons to the div element
  div.appendChild(leftArrow)
  div.appendChild(rightArrow)

  resultDiv.appendChild(div)
  return carouselInner
}

// Create the distribution charts
fetch(window.location.pathname + '?json=true', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(({ QAReport }) => {
    let { baseDistribution, lengthDistribution, phredDistribution } = QAReport
    let maxReadLength = lengthDistribution.reduce(
      (max, file) => (file.data.length > max ? file.data.length : max),
      0
    )

    createBaseDistributionGraphs(baseDistribution, maxReadLength)
    createLengthDistributionGraphs(lengthDistribution, maxReadLength)
    createPhredDistributionGraphs(phredDistribution, maxReadLength)
  })

function createBaseDistributionGraphs(baseDistribution, maxReadLength) {
  let baseDiv = makeDiv('baseDiv', ['jumbotron', 'project-details'])
  baseDistribution.map((file, index) => {
    let canvas = makeCanvas(baseDiv)
    let chart = makeChart(canvas, 'line')

    // If it is the first canvas we need to set its class to active
    if (index === 0) canvas.parentElement.classList.add('active')

    chart.data.labels = Array(maxReadLength)
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
      'rgba(255,255,0,0.75)',
      'rgba(0,0,0,0.75)'
    ]
    chart.data.datasets = chart.data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: colors[index]
    }))

    chart.update()
  })
}

function createLengthDistributionGraphs(lengthDistribution, maxReadLength) {
  let lengthDiv = makeDiv('lengthDiv', ['jumbotron', 'project-details'])
  let canvas = makeCanvas(lengthDiv)
  let chart = makeChart(canvas, 'bar')

  // There will be only one canvas but we still need to set its parents class to active
  canvas.parentElement.classList.add('active')

  chart.data.labels = Array(maxReadLength)
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

function createPhredDistributionGraphs(phredDistribution, maxReadLength) {
  let phredDiv = makeDiv('phredDiv', ['jumbotron', 'project-details'])

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

    chart.options.title.text = 'Phred Score Distributions per base for '
    chart.options.title.display = true

    chart.data.labels = Array(maxPhredScore + 2)
      .fill(0)
      .map((val, index) => index)

    chart.data.datasets = Object.entries(file.data).map(base => ({
      label: base[0],
      data: base[1]
    }))
    let colors = [
      'rgba(255,0,0,0.75)',
      'rgba(0,255,0,0.75)',
      'rgba(0,0,255,0.75)',
      'rgba(255,255,0,0.75)'
    ]
    chart.data.datasets = chart.data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: colors[index]
    }))

    chart.update()
  })
}
