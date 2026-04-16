# 学习助手小程序

本项目是一个基于微信小程序、Flask 和 PaddleOCR 的课程项目，整体分为两个模块：

- 笔记本：把图片中的文字识别出来，整理后保存成学习笔记
- 错题本：保存错题、题目解析、知识点归类与后续复习

当前仓库的开发重点是笔记本模块。错题本模块在 README 中完成方案设计和目录预留，代码层面暂未开始实现。

## 项目定位

项目面向课程展示、本地演示和个人学习场景，不依赖云端 OCR 服务。整体架构如下：

```text
微信小程序前端
    |
    | uploadFile / request
    v
Flask 本地服务
    |
    | Python 调用
    v
PaddleOCR 本地识别引擎
```

笔记本模块负责完成：

1. 选择图片或拍照
2. 上传图片到本地 Flask 服务
3. 调用 PaddleOCR 识别文本
4. 展示识别结果并允许编辑
5. 保存为本地笔记
6. 查看笔记列表、搜索、筛选、详情、删除

错题本模块后续计划负责：

1. 录入题目图片或手动录入题干
2. 保存答案、解析、知识点和错误原因
3. 支持按学科、章节、掌握状态筛选
4. 支持错题复习与再练习

## 当前完成情况

当前代码仓库已经完成以下内容：

- 项目首页改为“笔记本 + 错题本”双模块入口
- 笔记本模块前端页面完整打通
- 本地笔记数据结构与存储工具已完成
- Flask 后端已具备图片上传和 OCR 接口骨架
- PaddleOCR 集成已预留，安装依赖后即可接入真实识别

当前未完成内容：

- 错题本模块页面与数据流
- RAG 检索增强
- 数据库持久化
- 云端部署

## 项目目录

```text
miniprogram-1/
├─ miniprogram/
│  ├─ pages/
│  │  ├─ home/                # 首页，双模块入口
│  │  ├─ ocr/                 # 选择图片、上传、识别结果预览
│  │  ├─ editor/              # 编辑并保存笔记
│  │  ├─ notes/               # 笔记列表、搜索、筛选
│  │  ├─ note-detail/         # 笔记详情
│  │  └─ mistakes/            # 错题本占位页
│  ├─ utils/
│  │  ├─ note.ts             # 笔记数据读写与筛选
│  │  └─ request.ts          # OCR 上传请求封装
│  ├─ app.json
│  ├─ app.ts
│  └─ app.wxss
├─ server/
│  ├─ app.py                 # Flask 服务入口
│  ├─ requirements.txt
│  ├─ uploads/
│  └─ services/
│     └─ ocr_service.py      # PaddleOCR 调用封装
├─ typings/
├─ tsconfig.json
└─ README.md
```

## 一、开发路线

整个项目建议分成两条线推进：

- 第一条线：笔记本模块，先做完整闭环
- 第二条线：错题本模块，在笔记本稳定后再接入

具体开发顺序如下：

1. 完成项目初始化和页面拆分
2. 先打通笔记本模块的 OCR 主流程
3. 完成笔记本模块的本地保存、列表、搜索和详情
4. 再开始错题本模块
5. 最后再考虑 RAG、数据库和智能问答

## 二、笔记本模块开发步骤

### 第一步：明确页面与数据结构

笔记本模块包含以下页面：

- `home`：项目首页
- `ocr`：图片选择、上传与识别
- `editor`：笔记编辑与保存
- `notes`：笔记列表、搜索、分类筛选
- `note-detail`：笔记详情

笔记数据结构如下：

```ts
interface NoteItem {
  id: string
  title: string
  category: string
  content: string
  imagePath?: string
  createdAt: string
  updatedAt?: string
}
```

### 第二步：搭建 Flask 服务

在 `server/` 目录下创建本地后端服务。

建议命令：

