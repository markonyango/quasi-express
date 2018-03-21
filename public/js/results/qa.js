let divResults = document.getElementById('results')

function makeChart(ctx, type) {
  return new Chart(ctx, {
    type: type,
    options: {
      responsive: true,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
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
    let ctx = document.querySelector('canvas[id=base_distribution]').getContext('2d')
    let chart = makeChart(ctx, 'line')
    QAReport = QAReport.baseDistribution
    
    let maxReadLength = Math.max(
      QAReport[0].data.A.length,
      QAReport[0].data.T.length,
      QAReport[0].data.G.length,
      QAReport[0].data.C.length,
      QAReport[0].data.N.length
    )

    //chart.options.scales.yAxes.stacked = false

    chart.data.labels = Array(maxReadLength).fill(0).map((value, index) => index + 1)
    
    for(let file of QAReport){
      chart.options.title.text = `Base Distributions per Cycle for ${file.label}`
      chart.options.title.display = true
      /*chart.options.scales.xAxes.push({ticks: {callback : function(value, index, values){
        return value % 2 === 0 ? value : ''
      }}})*/
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

    }
    
    /*chart.data.datasets.push({
      label: 'mark',
      backgroundColor: 'red',
      data: [50, 50]
    })
    chart.data.datasets.push({
      label: 'eva',
      backgroundColor: 'green',
      data: [25, 75]
    })*/
    chart.update()
    let datasets = QAReport.baseDistribution
    console.log(datasets)
  })