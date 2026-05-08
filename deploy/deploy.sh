#!/bin/bash
# SoulQuad 部署脚本
# Usage: ./deploy.sh [server_ip] [domain]

set -e

SERVER_IP=${1:-"your-server-ip"}
DOMAIN=${2:-""}
PROJECT_DIR="/var/www/soulquad"

echo "=========================================="
echo "  SoulQuad 部署脚本"
echo "=========================================="

# 1. 连接服务器并创建目录
echo "[1/6] 连接服务器..."
ssh root@$SERVER_IP "mkdir -p $PROJECT_DIR"

# 2. 上传项目 (排除 node_modules, dist, .git)
echo "[2/6] 上传项目文件..."
rsync -avz --exclude='node_modules' --exclude='dist' --exclude='.git' \
    --exclude='*.log' --exclude='.env' \
    ./ root@$SERVER_IP:$PROJECT_DIR/

# 3. 安装依赖
echo "[3/6] 安装依赖..."
ssh root@$SERVER_IP "cd $PROJECT_DIR && npm install --production"

# 4. 构建前端
echo "[4/6] 构建前端..."
ssh root@$SERVER_IP "cd $PROJECT_DIR && npm run build"

# 5. 配置 Nginx
echo "[5/6] 配置 Nginx..."
ssh root@$SERVER_IP "cp $PROJECT_DIR/deploy/nginx.conf /etc/nginx/sites-available/soulquad"
if [ -n "$DOMAIN" ]; then
    ssh root@$SERVER_IP "sed -i 's/your-domain.com/$DOMAIN/g' /etc/nginx/sites-available/soulquad"
fi
ssh root@$SERVER_IP "ln -sf /etc/nginx/sites-available/soulquad /etc/nginx/sites-enabled/"
ssh root@$SERVER_IP "nginx -t && systemctl restart nginx"

# 6. 启动后端 (使用 PM2)
echo "[6/6] 启动后端服务..."
ssh root@$SERVER_IP "cd $PROJECT_DIR && pm2 delete soulquad 2>/dev/null || true"
ssh root@$SERVER_IP "cd $PROJECT_DIR && pm2 start server/index.js --name soulquad"
ssh root@$SERVER_IP "pm2 save"

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "前端地址: http://$SERVER_IP"
if [ -n "$DOMAIN" ]; then
    echo "域名地址: https://$DOMAIN"
fi
echo "后端地址: http://$SERVER_IP:3000"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs soulquad"
echo "  重启服务: pm2 restart soulquad"
echo "  查看状态: pm2 status"