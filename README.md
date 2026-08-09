# HSBC 通用申请工作流控制台

> Universal Workflow Console —— 一个以「Schema 驱动」为核心的通用申请审批系统演示。
> 纯前端 SPA、无真实后端、Mock 数据可复现，用于展示「一种申请类型 = 一份 Schema」的可扩展工作流设计。

---

## 一、项目概述

本系统实现了一个面向企业内部的**通用申请审批平台**：

- **单一业务形态落地**：产品当前收敛为「差旅申请」一种业务类型，但底层以通用 Schema 建模 —— 新增申请类型只需追加一份 Schema 定义，无需改动表单 / 校验 / 详情代码。
- **Schema 驱动**：表单渲染、预览、详情展示、字段校验全部由字段定义（`FieldDef`）自动生成。
- **多级并行审批（会签）**：审批链上的所有审批人可同时审批（无先后顺序），全部批准才通过，任一驳回即终止。
- **双角色视角**：同一登录用户可在「申请人 / 审批人」两种角色间切换，导航骨架随之变化。
- **中英文双语**：内置轻量 i18n（约 60 行，不依赖重型库），语言偏好持久化。
- **统计仪表盘**：待审批大数字、30 天趋势、状态分布、出行方式分布等，全部由数据响应式推导。
- **完整测试体系**：Vitest 单元测试覆盖全部核心模块，72 个用例，语句覆盖率 97%+。

> 视觉语言采用汇丰数字银行风格：**红 · 白 · 黑**（品牌红 `#DB0011`、炭黑侧栏、白色内容区）。

---

## 二、技术栈

| 类别 | 选型 | 说明 |
| ---- | ---- | ---- |
| 框架 | **SvelteKit 2 + Svelte 5** | 使用 Svelte 5 runes（`$state` / `$derived` / `$effect` / `$props`） |
| 语言 | **TypeScript** | 领域类型集中在 `src/lib/types.ts` |
| 样式 | **Tailwind CSS v4** | 品牌令牌在 `app.css`，TS 中类名可被扫描收集 |
| 构建 | **Vite 6** | dev / build / preview |
| 图表 | **ECharts 5** | 封装为 `EChart.svelte` 组件 |
| 测试 | **Vitest 3 + jsdom 24 + v8 coverage** | 单元测试 / 覆盖率 / JUnit / HTML 报告 |
| 部署 | **@sveltejs/adapter-static** | `fallback: 'index.html'`，纯 SPA（`ssr = false`） |

> 环境要求：Node.js 18–21（jsdom 固定为 ^24 以兼容 Node 21；Node ≥22 亦可正常运行）。

---

## 三、快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:5173）
npm run dev

# 生产构建 / 预览构建产物
npm run build
npm run preview

# 类型检查
npm run check

# 单元测试（快速）
npm test

# 单元测试（监听模式）
npm run test:watch