```powershell
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

如果你要真正使用 PaddleOCR，需要根据自己的电脑环境额外安装：

1. `paddlepaddle`
2. `paddleocr`

注意：

- `paddlepaddle` 的安装方式和版本需要参考官方文档
- CPU 和 GPU 安装命令不同
- 本项目 README 只给出项目开发流程，不替代官方安装说明

### 第三步：实现 OCR 上传接口

后端的 `/ocr` 接口负责：

1. 接收小程序上传的图片
2. 保存到 `server/uploads/`
3. 调用 `ocr_service.py`
4. 返回识别结果

请求格式：

```http
POST /ocr
Content-Type: multipart/form-data
```

上传字段：

- `file`

响应格式：

```json
{
  "success": true,
  "text": "识别出的完整文本",
  "lines": ["第一行", "第二行"],
  "message": "OCR success",
  "engine": "paddleocr"
}
```

### 第四步：实现小程序 OCR 页面

在 `pages/ocr` 页面中完成：

1. 选择图片或拍照
2. 上传图片到 Flask
3. 展示识别中状态
4. 展示识别结果
5. 跳转到编辑页

这一页是整个笔记本模块的入口页。

### 第五步：实现编辑与保存

在 `pages/editor` 页面中完成：

1. 接收 OCR 返回的文本
2. 自动填充到 `textarea`
3. 用户修改识别错误
4. 输入标题和分类
5. 保存到本地缓存

保存后的数据存入：

- `wx.setStorageSync('notebook_notes', notes)`

### 第六步：实现笔记列表与搜索

在 `pages/notes` 页面中完成：

1. 展示全部笔记
2. 支持关键词搜索
3. 支持按分类筛选
4. 支持删除笔记
5. 支持进入详情页

### 第七步：实现详情与二次编辑

在 `pages/note-detail` 页面中完成：

1. 查看完整标题、正文、时间和原图
2. 支持进入编辑页继续修改
3. 支持删除笔记

## 三、错题本模块规划

错题本模块暂不开发代码，但建议未来按下面的结构扩展：

- `pages/mistakes/`：错题列表页
- `pages/mistake-editor/`：错题编辑页
- `pages/mistake-detail/`：错题详情页
- `utils/mistake.ts`：错题数据存储工具

建议的数据结构：

```ts
interface MistakeItem {
  id: string
  subject: string
  question: string
  answer: string
  analysis: string
  tags: string[]
  createdAt: string
  mastered: boolean
}
```

建议功能：

1. 图片录题
2. 手动录题
3. 答案与解析录入
4. 错因标签
5. 掌握状态管理
6. 复习提醒

## 四、运行方式

### 1. 启动后端

```powershell
cd server
python app.py
```

启动成功后，访问：

```text
http://127.0.0.1:5000/ping
```

### 2. 启动小程序

1. 使用微信开发者工具打开项目根目录
2. 关闭“校验合法域名、web-view、TLS 版本以及 HTTPS 证书”
3. 编译项目
4. 进入首页
5. 打开笔记本模块

## 五、笔记本模块验收标准

如果要作为课程项目演示，笔记本模块至少需要满足以下标准：

- 可以选择图片或拍照
- 可以上传到本地 Flask
- 可以完成 OCR 识别
- 可以展示 OCR 文本
- 可以编辑 OCR 结果
- 可以保存为笔记
- 可以查看笔记列表
- 可以搜索笔记
- 可以按分类筛选
- 可以删除和修改笔记

## 六、适合写进课程报告的说明

本项目采用微信小程序前端、本地 Flask 服务端和 PaddleOCR 本地识别引擎的架构实现，并规划为“笔记本”和“错题本”两个模块。笔记本模块负责将图片中的文字识别为可编辑文本，再整理保存为笔记；错题本模块用于保存题目、答案和解析，实现学习资料的分类管理。项目当前优先完成笔记本模块，使系统具备完整的图片识别、文本编辑、笔记保存和笔记管理能力，后续将在此基础上继续扩展错题本与智能检索功能。

## 七、下一步建议

当前最合理的后续顺序是：

1. 在本机安装 PaddleOCR 依赖并验证 `/ocr` 接口
2. 用真实图片测试笔记本模块主流程
3. 开始错题本模块的页面与数据结构开发
4. 之后再考虑接入 RAG 和智能问答
