import axios from 'axios';
import { $ } from './bling';

function updateView(res) {
  const isHearted = this.heart.classList.toggle('heart__button--hearted');
  $('.heart-count').textContent = res.data.hearts.length;
  if (isHearted) {
    this.heart.classList.add('heart__button--float');
  }
}

function ajaxHeart(e) {
  // Prevent default behavior (button post)
  e.preventDefault();
  // Do AJAX post to add heart to store
  axios
    .post(this.action)
    .then(updateView.bind(this))
    .catch(console.error)
  // Remove animation class when ends
  this.heart.addEventListener('animationend', function() {
    this.classList.remove('heart__button--float');
  });
}

export default ajaxHeart;