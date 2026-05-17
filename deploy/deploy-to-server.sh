#!/bin/bash
# SoulQuad 一键部署脚本
# 支持: Debian/Ubuntu, RHEL/Rocky/AlmaLinux/CentOS
# 使用方法: ./deploy-to-server.sh

set -e

# ============== 配置变量 ==============
PROJECT_DIR="/var/www/soulquad"
DB_NAME="soulquad"
DB_USER="soulquad_user"
DB_PASS="SoulQuad2024!"
SERVER_IP=$(curl -s ifconfig.me || echo "YOUR_SERVER_IP")

# ============== 颜色 ==============
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============== OS 检测 ==============
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_ID=$ID
        OS_ID_LIKE=$ID_LIKE
        OS_NAME=$NAME
        OS_VERSION=$VERSION_ID
    elif [ -f /etc/redhat-release ]; then
        OS_ID="rhel"
        OS_NAME="Red Hat Enterprise Linux"
        OS_VERSION=$(cat /etc/redhat-release | sed 's/.*release //' | cut -d' ' -f1)
    else
        echo -e "${RED}不支持的操作系统${NC}"
        exit 1
    fi

    # 判断类型
    if [[ "$OS_ID" == "ubuntu" || "$OS_ID" == "debian" || "$OS_ID_LIKE" == *"debian"* ]]; then
        OS_FAMILY="debian"
    elif [[ "$OS_ID" == "rhel" || "$OS_ID" == "centos" || "$OS_ID" == "rocky" || "$OS_ID" == "almalinux" || "$OS_ID_LIKE" == *"rhel"* || "$OS_ID_LIKE" == *"fedora"* ]]; then
        OS_FAMILY="rhel"
    else
        echo -e "${RED}不支持的操作系统: $OS_NAME${NC}"
        exit 1
    fi
}

# ============== 包管理器 ==============
install_pkg() {
    case $OS_FAMILY in
        debian)
            export DEBIAN_FRONTEND=noninteractive
            apt update
            apt install -y "$@"
            ;;
        rhel)
            yum install -y "$@"
            ;;
    esac
}

start_service() {
    case $OS_FAMILY in
        debian)
            systemctl enable "$1" 2>/dev/null || true
            systemctl start "$1" 2>/dev/null || true
            ;;
        rhel)
            systemctl enable "$1" 2>/dev/null || true
            systemctl start "$1" 2>/dev/null || true
            ;;
    esac
}

restart_service() {
    case $OS_FAMILY in
        debian|rhel)
            systemctl restart "$1" 2>/dev/null || true
            ;;
    esac
}

open_firewall() {
    case $OS_FAMILY in
        debian)
            ufw allow "$1" 2>/dev/null || true
            ;;
        rhel)
            firewall-cmd --permanent --add-port="$1" 2>/dev/null || true
            firewall-cmd --reload 2>/dev/null || true
            ;;
    esac
}

# ============== PostgreSQL 安装 ==============
install_postgresql() {
    echo -e "${YELLOW}[1/7] 安装 PostgreSQL...${NC}"

    case $OS_FAMILY in
        debian)
            apt install -y postgresql postgresql-contrib
            ;;
        rhel)
            # RHEL/CentOS/Rocky 使用 EPEL 或官方仓库
            if command -v dnf &>/dev/null; then
                yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm 2>/dev/null || true
                dnf install -y postgresql15-server postgresql15-contrib 2>/dev/null || \
                yum install -y postgresql-server postgresql-contrib
            else
                yum install -y postgresql-server postgresql-contrib
            fi
            ;;
    esac

    # 初始化数据库（仅 RHEL 需要）
    if [[ "$OS_ID" == "rocky" || "$OS_ID" == "almalinux" || "$OS_ID" == "centos" || "$OS_ID" == "rhel" ]]; then
        postgresql-setup initdb 2>/dev/null || true
    fi

    start_service postgresql
    echo -e "${GREEN}  PostgreSQL 安装完成${NC}"
}

# ============== PostgreSQL 配置 ==============
configure_postgresql() {
    echo -e "${YELLOW}[2/7] 配置 PostgreSQL...${NC}"

    # PostgreSQL 数据目录
    PG_DATA=$(su - postgres -c "psql -t -c 'SHOW data_directory;'" 2>/dev/null | tr -d '[:space:]')
    PG_VERSION=$(su - postgres -c "psql -t -c 'SHOW server_version;'"| cut -d' ' -f1 | cut -d'.' -f1)
    PG_DATA="${PG_DATA:-/var/lib/pgsql/data}"

    # 创建数据库和用户
    su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME;\"" 2>/dev/null || echo "数据库已存在"
    su - postgres -c "psql -c \"CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';\"" 2>/dev/null || echo "用户已存在"
    su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\"" 2>/dev/null || true
    su - postgres -c "psql -c \"ALTER DATABASE $DB_NAME OWNER TO $DB_USER;\"" 2>/dev/null || true

    # 配置 pg_hba.conf（允许远程连接）
    PG_HBA=$(su - postgres -c "psql -t -c 'SHOW hba_file;'" 2>/dev/null | tr -d '[:space:]')
    if [ -z "$PG_HBA" ] || [ ! -f "$PG_HBA" ]; then
        PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
    fi

    if [ -f "$PG_HBA" ]; then
        if ! grep -q "host all all 0.0.0.0/0 md5" "$PG_HBA" 2>/dev/null; then
            echo "host all all 0.0.0.0/0 md5" >> "$PG_HBA"
        fi
    fi

    # 配置 postgresql.conf 允许监听所有地址
    PG_CONF=$(su - postgres -c "psql -t -c 'SHOW config_file;'" 2>/dev/null | tr -d '[:space:]')
    PG_CONF="${PG_CONF:-/etc/postgresql/${PG_VERSION}/main/postgresql.conf}"

    if [ -f "$PG_CONF" ]; then
        if grep -q "^#listen_addresses" "$PG_CONF"; then
            sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
        elif grep -q "^listen_addresses" "$PG_CONF"; then
            sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
        fi
    fi

    restart_service postgresql
    echo -e "${GREEN}  PostgreSQL 配置完成${NC}"
}

