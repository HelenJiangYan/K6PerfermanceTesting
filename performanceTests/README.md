# Performance Tests

性能测试套件，包含多种类型的性能测试场景。

## 目录结构

```
performanceTests/
├── load/           # 负载测试 - 验证系统在预期负载下的性能
├── stress/         # 压力测试 - 逐步增加负载找到系统极限
├── spike/          # 峰值测试 - 模拟突发流量
├── soak/           # 浸泡测试 - 长时间运行验证稳定性
└── README.md       # 本文档

results/            # 测试报告输出目录
├── *-test-report.html  # HTML 格式报告（易读、适合分享）
└── *-test-data.json    # JSON 格式数据（适合分析）
```

## 📊 测试结果输出

所有性能测试现在支持**三种输出格式**：

1. **控制台输出** - 实时显示测试进度和摘要
2. **HTML 报告** - 专业的可视化报告，保存在 `results/` 目录
3. **JSON 数据** - 完整的测试数据，便于后续分析

### 查看测试报告

运行测试后，可以通过以下方式查看报告：

```bash
# Windows
start results/load-test-report.html

# macOS
open results/load-test-report.html

# Linux
xdg-open results/load-test-report.html
```

## 测试类型说明

### 1. Load Test（负载测试）

**目的：** 验证系统在正常/预期负载下的性能表现

#### 1.1 业务操作负载测试（推荐）

**测试文件**: `createProjectAndSpecLoadTest.js`

**场景：** 5个并发用户（共享Token），持续2分钟

**Token 模式**: 所有 VU 共享一个 Token（模拟同一用户的多个并发操作）

**运行命令：**
```bash
k6 run performanceTests/load/createProjectAndSpecLoadTest.js
```

**性能指标：**
- HTTP 请求失败率 < 1%
- p95 响应时间 < 5秒
- 检查通过率 > 90%

**适用场景：**
- 测试已登录用户的业务操作性能
- 测试创建项目、规格等功能的吞吐量
- 不关注认证系统的并发能力

**优点：**
- ✅ 避免 OAuth 限流问题
- ✅ 更快的测试执行（跳过重复认证）
- ✅ 符合实际：用户登录一次，执行多个操作

---

#### 1.2 认证系统负载测试

**测试文件**: `authenticationLoadTest.js`

**场景：** 10个并发用户（每个VU独立Token），持续2分钟

**Token 模式**: 每个 VU 独立认证（模拟多个用户同时登录）

**运行命令：**
```bash
k6 run performanceTests/load/authenticationLoadTest.js
```

**性能指标：**
- 认证失败率 < 5%
- p95 认证响应时间 < 3秒
- 检查通过率 > 90%

**适用场景：**
- 测试认证系统的并发登录能力
- 测试 OAuth 服务的限流策略
- 验证多用户同时登录的场景

**注意事项：**
- ⚠️ 可能触发 OAuth 限流（401 错误）
- ⚠️ 并发数不宜过高（建议 < 20）
- ⚠️ 需要关注认证服务器的资源使用

---

### 2. Stress Test（压力测试）

**目的：** 逐步增加负载，找到系统的极限和瓶颈

**场景：** 从0逐步增加到200个并发用户

**负载阶段：**
- 0 → 50 用户（2分钟）→ 保持（3分钟）
- 50 → 100 用户（2分钟）→ 保持（3分钟）
- 100 → 150 用户（2分钟）→ 保持（3分钟）
- 150 → 200 用户（2分钟）→ 保持（3分钟）
- 200 → 0 用户（2分钟）

**运行命令：**
```bash
k6 run performanceTests/stress/createProjectAndSpecStressTest.js
```

**性能指标：**
- HTTP 请求失败率 < 5%（压力下允许更高失败率）
- p95 响应时间 < 10秒
- 检查通过率 > 85%

**适用场景：**
- 确定系统最大承载能力
- 找出系统瓶颈
- 容量规划

---

### 3. Spike Test（峰值测试）

**目的：** 模拟突发流量，测试系统弹性和恢复能力

**场景：** 正常流量突然激增到高峰，然后恢复

**负载阶段：**
- 0 → 20 用户（1分钟）- 正常流量
- 保持 20 用户（2分钟）
- 20 → 200 用户（30秒）- **突发峰值** 🚀
- 保持 200 用户（3分钟）
- 200 → 20 用户（30秒）- 快速恢复
- 保持 20 用户（2分钟）- 恢复期
- 20 → 0 用户（1分钟）

**运行命令：**
```bash
k6 run performanceTests/spike/createProjectAndSpecSpikeTest.js
```

**性能指标：**
- HTTP 请求失败率 < 5%
- p95 响应时间 < 10秒
- 检查通过率 > 80%

