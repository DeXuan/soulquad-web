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

# 检查是否是 git 仓库
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo -e "${RED}错误: 不是 Git 仓库，请使用完整部署脚本${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/4] 拉取最新代码...${NC}"
cd "$PROJECT_DIR"
git pull

echo -e "${YELLOW}[2/4] 安装依赖...${NC}"
npm install

echo -e "${YELLOW}[3/4] 构建前端...${NC}"
npm run build

echo -e "${YELLOW}[4/4] 重启服务...${NC}"
pm2 restart soulquad
nginx -t && systemctl reload nginx

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  更新完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址: http://$(curl -s ifconfig.me)"
echo -e "查看日志: pm2 logs soulquad"
echo ""