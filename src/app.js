import { createScramble } from './cube-math.js';
import { createCubeView, faceColors } from './cube-view.js';
import workerSource from './solver-worker.js';

const element = id => document.getElementById(id);
document.querySelectorAll('[data-face]').forEach(node => {
  const { color, ink, name } = faceColors[node.dataset.face];
  node.style.setProperty('--face-color', color);
  node.style.setProperty('--face-ink', ink);
  node.title = `${node.textContent}面 · ${name}`;
  node.setAttribute('aria-label', node.title);
});

const cube = new Cube();
const view = createCubeView(element('viewport'));
let busy = false;
let playing = false;
let moves = [];
let step = 0;
let solverReady = false;
let phase = '复原';
let scramble = [];
view.paint(cube.asString());
const worker = new Worker(URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' })));
worker.onmessage = ({ data }) => {
  if (data.type === 'ready') {
    solverReady = true;
    update();
    return;
  }
  busy = false;
  if (data.type === 'error') {
    element('status').textContent = data.message;
    update();
    return;
  }
  const solution = data.solution.trim().split(/\s+/).filter(Boolean);
  if (!cube.clone().move(solution.join(' ')).isSolved()) {
    element('status').textContent = '解法校验失败，请重新计算。';
    update();
    return;
  }
  moves = solution;
  step = 0;
  phase = '复原';
  element('status').textContent = `找到 ${solution.length} 步解法，可以逐步或自动复原。`;
  element('steps').replaceChildren(...solution.map(move => {
    const node = document.createElement('span');
    node.className = 'step';
    node.textContent = move;
    return node;
  }));
  update();
};
worker.onerror = () => {
  busy = false;
  solverReady = false;
  element('status').textContent = '求解器加载失败，请刷新页面重试。';
  update();
};

function update() {
  const remaining = step < moves.length;
  const move = moves[step];
  const faceNames = { U: '上', D: '下', L: '左', R: '右', F: '前', B: '后' };
  element('direction-dial').hidden = !move;
  element('direction-step').textContent = move
    ? `${phase} · ${busy ? '正在转动' : '下一步'} ${step + 1} / ${moves.length}`
    : moves.length ? `${phase}完成` : '先认识六个面';
  element('direction-symbol').textContent = move || '';
  element('direction-arrow').setAttribute('transform', move?.endsWith("'") ? 'translate(100 0) scale(-1 1)' : '');
  element('direction-action').textContent = move
    ? `${faceNames[move[0]]}面（${faceColors[move[0]].name}中心）${move.endsWith('2') ? '转动 180°（半圈）' : move.endsWith("'") ? '逆时针转 90°' : '顺时针转 90°'}`
    : moves.length ? phase === '打乱' ? '打乱完成，可以计算复原步骤。' : '六面已归位，可以重新打乱。'
      : '找到魔方中心的字母，辨认要转的面。';
  element('direction-perspective').textContent = move
    ? `正对${faceNames[move[0]]}面（${move[0]}）看${move.endsWith('2') ? '；180° 两个方向都可以。' : '，按箭头方向转动。'}`
    : '方向以正对要转的那一面为准。';
  document.querySelectorAll('[data-face]').forEach(node => node.classList.toggle('active', node.dataset.face === move?.[0]));
  element('scramble').disabled = busy || playing;
  element('replay-scramble').disabled = busy || playing || !scramble.length;
  element('solve').disabled = !solverReady || busy || playing || cube.isSolved() || remaining;
  element('solve').textContent = solverReady ? '计算复原步骤' : '正在初始化求解器…';
  element('next').disabled = busy || playing || !remaining;
  element('play').disabled = (!remaining || busy) && !playing;
  element('play').textContent = playing ? 'Ⅱ 暂停播放' : `▶ 自动${phase}`;
  element('count').textContent = phase === '复原' && moves.length ? `${moves.length} 步` : '— 步';
  element('progress-label').textContent = `${phase}进度`;
  element('progress-text').textContent = `${step} / ${moves.length}`;
  element('progress-fill').style.width = `${moves.length ? step / moves.length * 100 : 0}%`;
  element('state').textContent = remaining ? `${phase}${busy || playing ? '中' : '待继续'}` : cube.isSolved() ? '已复原' : '已打乱';
  [...element(phase === '打乱' ? 'scramble-text' : 'steps').children].forEach((node, index) => {
    node.className = 'step' + (index < step ? ' done' : index === step ? ' current' : '');
    if (index === step) node.setAttribute('aria-current', 'step');
    else node.removeAttribute('aria-current');
  });
}

function replayScramble() {
  phase = '打乱';
  moves = [...scramble];
  step = 0;
  element('steps').replaceChildren();
  cube.identity();
  view.paint(cube.asString());
  view.reset();
  element('scramble-text').replaceChildren(...scramble.map((move, index) => {
    const node = document.createElement('span');
    node.className = 'step';
    node.textContent = move;
    node.title = `第 ${index + 1} 步：${move}`;
    return node;
  }));
  element('scramble-details').open = true;
  element('status').textContent = '从复原状态开始：白面朝上、绿面朝前。点击下一步跟做，或自动打乱。';
  update();
}

element('scramble').onclick = () => {
  scramble = createScramble();
  replayScramble();
};
element('replay-scramble').onclick = replayScramble;
element('solve').onclick = () => {
  busy = true;
  element('status').textContent = '正在搜索较短解…';
  update();
  worker.postMessage({ state: cube.asString() });
};

async function nextStep() {
  if (busy || step >= moves.length) return;
  busy = true;
  update();
  await view.animate(moves[step], 450);
  cube.move(moves[step]);
  view.paint(cube.asString());
  step++;
  busy = false;
  element('status').textContent = `${phase}已完成 ${step} / ${moves.length} 步。`;
  if (step === moves.length) {
    playing = false;
    element('status').textContent = phase === '打乱'
      ? `已完成 ${step} 步打乱，可以计算复原步骤。`
      : `已完成全部 ${step} 步，魔方已复原。`;
  }
  update();
}

element('next').onclick = nextStep;
element('play').onclick = async () => {
  if (playing) {
    playing = false;
    update();
    return;
  }
  playing = true;
  update();
  while (playing && step < moves.length) await nextStep();
};
update();
