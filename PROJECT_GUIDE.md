# 项目详细讲解

本文档解释学习助手小程序的项目结构、页面职责、数据流、后端接口和关键实现逻辑。README 只保留项目当前状态和下一步建议，细节统一放在这里维护。

## 1. 项目目标

项目的核心目标是把学习资料从“图片”转成“可复习的结构化内容”。

当前用户路径是：

1. 在首页查看学习数据概况。
2. 进入图片识别页，选择照片或截图。
3. 后端 OCR 提取文字。
4. 用户把识别结果保存为笔记，或者保存为错题。
5. 用户在笔记列表中管理学习资料。
6. 用户在错题本中按科目、状态和标签复习。

这个项目目前更像一个本地学习工具原型：前端体验和核心流程已经打通，但数据仍在本地缓存中，后端也是本地 Flask 开发服务。

## 2. 技术栈

前端：

- 微信小程序原生框架
- TypeScript
- WXML
- WXSS
- 微信本地缓存 API
- `wx.chooseMedia`
- `wx.uploadFile`
- `wx.saveFile`

后端：

- Python
- Flask
- Werkzeug
- PaddleOCR
- paddlepaddle
- rapidocr_onnxruntime

工程：

- `npm run typecheck` 做 TypeScript 类型检查。
- `project.private.config.json` 本地关闭域名校验，方便 HTTP 调试。
- `.gitignore` 忽略依赖、虚拟环境、缓存和上传临时文件。

## 3. 目录结构

```text
.
├── miniprogram/                  # 微信小程序前端
│   ├── app.json                  # 页面注册、窗口样式
│   ├── app.ts                    # 小程序入口
│   ├── app.wxss                  # 全局变量、按钮、表单、卡片样式
│   ├── pages/
│   │   ├── home/                 # 首页工作台
│   │   ├── ocr/                  # 图片识别
│   │   ├── editor/               # 笔记编辑
│   │   ├── notes/                # 笔记列表
│   │   ├── note-detail/          # 笔记详情
│   │   ├── mistakes/             # 错题列表和创建入口
│   │   ├── mistake-editor/       # 错题编辑
│   │   └── mistake-detail/       # 错题详情
│   └── utils/
│       ├── request.ts            # 后端 OCR 请求
│       ├── ocr-history.ts        # OCR 识别记录
│       ├── note.ts               # 笔记数据模型和本地存储
│       ├── mistake.ts            # 错题数据模型和本地存储
│       └── file.ts               # 临时文件保存
├── server/
│   ├── app.py                    # Flask 接口
│   ├── requirements.txt          # 后端依赖
│   └── services/
│       └── ocr_service.py        # OCR 引擎初始化、调用和结果解析
├── typings/                      # 微信小程序类型声明
├── package.json
├── project.config.json
├── project.private.config.json
├── tsconfig.json
├── README.md
└── PROJECT_GUIDE.md
```

## 4. 页面说明

### 4.1 首页 `pages/home`

首页现在是一个学习工作台，而不是单纯菜单页。

职责：

- 读取本地笔记、错题、OCR 识别记录。
- 展示四个统计值：笔记数、错题数、待复习错题数、识别记录数。
- 提供三个任务入口：图片识别、整理笔记、复习错题。

关键文件：

- `miniprogram/pages/home/home.ts`
- `miniprogram/pages/home/home.wxml`
- `miniprogram/pages/home/home.wxss`

关键逻辑：

- `onShow` 每次页面显示时重新读取本地缓存。
- 使用 `getNotes()`、`getMistakes()`、`getOcrHistory()` 计算统计值。
- 通过 `wx.navigateTo` 进入对应页面。

### 4.2 图片识别页 `pages/ocr`

图片识别页负责把图片传给后端并展示 OCR 结果。

职责：

- 选择图片。
- 上传图片。
- 展示识别状态、错误信息和识别文本。
- 识别成功后写入 OCR 历史记录。
- 将识别结果传入笔记编辑页或错题编辑页。

关键文件：

- `miniprogram/pages/ocr/ocr.ts`
- `miniprogram/pages/ocr/ocr.wxml`
- `miniprogram/pages/ocr/ocr.wxss`
- `miniprogram/utils/request.ts`
- `miniprogram/utils/ocr-history.ts`

流程：

1. `chooseImage` 调用 `wx.chooseMedia`。
2. `recognizeImage` 调用 `uploadImageForOcr(imagePath)`。
3. `uploadImageForOcr` 使用 `wx.uploadFile` 请求后端 `/ocr`。
4. 后端返回成功后，页面设置 `ocrText` 和 `ocrLines`。
5. 调用 `saveOcrHistory(result.text, imagePath)` 保存识别记录。
6. 用户选择保存为笔记或错题。

### 4.3 笔记列表页 `pages/notes`

职责：

- 展示所有笔记。
- 支持关键词搜索。
- 支持分类筛选。
- 支持新建空白笔记。
- 支持进入详情和删除笔记。

