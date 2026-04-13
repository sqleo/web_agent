#!/usr/bin/env bash
# 本地：构建 linux/amd64 → 打 TCR 标签 → push
# 用法：
#   NEXT_PUBLIC_API_BASE_URL=https://api.example.com ./scripts/docker-build-push.sh
#   或在项目根目录准备 .env_web（与后端 .env 区分），本会自动加载其中的变量
#   TAG=v1 REGISTRY=... NAMESPACE=sqliu IMAGE_NAME=web_agent ./scripts/docker-build-push.sh

set -euo pipefail

if [[ -f .env_web ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env_web
  set +a
fi

REGISTRY="${REGISTRY:-ccr.ccs.tencentyun.com}"
NAMESPACE="${NAMESPACE:-sqliu}"
IMAGE_NAME="${IMAGE_NAME:-web_agent}"
TAG="${TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${TAG}"

echo "Building ${FULL_IMAGE} (platform=${PLATFORM})"
docker build \
  --platform "${PLATFORM}" \
  --build-arg "NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-}" \
  -t "${FULL_IMAGE}" \
  .

echo "Pushing ${FULL_IMAGE}"
docker push "${FULL_IMAGE}"

echo "Done. On server: docker login ${REGISTRY} && set TCR_IMAGE=${FULL_IMAGE} in .env_web or export, then compose pull && up -d"
