import noUiSlider                                                                 from 'nouislider';
import { CONST_URL, DATA_URL, DEFAULT_FROM, DEFAULT_TO, MATERIALS_URL, MEASURES } from "src/helpers/const";
import { getFilter, onChangeFilters, refreshFilter }                              from "src/helpers/filters";
import { loadConstants, loadData, loadMaterials }                                 from "src/helpers/loadData";
import { ceil10 }                                                                 from "src/helpers/math";
import styles                                                                     from './style.scss';

const filters = {};
let data = [];
let constants = null;
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
    const values = slider.get();
    slider.set([this.value, null]);
    filters[name] = [this.value, +values[1]];
    updateData();
  });
  toEl.addEventListener('change', function () {
    const values = slider.get();
    slider.set([null, this.value]);
    filters[name] = [+values[0], this.value];
    updateData();
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

onChangeFilters(( filter ) => {
  refreshTable(filter);
});

Promise.all([
  loadData(DATA_URL),
  loadConstants(CONST_URL),
  loadMaterials(MATERIALS_URL),
]).then(( [{ rows, edges }, _constants, _materials] ) => {
  constants = _constants;
  updateMaterials(_materials);

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

  refreshFilter();
  const filter = getFilter();
  rows.forEach(row => {
    const rowEl = document.createElement('tr');
    const nameEl = document.createElement('td');
    const price100El = document.createElement('td');
    const price50El = document.createElement('td');
    const price30El = document.createElement('td');
    nameEl.innerText = `${row.width} х ${row.depth} х ${row.height} мм, крышка ${row.cap} мм`;
    row.el = rowEl;
    row.price100El = price100El;
    row.price50El = price50El;
    row.price30El = price30El;
    rowEl.appendChild(nameEl);
    rowEl.appendChild(price100El);
    rowEl.appendChild(price50El);
    rowEl.appendChild(price30El);
  });
  data = rows;
  refreshTable(filter);
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

const updateMaterials = ( materials ) => {
  let fragment = document.createDocumentFragment();
  materials.forEach(material => {
    const optionEl = document.createElement('option');
    optionEl.innerText = material[0];
    optionEl.value = material[1];
    fragment.appendChild(optionEl);
  });
  document.querySelector('[name="material"]').appendChild(fragment);
};

function updateData() {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    row.el.style.display = isMatch(row) ? '' : 'none';
    tableEl.scrollTop = 0;
  }
}

function refreshTable( filter ) {
  data.forEach(row => updateRowPrice(row, filter));
  data = data.sort(( el1, el2 ) => {
    const f1 = el1.price;
    const f2 = el2.price;
    return f1 === f2 ? 0 : f1 > f2 ? 1 : -1;
  });
  let fragment = document.createDocumentFragment();
  data.forEach(row => fragment.appendChild(row.el));
  const table = tableEl.querySelector('tbody');
  table.innerHTML = '';
  table.appendChild(fragment);
}

function updateRowPrice( row, filter ) {
  const { MATERIAL_PRICE, PRINT_TOP, PRINT_BOTTOM, LAMINATION_TOP, LAMINATION_BOTTOM, PET_WINDOW } = filter;
  const {
          BN_01,
          MAX_PER_LIST,
          BN_02,
          MIN_LOGO_PRICE,
          LOGO_COEFFICIENT,
          MIN_FULLPRINT_PRICE,
          FULLPRINT_COEFFICIENT,
          LAMINATION_PRICE,
          INDIRECT_COSTS,
          WORKING_MINUTES,
          PLOTTERS_COUNT,
          PET_1CM,
          MIN_WINDOW_PRICE,
          WINDOW_COEFFICIENT,
          CUTTING_MARGIN,
          PRICEUP_COEFFICIENT,
        } = constants;

  // Изделий/листе
  const perList = row.topPerList + (row.bottomPerList || row.topPerList);

  // мин/кор
  const perMin = (BN_01 + MAX_PER_LIST / perList * BN_02) / 60;

  // Себестоимость - картон
  const priceCardboard = ceil10(MATERIAL_PRICE / row.topPerList + (row.bottomPerList ? MATERIAL_PRICE / row.bottomPerList : 0), -1);

  // Себестоимость - печать
  const pricePrintTop = PRINT_TOP === 'LOGO'
    ? MIN_LOGO_PRICE + row.width * row.depth / LOGO_COEFFICIENT
    : PRINT_TOP === 'FULL'
      ? MIN_FULLPRINT_PRICE + ((row.cap * 2 + row.width) * (row.cap * 2 + row.depth) / FULLPRINT_COEFFICIENT)
      : 0;
  const pricePrintBottom = PRINT_BOTTOM === 'LOGO'
    ? MIN_LOGO_PRICE + row.width * row.depth / LOGO_COEFFICIENT
    : PRINT_BOTTOM === 'FULL'
      ? MIN_FULLPRINT_PRICE + ((row.height * 2 + row.width) * (row.height * 2 + row.depth) / FULLPRINT_COEFFICIENT)
      : 0;
  const pricePrint = pricePrintTop + pricePrintBottom;

  // Себестоимость - ламинация
  const laminationPrice = ceil10(LAMINATION_PRICE * (
    (LAMINATION_TOP ? 1 / row.topPerList : 0) +
    (LAMINATION_BOTTOM ? row.bottomPerList ? 1 / row.bottomPerList : 0 : 0)
  ), -1);

  // Себестоимость - резка
  const cuttingPrice = ceil10(INDIRECT_COSTS / (WORKING_MINUTES / perMin * PLOTTERS_COUNT), -1);

  // Себестоимость - пленка пэт
  const petPrice = PET_WINDOW
    ? ceil10(PET_1CM * row.width / 10 * row.depth / 10, -1)
    : 0;

  // Себестоимость - прикл. окошка
  const windowPrice = PET_WINDOW
    ? (MIN_WINDOW_PRICE + ceil10((row.width / 10 * row.depth / 10 / WINDOW_COEFFICIENT), -1))
    : 0;

  const selfPrice = priceCardboard + pricePrint + laminationPrice + cuttingPrice + petPrice + windowPrice;

  const marginCoefficient =
          PRINT_TOP === 'LOGO' ? 1 : PRINT_TOP === 'FULL' ? 2 : 0 +
          PRINT_BOTTOM === 'LOGO' ? 1 : PRINT_BOTTOM === 'FULL' ? 2 : 0 +
          LAMINATION_TOP ? 1 : 0 +
          LAMINATION_BOTTOM ? 1 : 0 +
          PET_WINDOW ? 1 : 0;

  const marginPrice = ceil10((CUTTING_MARGIN / (WORKING_MINUTES / perMin * PLOTTERS_COUNT)) * (1 + 0.15 * marginCoefficient), -1);

  const totalPrice = selfPrice + marginPrice;

  row.price = totalPrice;
  const price50 = totalPrice * PRICEUP_COEFFICIENT;
  const price30 = price50 * PRICEUP_COEFFICIENT;
  row.price100El.innerText = `${ceil10(totalPrice, -1).toFixed(2).replace('.', ',')} р.`;
  row.price50El.innerText = `${ceil10(price50, -1).toFixed(2).replace('.', ',')} р.`;
  row.price30El.innerText = `${ceil10(price30, -1).toFixed(2).replace('.', ',')} р.`;
}
