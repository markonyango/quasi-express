export default function alignSettings(references) {
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