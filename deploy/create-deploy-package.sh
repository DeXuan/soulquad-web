#!/bin/bash
# SoulQuad 本地打包脚本
# 使用方法: ./create-deploy-package.sh
# 执行后生成 soulquad-deploy.zip，上传到服务器解压即可

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SoulQuad 打包部署${NC}"
echo -e "${GREEN}========================================${NC}"

PROJECT_DIR="c:\Users\gdx\soulquad-web"

# 切换到项目根目录
cd "$(dirname "$0")/.."

echo -e "${YELLOW}[1/3] 构建前端...${NC}"
npm run build

echo -e "${YELLOW}[2/3] 打包文件...${NC}"

# 创建临时目录
TEMP_DIR="deploy-package-temp"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制必要文件
cp -r dist "$TEMP_DIR/"
cp -r server "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp -r node_modules/.bin "$TEMP_DIR/node_modules/" 2>/dev/null || true

# 复制部署脚本
cp deploy/deploy-to-server.sh "$TEMP_DIR/"
cp deploy/deploy-update.sh "$TEMP_DIR/"
cp deploy/nginx.conf "$TEMP_DIR/"

# 打包
rm -f soulquad-deploy.zip
powershell -Command "Compress-Archive -Path '$TEMP_DIR\*' -DestinationPath 'soulquad-deploy.zip' -Force"

# 清理
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  打包完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "部署包: soulquad-deploy.zip"
echo ""
echo -e "上传到服务器:"
echo -e "  scp soulquad-deploy.zip root@你的IP:/var/www/"
echo -e ""
echo -e "服务器上解压:"
echo -e "  cd /var/www"
echo -e "  powershell -Command \"Expand-Archive -Path 'soulquad-deploy.zip' -DestinationPath '.' -Force\""
echo ""