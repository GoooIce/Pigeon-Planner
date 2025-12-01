# Act 使用指南

`act` 是一个强大的命令行工具，允许你在本地运行 GitHub Actions 工作流，无需将代码推送到 GitHub。这对于在提交代码之前测试 CI/CD 流程非常有用。

## 目录

- [安装](#安装)
- [基本使用](#基本使用)
- [常用命令](#常用命令)
- [项目特定配置](#项目特定配置)
- [故障排除](#故障排除)
- [最佳实践](#最佳实践)

## 安装

### macOS

使用 Homebrew 安装：

```bash
brew install act
```

### Linux

使用包管理器安装：

```bash
# Ubuntu/Debian
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# 或使用 snap
sudo snap install act
```

### Windows

使用 Chocolatey 或 Scoop：

```bash
# Chocolatey
choco install act-cli

# Scoop
scoop install act
```

### 验证安装

```bash
act --version
```

## 基本使用

### 列出可用的工作流

查看项目中所有可用的 GitHub Actions 工作流：

```bash
act --list
```

输出示例：
```
Stage  Job ID       Job name     Workflow name      Workflow file  Events           
0      build-linux  build-linux  Build and Release  build.yml      push,pull_request
```

### 运行默认工作流

运行默认事件（通常是 `push`）：

```bash
act
```

### 运行特定事件

运行特定的事件类型：

```bash
# 模拟 push 事件
act push

# 模拟 pull_request 事件
act pull_request
```

### 运行特定作业

只运行工作流中的特定作业：

```bash
act -j build-linux
```

## 常用命令

### 基本选项

```bash
# 列出所有工作流
act --list
# 或简写
act -l

# 运行特定作业
act -j <job-id>

# 指定工作流文件路径
act -W .github/workflows/build.yml

# 详细输出
act -v

# 静默模式（减少日志输出）
act -q
```

### 平台和架构配置

**重要提示**：如果你使用的是 Apple M 系列芯片（M1/M2/M3），建议指定容器架构以避免兼容性问题：

```bash
act --container-architecture linux/amd64
```

### 环境变量和密钥

```bash
# 设置环境变量
act --env MY_VAR=value

# 从文件读取环境变量
act --env-file .env

# 设置密钥（用于测试需要密钥的步骤）
act --secret MY_SECRET=secret_value

# 从文件读取密钥
act --secret-file .secrets
```

### 工作目录绑定

默认情况下，`act` 会将工作目录复制到容器中。使用 `--bind` 选项可以绑定挂载目录（更快，但可能有权限问题）：

```bash
act --bind
```

### 自定义 Docker 镜像

为特定平台指定自定义 Docker 镜像：

```bash
act -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

### 验证工作流

在不实际运行的情况下验证工作流语法：

```bash
act --validate
```

### 干运行模式

验证工作流但不创建容器：

```bash
act -n
# 或
act --dryrun
```

## 项目特定配置

### Pigeon Planner 项目配置

对于 Pigeon Planner 项目，推荐使用以下命令：

#### 1. 列出工作流

```bash
cd /Users/devel0per/Code/pigeon/Pigeon-Planner
act --list
```

#### 2. 运行构建作业

```bash
act push \
  -j build-linux \
  -W .github/workflows/build.yml
```

#### 3. 使用详细输出调试

```bash
act push \
  -j build-linux \
  -v \
  -W .github/workflows/build.yml
```

#### 4. 如果遇到架构问题（Apple Silicon）

如果遇到架构相关的问题，可以指定容器架构：

```bash
act push \
  --container-architecture linux/amd64 \
  -j build-linux \
  -W .github/workflows/build.yml
```

### 创建配置文件

你可以在项目根目录创建 `.actrc` 文件来保存常用配置：

```bash
# .actrc
-v
-W .github/workflows/build.yml
```

## 故障排除

### 问题 1: Apple M 系列芯片警告

**症状**：
```
WARN  ⚠ You are using Apple M-series chip and you have not specified container architecture...
```

**解决方案**：
```bash
act --container-architecture linux/amd64
```

### 问题 2: Docker 连接问题

**症状**：无法连接到 Docker daemon

**解决方案**：
1. 确保 Docker Desktop 正在运行
2. 检查 Docker socket 路径：
   ```bash
   act --container-daemon-socket unix:///var/run/docker.sock
   ```

### 问题 3: 权限问题

**症状**：容器内无法访问文件或执行操作

**解决方案**：
1. 使用 `--privileged` 模式（谨慎使用）：
   ```bash
   act --privileged
   ```
2. 或使用 `--bind` 选项：
   ```bash
   act --bind
   ```

### 问题 4: 网络问题

**症状**：无法下载依赖或访问外部资源

**解决方案**：
```bash
# 使用 host 网络模式
act --network host
```

### 问题 5: 缓存问题

**症状**：构建结果不一致

**解决方案**：
```bash
# 禁用缓存服务器
act --no-cache-server

# 或清理 act 缓存
rm -rf ~/.cache/act
```

### 问题 6: 工作流步骤失败

**症状**：某些步骤在本地失败但在 GitHub 上成功

**解决方案**：
1. 检查是否需要设置特定的环境变量或密钥
2. 使用 `-v` 查看详细日志
3. 确保 Docker 镜像与 GitHub Actions 使用的镜像匹配

### 问题 7: Rust 工具链安装失败 - Invalid cross-device link

**症状**：
```
error: could not rename component file ... Invalid cross-device link (os error 18)
```

**原因**：Docker 容器内 rustup 尝试在挂载的卷上重命名文件时失败

**解决方案**：

1. **清理 Docker 容器和缓存**：
   ```bash
   # 清理 act 缓存
   rm -rf ~/.cache/act
   
   # 清理 Docker 容器
   docker system prune -f
   ```

2. **使用 --privileged 模式**（如果上述方法无效）：
   ```bash
   act push \
     --privileged \
     -j build-linux \
     -W .github/workflows/build.yml
   ```

3. **设置环境变量**（在 workflow 中已自动处理）：
   - `RUSTUP_HOME` 和 `CARGO_HOME` 已在 workflow 中设置
   - 如果仍有问题，可以手动设置：
     ```bash
     act push \
       --env RUSTUP_HOME=/tmp/.rustup \
       --env CARGO_HOME=/tmp/.cargo \
       -j build-linux \
       -W .github/workflows/build.yml
     ```

4. **如果遇到架构问题**（Apple Silicon 可能需要）：
   ```bash
   act push \
     --container-architecture linux/amd64 \
     --privileged \
     -j build-linux \
     -W .github/workflows/build.yml
   ```

5. **跳过 Rust 安装步骤**（仅用于测试其他部分）：
   ```bash
   # 如果 Rust 已安装在容器中，可以跳过 Setup Rust 步骤
   # 但这需要修改 workflow 文件
   ```

## 最佳实践

### 1. 使用配置文件

创建 `.actrc` 文件保存常用选项：

```bash
# .actrc
--container-architecture linux/amd64
-v
```

### 2. 分步测试

先验证工作流语法，再运行完整构建：

```bash
# 1. 验证语法
act --validate

# 2. 干运行
act -n

# 3. 运行特定步骤
act -j build-linux
```

### 3. 使用环境变量文件

创建 `.env` 文件存储测试环境变量：

```bash
# .env
NODE_VERSION=20
RUST_VERSION=stable
```

然后使用：
```bash
act --env-file .env
```

### 4. 模拟不同事件

测试不同触发条件：

```bash
# 测试 push 事件
act push

# 测试 pull_request 事件
act pull_request

# 测试特定标签推送
act push --eventpath event.json
```

创建 `event.json`：
```json
{
  "ref": "refs/tags/v1.0.0",
  "pusher": {
    "name": "test-user"
  }
}
```

### 5. 重用容器

开发时重用容器以加快速度：

```bash
act -r  # 重用容器
```

### 6. 并行执行

如果有多个作业，可以并行运行：

```bash
act --concurrent-jobs 2
```

## 高级用法

### 自定义事件文件

创建自定义事件 JSON 文件来模拟特定场景：

```bash
# event.json
{
  "push": {
    "ref": "refs/heads/master",
    "head_commit": {
      "message": "Test commit"
    }
  }
}

# 使用
act push --eventpath event.json
```

### 本地 Action 替换

使用本地文件夹替换远程 Action：

```bash
act --local-repository actions/checkout@v4=/path/to/local/checkout
```

### 图形化工作流

可视化工作流结构：

```bash
act --graph
```

### 监听文件变化

自动运行工作流当文件改变时：

```bash
act -w
# 或
act --watch
```

## 性能优化

### 1. 使用缓存

`act` 默认会缓存 Actions 和 Docker 镜像，确保缓存正常工作：

```bash
# 查看缓存位置
ls ~/.cache/act
```

### 2. 绑定工作目录

对于大型项目，使用 `--bind` 可以显著加快速度：

```bash
act --bind
```

### 3. 重用容器

开发时重用容器避免重复创建：

```bash
act -r
```

### 4. 限制并发

根据系统资源调整并发数：

```bash
act --concurrent-jobs 1
```

## 与 GitHub Actions 的差异

虽然 `act` 尽力模拟 GitHub Actions，但存在一些差异：

1. **环境差异**：本地 Docker 环境可能与 GitHub 运行器不同
2. **权限差异**：某些权限相关功能可能无法完全模拟
3. **服务差异**：GitHub 特定的服务（如 Artifacts、Cache）使用本地实现
4. **网络差异**：网络访问可能受到本地防火墙限制

## 参考资源

- [Act 官方文档](https://github.com/nektos/act)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker 文档](https://docs.docker.com/)

## 快速参考

```bash
# 基本命令
act --list                    # 列出工作流
act push                      # 运行 push 事件
act -j build-linux           # 运行特定作业

# Apple Silicon
act --container-architecture linux/amd64

# 调试
act -v                       # 详细输出
act -n                       # 干运行
act --validate               # 验证语法

# 配置
act --bind                   # 绑定目录
act -r                       # 重用容器
act --env MY_VAR=value      # 设置环境变量
```

---

**提示**：如果遇到问题，使用 `-v` 选项查看详细日志，这通常能帮助你找到问题的根源。

