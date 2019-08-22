import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [{
  input: 'raster/main.js',
  plugins: [
    resolve(),
  ],
  output: {
    file: 'raster/main.min.js',
    format: 'iife',
    name: 'rasterMap'
  }
}, {
  input: 'vector/main.js',
  plugins: [
    resolve(),
  ],
  output: {
    file: 'vector/main.min.js',
    format: 'iife',
    name: 'vectorMap'
  }
}, {
  input: 'macrostrat/main.js',
  plugins: [
    resolve(),
    commonjs(),
  ],
  output: {
    file: 'macrostrat/main.min.js',
    format: 'iife',
    name: 'macrostrat'
  }
}];
