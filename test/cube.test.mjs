import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { createScramble, facelets, turnInfo } from '../src/cube-math.js';

const context = {};
runInNewContext(readFileSync(new URL('../vendor/cube.js', import.meta.url), 'utf8'), context);
runInNewContext(readFileSync(new URL('../vendor/solve.js', import.meta.url), 'utf8'), context);
const { Cube } = context;

test('each animated layer rotation matches the cube.js facelet permutation', () => {
  const labels = new Cube().move("R U F2 L' D B2 R' U2 F L2 D'").asString();
  for (const face of ['U', 'R', 'F', 'D', 'L', 'B']) {
    for (const power of ['', "'", '2']) {
      const move = face + power;
      const { normal: axis, angle } = turnInfo(move);
      const rotated = [];
      const dot = vector => vector.reduce((sum, value, index) => sum + value * axis[index], 0);
      const rotate = vector => {
        const cross = [
          axis[1] * vector[2] - axis[2] * vector[1],
          axis[2] * vector[0] - axis[0] * vector[2],
          axis[0] * vector[1] - axis[1] * vector[0],
        ];
        return vector.map((value, index) => Math.round(
          value * Math.cos(angle) + cross[index] * Math.sin(angle) + axis[index] * dot(vector) * (1 - Math.cos(angle)),
        ));
      };
      facelets.forEach((sticker, index) => {
        const inLayer = dot(sticker.position) > 0.5;
        const position = inLayer ? rotate(sticker.position) : sticker.position;
        const normal = inLayer ? rotate(sticker.normal) : sticker.normal;
        const destination = facelets.findIndex(candidate =>
          candidate.position.every((value, coordinate) => value === position[coordinate]) &&
          candidate.normal.every((value, coordinate) => value === normal[coordinate]));
        assert.notEqual(destination, -1, move);
        rotated[destination] = labels[index];
      });
      assert.equal(rotated.join(''), Cube.fromString(labels).move(move).asString(), move);
    }
  }
});

test('generated scrambles have 25 valid moves with no repeated adjacent face and can be inverted', () => {
  for (let trial = 0; trial < 40; trial++) {
    const moves = createScramble();
    assert.equal(moves.length, 25);
    moves.forEach((move, index) => {
      assert.match(move, /^[URFDLB](?:2|')?$/);
      if (index) assert.notEqual(move[0], moves[index - 1][0]);
    });
    const algorithm = moves.join(' ');
    assert.ok(new Cube().move(algorithm).move(Cube.inverse(algorithm)).isSolved());
  }
});

test('two-phase solutions restore fixed and randomly generated scrambles', { timeout: 120000 }, () => {
  Cube.initSolver();
  const algorithms = ["R U R' U'", 'U2 R2 F2 D2 L2 B2', ...Array.from({ length: 6 }, () => createScramble().join(' '))];
  for (const algorithm of algorithms) {
    const cube = new Cube().move(algorithm);
    const solution = cube.solve(22);
    assert.ok(cube.clone().move(solution).isSolved(), algorithm);
    assert.ok(solution.trim().split(/\s+/).length <= 22);
  }
});
