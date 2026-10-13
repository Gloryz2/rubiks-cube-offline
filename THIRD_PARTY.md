# 第三方组件

| 组件 | 版本 | 用途 | 许可与来源 |
| --- | --- | --- | --- |
| Three.js（含 OrbitControls） | 0.180.0 / r180 | 3D 渲染与视角操作，构建时打包 | MIT；[源代码版本](https://github.com/mrdoob/three.js/tree/r180)，[本地许可](THREE-LICENSE.txt) |
| cubejs | 1.3.2 | 魔方状态模型与 Kociemba 两阶段求解器 | MIT；[上游项目](https://github.com/ldez/cubejs)，[固定版本 npm 包](https://registry.npmjs.org/cubejs/-/cubejs-1.3.2.tgz)，[本地许可](CUBEJS-LICENSE.txt) |
| esbuild | 0.28.2 | 开发时生成离线 HTML | MIT；[源代码版本](https://github.com/evanw/esbuild/tree/v0.28.2)；不作为运行时脚本分发 |

Three.js 与 esbuild 的精确下载来源、完整性校验和传递依赖记录在 `package-lock.json` 中。应用运行时不使用 npm 或 CDN。

`vendor/cube.js` 和 `vendor/solve.js` 从已有 HTML 提取，经换行规范化后与官方 cubejs 1.3.2 包内容一致，没有修改算法。

| 本地文件 | SHA-256（LF 换行） |
| --- | --- |
| `vendor/cube.js` | `450a53a9acf5033fde7ca23be8fd08ac37d30f04c58aac63f053a1c05a7f5802` |
| `vendor/solve.js` | `faa0ccffca78f80a5fe7a197a9676af02d79d8ddece9cf3506154fea616fc445` |

上游 cubejs 的原始 CoffeeScript 源码可在其项目和固定版本 npm 包中查阅。保留 `THREE-LICENSE.txt`、`CUBEJS-LICENSE.txt` 和 `LICENSE`；完整许可也内嵌于 `index.html`，方便单文件分发。
