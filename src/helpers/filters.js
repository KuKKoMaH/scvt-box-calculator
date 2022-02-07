import { parseInt } from "src/helpers/math";

let _cb = null;

const mapping = {
  material:           'material',
  printTopEnabled:    'print_top_enabled',
  printTop:           'print_top',
  printBottomEnabled: 'print_bottom_enabled',
  printBottom:        'print_bottom',
  laminationTop:      'lamination_top',
  laminationBottom:   'lamination_bottom',
  petWindow:          'pet_window',
};

const values = {};

const updateValue = ( key, el ) => {
  values[key] = el.type === 'checkbox' ? el.checked : el.value;
  updateFilter();
};

const updateFilter = () => {
  if (!_cb) return;
  _cb(getFilter());
};

export const refreshFilter = () => {
  for (let key in mapping) {
    const el = document.querySelector(`[name="${mapping[key]}"]`);
    el.addEventListener('change', ( e ) => updateValue(key, el));
    updateValue(key, el);
  }
};


export const onChangeFilters = ( cb ) => _cb = cb;

export const getFilter = () => ({
  MATERIAL_PRICE:    parseInt(values.material),
  PRINT_TOP:         values.printTopEnabled ? values.printTop === "logo" ? 'LOGO' : 'FULL' : 'NO',
  PRINT_BOTTOM:      values.printBottomEnabled ? values.printBottom === "logo" ? 'LOGO' : 'FULL' : 'NO',
  LAMINATION_TOP:    values.laminationTop,
  LAMINATION_BOTTOM: values.laminationBottom,
  PET_WINDOW:        values.petWindow,
});
