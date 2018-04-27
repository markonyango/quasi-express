import Modal from './modal.js'
import { alignSettings, validateAlign } from './projects/align.js'
import { deaSettings, validateDEA } from './projects/dea.js'

// Was Alignment reference list loaded already? Null if no, array if yes.
let references = null /* not null if alignment refs have been loaded */
let countMatrices = null /* not null if count matrices have been loaded */

let projectType = document.querySelector('select[name="projecttype"]')
let projectForm = document.getElementById('add_project_form')
let startButtons = document.querySelectorAll('button[name="start_project"]')
let stopButtons = document.querySelectorAll('button[name="stop_project"]')
let removeButtons = document.querySelectorAll('button[name="remove_project"]')

let options_qa = document.getElementById('options_qa')
let options_dea = document.getElementById('options_dea')
let options_align = document.getElementById('options_align')

let prevCountMatrix = document.getElementById('previousCountMatrix')

// Form evaluation stuff

projectType.addEventListener('change', function() {
  const selected_projecttype = projectType.selectedOptions[0].value

  if (selected_projecttype === 'dea') {
    deaSettings()
  } else {
    options_dea.style.display = 'none'
  }

  if (selected_projecttype === 'align') {
    alignSettings(projectForm.querySelector('select[name="settings[reference]"]'))
  } else {
    options_align.style.display = 'none'
  }

  if (selected_projecttype === 'qa') {
    options_qa.style.display = 'block'
  } else {
    options_qa.style.display = 'none'
  }
})

// Form submission handling

projectForm.addEventListener('submit', function(event) {
  event.preventDefault()
  validateForm()
    .then(submitFormData)
    .catch(error => console.log(error))
})

// Development Button

devButton.addEventListener('click', function(event) {
  event.preventDefault()
  switch (projectType.value) {
    case 'dea':
      formValues()
      break

    default:
      break
  }
})

// Resetting form

projectForm.addEventListener('reset', function() {
  let fieldsets = projectForm.querySelectorAll('fieldset')
  fieldsets.forEach(fieldset => (fieldset.style.display = 'none'))
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
      .catch(error => console.log(error))
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
      .catch(error => console.log(error))
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
      .catch(error => console.log(error))
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

function formValues() {
  let options = projectForm.querySelectorAll(
    `fieldset[id="options_${projectType.value}"] input[name^=settings]:enabled, 
     fieldset[id="options_${projectType.value}"] select:enabled, 
     fieldset[id="options_${projectType.value}"] input[type=file]:enabled`
  )
  let settings = {}
  options.forEach(option => {
    let name = option.type !== 'file' ? /\[(\w+)\]/.exec(option.name)[1] : option.name
    settings[name] = option
  })
  return settings
}

function validateForm() {
  console.log('validateForm')
  return new Promise((resolve, reject) => {
    let settings = formValues()
    switch (projectType.value) {
      case 'align':
        validateAlign(settings)
          .then(formData => resolve(formData))
          .catch(reject)
        break
      case 'dea':
        validateDEA(settings)
          .then(formData => resolve(formData))
          .catch(reject)
        break
      default:
        reject('Project type error during validateForm()')
        break
    }
  })
}

function submitFormData(formData) {
  formData.append('projectname', projectForm.projectname.value)
  formData.append('projecttype', projectForm.projecttype.value)

  return fetch('/projects/upload', { body: formData, method: 'POST', credentials: 'include' })
    .then(res => res.json())
    .then(res => window.location = '/projects')
}
