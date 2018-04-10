(() => {
  let resultDiv = document.getElementById('results')
  let samstatFileList = document.getElementById('samstatFileList')

  let Report = window.Report
  let resultFiles = Report.resultFiles
  let samstatFiles = resultFiles.filter(file => file.indexOf('samstat') !== -1)

  let objectCard = document.createElement('div')
  let objectCardHeader = document.createElement('div')
  let objectCardBody = document.createElement('div')
  let objectElement = document.createElement('object')

  objectCard.classList.add('card')
  objectCardHeader.classList.add('card-header')
  objectCardBody.classList.add('card-body')

  objectCardHeader.innerText = 'SAMstats'

  objectCard.appendChild(objectCardHeader)
  objectCardBody.appendChild(objectElement)
  objectCard.appendChild(objectCardBody)
  resultDiv.appendChild(objectCard)

  for (let file of samstatFiles) {
    let li = document.createElement('li')
    li.textContent = file.replace('.samstat.html', '')
    li.setAttribute('data-file', file)
    li.addEventListener('click', function(e) {
      if (!objectElement.data) objectCard.style.height = '50vh'
      objectElement.data = `${location}/${e.target.getAttribute('data-file')}`
    })
    samstatFileList.appendChild(li)
  }
})()