# ============== Node.js 安装 ==============
install_nodejs() {
    echo -e "${YELLOW}[3/7] 安装 Node.js...${NC}"

    if command -v node &>/dev/null; then
        echo -e "${GREEN}  Node.js 已安装: $(node -v)${NC}"
    else
        case $OS_FAMILY in
            debian)
                curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                apt install -y nodejs
                ;;
            rhel)
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
                yum install -y nodejs
                ;;
        esac
    fi

    # 安装 PM2
    npm install -g pm2
    echo -e "${GREEN}  Node.js 安装完成: $(node -v)${NC}"
}

# ============== 部署项目 ==============
deploy_project() {
    echo -e "${YELLOW}[4/7] 部署项目...${NC}"

    mkdir -p "$PROJECT_DIR"

    # rsync 复制项目文件（排除 node_modules, .git, dist）
    rsync -avz --exclude='node_modules' --exclude='.git' --exclude='dist' \
          --exclude='release*' --exclude='electron' --exclude='build' \
          --exclude='*.log' --exclude='soulquad-data.sql' \
          . "$PROJECT_DIR/"

    cd "$PROJECT_DIR"
    npm install
    echo -e "${GREEN}  项目部署完成${NC}"
}

# ============== 数据库迁移 ==============
run_migration() {
    echo -e "${YELLOW}[5/7] 运行数据库迁移...${NC}"

    if [ -f "$PROJECT_DIR/server/db/migrate.sql" ]; then
        su - postgres -c "psql -d $DB_NAME -f $PROJECT_DIR/server/db/migrate.sql" || echo "迁移完成"
        echo -e "${GREEN}  数据库迁移完成${NC}"
    else
        echo -e "${YELLOW}  迁移脚本不存在，跳过${NC}"
    fi
}

# ============== 环境变量配置 ==============
configure_env() {
    echo -e "${YELLOW}[6/7] 配置环境变量...${NC}"

    cat > "$PROJECT_DIR/.env" << EOF
NODE_ENV=production
PORT=3000

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=$DB_NAME
PG_USER=$DB_USER
PG_PASSWORD=$DB_PASS

TOKEN_SECRET=SoulQuad-Secret-Key-2024-$(date +%s)
CORS_ORIGIN=*
EOF

    # 修复 API 地址（使用相对路径，通过 Nginx 代理）
    sed -i "s|const API_BASE = 'http://localhost:3001/api';|const API_BASE = '/api';|" "$PROJECT_DIR/src/services/api.ts" 2>/dev/null || true

    # 构建前端
    echo "  构建前端..."
    npm run build

    echo -e "${GREEN}  环境变量配置完成${NC}"
}

# ============== 启动服务 ==============
start_service() {
    echo -e "${YELLOW}[7/7] 启动服务...${NC}"

    # 停止旧进程
    cd "$PROJECT_DIR"
    pm2 delete soulquad 2>/dev/null || true

    # 启动应用
    pm2 start server/index.js --name soulquad
    pm2 save
    pm2 startup 2>/dev/null || true

    # 配置 Nginx
    if [ -f "$PROJECT_DIR/deploy/nginx.conf" ]; then
        NGINX_CONF="/etc/nginx/sites-available/soulquad"
        NGINX_ENABLED="/etc/nginx/sites-enabled/soulquad"

        cp "$PROJECT_DIR/deploy/nginx.conf" "$NGINX_CONF"
        ln -sf "$NGINX_CONF" "$NGINX_ENABLED" 2>/dev/null || true
        nginx -t && systemctl reload nginx
    fi

    # 开放防火墙端口
    open_firewall 80/tcp
    open_firewall 443/tcp
    open_firewall 3000/tcp

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
    echo ""
}

# ============== 主流程 ==============
main() {
    detect_os

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  SoulQuad 部署脚本${NC}"
    echo -e "${GREEN}  操作系统: $OS_NAME $OS_VERSION${NC}"
    echo -e "${GREEN}========================================${NC}"

    # 检查 root 权限
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}请使用 sudo 运行此脚本${NC}"
        exit 1
    fi

    install_postgresql
    configure_postgresql
    install_nodejs
    deploy_project
    run_migration
    configure_env
    start_service
}

main "$@"