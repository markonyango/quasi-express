export function deaSettings() {
  options_dea.style.display = 'block'
}

previousCountMatrix.addEventListener('change', function(e) {
  if (e.target.checked) {
    if (prevCountMatrixFile.children.length === 1) {
      fetch('/projects/countfiles', { credentials: 'include' })
        .then(res => res.json())
        .then(json => {
          json.map(project => {
            let option = document.createElement('option')
            option.innerText = project.projectname
            option.value = project._id
            prevCountMatrixFile.appendChild(option)
          })
        })
        .catch(error => {
          let option = document.createElement('option')
          option.text = 'Error retrieving count matrices'
          option.disabled = true
          prevCountMatrixFile.appendChild(option)
        })
    }
    prevCountMatrixFile.disabled = false
    prevCountMatrixFile.style.display = 'block'
    newCountMatrixFile.disabled = true
    newCountMatrixFile.style.display = 'none'
  } else {
    newCountMatrixFile.disabled = false
    newCountMatrixFile.style.display = 'block'
    prevCountMatrixFile.disabled = true
    prevCountMatrixFile.style.display = 'none'
  }
})

export function validateDEA(settings) {
  return new Promise((resolve, reject) => {
    let packages = ['deseq', 'deseq2', 'edger', 'bayseq']
    if (!settings.package.every(pkg => packages.includes(pkg))) {
      reject('Unrecognized package provided')
    } else if (settings.conditions.split(' ').length < 2) {
      reject('Not enough conditions provided')
    } else if (typeof settings.correlateSamples !== 'boolean') {
      reject('correlateSamples is not a boolean value')
    } else if (settings.countMatrixFile === '') {
      reject('No count matrix file was provided')
    } else if (settings.pairwise.split(' ').length < 2) {
      reject('Not enough conditions for pairwise analysis provided')
    } else if (settings.significanceLevel < 0.01 || settings.significanceLevel > 0.99) {
      reject('Significance level is out of valid interval range')
    } else {
      let formData = new FormData()
      Object.entries(settings).map(([key, value]) =>
        formData.append('settings[' + key + ']', value)
      )
      resolve(formData)
    }
  })
}
