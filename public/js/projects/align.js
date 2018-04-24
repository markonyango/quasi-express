export function alignSettings(references) {
  if (!references) {
    fetch('/projects/references', { credentials: 'include' })
      .then(res => res.json())
      .then(references => {
        let referenceSelect = document.querySelector('select[name="settings[reference]"]')
        references.map(ref => {
          let child = document.createElement('option')
          child.value = ref
          child.text = ref
          referenceSelect.appendChild(child)
        })
        options_align.style.display = 'block'
      })
      .catch(error => {
        let referenceSelect = document.querySelector('select[name="settings[reference]"]')
        let child = document.createElement('option')
        child.text = 'Error retrieving references'
        child.disabled = true
        referenceSelect.appendChild(child)
        options_align.style.display = 'block'
      })
  } else {
    options_align.style.display = 'block'
  }
}

export function validateAlign(settings) {
  return new Promise((resolve, reject) => {
    if (typeof(settings.countMatrix) !== 'boolean') {
      reject('Non-boolean value for count matrix settings recieved')
    } else if (settings.mismatches < 0) {
      reject('Invalid number of mismatches provided')
    } else if (settings.postTrim < 0) {
      reject('Invalid number of bases to be trimmed provided')
    } else if (settings.preTrim < 0) {
      reject('Invalid number of bases to be trimmed provided')
    } else if (settings.reference === '' || settings.reference === 'Select reference...') {
      reject('No or wrong alignment reference provided')
    } else if (typeof(settings.writeUnaligned) !== 'boolean') {
      reject('Invalid option for writeUnaligned provided')
    } else {
      let formData = new FormData()
      Object.entries(settings).map(([key, value]) => formData.append('settings['+key+']', value))
      resolve(formData)
    }
  })
}