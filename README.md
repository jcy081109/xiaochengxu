# 学习助手小程序

这是一个“微信小程序前端 + Flask 后端 + PaddleOCR”的学习助手项目。当前已实现图片 OCR、学习笔记、错题本三个主要流程，界面文案已统一为中文。

## 当前完成情况

已完成：

- 首页入口：学习笔记、错题本。
- 图片识别页：选择图片、上传后端、展示 OCR 结果。
- OCR 结果处理：可保存为笔记，也可保存为错题。
- 学习笔记：新增、编辑、详情、删除、搜索、分类筛选。
- 错题本：新增、编辑、详情、删除、搜索、科目筛选、掌握状态筛选。
- 图片保存：笔记保存前会调用 `wx.saveFile`，避免只保存临时图片路径。
- 上传健壮性：`wx.uploadFile` 已增加 HTTP 状态码、空响应和 JSON 解析错误处理。
- 中文化：页面标题、按钮、占位符、弹窗、Toast、导航栏、分类、科目、状态和后端提示已改为中文。
- 样式修复：修复小程序 `input` 单行输入框中文字被上下裁切的问题。
- 类型检查：已配置 `npm run typecheck`。

仍需外部配置：

- 本机安装 PaddleOCR 和 paddlepaddle 后才能真实 OCR。
- 真机调试不能直接使用 `127.0.0.1`，需要改为局域网 IP、内网穿透地址或 HTTPS 服务地址。
- 上线前需要部署 HTTPS 后端，并在微信公众平台配置合法域名。

## 项目结构

```text
.
├── miniprogram/                  # 微信小程序前端
│   ├── app.json                  # 页面注册和全局窗口配置
│   ├── app.ts
│   ├── app.wxss                  # 全局样式
│   ├── pages/
│   │   ├── home/                 # 首页
│   │   ├── ocr/                  # 图片识别页
│   │   ├── editor/               # 笔记编辑页
│   │   ├── notes/                # 笔记列表页
│   │   ├── note-detail/          # 笔记详情页
│   │   ├── mistakes/             # 错题列表页
│   │   ├── mistake-editor/       # 错题编辑页
│   │   └── mistake-detail/       # 错题详情页
│   └── utils/
│       ├── request.ts            # OCR 请求封装
│       ├── note.ts               # 笔记本地存储封装
│       ├── mistake.ts            # 错题本地存储封装
│       └── file.ts               # 临时文件保存封装
├── server/                       # Flask 后端
│   ├── app.py                    # HTTP 接口
│   ├── requirements.txt          # Python 依赖
│   └── services/
│       └── ocr_service.py        # PaddleOCR 调用封装
├── typings/                      # 微信小程序类型声明
├── package.json
├── package-lock.json
├── project.config.json
├── project.private.config.json
├── tsconfig.json
└── README.md
```

## 运行环境

前端需要：

- 微信开发者工具
- Node.js
- npm

后端需要：

- Python
- Flask
- PaddleOCR
- paddlepaddle

## 安装依赖

安装前端依赖：

```powershell
npm install
```

安装后端依赖：

