# RAG 接入规划

本文档规划如何把 RAG 加入当前学习助手小程序。目标不是一次性做复杂系统，而是按阶段把“基于笔记、错题和 OCR 记录的学习问答”做起来。

## 1. 接入目标

RAG 加入后，小程序应该支持：

- 基于已保存笔记问答。
- 基于错题本问答。
- 基于 OCR 识别记录问答。
- 查询某个知识点相关的笔记和错题。
- 为错题生成解析或复习建议。
- 根据已有资料总结知识点。

推荐先做最小可用版本：

```text
用户输入问题
-> 小程序请求后端
-> 后端从笔记、错题、OCR 记录中检索相关文本
-> 后端返回相关资料片段和简短回答
-> 小程序展示回答和引用来源
```

## 2. 当前项目适合接入 RAG 的原因

当前已经有三类可用于检索的学习资料：

- 笔记：`notebook_notes`
- 错题：`study_mistakes`
- OCR 识别记录：`ocr_history_records`

这些数据天然适合作为 RAG 的知识库来源。

当前限制是：

- 数据保存在小程序本地缓存中，后端默认拿不到。
- 后端只有 OCR 接口，没有知识库同步接口。
- 还没有大模型接口配置。
- 还没有向量数据库或检索索引。

所以第一步要先解决“前端本地数据如何同步到后端”。

## 3. 推荐分阶段路线

## 阶段一：本地关键词检索版

目标：不接大模型、不接向量数据库，先跑通知识库同步和问答页面。

### 3.1 前端新增页面

新增页面：

```text
miniprogram/pages/rag/rag
```

页面功能：

- 输入问题。
- 点击“提问”。
- 展示后端返回的回答。
- 展示匹配到的资料来源。
- 支持从首页进入。

首页需要新增入口：

```text
学习问答
```

### 3.2 前端新增数据同步方法

新增工具文件：

```text
miniprogram/utils/knowledge.ts
```

职责：

- 读取本地笔记、错题、OCR 记录。
- 转换成统一的知识文档格式。
- 请求后端同步接口。

统一格式建议：

```ts
export interface KnowledgeDocument {
  id: string
  sourceType: 'note' | 'mistake' | 'ocr'
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt?: string
}
```

转换规则：

- 笔记：
  - `sourceType = 'note'`
  - `title = note.title`
  - `content = note.content`
  - `tags = [note.category]`
- 错题：
  - `sourceType = 'mistake'`
  - `title = mistake.subject + '错题'`
  - `content = 题目 + 答案 + 解析`
  - `tags = mistake.tags + subject + mastered 状态`
- OCR 记录：
  - `sourceType = 'ocr'`
  - `title = 'OCR 识别记录'`
  - `content = record.text`
  - `tags = []`

### 3.3 后端新增知识库同步接口

新增接口：

```http
POST /knowledge/sync
```

请求体：

```json
{
  "documents": [
    {
      "id": "note-xxx",
      "sourceType": "note",
      "title": "操作系统课堂笔记",
      "content": "进程调度相关内容...",
      "tags": ["课堂笔记"],
      "createdAt": "2026-05-10T10:00:00.000Z",
      "updatedAt": "2026-05-10T10:30:00.000Z"
    }
  ]
}
```

后端处理：

- 校验请求体。
- 保存到本地 JSON 文件。
- 建议保存路径：

```text
server/data/knowledge_documents.json
```

### 3.4 后端新增关键词查询接口

新增接口：

```http
POST /rag/query
```

请求体：

```json
{
  "question": "进程调度是什么"
}
```

返回体：

```json
{
  "success": true,
  "answer": "根据已保存资料，进程调度主要是...",
  "matches": [
    {
      "id": "note-xxx",
      "sourceType": "note",
      "title": "操作系统课堂笔记",
      "snippet": "进程调度是操作系统...",
      "score": 0.82
    }
  ]
}
```

阶段一的回答可以先不用大模型，直接返回：

