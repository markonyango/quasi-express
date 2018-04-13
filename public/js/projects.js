import Modal from './modal.js'

(() => {
  // Was Alignment reference list loaded already? Null if no, array if yes.
  let references = null
  let projectType = document.querySelector('select[name="projecttype"]')
  let projectForm = document.getElementById('add_project_form')
  let startButtons = document.querySelectorAll('button[name="start_project"]')
  let stopButtons = document.querySelectorAll('button[name="stop_project"]')
  let removeButtons = document.querySelectorAll('button[name="remove_project"]')

  let options_dea = document.getElementById('options_dea')
  let options_align = document.getElementById('options_align')

  // Form evaluation stuff

  projectType.addEventListener('change', function() {
    const selected_projecttype = document.querySelector('select[name="projecttype"]')
      .selectedOptions[0].value

    if (selected_projecttype === 'dea') {
      options_dea.style.display = 'block'
    } else {
      options_dea.style.display = 'none'
    }

    if (selected_projecttype === 'align') {
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
    } else {
      options_align.style.display = 'none'
    }
  })

  // Form submission handling

  projectForm.addEventListener('submit', function(event) {
    event.preventDefault()
    const formData = new FormData(projectForm)
    fetch('/projects/upload', { body: formData, method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(res => {
        window.location = '/projects'
      })
      .catch(error => console.log)
  })

  // Resetting form

  projectForm.addEventListener('reset', function(){
    let fieldsets = add_project_form.querySelectorAll('fieldset')
    fieldsets.forEach(fieldset => fieldset.style.display = 'none')
  })


  // Starting and Stoping projects

  for (let node of startButtons) {
    node.addEventListener('click', function() {
      const pid = this.attributes.pid.value

      fetch('/projects/' + pid + '/start', { method: 'PUT', credentials: 'include' })
        .then(res => res.json())
        .then(project => {
          if (project.status === 'running') {
            window.location = '/projects'
          } else {
            alert('Could not start project. Contact admin.')
          }
        })
        .catch(error => console.log)
    })
  }

  for (let node of stopButtons) {
    node.addEventListener('click', function() {
      const pid = this.attributes.pid.value

      fetch('/projects/' + pid + '/stop', { method: 'PUT', credentials: 'include' })
        .then(res => res.json())
        .then(project => {
          if (project.status === 'stopped') {
            window.location = '/projects'
          } else {
            alert('Could not stop project. Contact admin.')
          }
        })
        .catch(error => console.log)
    })
  }

  for (let node of removeButtons) {
    node.addEventListener('click', function() {
      const pid = this.attributes.pid.value

      fetch('/projects/' + pid + '/remove', { method: 'PUT', credentials: 'include' })
        .then(res => res.json())
        .then(project => {
          if (project._id === pid) {
            window.location = '/projects'
          } else {
            alert('Could not remnove project. Contact admin.')
          }
        })
        .catch(error => console.log)
    })
  }

  /* Adding another project to the list */
  addProjectButton.addEventListener('click', () => {

    let modal = document.querySelector('.modal')
    let modalBackground = document.querySelector('.modalBackground')

    new Modal(modal, modalBackground).modal()
  })

  /* 'Reset Form' button */
  resetForm.addEventListener('click', () => {
    add_project_form.reset()
  })
})()