```powershell
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

如果 OCR 初始化失败，需要额外安装 paddlepaddle：

```powershell
pip install paddlepaddle
```

GPU 环境需要根据 CUDA 版本选择对应的 PaddlePaddle 安装命令。

## 本地启动

启动后端：

```powershell
cd server
venv\Scripts\activate
python app.py
```

后端默认地址：

```text
http://127.0.0.1:5000
```

健康检查：

```text
http://127.0.0.1:5000/ping
```

预期返回：

```json
{
  "success": true,
  "message": "服务运行中"
}
```

启动小程序：

1. 打开微信开发者工具。
2. 导入当前项目目录。
3. 确认小程序根目录为 `miniprogram/`。
4. 编译运行。
5. 从首页进入“开始识别”或“进入错题本”。

## OCR 流程

前端入口：

- `miniprogram/pages/ocr/ocr.ts`
- `miniprogram/utils/request.ts`

流程：

1. 用户选择图片。
2. 小程序调用 `wx.uploadFile` 上传图片。
3. Flask 后端接收 `POST /ocr` 请求。
4. 后端临时保存图片。
5. 调用 PaddleOCR 识别文字。
6. 返回识别文本和行列表。
7. 前端展示结果。
8. 用户选择“保存为笔记”或“保存为错题”。

当前接口地址位于：

```ts
export const API_BASE_URL = 'http://127.0.0.1:5000'
```

文件位置：

```text
miniprogram/utils/request.ts
```

真机调试或上线时必须替换为可访问地址。

## 笔记模块

数据结构位于 `miniprogram/utils/note.ts`：

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

分类：

- 课堂笔记
- 知识点
- 阅读摘录
- 实验记录
- 其他

已实现功能：

- 手动新建笔记。
- OCR 结果转笔记。
- 编辑笔记。
- 删除笔记。
- 查看详情。
- 按关键词搜索。
- 按分类筛选。
- 本地缓存保存。
- 图片路径保存前调用 `wx.saveFile`。

## 错题模块

数据结构位于 `miniprogram/utils/mistake.ts`：

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

科目：

- 数学
- 英语
- 物理
- 化学
- 语文
- 其他

已实现功能：

- 新增错题。
- OCR 结果转错题。
- 编辑错题。
- 删除错题。
- 查看详情。
- 按关键词搜索。
- 按科目筛选。
- 按掌握状态筛选。
- 标记为已掌握或未掌握。
- 标签录入和展示。

## 中文化说明

以下内容已统一为中文：

- 页面标题。
- 导航栏标题。
- 按钮文字。
- 输入框占位符。
- 空状态提示。
- Toast 提示。
- 删除确认弹窗。
- 笔记分类。
- 错题科目。
- 错题掌握状态。
- 后端返回消息。

代码标识符、文件名、接口字段、npm 脚本名保留英文，避免破坏工具链和项目结构。

## 样式修复记录

已修复小程序单行输入框文字显示不全的问题。

修复位置：

```text
miniprogram/app.wxss
```

原因：

- 原先 `.input`、`.textarea`、`.picker-box` 共用较大的上下 padding。
- 小程序原生 `input` 在部分机型或模拟器中会出现中文占位符被上下裁切。

处理：

- 将 `.input` 单独拆出。
- 设置固定高度、最小高度和行高。
- 保留 `.textarea` 和 `.picker-box` 的多行样式。

## 校验命令

前端类型检查：

```powershell
npm install
npm run typecheck
```

后端语法检查：

```powershell
python -m py_compile server\app.py server\services\ocr_service.py
```

## 上线前检查

- [ ] `npm install` 成功。
- [ ] `npm run typecheck` 成功。
- [ ] 后端虚拟环境创建成功。
- [ ] `pip install -r requirements.txt` 成功。
- [ ] `paddlepaddle` 安装成功。
- [ ] `python app.py` 可以启动服务。
- [ ] `/ping` 返回正常。
- [ ] `/ocr` 可以识别图片。
- [ ] 小程序开发者工具可以选择图片。
- [ ] OCR 结果可以展示。
- [ ] OCR 结果可以保存为笔记。
- [ ] OCR 结果可以保存为错题。
- [ ] 笔记可以搜索、筛选、编辑、删除。
- [ ] 错题可以搜索、筛选、编辑、删除。
- [ ] 真机调试可以访问后端。
- [ ] 后端已部署为 HTTPS。
- [ ] 微信公众平台已配置合法域名。
- [ ] 已补充用户隐私说明。

## 后续扩展

可以继续扩展：

- 云端账号体系。
- 笔记和错题云同步。
- OCR 多语言识别。
- AI 总结笔记。
- AI 生成错题解析。
- 错题复习计划。
- 学习进度统计。
- 导出 Markdown、PDF 或 Word。
- 接入 RAG，用已有笔记做问答。

