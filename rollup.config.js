import typescript from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve'
// 为了让rollup识别commonjs类型的包,默认只支持导入ES6
import commonjs from 'rollup-plugin-commonjs';

// 代码生成sourcemaps
import sourceMaps from 'rollup-plugin-sourcemaps'
import path from 'path'
export default {
  input:path.resolve(__dirname,"./src/index.ts"),
  plugins:[
    typescript(),
    commonjs(),
    sourceMaps()
  ],
  output:[{
    format: 'cjs',
    file: path.resolve(__dirname,'./lib/index.js'),
    sourcemap: true
  }]
}
