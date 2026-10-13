// Face and facelet order matches cube.js: U, R, F, D, L, B.
export const faceOrientation = {
  U: { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
  R: { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] },
  F: { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  D: { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] },
  L: { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] },
  B: { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
};

export const facelets = Object.entries(faceOrientation).flatMap(
  ([face, { normal, right, up }]) => Array.from({ length: 9 }, (_, index) => ({
    face,
    normal,
    position: normal.map((value, axis) =>
      value + (index % 3 - 1) * right[axis] + (1 - Math.floor(index / 3)) * up[axis]),
  })),
);

export function turnInfo(move) {
  return {
    normal: faceOrientation[move[0]].normal,
    angle: -Math.PI / 2 * (move.endsWith('2') ? 2 : move.endsWith("'") ? -1 : 1),
  };
}

export function createScramble() {
  const faces = Object.keys(faceOrientation);
  const powers = ['', "'", '2'];
  const moves = [];
  for (let index = 0; index < 25; index++) {
    const choices = faces.filter(face => face !== moves.at(-1)?.[0]);
    moves.push(choices[Math.floor(Math.random() * choices.length)] + powers[Math.floor(Math.random() * 3)]);
  }
  return moves;
}
