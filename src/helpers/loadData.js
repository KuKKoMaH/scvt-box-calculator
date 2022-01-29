import papaparse    from "papaparse";
import { MEASURES } from "src/helpers/const";
import { parseInt } from "src/helpers/math";

export const loadData = ( url ) => {
  return fetch(url)
    .then(resp => resp.text())
    .then(resp => {
      const { data } = papaparse.parse(resp);

      const edges = {};
      for (let j = 0; j < MEASURES.length; j++) {
        edges[MEASURES[j]] = [Number.MAX_SAFE_INTEGER, 0];
      }

      const rows = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const item = {};
        for (let j = 0; j < MEASURES.length; j++) {
          const measure = MEASURES[j];
          const value = parseInt(row[j]);
          if (value < edges[measure][0]) edges[measure][0] = value;
          if (value > edges[measure][1]) edges[measure][1] = value;
          item[measure] = value;
        }
        rows.push(item);
      }

      return { edges, rows };
    });
};

export const loadConstants = ( url ) => {
  return fetch(url)
    .then(resp => resp.text())
    .then(resp => {
      const { data } = papaparse.parse(resp);
      const constants = {};
      data.forEach(row => {
        if (row.length < 2) return;
        constants[row[0].trim()] = parseInt(row[1]);
      });
      return constants;
    });
};

export const loadMaterials = ( url ) => {
  return fetch(url)
    .then(resp => resp.text())
    .then(resp => {
      const { data } = papaparse.parse(resp);
      const materials = [];
      data.forEach(row => {
        if (row.length < 2) return;
        materials.push([row[0].trim(), parseInt(row[1])]);
      });
      return materials;
    });
};
