export default class Carousel {
  constructor(e) {
    let inner = e.children[0]; /* carousel-inner div containing the slides */
    let slides = inner.children; /* HTML Collection of divs with class "slide" */
    let parent = e.parentElement.parentElement; /* This is the row element */
    let left = parent.children[0]; /* Left arrow navigation element */
    let right = parent.children[2]; /* Right arrow navigation element */
    let itemNumber = 0; /* Index of currently viewed slide */
    
    if (slides.length > 1) {
      left.addEventListener('click', e => this.moveSlide(e));
      right.addEventListener('click', e => this.moveSlide(e));
    }
    else {
      parent.removeChild(left);
      parent.removeChild(right);
      parent.children[0].classList.remove('col-10');
      parent.children[0].classList.add('col-12');
    }
    this.moveSlide = function (e) {
      slides[itemNumber].classList.remove('active');
      e.target.className === 'right' ? itemNumber++ : itemNumber--;
      itemNumber >= slides.length ? (itemNumber = 0) : null;
      itemNumber < 0 ? (itemNumber = slides.length - 1) : null;
      slides[itemNumber].classList.add('active');
    };
  }
}

