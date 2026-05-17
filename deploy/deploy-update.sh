#!/bin/bash
# SoulQuad 增量更新脚本
# 支持: Debian/Ubuntu, RHEL/Rocky/AlmaLinux/CentOS
# 使用方法: ./deploy-update.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/soulquad"
DB_NAME="soulquad"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SoulQuad 增量更新${NC}"
echo -e "${GREEN}========================================${NC}"

# 操作系统检测
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_FAMILY="debian"
        if [[ "$ID" == "rhel" || "$ID" == "centos" || "$ID" == "rocky" || "$ID" == "almalinux" || "$ID_LIKE" == *"rhel"* ]]; then
            OS_FAMILY="rhel"
        fi
    elif [ -f /etc/redhat-release ]; then
        OS_FAMILY="rhel"
    fi
}

detect_os

# ============== 1. 拉取代码 ==============
echo -e "${YELLOW}[1/6] 拉取最新代码...${NC}"
cd "$PROJECT_DIR"
if [ -d ".git" ]; then
    git pull origin main || git pull || echo "git pull 完成（可能存在冲突）"
else
    echo -e "${YELLOW}  非 Git 仓库，跳过代码拉取...${NC}"
fi

# ============== 2. 数据库迁移 ==============
echo -e "${YELLOW}[2/6] 运行数据库迁移...${NC}"
if [ -f "$PROJECT_DIR/server/db/migrate.sql" ]; then
    su - postgres -c "psql -d $DB_NAME -f $PROJECT_DIR/server/db/migrate.sql" 2>/dev/null || \
    sudo -u postgres psql -d "$DB_NAME" -f "$PROJECT_DIR/server/db/migrate.sql" || \
    echo "迁移完成"
    echo -e "${GREEN}  数据库迁移完成${NC}"
else
    echo -e "${YELLOW}  迁移脚本不存在，跳过${NC}"
fi

# ============== 3. 安装依赖 ==============
echo -e "${YELLOW}[3/6] 安装依赖...${NC}"
npm install

# ============== 4. 构建前端 ==============
echo -e "${YELLOW}[4/6] 构建前端...${NC}"
npm run build

# ============== 5. 重启服务 ==============
echo -e "${YELLOW}[5/6] 重启服务...${NC}"
pm2 restart soulquad

# ============== 6. 重载 Nginx ==============
echo -e "${YELLOW}[6/6] 重载 Nginx...${NC}"
nginx -t && systemctl reload nginx 2>/dev/null || nginx -t && service nginx reload 2>/dev/null || true

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  更新完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址: http://$(curl -s ifconfig.me)"
echo -e "查看日志: pm2 logs soulquad"
echo ""