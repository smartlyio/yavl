import Benchmark from 'benchmark';
import { getIndicesFromStrPath_original, getIndicesFromStrPath_optimized } from './getIndicesFromStrPath';

// Test cases that cover different scenarios
const testCases = [
  'simple.path',
  'array[0].nested[1].path',
  'deeply.nested.path.with.many.segments',
  'mixed[0].path[1].with[2].arrays[3]',
  'a[0].b[1].c[2].d.e[3]',
  'single',
  'array[123456789]',
  'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z',
  '[0][1][2][3][4][5][6][7][8][9][10]',
  'array[0].array[1].array[2].array[3].array[4].array[5]',
  'array[0].array[1].array[2].array[3].array[4].array[5].array[6].array[7].array[8].array[9].array[10]',
  // Property access test cases
  // Not enabled as the original implementation doesn't support it
  // 'arr[0].obj[property]',
  // 'arr[0].obj[property].nested[1]',
  // 'arr[0][property][1].nested[2]',
  // 'obj[property][0].arr[1]',
  // 'deeply.nested[0].obj[property].path[1]',
];

// Benchmark suite
const suite = new Benchmark.Suite();

suite
  .add('getIndicesFromStrPath_original', () => {
    testCases.forEach(path => getIndicesFromStrPath_original(path));
  })
  .add('getIndicesFromStrPath_optimized', () => {
    testCases.forEach(path => getIndicesFromStrPath_optimized(path));
  })
  .on('cycle', (event: any) => {
    console.log(String(event.target));
  })
  .on('complete', function (this: any) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });
