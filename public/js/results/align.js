let resultDiv = document.getElementById('results')
let Report = window.Report
let samstatFiles = Report.samstatFiles

for(let file of samstatFiles){
  let objectElement = document.createElement('object')
  objectElement.data = file
  resultDiv.appendChild(objectElement)
}
