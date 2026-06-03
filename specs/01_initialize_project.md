# 專案初始化規格與執行紀錄 (01_initialize_project)

本文件定義並記錄了 `Case Manager System` 專案的手動 Scaffolding 與初始化規格。

## 1. 規格背景與目的

原定透過 `specify init . --ai gemini --script ps --here` 初始化 Spec Kit 專案。然而：
1. 本地 `specify` 舊版 CLI 受到無效的 `GITHUB_TOKEN` 影響，對 GitHub API 請求回傳了 401 錯誤。
2. GitHub 遠端 Releases 缺少 `gemini` 與 `ps` 的 zip 模板資源。

為了在不破壞開發流程的前提下建立標準的 Spec-Driven Development (SDD) 專案結構，本步驟採用手動 Python Scaffolding 方案，直接引用最新版 `spec-kit` 倉庫中的模板與 powershell 腳本，構建出相容於最新 `spec-kit` 設計的專案結構，特別是為 `gemini` CLI 的 TOML 指令格式進行適配。

## 2. 專案目錄結構設計

初始化完成後，專案結構應包含以下部分：

```text
Case Manager System/
├── .specify/                         # Spec Kit 核心管理目錄
│   ├── templates/                    # 各階段的 Markdown Scaffolding 模板
│   │   ├── checklist-template.md
│   │   ├── constitution-template.md
│   │   ├── plan-template.md
│   │   ├── spec-template.md
│   │   └── tasks-template.md
│   ├── scripts/
│   │   └── powershell/               # 自動化執行腳本 (PowerShell 版本)
│   │       ├── check-prerequisites.ps1
│   │       ├── common.ps1
│   │       ├── create-new-feature.ps1
│   │       ├── setup-plan.ps1
│   │       └── setup-tasks.ps1
│   ├── memory/
│   │   └── constitution.md           # 專案憲法/開發規範 (初始化自範本)
│   ├── integrations/
│   │   ├── speckit.manifest.json     # 追蹤共享基礎設施檔案雜湊
│   │   └── gemini.manifest.json      # 追蹤 Gemini CLI 整合檔案雜湊
│   ├── extensions/
│   │   └── agent-context/
│   │       └── agent-context-config.yml # 整合上下文配置
│   ├── init-options.json             # 儲存 specify init 使用之參數
│   └── integration.json              # 儲存目前啟用之 Integration
├── .gemini/
│   └── commands/                     # Gemini CLI 指令檔目錄 (TOML 格式)
│       ├── speckit.analyze.toml
│       ├── speckit.checklist.toml
│       ├── speckit.clarify.toml
│       ├── speckit.constitution.toml
│       ├── speckit.implement.toml
│       ├── speckit.plan.toml
│       ├── speckit.specify.toml
│       ├── speckit.tasks.toml
│       └── speckit.taskstoissues.toml
├── specs/
│   └── 01_initialize_project.md      # 本初始化文件
├── GEMINI.md                         # Gemini CLI 自動載入的 Context 宣告檔案
└── spec-config.json                  # 專案層級設定檔
```

## 3. 核心轉譯與變更說明

- **Placeholders 替換**：所有 command templates 中的 `{SCRIPT}`, `{ARGS}`, `__AGENT__`, `__CONTEXT_FILE__` 等皆依據 `ps` 與 `gemini` 的條件完成替換，且相對路徑重寫為 `.specify/` 開頭。
- **指令格式轉換**：原 Markdown 格式命令轉譯為 TOML 物件，內含 `description` 及 `prompt` 字串欄位。
- **Context File 綁定**：建立 `GEMINI.md` 並配置於 `agent-context-config.yml` 中，設定 start/end 標記，未來在 `speckit.plan` 時，Gemini 會將技術規劃檔案路徑自動寫入其中作為 prompt context。
- **Manifest 生成**：將所有生成之 template 檔案與 toml 命令檔案的 SHA256 雜湊值記錄在 manifest 中，以符合 spec-kit CLI 的後續升級與檔案變更追蹤要求。

## 4. 驗證

本專案結構已成功建立。以下為後續的 SDD 執行指令流程：
1. `$speckit-constitution` 建立專案憲法原則
2. `$speckit-specify` 設計 feature spec.md
3. `$speckit-plan` 撰寫詳細的技術實作計畫
4. `$speckit-tasks` 分解為具體的 task.md 目錄
5. `$speckit-implement` 執行與交付實作
