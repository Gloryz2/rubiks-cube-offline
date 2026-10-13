# 安全政策

## 范围

当前维护范围是本仓库的最新源码与对应的 `index.html`。应用没有服务端、用户账户或密钥，求解过程由本地 Web Worker 执行。

## 报告问题

发现可能泄露信息、突破内容安全策略或执行非预期代码的问题，请优先使用仓库 **Security → Report a vulnerability** 的私密报告入口。该入口是否可用取决于仓库的实际设置。

如果私密报告入口尚未启用，请先在 Issue 中只说明需要建立私密报告渠道，不附攻击代码、凭据、个人信息或可被直接利用的细节。普通功能问题可通过 Issue 报告。

报告建议包含受影响版本、浏览器、简短复现步骤和影响范围。请只使用合成数据，并移除个人信息。

## 维护检查

- `npm ci --ignore-scripts` 使用锁文件并跳过安装生命周期脚本。
- `npm run check` 验证构建一致性、求解与转动方向、安全策略和发布文件隐私。
- `npm audit` 检查 npm 依赖。`vendor/` 中的 cubejs 需要另行按版本检查上游公告或漏洞数据库，npm audit 不自动覆盖这些拷贝。
- 更新依赖时固定版本、更新锁文件、核对许可，再重建和验证离线功能。
- GitHub 工作流只有读取仓库内容的权限，不自动部署或公开仓库。

内嵌 CSP 仅是浏览器防护的一部分，不等同于完整安全审计。HTTP 托管环境可另行配置响应头，例如 `frame-ancestors 'none'`、`X-Content-Type-Options: nosniff` 和 `Referrer-Policy: no-referrer`；`frame-ancestors` 必须通过 HTTP 响应头设置。
