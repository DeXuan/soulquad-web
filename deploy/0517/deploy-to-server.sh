#!/bin/bash
# SoulQuad 一键部署脚本
# 使用方法: ./deploy-to-server.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SoulQuad 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检测是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# ========== 配置变量 ==========
PROJECT_DIR="/var/www/soulquad"
DB_NAME="soulquad"
DB_USER="soulquad_user"
DB_PASS="SoulQuad2024!"
# 请修改为你的服务器 IP 或域名
SERVER_IP=$(curl -s ifconfig.me || echo "YOUR_SERVER_IP")

# ========== 1. 安装 PostgreSQL ==========
echo -e "${YELLOW}[1/7] 安装 PostgreSQL...${NC}"
apt update
apt install -y postgresql postgresql-contrib

# 启动服务
systemctl start postgresql
systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "数据库已存在"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';" 2>/dev/null || echo "用户已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"

echo -e "${GREEN}  PostgreSQL 安装完成${NC}"

# ========== 2. 配置 PostgreSQL ==========
echo -e "${YELLOW}[2/7] 配置 PostgreSQL...${NC}"

# 检测 PostgreSQL 版本
PG_VERSION=$(ls /etc/postgresql/ 2>/dev/null || echo "15")
PG_HBA="/etc/postgresql/$PG_VERSION/main/pg_hba.conf"
PG_CONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"

# 配置 pg_hba.conf
if [ -f "$PG_HBA" ]; then
    if ! grep -q "host all all 0.0.0.0/0 md5" "$PG_HBA" 2>/dev/null; then
        echo "host all all 0.0.0.0/0 md5" >> "$PG_HBA"
    fi
fi

# 配置 postgresql.conf
if [ -f "$PG_CONF" ]; then
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
fi

# 重启 PostgreSQL
systemctl restart postgresql

echo -e "${GREEN}  PostgreSQL 配置完成${NC}"

# ========== 3. 安装 Node.js ==========
echo -e "${YELLOW}[3/7] 安装 Node.js...${NC}"

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PM2
npm install -g pm2

echo -e "${GREEN}  Node.js 安装完成${NC}"

# ========== 4. 部署项目 ==========
echo -e "${YELLOW}[4/7] 部署项目...${NC}"

# 创建项目目录
mkdir -p "$PROJECT_DIR"

# 复制项目文件（排除 node_modules, .git, dist）
echo "  正在复制项目文件..."
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='release*' --exclude='electron' --exclude='build' --exclude='*.log' . "$PROJECT_DIR/"

cd "$PROJECT_DIR"

# 安装依赖
npm install

echo -e "${GREEN}  项目部署完成${NC}"

# ========== 5. 运行数据库迁移 ==========
echo -e "${YELLOW}[5/7] 运行数据库迁移...${NC}"

if [ -f "$PROJECT_DIR/server/db/migrate.sql" ]; then
    sudo -u postgres psql -d "$DB_NAME" -f "$PROJECT_DIR/server/db/migrate.sql" || echo "迁移脚本执行完成"
    echo -e "${GREEN}  数据库迁移完成${NC}"
else
    echo -e "${YELLOW}  迁移脚本不存在，跳过${NC}"
fi

# ========== 6. 配置环境变量和修复前端配置 ==========
echo -e "${YELLOW}[6/7] 配置环境变量和修复前端配置...${NC}"

cat > "$PROJECT_DIR/.env" << 'EOF'
# SoulQuad 环境配置
NODE_ENV=production
PORT=3000

# PostgreSQL 配置
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=soulquad
PG_USER=soulquad_user
PG_PASSWORD=SoulQuad2024!

# JWT 密钥（生产环境请修改）
TOKEN_SECRET=SoulQuad-Secret-Key-2024

# CORS
CORS_ORIGIN=*
EOF

# 修复 API 地址（使用相对路径，通过 Nginx 代理）
echo "  修复 API 地址配置..."
sed -i "s|const API_BASE = 'http://localhost:3001/api';|const API_BASE = '/api';|" "$PROJECT_DIR/src/services/api.ts" 2>/dev/null || true

# 构建前端（修复配置后再构建）
echo "  构建前端..."
npm run build

echo -e "${GREEN}  环境变量配置完成${NC}"

# ========== 7. 启动服务 ==========
echo -e "${YELLOW}[7/7] 启动服务...${NC}"

# 停止旧进程
pm2 delete soulquad 2>/dev/null || true

# 启动应用
cd "$PROJECT_DIR"
pm2 start server/index.js --name soulquad
pm2 save
pm2 startup

# 配置 Nginx
if [ -f "$PROJECT_DIR/deploy/nginx.conf" ]; then
    cp "$PROJECT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/soulquad
    ln -sf /etc/nginx/sites-available/soulquad /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

# 开放防火墙端口
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw allow 3000/tcp 2>/dev/null || true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址: http://$SERVER_IP"
echo -e "API地址: http://$SERVER_IP:3000"
echo ""
echo -e "数据库信息:"
echo -e "  Host: localhost"
echo -e "  Port: 5432"
echo -e "  Database: $DB_NAME"
echo -e "  User: $DB_USER"
echo -e "  Password: $DB_PASS"
echo ""
echo -e "常用命令:"
echo -e "  查看日志: pm2 logs soulquad"
echo -e "  重启服务: pm2 restart soulquad"
echo -e "  查看状态: pm2 status"
echo -e "  查看数据库: sudo -u postgres psql -d $DB_NAME"
echo ""