```text
已找到 3 条相关资料，请优先查看以下内容...
```

检索方式：

- 对问题分词或按字符切分。
- 在 `title`、`content`、`tags` 中匹配关键词。
- 按命中次数和字段权重排序。
- 返回前 5 条。

### 3.5 阶段一验收标准

- 首页能进入学习问答页。
- 学习问答页可以同步本地资料。
- 输入关键词后能返回相关笔记、错题或 OCR 记录。
- 回答区域能显示匹配摘要。
- 没有匹配结果时有明确提示。

## 阶段二：接入大模型生成回答

目标：在关键词检索基础上，让后端基于匹配资料生成自然语言回答。

### 4.1 后端新增大模型配置

建议使用环境变量：

```text
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
```

也可以先放到本地 `.env`，但不要提交真实密钥。

### 4.2 后端 RAG 生成流程

流程：

```text
用户问题
-> 检索相关资料
-> 拼接上下文
-> 调用大模型
-> 返回回答 + 引用来源
```

Prompt 建议：

```text
你是学习助手。请只根据给定资料回答问题。
如果资料不足，请明确说明“不确定”。
回答要简洁，并列出依据来源。

用户问题：
{question}

资料：
{contexts}
```

### 4.3 返回格式

```json
{
  "success": true,
  "answer": "进程调度是操作系统决定下一个运行进程的机制...",
  "matches": [
    {
      "id": "note-xxx",
      "sourceType": "note",
      "title": "操作系统课堂笔记",
      "snippet": "进程调度...",
      "score": 0.82
    }
  ],
  "model": "gpt-xxx"
}
```

### 4.4 阶段二验收标准

- 用户可以输入自然语言问题。
- 后端能生成完整回答。
- 回答必须展示引用来源。
- 资料不足时不能胡编。
- 大模型调用失败时能退回到阶段一的匹配结果。

## 阶段三：升级为向量检索

目标：用语义检索替代简单关键词匹配，提高召回质量。

### 5.1 文本切片

把长文本拆成片段：

```ts
interface KnowledgeChunk {
  id: string
  documentId: string
  sourceType: 'note' | 'mistake' | 'ocr'
  title: string
  content: string
  tags: string[]
  chunkIndex: number
}
```

切片规则建议：

- 每段 300 到 600 中文字符。
- 相邻片段保留 50 到 100 字重叠。
- 错题不强制切片，可以题目、答案、解析作为一个整体。

### 5.2 生成向量

新增后端能力：

- 对每个 chunk 生成 embedding。
- 保存向量和元数据。
- 数据变化时更新索引。

### 5.3 向量库选择

本地开发优先级：

1. Chroma：上手快，适合本地原型。
2. FAISS：检索性能好，但元数据管理需要自己做。
3. SQLite + 向量扩展：适合后续做轻量长期存储。

建议先用 Chroma。

### 5.4 新增索引接口

```http
POST /rag/reindex
```

职责：

- 读取 `knowledge_documents.json`。
- 重新切片。
- 重新生成 embedding。
- 写入向量库。

### 5.5 查询流程

```text
用户问题
-> 生成问题向量
-> 向量库 topK 检索
-> 拼接上下文
-> 大模型生成回答
-> 返回回答和引用
```

### 5.6 阶段三验收标准

- 语义相近但关键词不同的问题也能检索到相关资料。
- 返回来源包含文档标题和片段摘要。
- 支持重新构建索引。
- 同步资料后能更新检索结果。

## 阶段四：围绕学习场景做 RAG 功能

目标：不只是问答，而是让 RAG 真正服务学习。

### 6.1 错题解析生成

入口：

```text
错题详情页 -> 生成解析
```

流程：

```text
当前错题
-> 检索相关笔记
-> 结合题目、答案、相关笔记
-> 生成解析
-> 用户确认后保存到 analysis 字段
```

### 6.2 知识点关联

入口：

```text
错题编辑页 -> 查找相关笔记
```

返回：

- 相关笔记。
- 可能知识点。
- 推荐标签。

