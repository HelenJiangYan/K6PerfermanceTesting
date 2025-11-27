# k6 Performance Testing Framework

基于 k6 的企业级性能测试框架，采用 POM (Page Object Model) 设计模式，支持多环境配置、实时监控和多格式测试报告。

---

## 📋 目录

- [项目概述](#项目概述)
- [核心特性](#核心特性)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [测试类型](#测试类型)
- [测试报告](#测试报告)
- [实时监控](#实时监控)
- [配置管理](#配置管理)
- [最佳实践](#最佳实践)
- [故障排查](#故障排查)

---

## 🎯 项目概述

这是一个完整的 k6 性能测试解决方案，适用于 Web 应用程序的性能测试、负载测试和压力测试。

### 技术栈

- **测试工具**: k6 (Grafana Labs)
- **监控系统**: InfluxDB 1.8 + Grafana
- **容器化**: Docker + Docker Compose
- **报告生成**: k6-reporter (HTML) + JSON

---

## ✨ 核心特性

### 🏗️ 架构设计

- ✅ **POM 模式**: Helper 层抽象，代码复用性高
- ✅ **多环境支持**: QA1、QA2、Production 环境配置
- ✅ **多用户管理**: 支持不同角色用户（Admin、Member）
- ✅ **Token 共享**: 通过 setup() 函数共享认证 token，避免 OAuth 并发问题
- ✅ **数据生成器**: 自动生成唯一的测试数据（项目名、规格名等）

### 📊 测试能力

- ✅ **负载测试** (Load Test): 验证系统在预期负载下的性能
- ✅ **压力测试** (Stress Test): 找到系统性能极限
- ✅ **峰值测试** (Spike Test): 测试系统应对突发流量的能力
- ✅ **浸泡测试** (Soak Test): 长时间稳定性测试（2 小时+）

### 📈 监控与报告

- ✅ **三种报告格式**:
  - 控制台输出（实时）
  - HTML 报告（可视化）
  - JSON 数据（自动化分析）
- ✅ **实时监控**:
  - InfluxDB 时序数据库
  - Grafana 可视化仪表板
  - 6 个核心性能指标面板

---

## 📁 项目结构

```
k6PermanceTesting/
├── config/                          # 配置管理
│   ├── environments.js              # 环境配置（QA1/QA2/Prod）
│   └── users.js                     # 用户配置（Admin/Member）
│
├── helpers/                         # Helper 层（POM 模式）
│   ├── auth.js                      # 认证 Helper（OAuth 2.0）
│   ├── project.js                   # 项目操作 Helper
│   └── spec.js                      # 规格操作 Helper
│
├── utils/                           # 工具函数
│   ├── dataGenerator.js             # 测试数据生成器
│   └── reportGenerator.js           # 报告生成器（可选）
│
├── scripts/                         # 快速测试脚本
│   ├── createProject.js             # 单次项目创建测试
│   └── createProjectAndSpec.js      # 项目+规格创建测试
│
├── performanceTests/                # 性能测试套件
│   ├── load/                        # 负载测试
│   │   └── createProjectAndSpecLoadTest.js
│   ├── stress/                      # 压力测试
│   │   └── createProjectAndSpecStressTest.js
│   ├── spike/                       # 峰值测试
│   │   └── createProjectAndSpecSpikeTest.js
│   └── soak/                        # 浸泡测试
│       └── createProjectAndSpecSoakTest.js
│
├── results/                         # 测试报告输出目录
│   ├── *.html                       # HTML 报告
│   └── *.json                       # JSON 数据
│
├── grafana/                         # Grafana 配置
│   ├── dashboards/
│   │   └── k6-dashboard.json        # k6 性能仪表板
│   └── provisioning/
│       ├── datasources/
│       │   └── influxdb.yml         # InfluxDB 数据源配置
│       └── dashboards/
│           └── dashboard.yml        # 仪表板加载配置
│
├── docker-compose.yml               # Docker 容器编排
├── start-monitoring.bat             # 启动监控栈（Windows）
├── stop-monitoring.bat              # 停止监控栈（Windows）
├── run-with-monitoring.bat          # 运行测试（带监控，Windows）
├── .gitignore                       # Git 忽略规则
├── MONITORING.md                    # 监控系统文档
└── README.md                        # 项目文档（本文件）
```

---

## 🚀 快速开始

### 前提条件

确保已安装以下工具：

- [k6](https://k6.io/docs/getting-started/installation/) - 性能测试工具
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) - 用于监控系统（可选）
- [Git](https://git-scm.com/) - 版本控制（可选）

### 安装步骤

1. **克隆项目**（如果使用 Git）
   ```bash
   git clone <repository-url>
   cd k6PermanceTesting
   ```

2. **配置环境变量**

   编辑 `config/environments.js` 和 `config/users.js`，设置您的测试环境和用户凭据。

3. **运行第一个测试**
   ```bash
   # Windows
   k6 run scripts/createProject.js

   # macOS/Linux
   k6 run scripts/createProject.js
   ```

4. **查看测试报告**
   ```bash
   # Windows
   start results/create-project-report.html

   # macOS
   open results/create-project-report.html

   # Linux
   xdg-open results/create-project-report.html
   ```

---

## 🧪 测试类型

### 1. 烟雾测试 (Smoke Test)

**用途**: 快速验证系统基本功能

```bash
k6 run scripts/createProject.js
k6 run scripts/createProjectAndSpec.js
```

**配置**:
- VUs: 1
- 迭代次数: 1
- 预期时长: < 10 秒

---

### 2. 负载测试 (Load Test)

**用途**: 验证系统在预期负载下的性能

```bash
k6 run performanceTests/load/createProjectAndSpecLoadTest.js
```

**配置**:
- 阶段 1: 0 → 10 VUs (30 秒爬坡)
- 阶段 2: 10 VUs (2 分钟稳定)
- 阶段 3: 10 → 0 VUs (30 秒下降)

**性能阈值**:
- ✓ 失败率 < 1%
- ✓ P95 响应时间 < 15 秒
- ✓ 检查通过率 > 90%

---

### 3. 压力测试 (Stress Test)

**用途**: 找到系统性能瓶颈和极限

```bash
k6 run performanceTests/stress/createProjectAndSpecStressTest.js
```

**配置**:
- 阶段 1: 0 → 20 VUs (1 分钟)
- 阶段 2: 20 → 40 VUs (2 分钟)
- 阶段 3: 40 → 60 VUs (2 分钟)
- 阶段 4: 60 → 0 VUs (1 分钟)

**目标**: 找到系统开始出现错误的负载点

---

### 4. 峰值测试 (Spike Test)

**用途**: 测试系统应对突发流量的能力

```bash
k6 run performanceTests/spike/createProjectAndSpecSpikeTest.js
```

**配置**:
- 正常负载: 5 VUs
- 突发峰值: 50 VUs (持续 30 秒)
- 恢复观察: 返回 5 VUs

---

### 5. 浸泡测试 (Soak Test)

**用途**: 长时间稳定性测试，发现内存泄漏等问题

```bash
k6 run performanceTests/soak/createProjectAndSpecSoakTest.js
```

**配置**:
- 持续时间: 2 小时
- 并发用户: 10 VUs
- 推荐: 结合 Grafana 实时监控

---

## 📊 测试报告

### 报告格式

所有测试自动生成**三种格式**的报告：

#### 1. 控制台输出（实时）

测试运行时直接在终端显示：

```
============================================================
 CREATE PROJECT TEST SUMMARY
============================================================

 Test Duration: 4.35s
 Iterations: 1
 HTTP Requests: 5

 Performance Metrics:
   Request Duration (avg): 365.57ms
   Request Duration (p95): 595.06ms
   Request Duration (max): 638.65ms
   Failure Rate: 0.00%
   Check Success Rate: 100.00%

============================================================
```

#### 2. HTML 报告（可视化）

专业的 HTML 报告，包含图表和详细指标：

- 文件位置: `results/`
- 查看方式: 双击打开或使用浏览器
- 内容: 性能曲线图、统计摘要、详细指标

**打开 HTML 报告**:
```bash
# Windows
start results/load-test-report.html

# macOS
open results/load-test-report.html

# Linux
xdg-open results/load-test-report.html
```

#### 3. JSON 数据（自动化分析）

完整的测试数据，适用于：
- CI/CD 集成
- 自定义分析脚本
- 数据趋势对比

```bash
# 查看 JSON 数据
cat results/load-test-data.json
```

---

## 📈 实时监控

### 启动监控系统

使用 InfluxDB + Grafana 进行实时性能监控。

#### 1. 启动监控栈

```bash
# Windows
start-monitoring.bat

# macOS/Linux
docker-compose up -d
```

**预期输出**:
```
✔ Container k6-influxdb  Started
✔ Container k6-grafana   Started
```

#### 2. 访问 Grafana 仪表板

**URL**: http://localhost:3000

**登录凭据**:
- 用户名: `admin`
- 密码: `admin`

**仪表板地址**:
```
http://localhost:3000/d/k6-performance/k6-performance-testing-dashboard
```

#### 3. 运行测试（带监控）

```bash
# Windows - 使用监控脚本
run-with-monitoring.bat performanceTests/load/createProjectAndSpecLoadTest.js

# 或手动指定 InfluxDB 输出
k6 run --out influxdb=http://localhost:8086/k6 performanceTests/load/createProjectAndSpecLoadTest.js
```

#### 4. 查看实时数据

Grafana 仪表板包含 6 个监控面板：

1. **Virtual Users (VUs)** - 虚拟用户数
2. **Request Rate (req/s)** - 每秒请求数
3. **Response Time (ms)** - 响应时间（平均/P95/P99）
4. **Failure Rate (%)** - 失败率
5. **Checks Pass Rate (%)** - 检查通过率
6. **Iteration Duration (ms)** - 迭代耗时

#### 5. 停止监控系统

```bash
# Windows
stop-monitoring.bat

# macOS/Linux
docker-compose down
```

**详细监控文档**: 查看 [MONITORING.md](MONITORING.md)

---

## ⚙️ 配置管理

### 环境配置

编辑 `config/environments.js`:

```javascript
export const ENVIRONMENTS = {
  QA1: {
    name: 'QA1',
    baseUrl: 'https://one.qa1.example.com',
    domain: 'qa1.example.com',
    workgroupId: '5018408',
  },
  QA2: {
    name: 'QA2',
    baseUrl: 'https://one.qa2.example.com',
    domain: 'qa2.example.com',
    workgroupId: '5018408',
  },
  // 添加更多环境...
};
```

**切换环境**:
```bash
# 设置环境变量
export CURRENT_ENV=QA1  # macOS/Linux
set CURRENT_ENV=QA1     # Windows

k6 run scripts/createProject.js
```

### 用户配置

编辑 `config/users.js`:

```javascript
export const USERS = {
  ADMIN: {
    username: 'admin_user',
    password: 'admin_password',
    role: 'admin',
  },
  MEMBER: {
    username: 'member_user',
    password: 'member_password',
    role: 'member',
  },
};
```

**切换用户**:
```bash
export CURRENT_USER=ADMIN  # macOS/Linux
set CURRENT_USER=ADMIN     # Windows

k6 run scripts/createProject.js
```

---

## 🎯 最佳实践

### 1. 测试数据隔离

使用数据生成器自动创建唯一的测试数据：

```javascript
import { generateProjectName } from '../utils/dataGenerator.js';

const projectName = generateProjectName(envPrefix, 'Performance');
// 输出: QA2_K6_Project_Performance_1764209108077
```

### 2. Token 共享

使用 `setup()` 函数共享认证 token，避免并发认证问题：

```javascript
export function setup() {
  const env = getCurrentEnvironment();
  const user = getCurrentUser();
  const authHelper = new AuthHelper(env.baseUrl, env.workgroupId);
  const authData = authHelper.authenticate(user.username, user.password);

  return { env, user, authData };
}

export default function (data) {
  // 使用共享的 authData
  const { env, user, authData } = data;
  // 执行测试...
}
```

### 3. 渐进式负载测试

从小负载开始，逐步增加：

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // 爬坡
    { duration: '2m', target: 10 },    // 稳定
    { duration: '30s', target: 0 },    // 下降
  ],
};
```

### 4. 设置合理的阈值

根据业务需求设置性能阈值：

```javascript
export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],      // 失败率 < 1%
    http_req_duration: ['p(95)<15000'],  // P95 < 15 秒
    checks: ['rate>0.90'],               // 检查通过率 > 90%
  },
};
```

### 5. 结合多种报告方式

同时使用多种输出格式：

```bash
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  --out json=results/data.json \
  performanceTests/load/createProjectAndSpecLoadTest.js
```

---

## 🔧 故障排查

### 问题 1: OAuth 认证失败

**症状**: 并发测试时出现大量认证失败

**解决方案**: 使用 Token 共享模式（已在所有性能测试中实现）

```javascript
// ✅ 正确：使用 setup() 共享 token
export function setup() {
  return authHelper.authenticate(user, password);
}

// ❌ 错误：每个 VU 独立认证（会导致并发问题）
export default function () {
  authHelper.authenticate(user, password);
}
```

---

### 问题 2: Grafana 无数据显示

**症状**: 仪表板显示 "No data"

**解决方案**:

1. 检查 InfluxDB 是否运行
   ```bash
   docker-compose ps
   ```

2. 确认测试使用了 InfluxDB 输出
   ```bash
   k6 run --out influxdb=http://localhost:8086/k6 <script>
   ```

3. 调整时间范围（Grafana 右上角）
   - 选择 "Last 15 minutes" 或 "Last 30 minutes"

4. 检查数据库
   ```bash
   docker exec -it k6-influxdb influx
   > USE k6
   > SHOW MEASUREMENTS
   ```

---

### 问题 3: 端口被占用

**症状**: Docker 启动失败，提示端口被占用

**解决方案**:

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :8086

# 停止占用进程或修改 docker-compose.yml 中的端口
```

---

### 问题 4: 测试失败率高

**症状**: 大量请求失败，失败率 > 10%

**可能原因**:
- 服务器负载过高（降低 VUs）
- 网络问题（检查连接）
- 服务器配置不足（增加资源）

**调试步骤**:

1. 降低并发用户数
   ```javascript
   stages: [
     { duration: '30s', target: 5 },  // 从 5 个 VU 开始
   ]
   ```

2. 增加超时时间
   ```javascript
   export const options = {
     timeout: '60s',
   };
   ```

3. 查看详细错误日志
   ```bash
   k6 run --verbose scripts/createProject.js
   ```

---

## 📚 进阶主题

### CI/CD 集成

将 k6 测试集成到 CI/CD 流水线：

```yaml
# GitHub Actions 示例
name: Performance Tests
on: [push]
jobs:
  k6-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: performanceTests/load/createProjectAndSpecLoadTest.js
          flags: --out json=results.json
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: k6-results
          path: results.json
```

### 自定义指标

添加自定义业务指标：

```javascript
import { Trend } from 'k6/metrics';

const projectCreationTime = new Trend('project_creation_time');

export default function () {
  const start = Date.now();

  // 创建项目
  const project = projectHelper.createProject(projectName);

  const duration = Date.now() - start;
  projectCreationTime.add(duration);
}
```

### 数据驱动测试

使用 CSV 或 JSON 文件提供测试数据：

```javascript
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const csvData = new SharedArray('test data', function () {
  return papaparse.parse(open('./testdata.csv'), { header: true }).data;
});

export default function () {
  const data = csvData[__VU % csvData.length];
  // 使用 data...
}
```

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 支持

遇到问题？

1. 查看 [故障排查](#故障排查) 章节
2. 查看 [MONITORING.md](MONITORING.md) 了解监控系统详情
3. 查看 [k6 官方文档](https://k6.io/docs/)
4. 提交 Issue

---

## 🎓 学习资源

- [k6 官方文档](https://k6.io/docs/)
- [k6 性能测试最佳实践](https://k6.io/docs/testing-guides/test-types/)
- [Grafana 仪表板教程](https://grafana.com/tutorials/)
- [InfluxDB 查询语法](https://docs.influxdata.com/influxdb/v1.8/query_language/)

---

**Created with ❤️ for Performance Testing Excellence**

*Last Updated: 2025-11-27*