关键逻辑：

- `searchNotes(keyword, category)` 从本地缓存中过滤笔记。
- 列表卡片显示标题、分类、更新时间和内容预览。
- 删除前使用 `wx.showModal` 做二次确认。

### 4.4 笔记编辑页 `pages/editor`

职责：

- 新建笔记。
- 编辑笔记。
- 接收 OCR 页面传来的图片路径和文本内容。
- 保存前校验标题和正文。

数据来源：

- 用户手动输入。
- OCR 页面通过 URL 参数传入：

```text
imagePath
content
```

保存逻辑：

- 新建时调用 `createNote`。
- 编辑时调用 `updateNote`。
- 如果有临时图片路径，保存前调用文件工具把临时文件转成可长期使用的路径。

### 4.5 笔记详情页 `pages/note-detail`

职责：

- 展示笔记标题、分类、时间、图片和正文。
- 进入编辑页。
- 删除笔记。

### 4.6 错题列表页 `pages/mistakes`

职责：

- 展示错题列表。
- 提供三种错题创建方式。
- 支持关键词搜索。
- 支持科目筛选。
- 支持掌握状态筛选。
- 支持快速切换掌握状态。
- 支持删除错题。

三种创建方式：

- 从记录创建：进入 `mistake-editor?mode=record`。
- 拍照创建：进入 `mistake-editor?mode=photo`。
- 手动创建：进入 `mistake-editor?mode=manual`。

列表中的错题卡片展示：

- 科目。
- 掌握状态。
- 题目预览。
- 标签。
- 最近更新时间。

### 4.7 错题编辑页 `pages/mistake-editor`

这是错题模块里最关键的页面。

职责：

- 新建错题。
- 编辑错题。
- 根据创建模式展示不同辅助操作。
- 支持题目、答案、解析三个字段分别导入或拍照识别。

模式说明：

```ts
type CreateMode = 'record' | 'photo' | 'manual'
```

从记录创建：

- 页面显示“从记录创建”。
- 字段旁显示“从记录填入”。
- 记录来源包括已保存笔记和 OCR 识别历史。
- 用户可以分别把同一条或不同记录填入题目、答案、解析。

拍照创建：

- 页面显示“拍照创建”。
- 字段旁显示“拍照识别填入”。
- 进入页面后会先触发题目识别。
- 用户也可以对答案和解析分别拍照识别。

手动创建：

- 页面显示“手动创建”。
- 不展示导入或拍照按钮。
- 用户直接填写题目、答案、解析、标签和掌握状态。

编辑已有错题：

- 根据 `id` 读取已有数据。
- 页面标题显示“编辑错题”。
- 保存时调用 `updateMistake`。

### 4.8 错题详情页 `pages/mistake-detail`

职责：

- 展示科目、掌握状态、标签、时间。
- 分区展示题目、答案、解析。
- 支持编辑。
- 支持切换掌握状态。
- 支持删除。

## 5. 数据模型

### 5.1 笔记

文件：

```text
miniprogram/utils/note.ts
```

结构：

```ts
export interface NoteItem {
  id: string
  title: string
  category: string
  content: string
  imagePath?: string
  createdAt: string
  updatedAt?: string
}
```

存储 key：

```text
notebook_notes
```

支持操作：

- `getNotes`
- `getNoteById`
- `createNote`
- `updateNote`
- `removeNote`
- `searchNotes`
- `buildSuggestedTitle`

### 5.2 错题

文件：

```text
miniprogram/utils/mistake.ts
```

结构：

```ts
export interface MistakeItem {
  id: string
  subject: string
  question: string
  answer: string
  analysis: string
  tags: string[]
  createdAt: string
  updatedAt?: string
  mastered: boolean
}
```

存储 key：

```text
study_mistakes
```

支持操作：

- `getMistakes`
- `getMistakeById`
- `createMistake`
- `updateMistake`
- `removeMistake`
- `toggleMastered`
- `searchMistakes`

### 5.3 OCR 识别记录

文件：

```text
miniprogram/utils/ocr-history.ts
```

结构：

```ts
export interface OcrHistoryItem {
  id: string
  text: string
  imagePath?: string
  createdAt: string
}
```

存储 key：

```text
ocr_history_records
```

规则：

- 只保存非空文本。
- 默认最多保留 30 条。
- 相同文本会去重，保留最新记录。

## 6. 前后端接口

### 6.1 前端请求配置

文件：

```text
miniprogram/utils/request.ts
```

当前地址：

```ts
export const API_BASE_URL = 'http://10.29.45.6:5000'
```

如果电脑局域网 IP 变化，需要修改这里。

### 6.2 健康检查

请求：

```http
GET /ping
```

返回：

```json
{
  "success": true,
  "message": "服务运行中"
}
```

用途：

- 确认 Flask 已启动。
- 确认局域网 IP 可以访问。
- 排查小程序无法上传的问题。

