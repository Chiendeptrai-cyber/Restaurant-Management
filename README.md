# Food Ordering SOA Demo

Demo hệ thống SOA gồm 3 phần:
- `product-service`: Express.js với MongoDB riêng
- `order-service`: Express.js với MongoDB riêng và Fault Tolerance
- `frontend`: React + Vite + Tailwind, build static và serve bằng Nginx

## Cấu trúc

```text
textfood-order-soa-demo/
├── product-service/
├── order-service/
├── frontend/
├── docker-compose.yml
└── README.md
```

## Chạy demo

1. Vào thư mục dự án:
```bash
cd textfood-order-soa-demo
```

2. Xây dựng và chạy toàn bộ dịch vụ:
```bash
docker-compose up --build
```

3. Truy cập frontend:
- http://localhost:3000

## Kiểm tra Fault Tolerance

1. Tạo một hoặc nhiều sản phẩm bằng API Product Service:
```bash
curl -X POST http://localhost:3001/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Pizza","price":120,"description":"Pizza demo","stock":10}'
```

2. Tắt `product-service`:
```bash
docker-compose stop product-service
```

3. Gọi đặt hàng:
- Từ frontend: thêm sản phẩm vào giỏ và bấm `Đặt hàng`
- Hoặc bằng curl:
```bash
curl -X POST http://localhost:3002/orders \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"<id>","quantity":1}]}'
```

4. Khi `product-service` down, `order-service` vẫn tạo order với status `product_service_unavailable` và trả về cảnh báo rõ ràng.

## Môi trường

Mỗi service có file `.env.example` riêng để cấu hình môi trường cơ bản.

- Product Service: `product-service/.env.example`
- Order Service: `order-service/.env.example`
- Frontend: `frontend/.env.example`

## Endpoints chính

- Product Service
  - `GET /products`
  - `GET /products/:id`
  - `POST /products`

- Order Service
  - `POST /orders`
  - `GET /orders`

- Frontend
  - `http://localhost:3000`
# Restaurant-Management
