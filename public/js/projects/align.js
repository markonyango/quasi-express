export function alignSettings(referencesElement) {
  if (!(referencesElement.children.length > 1)) {
    fetch('/projects/references', { credentials: 'include' })
      .then(res => res.json())
      .then(references => {
        references.map(ref => {
          let child = document.createElement('option')
          child.value = ref
          child.text = ref
          referencesElement.appendChild(child)
        })
        options_align.style.display = 'block'
      })
      .catch(error => {
        let child = document.createElement('option')
        child.text = 'Error retrieving references'
        child.disabled = true
        referencesElement.appendChild(child)
        options_align.style.display = 'block'
      })
  } else {
    options_align.style.display = 'block'
  }
}

export function validateAlign(settings) {
  let { countMatrix, mismatches, postTrim, preTrim, reference, writeUnaligned, files } = settings
  return new Promise((resolve, reject) => {
    if (typeof countMatrix.checked !== 'boolean') {
      reject('Non-boolean value for count matrix settings recieved')
    } else if (mismatches.value < 0) {
      reject('Invalid number of mismatches provided')
    } else if (postTrim.value < 0) {
      reject('Invalid number of bases to be trimmed provided')
    } else if (preTrim.value < 0) {
      reject('Invalid number of bases to be trimmed provided')
    } else if (reference.value === '' || reference.value === 'Select reference...') {
      reject('No or wrong alignment reference provided')
    } else if (typeof writeUnaligned.checked !== 'boolean') {
      reject('Invalid option for writeUnaligned provided')
    } else {
      let formData = new FormData()
      formData.append(countMatrix.name, countMatrix.checked)
      formData.append(mismatches.name, mismatches.value)
      formData.append(postTrim.name, postTrim.value)
      formData.append(preTrim.name, preTrim.value)
      formData.append(reference.name, reference.value)
      formData.append(writeUnaligned.name, writeUnaligned.checked)
      
      Array.from(files.files).forEach(file => formData.append(files.name, file))

      resolve(formData)
    }
  })
}
