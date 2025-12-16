import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default [{
	input: './src/index.ts',
	output: [
		{
			file: "./lib/index.mjs",
			format: 'es',
			sourcemap: false,
		},{
			file: "./lib/index.cjs",
			format: 'cjs',
			sourcemap: false,
			exports: 'named',
		}
	],
	external: ['vue', 'vue-router'],
	plugins: [
		json(),
		resolve(),
		commonjs(),
		typescript({
			tsconfig: './tsconfig.json'
		}),
		terser()
	]
},{
	input: './src/index.ts',
	external: ['vue', 'vue-router'],
	output: {
		file: './lib/index.d.ts',
		format: 'es',
	},
	plugins: [dts()],
},]
