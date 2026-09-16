FROM nginx:alpine

# 复制前端代码到 Nginx 默认目录
COPY . /usr/share/nginx/html

# 暴露 80 端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