# 单元测试 + 完整报告（JUnit XML / HTML / 覆盖率）
npm run test:report
```

> 所有数据均为 Mock：进入系统即加载 148 条固定种子数据（见「数据层」），可在「设置 → 重置演示数据」中恢复初始状态。

---

## 四、目录结构

```
src/
├── app.css                      # 全局样式 + 品牌令牌（红/黑/白、状态色）
├── app.html / app.d.ts
├── lib/
│   ├── types.ts                 # ★ 领域模型契约中心（状态/Schema/申请/表格列）
│   ├── workflow/                # ★ 工作流状态机 + 并行审批进度
│   ├── schema/                  # ★ Schema 驱动核心
│   │   ├── presets.ts           #    预置差旅类型字段定义
│   │   ├── auto.ts              #    auto 字段自动填充（申请人信息派生）
│   │   └── validate.ts          #    校验与值规范化
│   ├── api/                     # ★ Mock API 层（异步 + 模拟延迟）
│   ├── store/                   # 响应式数据（applications/people/templates/role）
│   ├── i18n/                    # 轻量国际化 + zh-CN / en-US 词条
│   ├── utils/                   # format / charts 工具
│   └── components/              # 可复用组件（表单、表格、时间线、图表等）
├── routes/                      # SvelteKit 文件路由（页面见下文）
└── **/*.test.ts                 # Vitest 单元测试（与被测模块同目录）

test-results/                    # 测试报告输出（npm run test:report 生成，已 gitignore）
├── junit.xml                    # JUnit 报告（可接入 CI）
├── html/                        # 交互式 HTML 测试报告
└── coverage/                    # v8 覆盖率报告（HTML + JSON 摘要）
```

---

## 五、核心概念

### 5.1 领域模型（`src/lib/types.ts`）

整个系统的「契约中心」，各模块引用同一套类型：

- **`ApplicationStatus`**：`draft | submitted | approved | rejected`。
- **`ApplicationTypeSchema`**：一种申请类型 = 一组 `FieldDef[]`。
- **`FieldDef`**：单个字段定义，支持 `text / textarea / number / date / datetime / select / file` 控件类型。
- **`Application`**：一条申请，含 `fields`（字段值字典）、`approvers`（审批链）、`events`（审计时间线）。
- **`TimelineEvent`**：时间线事件（created / submitted / approved / rejected / resubmitted / edited / waiting）。

**字段关键标志位：**

| 标志 | 含义 |
| ---- | ---- |
| `auto` | 申请人公共字段（姓名/工号/部门/岗位/电话/申请时间），由系统派生、只读（见 `schema/auto.ts`） |
| `system` | 流程字段（如 `approval_status`），不入表单，详情页渲染状态徽章 |
| `showIf` | 条件显示（如「预借金额」仅在「预借差旅费 = 是」时出现） |
| `required / min / max / after` | 必填、数值范围、日期交叉校验（结束 ≥ 开始） |

> ⚠️ **字段顺序即展示顺序**：Schema 中 `fields` 数组的顺序就是表单 / 预览 / 详情页的展示顺序（单一数据源，渲染层不做二次排序）。当前遵循「核心决策字段在前、富文本事由靠后、附件垫底」的重要性排序约定。

### 5.2 Schema 驱动（`src/lib/schema/`）

- `presets.ts`：定义 `TRAVEL_SCHEMA`（差旅），`BUILT_IN_SCHEMAS = [TRAVEL_SCHEMA]` 为当前唯一开放的内置类型。
- `validate.ts`：
  - `isFieldVisible()`：`auto / system / showIf 不满足` 的字段不参与录入与校验；
  - `validateFields()`：必填、数字范围、日期交叉校验，返回错误映射；
  - `normalizeValues()`：number 字符串转数字、清理条件字段残留值。
- `auto.ts`：从所选申请人档案派生申请人公共字段；`apply_time`（提交时间）不在此预填，由 API 层在提交时刻写入。

### 5.3 工作流状态机（`src/lib/workflow/index.ts`）

```
draft ──submit──▶ submitted ──approve──▶ approved（终态）
  ▲                   │
  │                   └──reject──▶ rejected ──resubmit──▶ submitted
  └── saveDraft（创建时即为 draft，无流转）
```

- 合法流转集中在 `TRANSITIONS` 表；任何状态变更必须经过 `assertTransition()` 校验，**非法流转直接抛错**。
- `STATUS_META`：状态徽章配色（Tailwind 类名字面量，v4 可扫描 `.ts` 收集）。

**并行多级审批规则：**

- 审批链 `approvers` 上所有人可**同时**审批（无先后）；
- 每人批准追加一条 `approved` 事件，**全部批准**才置为 `approved`；
- **任一人驳回**即置为 `rejected`；
- 重新提交（`resubmit`）后进度清零、从头再来（进度只统计最近一次提交之后的事件）；
- `canDecide()`：判断某人当前能否审批（状态为 submitted + 在审批链上 + 本轮未批过）。

### 5.4 审批链与人员（`src/lib/store/people.ts`）

- 默认审批链 = **申请人所在部门负责人 + 合规审批人（沈亦清）**，并行会签；
- 「不能审批自己」：申请人是负责人时跳过，申请人是合规审批人时不加入自己；极端情况链为空时兜底任选一位其他负责人；
- 当前登录用户 `CURRENT_USER`（沈亦清，工号 HS-2001）固定作为审批链终审级；
- 员工检索支持工号 / 中文名 / 英文名 / 邮箱（不区分大小写）。

---

## 六、数据层与 Mock

| 模块 | 职责 |
| ---- | ---- |
| `store/applications.ts` | 用固定种子 `mulberry32(20260806)` 生成 **148 条**差旅演示申请（状态权重：已批准 45% / 待审批 25% / 已驳回 18% / 草稿 12%），`resetApplications()` 可恢复初始 |
| `store/people.ts` | 9 名员工候选（申请人 / 审批人），含工号、双语姓名、部门、岗位、电话 |
| `store/templates.ts` | 申请类型模板（当前仅差旅一种内置类型） |
| `store/role.ts` | 当前角色（applicant / approver），持久化到 localStorage |
| `api/index.ts` | **Mock API 层**：以「异步 + 模拟网络延迟（约 260ms）」封装对 store 的读写 |

**`api/index.ts` 主要接口：**

- `listApplications(query)`：过滤（类型/状态/关键字）+ 创建时间倒序；
- `getApplication(id)`：按单号查询；
- `createApplication()`：创建（草稿或直接提交），`apply_time` 仅提交时写入；
- `updateFields()` / `updateApprovers()`：草稿/驳回态下修改；
- `transition(id, action, comment)`：执行流转（submit/approve/reject/resubmit），非法流转由状态机拦截；并行会签中间票保持 `submitted`，全部批准才置 `approved`；
- `deleteApplications(ids)`：批量删除，仅允许删除草稿，已流转的申请受状态机保护。

> 🔌 **接入真实后端**：页面组件依赖的 store 结构保持不变，只需替换 `api/index.ts` 的读写实现即可。

---

## 七、页面与路由

| 路由 | 说明 |
| ---- | ---- |
| `/` | 307 重定向 → `/dashboard` |
| `/dashboard` | 仪表盘：待审批大数字卡、30 天趋势、KPI 三卡、状态/出行方式分布、最近申请 |
| `/applications` | 个人申请列表（scope=`mine`），支持 `?status=` 预选筛选、`?view=stats` 统计视图 |
| `/applications/new` | 新建申请：选择申请人 → Schema 驱动表单 → 保存草稿 / 提交 |
| `/applications/[id]` | 申请详情：字段展示、审批链、时间线、审批操作 |
| `/approvals` | 待我审批（scope=`pending-approval`），行内可批准/驳回 |
| `/approvals/done` | 已处理 |
| `/settings` | 语言切换、重置演示数据、关于 |
| `/stats` | 307 重定向 → `/applications?view=stats`（统计已合并进列表） |
| `/templates` | 307 重定向 → `/applications`（单一差旅类型不再开放模板管理） |

**导航骨架随角色变化**（`+layout.svelte`）：

- 申请人：仪表盘 / 申请中心 / 设置；
- 审批人：仪表盘 / 审批中心（待我审批、已处理）/ 设置。

---

## 八、国际化（i18n）

`src/lib/i18n/` 提供约 60 行的轻量方案（不引入重型库），满足：

- **词条分层**：`zh-CN.ts` / `en-US.ts` 嵌套对象，`'a.b.c'` 路径取值；
- **插值**：`$t('common.total', { n: 12 })`；
- **持久化**：语言偏好存 `localStorage`（key: `hsbc-wf-locale`）；初始「本地记忆 > 浏览器语言 > 默认中文」；
- **回退**：查不到词条回退中文，再回退键本身 —— 使自定义文本也能直接作为 label。

---

## 九、组件库（`src/lib/components/`）

| 组件 | 用途 |
| ---- | ---- |
| `SchemaForm` | Schema 驱动的动态表单（核心） |
| `Field` / `Input` / `Select` / `Textarea` / `FileUpload` | 各字段控件 |
| `DataTable` | 通用表格（列定义 + 排序） |
| `ApplicationsListView` | 申请列表视图（`mine` / `pending-approval` / `done` 等 scope） |
| `ApprovalChain` / `ApproverPicker` | 审批链展示 / 审批人选择 |
| `Timeline` | 审计时间线 |
| `EChart` / `StatCard` / `StatsPreview` | 图表与统计卡 |
| `StatusBadge` / `TypeIcon` / `FileChips` / `Avatar` | 状态徽章 / 类型图标 / 附件条目 / 头像 |
| `Modal` / `Toast` / `EmptyState` / `NotificationCenter` | 通用交互件 |
| `HexLogo` / `WorldTexture` / `Button` | 品牌视觉元素与基础件 |

---

## 十、测试（Vitest）

测试体系基于 **Vitest 3 + jsdom + v8 coverage**，配置见 `vitest.config.ts`（复用 `sveltekit()` 插件以解析 `$app/*` 与 `$lib/*` 别名）。

```bash
npm test              # 快速运行全部测试
npm run test:watch    # 监听模式
npm run test:report   # 测试 + JUnit XML + HTML 报告 + v8 覆盖率
```

**测试分布（11 个文件 / 72 个用例，与被测模块同目录）：**

| 测试文件 | 用例数 | 覆盖重点 |
| ---- | ---- | ---- |
| `api/index.test.ts` | 13 | 查询过滤、创建草稿/提交、并行会签流转、非法流转拦截、删除保护 |
| `workflow/index.test.ts` | 7 | 状态机流转规则、审批进度统计、`canDecide` 准入 |
| `schema/validate.test.ts` | 8 | 必填/数字范围/日期交叉校验、条件字段、值规范化 |
| `schema/auto.test.ts` | 6 | 申请人档案派生、防 `$effect` 循环 |
| `schema/presets.test.ts` | 5 | 字段唯一性、字段顺序即重要性顺序、条件字段成对出现 |
| `store/applications.test.ts` | 7 | 148 条种子数据完整性、时间线递增、重置 |
| `store/people.test.ts` | 10 | 人员检索、默认审批链（含「不能审批自己」各分支） |
| `store/role.test.ts` | 2 | 角色切换与持久化 |
| `store/templates.test.ts` | 3 | 类型模板查询与重置 |
| `i18n/index.test.ts` | 4 | 翻译、插值、回退、语言切换 |
| `utils/format.test.ts` | 7 | 日期/金额/数字/字节格式化、`uid` 唯一性 |

**覆盖率（最近一次运行）**：语句/行 **97.59%**、分支 **90.74%**、函数 **91.52%**。

**报告产物**（`test-results/`，已 gitignore）：

- `test-results/junit.xml` —— JUnit 报告，可直接接入 CI；
- `test-results/html/index.html` —— 交互式 HTML 测试报告（`npx vite preview --outDir test-results/html` 预览）；
- `test-results/coverage/index.html` —— 逐行高亮的覆盖率报告。

---

## 十一、本地存储键

| Key | 用途 |
| ---- | ---- |
| `hsbc-wf-locale` | 当前语言（zh-CN / en-US） |
| `hsbc-wf-role` | 当前角色（applicant / approver） |
| `hsbc-wf-sidebar-collapsed` | 侧栏收起状态（桌面端） |

---

## 十二、设计要点与扩展

1. **单一数据源**：字段展示顺序、校验规则、表单结构全部由 Schema 决定，渲染层不做二次排序。
2. **类型契约集中**：所有领域类型在 `types.ts`，避免各模块重复定义。
3. **状态机强约束**：非法流转在 API 层抛错，保证流程一致性。
4. **Mock 可复现**：固定种子伪随机（`mulberry32(20260806)`），每次进入系统初始数据一致。
5. **扩展一种申请类型**：在 `schema/presets.ts` 新增一份 `ApplicationTypeSchema` 并加入 `BUILT_IN_SCHEMAS` 即可，无需改动表单/校验/详情代码。
6. **可测试性**：核心业务逻辑（状态机、校验、API、store）均为纯函数/可独立实例化模块，测试与被测代码同目录就近维护。

---

*v1.0 · UNIVERSAL WORKFLOW · HSBC 演示项目（Mock 数据，仅用于方案展示）*