### 6.3 OCR 识别

请求：

```http
POST /ocr
```

请求方式：

- `multipart/form-data`
- 文件字段名：`file`

成功返回示例：

```json
{
  "success": true,
  "text": "识别出的完整文本",
  "lines": ["第一行", "第二行"],
  "message": "OCR 识别成功",
  "engine": "rapidocr"
}
```

失败返回示例：

```json
{
  "success": false,
  "text": "",
  "lines": [],
  "message": "图片中未识别到可读文字。",
  "engine": "rapidocr"
}
```

## 7. 后端实现

### 7.1 Flask 入口

文件：

```text
server/app.py
```

核心职责：

- 创建 Flask app。
- 配置 CORS 响应头。
- 创建上传目录。
- 校验上传文件是否存在。
- 校验图片扩展名。
- 保存临时图片。
- 调用 `recognize_image`。
- 请求结束后删除临时图片。

后端启动：

```powershell
cd server
venv\Scripts\activate
python app.py
```

监听配置：

```python
app.run(host="0.0.0.0", port=5000, debug=True)
```

这表示局域网内其他设备可以通过电脑 IP 访问服务。

### 7.2 OCR 服务

文件：

```text
server/services/ocr_service.py
```

核心职责：

- 懒加载 PaddleOCR 实例。
- 懒加载 RapidOCR 实例。
- 兼容不同 OCR 引擎和不同版本的返回结构。
- 把识别结果统一提取成 `lines: string[]`。
- 返回统一 JSON 字段。

识别策略：

1. 初始化 PaddleOCR。
2. 优先调用 PaddleOCR。
3. 如果 PaddleOCR 调用失败，尝试 RapidOCR。
4. 如果识别文本为空，返回失败。
5. 如果识别成功，返回文本、行列表和引擎名。

返回中的 `engine` 字段含义：

- `paddleocr`：PaddleOCR 成功。
- `rapidocr`：PaddleOCR 失败后 RapidOCR 成功。
- `不可用`：OCR 依赖不可用。

## 8. 小程序本地调试注意事项

### 8.1 不能用 127.0.0.1 给真机访问

`127.0.0.1` 对真机来说是手机自己，不是电脑。真机和部分开发者工具场景需要使用电脑局域网 IP，例如：

```text
http://10.29.45.6:5000
```

### 8.2 微信开发者工具域名校验

本地 HTTP 调试阶段需要关闭：

```text
校验合法域名、web-view、TLS 版本以及 HTTPS 证书
```

项目里的 `project.private.config.json` 已设置：

```json
{
  "setting": {
    "urlCheck": false
  }
}
```

### 8.3 修改后端代码后必须重启 Flask

如果小程序还显示旧错误，例如：

```text
PaddleOCR.predict() got an unexpected keyword argument 'cls'
```

说明后端进程可能还是旧代码。处理方式：

```powershell
Ctrl + C
python app.py
```

## 9. 常见问题

### 9.1 小程序提示无法连接本地 Flask 服务

检查顺序：

1. 后端是否正在运行。
2. 浏览器是否能访问 `/ping`。
3. `API_BASE_URL` 是否是当前电脑 IP。
4. 微信开发者工具是否关闭域名校验。
5. 防火墙是否拦截 5000 端口。

### 9.2 PaddleOCR 报 `paddle_static is unavailable`

通常是 `paddlepaddle` 没安装或环境不匹配。

处理：

```powershell
cd server
venv\Scripts\activate
pip install paddlepaddle
python app.py
```

### 9.3 PaddleOCR 报兼容性错误

如果出现 Paddle 运行时兼容性错误，当前项目会自动尝试 RapidOCR。只要返回 `engine: "rapidocr"` 并且有识别文本，就说明流程可用。

### 9.4 识别成功但文本不准

优先检查：

- 图片是否清晰。
- 是否存在倾斜、反光、截断。
- 文字是否太小。
- 是否包含复杂公式或表格。

当前项目只做 OCR 文本提取，不做数学公式结构化识别。

## 10. 验证命令

前端类型检查：

```powershell
npm run typecheck
```

后端语法检查：

```powershell
python -m py_compile server\app.py server\services\ocr_service.py
```

后端 OCR 手动测试：

```powershell
cd server
venv\Scripts\activate
python -c "from services.ocr_service import recognize_image; print(recognize_image(r'..\data\image.png'))"
```

## 11. 后续演进建议

短期：

- 完整测试主流程。
- 优化真实图片下的 OCR 提示。
- 增加导出和备份。
- 让错题支持附原图。

中期：

- 增加复习计划和复习记录。
- 支持从一条 OCR 记录拆分多个错题。
- 支持按更新时间、掌握状态、科目组合排序。
- 增加数据结构版本迁移。

长期：

- 后端 HTTPS 部署。
- 云数据库和多设备同步。
- 用户账号体系。
- AI 自动拆分题目、答案、解析。
- AI 生成解析、标签和复习计划。
