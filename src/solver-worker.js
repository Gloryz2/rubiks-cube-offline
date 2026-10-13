// build.mjs prepends the vendored cube.js model and two-phase solver.
Cube.initSolver();
postMessage({ type: 'ready' });
onmessage = ({ data }) => {
  try {
    postMessage({ type: 'solution', solution: Cube.fromString(data.state).solve(22) });
  } catch {
    postMessage({ type: 'error', message: '本次求解未完成，请重新计算。' });
  }
};
