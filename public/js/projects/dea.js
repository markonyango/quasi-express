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

newCountMatrixFile.addEventListener('change', event => {
  let file = event.target.files[0]
  let fr = new FileReader()
  fr.onload = function(file2) {
    let firstLineBreak = fr.result.indexOf('\n')
    let firstLine = fr.result.substring(3, firstLineBreak)
    let conditions = firstLine.trim().split('\t')

    conditions.forEach(condition => {
      let div = document.createElement('div')
      /* Remove any file extensions the name may have 
         That is definitely the case with the count
         tool from QUASI-Tools
      */
      let { index: pos } = /\.\w+$/.exec(condition)
      div.innerText = condition.slice(0, pos)
      countMatrixConditions.appendChild(div)
    })
    document
      .querySelectorAll('*[name="countMatrixConditions"]')
      .forEach(element => (element.style.display = 'block'))
  }
  fr.readAsText(file)
})

export function validateDEA(settings) {
  let {
    packages,
    conditions,
    correlateSamples,
    countMatrixFile = null,
    files = null,
    pairwise,
    significanceLevel
  } = settings
  console.log(settings)
  return new Promise((resolve, reject) => {
    let checkPackages = ['deseq', 'deseq2', 'edger', 'bayseq']
    if (
      !Array.from(packages.selectedOptions)
        .map(x => x.value)
        .every(pkg => checkPackages.includes(pkg))
    ) {
      reject('Unrecognized package provided')
    } else if (conditions.value.split(' ').length < 2) {
      reject('Not enough conditions provided')
    } else if (typeof correlateSamples.checked !== 'boolean') {
      reject('correlateSamples is not a boolean value')
    } else if (countMatrixFile === null && files === null) {
      reject('No count matrix file was provided' + countMatrixFile || files)
    } else if (pairwise.value.split(' ').length < 2) {
      reject('Not enough conditions for pairwise analysis provided')
    } else if (significanceLevel.value < 0.01 || significanceLevel > 0.99) {
      reject('Significance level is out of valid interval range')
    } else {
      /* We must append the file directly not the input element */
      let formData = new FormData()
      formData.append(conditions.name, conditions.value)
      formData.append(correlateSamples.name, correlateSamples.checked)
      formData.append(pairwise.name, pairwise.value)
      formData.append(significanceLevel.name, significanceLevel.value)

      if(countMatrixFile !== null) {
        formData.append(countMatrixFile.name, countMatrixFile.value)
      } else {
        formData.append(files.name, files.files[0])
      }

      resolve(formData)
    }
  })
}
