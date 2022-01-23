import noUiSlider                                       from 'nouislider';
import { DATA_URL, DEFAULT_FROM, DEFAULT_TO, MEASURES } from "src/helpers/const";
import { loadData }                                     from "src/helpers/loadData";
import styles                                           from './style.scss';

const filters = {};
let data = [];
const tableEl = document.querySelector('.' + styles.table);


const measureSliders = {};
const measures = document.querySelectorAll('.' + styles.measure);
measures.forEach(measure => {
  const name = measure.dataset['name'];
  const fromEl = measure.querySelector('[name="from"]');
  const toEl = measure.querySelector('[name="to"]');
  const slider = noUiSlider.create(measure.querySelector('.' + styles.range), {
    connect: true,
    start:   [DEFAULT_FROM, DEFAULT_TO],
    range:   {
      'min': DEFAULT_FROM,
      'max': DEFAULT_TO,
    },
    step:    1,
  });

  slider.on('update', function ( values, handle ) {
    var value = values[handle];
    const el = handle === 0 ? fromEl : toEl;
    el.value = Math.round(value);
  });

  slider.on('change', function ( values ) {
    filters[name] = [+values[0], +values[1]];
    updateData();
  });

  fromEl.addEventListener('change', function () {
    slider.set([this.value, null]);
  });
  toEl.addEventListener('change', function () {
    slider.set([null, this.value]);
  });

  measureSliders[name] = slider;
});

const params = document.querySelectorAll('.' + styles.param);
params.forEach(param => {

  param.querySelector('input').addEventListener('change', ( e ) => {
    const { checked } = e.currentTarget;
    checked
      ? param.classList.add(styles.paramActive)
      : param.classList.remove(styles.paramActive);
  });
});

loadData(DATA_URL).then(( { rows, edges } ) => {
  for (let measure in edges) {
    const edge = edges[measure];
    const slider = measureSliders[measure];
    if (!slider) continue;
    slider.updateOptions({
      start: [edge[0], edge[1]],
      range: {
        'min': edge[0],
        'max': edge[1],
      },
    });
  }

  const table = tableEl.querySelector('tbody');
  let fragment = document.createDocumentFragment();
  rows.forEach(row => {
    const rowEl = document.createElement('tr');
    const nameEl = document.createElement('td');
    const priceEl = document.createElement('td');
    nameEl.innerText = `${row.width} х ${row.depth} х ${row.height} мм, крышка ${row.cap} мм`;
    priceEl.innerText = `${row.price} р.`;
    row.el = rowEl;
    rowEl.appendChild(nameEl);
    rowEl.appendChild(priceEl);
    fragment.appendChild(rowEl);
  });
  table.appendChild(fragment);
  data = rows;
});

const isMatch = ( row ) => {
  for (let i = 0; i < MEASURES.length; i++) {
    const measure = MEASURES[i];
    const filter = filters[measure];
    const value = row[measure];
    if (!filter) continue;
    if (value < filter[0] || value > filter[1]) return false;
  }
  return true;
};

function updateData() {
  1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    row.el.style.display = isMatch(row) ? '' : 'none';
    tableEl.scrollTop = 0;
  }
}