**适用场景：**
- 抢购活动
- 促销活动
- 突发新闻/热点事件
- 验证自动扩缩容

---

### 4. Soak Test（浸泡测试/持久性测试）

**目的：** 长时间运行，发现内存泄漏、资源耗尽等问题

**场景：** 30个并发用户，持续2小时

**运行命令：**
```bash
# 完整2小时测试
k6 run performanceTests/soak/createProjectAndSpecSoakTest.js

# 短时间测试（10分钟）
k6 run -e DURATION=10m performanceTests/soak/createProjectAndSpecSoakTest.js

# 自定义时长（30分钟）
k6 run -e DURATION=30m performanceTests/soak/createProjectAndSpecSoakTest.js
```

**性能指标：**
- HTTP 请求失败率 < 1%（长时间应保持低失败率）
- p95 响应时间 < 5秒
- 检查通过率 > 95%

**监控重点：**
- 响应时间是否逐渐增加
- 内存使用是否持续上升
- 错误率是否随时间增加
- 资源泄漏

**适用场景：**
- 验证系统长期稳定性
- 发现内存泄漏
- 生产环境模拟

---

## 切换测试环境

所有测试都支持通过 `-e ENV` 参数切换环境：

```bash
# 在 QA2 环境运行（默认）
k6 run performanceTests/load/createProjectAndSpecLoadTest.js

# 在 QA3 环境运行
k6 run -e ENV=qa3 performanceTests/load/createProjectAndSpecLoadTest.js

# 在 SQA 环境运行
k6 run -e ENV=sqa performanceTests/load/createProjectAndSpecLoadTest.js
```

## 切换用户类型

```bash
# 使用标准用户（默认）
k6 run performanceTests/load/createProjectAndSpecLoadTest.js

# 使用管理员用户
k6 run -e USER_TYPE=admin performanceTests/load/createProjectAndSpecLoadTest.js
```

## 组合参数

```bash
# QA3环境 + 管理员用户 + 10分钟浸泡测试
k6 run -e ENV=qa3 -e USER_TYPE=admin -e DURATION=10m performanceTests/soak/createProjectAndSpecSoakTest.js
```

## 性能测试最佳实践

### 1. 测试顺序建议

按以下顺序执行测试：

1. **Smoke Test** (scripts/ 目录) - 验证功能正常
2. **Load Test** - 验证正常负载下的性能
3. **Stress Test** - 找到系统极限
4. **Spike Test** - 验证弹性
5. **Soak Test** - 验证长期稳定性

### 2. 测试前准备

- ✅ 确保测试环境资源充足
- ✅ 清理测试数据（如果需要）
- ✅ 确认测试不会影响生产环境
- ✅ 准备监控工具（服务器CPU、内存、网络等）

### 3. 结果分析

关注以下指标：

- **响应时间**：avg, p95, p99, max
- **吞吐量**：http_reqs (req/s)
- **错误率**：http_req_failed
- **检查通过率**：checks

### 4. 性能基准

建议建立性能基准线：

```javascript
// 示例：基准指标
const BASELINE = {
  load: {
    p95: 3000,        // ms
    failureRate: 0.01, // 1%
    throughput: 20,    // req/s
  },
  stress: {
    maxVUs: 150,
    p95: 5000,
  },
};
```

## 输出和报告

所有测试都包含自定义摘要输出，提供关键性能指标：

```
============================================================
 LOAD TEST SUMMARY
============================================================

 Test Duration: 300s
 VUs: 50
 Iterations: 1500
 HTTP Requests: 9000

 Performance Metrics:
   Request Duration (avg): 450.23ms
   Request Duration (p95): 1250.45ms
   Request Duration (max): 3500.12ms
   Request Rate: 30.00 req/s
   Failure Rate: 0.50%
   Check Success Rate: 98.50%

============================================================
```

## 常见问题

### Q: 为什么负载测试失败率高？
A: 检查以下几点：
- 测试环境资源是否充足
- 并发数是否超过系统承载能力
- 网络是否稳定
- 数据库连接池是否足够

### Q: 如何确定合适的并发用户数？
A:
1. 从小负载开始（10-20 VU）
2. 逐步增加观察系统表现
3. 找到性能指标开始下降的临界点
4. 预留20-30%的余量作为正常负载

### Q: 浸泡测试要运行多久？
A:
- 最少：30分钟
- 推荐：2-4小时
- 理想：24小时

## 下一步

- [ ] 添加更多业务场景的性能测试
- [ ] 集成 Grafana 可视化
- [ ] 添加 CI/CD 集成
- [ ] 自动化性能回归测试
