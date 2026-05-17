#!/bin/bash
# 生成自签名 SSL 证书（用于测试）
# 正式使用时建议使用 Let's Encrypt 证书

set -e

SSL_DIR="/etc/nginx/ssl"

echo "=========================================="
echo "  生成自签名 SSL 证书"
echo "=========================================="

# 创建证书目录
sudo mkdir -p $SSL_DIR

# 生成私钥和证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/soulquad.key" \
    -out "$SSL_DIR/soulquad.crt" \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=SoulQuad/CN=localhost"

echo ""
echo "证书已生成:"
echo "  证书: $SSL_DIR/soulquad.crt"
echo "  私钥: $SSL_DIR/soulquad.key"
echo ""
echo "注意: 这是自签名证书，浏览器会显示不安全警告"
echo "      测试完成后建议使用 Let's Encrypt 获取正式证书"
