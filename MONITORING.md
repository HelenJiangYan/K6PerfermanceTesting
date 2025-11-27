# k6 Performance Monitoring - InfluxDB + Grafana

实时监控方案，用于长时间测试和生产环境性能监控。

## 📋 目录

- [架构说明](#架构说明)
- [快速开始](#快速开始)
- [使用指南](#使用指南)
- [仪表板说明](#仪表板说明)
- [故障排查](#故障排查)

---

## 🏗️ 架构说明

```
┌─────────────┐
│   k6 Test   │
│   Scripts   │
└──────┬──────┘
       │ HTTP (port 8086)
       ▼
┌─────────────┐
│  InfluxDB   │  时序数据库
│  (v1.8)     │  存储性能指标
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Grafana   │  可视化仪表板
│  (Latest)   │  实时监控
└─────────────┘
  http://localhost:3000
```

**组件说明:**
- **InfluxDB**: 时序数据库，存储 k6 性能指标
- **Grafana**: 数据可视化平台，提供实时仪表板
- **Docker Compose**: 容器编排，简化部署

---

## 🚀 快速开始

### 前提条件

确保已安装：
- ✅ Docker Desktop (Windows)
- ✅ k6 性能测试工具

### 步骤 1: 启动监控栈

```bash
# 方式 1: 使用启动脚本 (推荐 - Windows)
start-monitoring.bat

# 方式 2: 使用 Docker Compose (macOS/Linux)
docker-compose up -d
```

**预期输出:**
```
[+] Running 3/3
 ✔ Network k6permancetesting_k6-network  Created
 ✔ Container k6-influxdb                  Started
 ✔ Container k6-grafana                   Started
```

### 步骤 2: 访问 Grafana

浏览器打开: **http://localhost:3000**

**登录凭据:**
- 用户名: `admin`
- 密码: `admin`

### 步骤 3: 运行带监控的测试

```bash
# Windows - 使用监控脚本运行测试
run-with-monitoring.bat performanceTests/load/createProjectAndSpecLoadTest.js

# 或者手动运行
k6 run --out influxdb=http://localhost:8086/k6 performanceTests/load/createProjectAndSpecLoadTest.js
```

### 步骤 4: 查看实时仪表板

测试运行时，访问：
**http://localhost:3000/d/k6-performance/k6-performance-testing-dashboard**

---

## 📖 使用指南

### 启动监控栈

```bash
# Windows
start-monitoring.bat

# macOS/Linux
docker-compose up -d
```

### 运行测试（带监控）

```bash
# 负载测试 (Windows)
run-with-monitoring.bat performanceTests/load/createProjectAndSpecLoadTest.js

# 压力测试 (Windows)
run-with-monitoring.bat performanceTests/stress/createProjectAndSpecStressTest.js

# 峰值测试 (Windows)
run-with-monitoring.bat performanceTests/spike/createProjectAndSpecSpikeTest.js

# 浸泡测试（长时间，Windows）
run-with-monitoring.bat performanceTests/soak/createProjectAndSpecSoakTest.js
```

### 手动运行测试

```bash
# 指定 InfluxDB 输出
k6 run --out influxdb=http://localhost:8086/k6 <test-script>

# 同时输出到多个目标
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  --out json=results/data.json \
  <test-script>
```

### 停止监控栈

```bash
# Windows
stop-monitoring.bat

# macOS/Linux
docker-compose down
```

### 清除所有数据

```bash
# 停止并删除所有数据（包括历史记录）
docker-compose down -v
```

---

## 📊 仪表板说明

### 默认仪表板: k6 Performance Testing Dashboard

**面板说明:**

1. **Virtual Users (VUs)**
   - 显示: 实时虚拟用户数量
   - 用途: 查看负载变化趋势

2. **Request Rate (req/s)**
   - 显示: 每秒请求数
   - 用途: 监控系统吞吐量

3. **Response Time (ms)**
   - 显示: 平均、P95、P99 响应时间
   - 用途: 性能趋势分析

4. **Failure Rate (%)**
   - 显示: 请求失败率百分比
   - 用途: 稳定性监控

5. **Checks Pass Rate (%)**
   - 显示: k6 检查通过率
   - 用途: 业务逻辑验证

6. **Iteration Duration (ms)**
   - 显示: 完整迭代耗时
   - 用途: 端到端性能分析

### 自定义仪表板

1. 登录 Grafana: http://localhost:3000
2. 点击 "+" → "Dashboard"
3. 添加面板，选择数据源: `InfluxDB-k6`
4. 编写查询（示例见下方）

**常用查询示例:**

```sql
-- 平均响应时间
SELECT mean("value") FROM "http_req_duration"
WHERE $timeFilter GROUP BY time($__interval)

-- P95 响应时间
SELECT percentile("value", 95) FROM "http_req_duration"
WHERE $timeFilter GROUP BY time($__interval)

-- 请求成功率
SELECT mean("rate") * 100 FROM "http_req_failed"
WHERE $timeFilter GROUP BY time($__interval)
```

---

## 🔧 高级配置

### 修改 InfluxDB 端口

编辑 `docker-compose.yml`:

```yaml
influxdb:
  ports:
    - "9086:8086"  # 修改为其他端口
```

运行测试时也需要修改:
```bash
k6 run --out influxdb=http://localhost:9086/k6 <script>
```

### 启用 InfluxDB 认证

编辑 `docker-compose.yml`:

```yaml
influxdb:
  environment:
    - INFLUXDB_HTTP_AUTH_ENABLED=true
    - INFLUXDB_ADMIN_USER=admin
    - INFLUXDB_ADMIN_PASSWORD=your_password
```

运行测试时添加认证:
```bash
k6 run --out influxdb=http://admin:your_password@localhost:8086/k6 <script>
```

### 数据持久化

数据存储在 Docker volumes 中:
- `influxdb-data`: InfluxDB 数据
- `grafana-data`: Grafana 配置

**备份数据:**
```bash
docker-compose stop
docker run --rm -v k6permancetesting_influxdb-data:/data -v $(pwd):/backup alpine tar czf /backup/influxdb-backup.tar.gz /data
```

**恢复数据:**
```bash
docker run --rm -v k6permancetesting_influxdb-data:/data -v $(pwd):/backup alpine tar xzf /backup/influxdb-backup.tar.gz -C /
```

---

## ⚙️ 配置文件说明

### docker-compose.yml
Docker Compose 主配置文件，定义服务、网络和卷。

### grafana/provisioning/datasources/influxdb.yml
Grafana 数据源自动配置，连接到 InfluxDB。

### grafana/provisioning/dashboards/dashboard.yml
仪表板自动加载配置。

### grafana/dashboards/k6-dashboard.json
k6 性能测试仪表板定义。

---

## 🐛 故障排查

### 问题 1: 无法访问 Grafana

**症状:** 浏览器无法打开 http://localhost:3000

**解决:**
```bash
# 检查容器状态
docker-compose ps

# 查看容器日志
docker-compose logs grafana

# 重启服务
docker-compose restart grafana
```

### 问题 2: Grafana 无数据显示

**症状:** 仪表板显示 "No data"

**原因:**
- InfluxDB 未运行
- k6 未正确配置输出
- 数据库中无数据

**解决:**
```bash
# 1. 检查 InfluxDB 状态
docker-compose ps influxdb

# 2. 检查数据库
docker exec -it k6-influxdb influx
> SHOW DATABASES
> USE k6
> SHOW MEASUREMENTS

# 3. 确保运行测试时指定了 --out 参数
k6 run --out influxdb=http://localhost:8086/k6 <script>
```

### 问题 3: 端口被占用

**症状:**
```
Error: bind: address already in use
```

**解决:**
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000
netstat -ano | findstr :8086

# 停止占用进程或修改 docker-compose.yml 中的端口
```

### 问题 4: Docker 启动失败

**症状:** `docker-compose up -d` 报错

**解决:**
```bash
# 1. 检查 Docker 是否运行
docker version

# 2. 清理旧容器
docker-compose down -v

# 3. 重新启动
docker-compose up -d

# 4. 查看详细日志
docker-compose logs
```

---

## 📚 最佳实践

### 1. 长时间测试

浸泡测试（2小时+）时，使用 InfluxDB 监控:
```bash
# Windows
run-with-monitoring.bat performanceTests/soak/createProjectAndSpecSoakTest.js
```

### 2. 生产监控

设置告警规则（Grafana Alerts）:
1. 编辑仪表板面板
2. 设置告警条件
3. 配置通知渠道（Email, Slack等）

### 3. 团队协作

分享仪表板:
1. Grafana → Dashboard → Share
2. 复制链接或导出 JSON
3. 团队成员可导入 JSON 创建相同仪表板

### 4. 历史数据分析

保留测试数据进行趋势分析:
- 定期备份 InfluxDB 数据
- 创建对比仪表板
- 分析性能退化

---

## 🔗 相关资源

- [k6 InfluxDB 输出文档](https://k6.io/docs/results-output/real-time/influxdb/)
- [Grafana 官方文档](https://grafana.com/docs/grafana/latest/)
- [InfluxDB 查询语法](https://docs.influxdata.com/influxdb/v1.8/query_language/)
- [k6 指标说明](https://k6.io/docs/using-k6/metrics/)

---

## 📞 支持

遇到问题？
1. 查看本文档的[故障排查](#故障排查)章节
2. 检查 Docker 容器日志: `docker-compose logs`
3. 查看 k6 官方文档

---

## 🎯 集成说明

本监控方案与项目的其他输出方式**互补使用**：

- **HTML + JSON 报告**：测试完成后的详细分析（已配置）
- **InfluxDB + Grafana**：长时间测试的实时监控（本文档）

两者可以同时使用：
```bash
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  --out json=results/data.json \
  performanceTests/soak/createProjectAndSpecSoakTest.js
```

这样既可以实时监控，又可以在测试结束后查看详细的 HTML 报告。

---

**Created with ❤️ for k6 Performance Testing**
