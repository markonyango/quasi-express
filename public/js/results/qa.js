let resultDiv = document.getElementById('results')
let getResultsButton = document.getElementById('getResultsButton')

getResultsButton.addEventListener('click', function() {
  fetch(window.location.pathname + '?json=true', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(({ QAReport }) => {
      let { baseDistribution, lengthDistribution, phredDistribution, boxplotDistribution } = QAReport
      let maxReadLength = lengthDistribution.reduce(
        (max, file) => (file.data.length > max ? file.data.length : max),
        0
      )

      createBaseDistributionGraphs(baseDistribution, maxReadLength)
      createLengthDistributionGraphs(lengthDistribution, maxReadLength)
      createPhredDistributionGraphs(phredDistribution, maxReadLength)
      createBoxplotGraphs(boxplotDistribution, maxReadLength)
    })

  getResultsButton.setAttribute('disabled', true)
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
  let carouselInner = document.createElement('div')

  // Set up the rowDiv where the arrow buttons and the canvas will be shown
  rowDiv.classList.add('row', 'align-items-center', 'justify-content-between')
  colLeft.classList.add('col-1')
  colRight.classList.add('col-1')
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
  }
  cardHeader.classList.add('card-header')
  cardBody.id = id
  card.classList.add('card', 'project-details')
  cardBody.classList.add('card-body', 'carousel', 'slide')
  carouselInner.classList.add('carousel-inner')

  // Create carousel controls
  // Left arrow button
  let leftArrow = document.createElement('a')
  leftArrow.classList.add('arrowLeft') //carousel-control-prev')
  leftArrow.setAttribute('role', 'button')
  leftArrow.setAttribute('data-slide', 'prev')
  leftArrow.setAttribute('href', '#' + id)
  leftArrow.innerHTML = `<span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="sr-only">Previous</span>`

  // Right arrow button
  let rightArrow = document.createElement('a')
  rightArrow.classList.add('arrowRight') //carousel-control-next')
  rightArrow.setAttribute('role', 'button')
  rightArrow.setAttribute('data-slide', 'next')
  rightArrow.setAttribute('href', '#' + id)
  rightArrow.innerHTML = `<span class="carousel-control-next-icon" aria-hidden="true"></span><span class="sr-only">Next</span>`

  // Append divs to their respective parents
  colLeft.appendChild(leftArrow)
  colRight.appendChild(rightArrow)
  colMid.appendChild(carouselInner)

  rowDiv.appendChild(colLeft)
  rowDiv.appendChild(colMid)
  rowDiv.appendChild(colRight)

  cardBody.appendChild(rowDiv)
  card.appendChild(cardHeader)
  card.appendChild(cardBody)

  resultDiv.appendChild(card)
  return carouselInner
}

function createBaseDistributionGraphs(baseDistribution, maxReadLength) {
  let baseDiv = makeDiv('baseDiv')
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
  let lengthDiv = makeDiv('lengthDiv')
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

function createBoxplotGraphs(boxplotDistribution, maxReadLength) {
  let boxplotDiv = makeDiv('boxplotDiv')

  boxplotDistribution.map((file, index) => {
    let canvas = makeCanvas(boxplotDiv)
    let chart = makeChart(canvas, 'boxplot')

    // If it is the first canvas we need to set its class to active
    if (index === 0) canvas.parentElement.classList.add('active')

    chart.options.title.text = 'Qualityscore distribution per cycle for ' + file.label
    chart.options.title.display = true

    chart.data.labels = Array(maxReadLength + 1)
      .fill(0)
      .map((val, index) => index)
    chart.data.datasets = file.data
    chart.data.datasets = [
      {
        data: file.data,
        label: file.label,
        backgroundColor: 'rgba(0, 0, 0, .75)'
      }
    ]
    chart.update()
  })
}
