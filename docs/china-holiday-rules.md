# 中国节假日与调休规则维护说明

## 规则口径

- `WORKDAY`：普通工作日，按工作日加班规则计算。
- `WEEKEND`：普通周末。仅当工作规则开启 `weekendEnabled` 时，按休息日加班口径计算。
- `HOLIDAY`：法定节假日。仅当工作规则开启 `holidayEnabled` 时，按节假日加班口径计算。
- `ADJUSTED_WORKDAY`：调休补班日，即使日期落在周六或周日，也按普通工作日规则计算。

运行时统计只读取本地规则，不直接请求第三方 API，避免接口波动影响历史报表。

## 数据来源

年度规则以国务院办公厅发布的节假日安排为准，开放 API 只作为生成候选数据和交叉复核来源。

- 官方来源：`https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm`
- 候选生成 API：`https://timor.tech/api/holiday/year/2026/`

## 更新年度规则

1. 拉取候选规则：

```bash
npm run calendar:sync -- 2026
```

2. 如需保留候选 JSON 便于人工复核：

```bash
npm run calendar:sync -- 2026 -- --write-json
```

3. 对照国务院办公厅通知复核候选规则。

4. 将复核后的年度规则合并到 `lib/calendar/china-holiday-rules.ts`，同时更新 `chinaHolidayRuleSources`。

5. 运行验证：

```bash
npm test -- lib/attendance/calculate.test.ts
npm run lint
npm run build
```

## 运营注意事项

- 已生成的分享快照不会跟随规则变更自动变化。
- 如果规则变更影响历史打卡记录，需要先确认是否批量重算历史记录。
- 后续若要支持运营后台维护，应增加规则版本号、审批记录、操作者、变更原因和受影响月份。
