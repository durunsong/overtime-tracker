# 安全策略

## 支持的版本

| 版本 | 支持状态 |
| --- | --- |
| `main` 分支最新代码 | ✅ 接受安全报告 |
| 已发布 tag / Release | ✅ 接受安全报告 |
| 其他旧分支或 fork | ❌ 不保证维护 |

## 报告方式

如果你发现了安全漏洞，**请不要公开创建 GitHub Issue**。

请通过 GitHub Security Advisories 私下报告：

https://github.com/durunsong/overtime-tracker/security/advisories/new

如无法使用上述入口，也可通过仓库 Owner 的 GitHub 联系方式私下沟通。

## 报告内容建议

- 漏洞类型与影响范围（认证、授权、数据隔离、注入、SSRF 等）
- 复现步骤或 PoC（请避免包含真实用户数据）
- 受影响的路由、组件或版本
- 如有修复建议，可一并说明

## 响应预期

- 我们会在合理时间内确认收到报告。
- 确认后会评估严重级别并安排修复与披露时间线。
- 修复完成后会在 Security Advisory 或 Release Notes 中说明。

## 自托管注意事项

部署实例时请至少做到：

- 使用强随机 `SESSION` / 数据库凭证，且不要提交 `.env`。
- 为生产环境配置 HTTPS 与正确的 `NEXT_PUBLIC_APP_URL`。
- 限制 AI Provider Key 权限，并定期轮换密钥。
- 公开分享链接仅暴露脱敏快照，不应替代完整权限控制。

## 已知边界

- 本项目面向个人/小团队考勤分析，不是企业级 IAM 或合规审计系统。
- AI 输出依赖外部模型与 Prompt，需结合真实数据人工复核。
