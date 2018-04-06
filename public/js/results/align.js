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


  objectElement.style.width = '100%'
  objectElement.style.height = 'calc(100% - 1.25rem)'

  objectCardHeader.innerText = 'SAMstats'

  objectCard.appendChild(objectCardHeader)
  objectCard.appendChild(objectElement)
  resultDiv.appendChild(objectCard)

  samstatFileList.style.padding = '0'
  samstatFileList.style.margin = '0'
  for (let file of samstatFiles) {
    let li = document.createElement('li')
    li.textContent = file.replace('.samstat.html', '')
    li.setAttribute('data-file', file)
    li.style.display = 'inline'
    li.style.marginRight = '5px'
    li.addEventListener('click', function(e) {
      if (!objectElement.data) objectCard.style.height = '50vh'
      objectElement.data = `${location}/${e.target.getAttribute('data-file')}`
    })
    samstatFileList.appendChild(li)
  }
})()
