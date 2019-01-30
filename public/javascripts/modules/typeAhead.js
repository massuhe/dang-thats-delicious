import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
  return stores
    .map(store => `
      <a href="/stores/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>`)
    .join('');
}

function showResults(searchResults, stores) {
  if (!stores.length) {
    searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results found.</div>`);
    return ;
  }
  const html = searchResultsHTML(stores);
  searchResults.innerHTML = dompurify.sanitize(html);
}

function typeAhead(search) {
  if (!search) return;
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');
  searchInput.on('input', function() {
    // If there is no value, quit it!
    if (!this.value) {
      searchResults.style.display = 'none';
      return;
    }
    // Show the search results!
    searchResults.style.display = 'block';
    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => showResults(searchResults, res.data))
      .catch(err => console.log(err));
  });

  // handle keybord inputs
  searchInput.on('keyup', e => {
    const UP = 38, DOWN = 40, ENTER = 13;
    const key = e.keyCode;
    // If thet aren't pressing up, down or enter, who cares!
    if ([UP, DOWN, ENTER].indexOf(key) === -1) return;

    const results = Array.from(searchResults.children);
    const currentActiveResult = results.findIndex(r => r.classList.contains('search__result--active'));
    if (key === ENTER && currentActiveResult >= 0) {
      return results[currentActiveResult].click();
    }
    if (currentActiveResult >= 0) {
      results[currentActiveResult].classList.remove('search__result--active');
    }
    let nextResult ;
    if (key === UP) {
      nextResult = [-1, 0].indexOf(currentActiveResult) >= 0 ? results.length - 1 : currentActiveResult - 1;
    }
    if (key === DOWN) {
      nextResult = [-1, results.length - 1].indexOf(currentActiveResult) >= 0 ? 0 : currentActiveResult + 1;
    }
    results[nextResult].classList.add('search__result--active');
  });

}

export default typeAhead;