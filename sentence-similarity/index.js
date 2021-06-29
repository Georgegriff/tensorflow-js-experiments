/// <reference path="../index.d.ts" />
import * as Comlink from "https://unpkg.com/comlink@4.3.0/dist/esm/comlink.min.mjs";

const worker = new Worker("worker.js");
// WebWorkers use `postMessage` and therefore work with Comlink.
const Searcher = Comlink.wrap(worker);

// UI
const searchEl = document.querySelector("#search");
searchEl.disabled = false;
const resultsEl = document.querySelector('#results');
const loading = document.querySelector('.loading');
loading.hidden = true;

function decodeHtml(html) {
  var txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

const search = async (searchInput) => {
  if(!searchInput) {
    return;
  }
  resultsEl.innerHTML = '';
  loading.hidden = false;

  const allResults = await Searcher.search([searchInput]);
  if(!allResults.length) {
    return;
  }
  loading.hidden = true;
  const results = allResults[0]


  results.predictions.forEach(({result, similarity}) => {
    const li = document.createElement('li');
    li.innerText=decodeHtml(`Template: ${result.title}, description: ${result.description}, Match score: ${similarity}`)
    resultsEl.appendChild(li);
  });
}

const setSearchField = (query) => {
  searchEl.value = query
}

const updateSearchParams = (value) => {
  const queryParams = new URLSearchParams(window.location.search);
  queryParams.set("q", encodeURIComponent(value));
  history.replaceState(null, null, "?"+ queryParams.toString());
}

const readQueryFromSearchParams = () => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get("q");
}

searchEl.addEventListener('change', async (e) => {
  const searchInput = e.target.value;
  updateSearchParams(searchInput);
  try {
    await search(searchInput)
  } catch(e) {
    console.error(e)
  }

})

await Searcher.load();
const query = readQueryFromSearchParams();
setSearchField(query);
await search(query);




