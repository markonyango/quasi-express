export default class Modal {
  constructor(modalElement, modalBackground){
    this.modalElement = modalElement
    this.modalBackground = modalBackground

    this.modalElement.style.display = 'block'
    this.modalBackground.style.display = 'block'
  }

  modal() {
    this.modalBackground.addEventListener('click', ()=> {
      this.modalElement.style.display = 'none'
      this.modalBackground.style.display = 'none'
    })
  }
} 
