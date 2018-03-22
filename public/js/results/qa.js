let divResults = document.getElementById('results')

function makeCanvas(parentDiv) {
  let canvas = document.createElement('canvas')
  parentDiv.appendChild(canvas)
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

// Create the base distribution chart
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

    let resultDiv = document.getElementById('results')

    // Creating base distribution charts
    let baseDiv = document.createElement('div')
    baseDiv.id = 'baseDiv'
    resultDiv.appendChild(baseDiv)
    for (let file of baseDistribution) {
      let canvas = makeCanvas(baseDiv)
      let chart = makeChart(canvas, 'line')
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
      chart.options.title.text =
        'Base Distributions per Cycle for ' + file.label
      chart.options.title.display = true

      chart.data.datasets.push({
        label: 'A',
        data: file.data.A,
        backgroundColor: 'rgba(255, 0, 0, 0.50)'
      })
      chart.data.datasets.push({
        label: 'T',
        data: file.data.T,
        backgroundColor: 'rgba(0, 255, 0, 0.50)'
      })
      chart.data.datasets.push({
        label: 'G',
        data: file.data.G,
        backgroundColor: 'rgba(0, 0, 255, 0.50)'
      })
      chart.data.datasets.push({
        label: 'C',
        data: file.data.C,
        backgroundColor: 'rgba(255, 255, 0, 0.50)'
      })
      chart.data.datasets.push({
        label: 'N',
        data: file.data.N,
        backgroundColor: 'rgba(0, 0, 0, 0.50)'
      })

      chart.update()
    }
  })
