let sidebarToggle = document.getElementById('sidebarToggle')
let sidebar = document.getElementById('sidebar')
let mainBox = document.getElementById('mainBox')

sidebarToggle.addEventListener('click', function(e) {
  if (!sidebar.classList.contains('d-lg-block')) {
    sidebar.classList.add('d-lg-block')
    mainBox.classList.remove('col-lg-12')
    mainBox.classList.add('col-lg-10')
    /* Hier code für FA icon switch */
  } else {
    sidebar.classList.remove('d-lg-block')
    mainBox.classList.add('col-lg-12')
    mainBox.classList.remove('col-lg-10')
    /* Hier code für FA icon switch */
  }
})