### 6.3 复习计划

根据错题数据生成：

- 今天建议复习哪些题。
- 哪些科目未掌握最多。
- 哪些标签需要重点复习。

### 6.4 笔记总结

入口：

```text
笔记详情页 -> 总结
```

输出：

- 核心知识点。
- 重要概念。
- 可能考点。
- 可转成错题的内容。

## 7. 推荐接口清单

阶段一需要：

```http
POST /knowledge/sync
POST /rag/query
```

阶段二增加：

```http
POST /rag/query
```

同一个接口内部增加大模型生成即可。

阶段三增加：

```http
POST /rag/reindex
GET /rag/status
```

阶段四增加：

```http
POST /rag/generate-analysis
POST /rag/related-notes
POST /rag/summarize-note
POST /rag/review-plan
```

## 8. 推荐文件改动

### 8.1 前端新增

```text
miniprogram/pages/rag/rag.ts
miniprogram/pages/rag/rag.wxml
miniprogram/pages/rag/rag.wxss
miniprogram/pages/rag/rag.json
miniprogram/utils/knowledge.ts
miniprogram/utils/rag.ts
```

### 8.2 前端修改

```text
miniprogram/app.json
miniprogram/pages/home/home.ts
miniprogram/pages/home/home.wxml
miniprogram/pages/home/home.wxss
```

### 8.3 后端新增

```text
server/services/knowledge_store.py
server/services/rag_service.py
server/data/knowledge_documents.json
```

阶段三再新增：

```text
server/services/vector_store.py
server/data/chroma/
```

### 8.4 后端修改

```text
server/app.py
server/requirements.txt
```

## 9. 数据同步策略

阶段一建议采用手动同步：

- 学习问答页顶部显示“同步资料”按钮。
- 用户点击后，前端读取本地笔记、错题、OCR 记录。
- 前端调用 `/knowledge/sync`。
- 后端覆盖保存知识库 JSON。

优点：

- 实现简单。
- 用户能理解当前知识库是否已更新。
- 避免每次新增笔记都自动请求后端。

后续可以改成自动同步：

- 保存笔记后同步。
- 保存错题后同步。
- OCR 成功后同步。
- 首页进入时检查是否需要同步。

## 10. 隐私和安全注意事项

RAG 会把用户笔记和错题发给后端，甚至可能发给大模型服务，所以必须注意：

- 上线前补充隐私说明。
- 明确告知用户哪些内容会被上传。
- 不要把 API Key 放在小程序前端。
- 大模型调用只能从后端发起。
- 后端需要限制上传内容大小。
- 后端需要做用户隔离，否则多用户资料会混在一起。
- 正式环境必须使用 HTTPS。

## 11. 实施顺序建议

推荐按以下顺序开发：

1. 新增 `KnowledgeDocument` 统一数据格式。
2. 前端实现本地资料汇总。
3. 后端实现 `/knowledge/sync`。
4. 后端实现关键词版 `/rag/query`。
5. 前端新增学习问答页。
6. 首页新增学习问答入口。
7. 跑通“同步资料 -> 提问 -> 返回匹配资料”。
8. 接入大模型生成回答。
9. 增加引用来源展示。
10. 再考虑向量数据库和 embedding。

## 12. 第一版最小任务清单

第一版只做这些：

- [ ] 新增学习问答页面。
- [ ] 新增首页入口。
- [ ] 新增 `miniprogram/utils/knowledge.ts`。
- [ ] 新增 `miniprogram/utils/rag.ts`。
- [ ] 后端新增 `server/services/knowledge_store.py`。
- [ ] 后端新增 `server/services/rag_service.py`。
- [ ] 后端新增 `POST /knowledge/sync`。
- [ ] 后端新增 `POST /rag/query`。
- [ ] 问答页支持同步资料。
- [ ] 问答页支持提问。
- [ ] 问答页展示匹配资料和来源。

第一版完成后，再决定是否接入大模型和向量检索。
