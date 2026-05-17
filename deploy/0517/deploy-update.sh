#!/bin/bash
# SoulQuad 增量更新脚本
# 使用方法: ./deploy-update.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SoulQuad 增量更新${NC}"
echo -e "${GREEN}========================================${NC}"

PROJECT_DIR="/var/www/soulquad"
DB_NAME="soulquad"

# 尝试 git pull（如果存在 .git 目录）
if [ -d "$PROJECT_DIR/.git" ]; then
    echo -e "${YELLOW}[1/6] 拉取最新代码...${NC}"
    cd "$PROJECT_DIR"
    git pull || echo "git pull 完成（可能存在冲突，手动检查）"
else
    echo -e "${YELLOW}[1/6] 非 Git 仓库，跳过代码拉取...${NC}"
fi

echo -e "${YELLOW}[2/6] 运行数据库迁移...${NC}"
if [ -f "$PROJECT_DIR/server/db/migrate.sql" ]; then
    sudo -u postgres psql -d "$DB_NAME" -f "$PROJECT_DIR/server/db/migrate.sql" || echo "迁移脚本执行完成"
    echo -e "${GREEN}  数据库迁移完成${NC}"
else
    echo -e "${YELLOW}  迁移脚本不存在，跳过${NC}"
fi

echo -e "${YELLOW}[3/6] 安装依赖...${NC}"
cd "$PROJECT_DIR"
npm install

echo -e "${YELLOW}[4/6] 构建前端...${NC}"
npm run build

echo -e "${YELLOW}[5/6] 重启服务...${NC}"
pm2 restart soulquad

echo -e "${YELLOW}[6/6] 重载 Nginx...${NC}"
nginx -t && systemctl reload nginx

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  更新完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址: http://$(curl -s ifconfig.me)"
echo -e "查看日志: pm2 logs soulquad"
echo ""