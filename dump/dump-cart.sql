-- Create items in "carts" and "cart_items" tables 

-- 1:
INSERT INTO public."carts" (id, user_id, created_at, updated_at, status) 
VALUES('de15726f-8248-4628-9a5e-8758c4f4feb1', 'ce86cf85-651b-4bd6-ab81-32390921b9ab', '2023-07-06', '2023-07-06', 'OPEN');

INSERT INTO public."cart_items" (id, cart_id, product_id, count) 
VALUES('6deea629-8c70-4e1c-94aa-07e90a47f298', 'de15726f-8248-4628-9a5e-8758c4f4feb1', '593e53d4-7a4d-4953-b4e7-109b6ad5c298', 7);

INSERT INTO public."cart_items" (id, cart_id, product_id, count) 
VALUES('5451f8b0-3435-43a5-aeba-c891d8e81944', 'de15726f-8248-4628-9a5e-8758c4f4feb1', '76a9d83a-a30e-4994-a856-7832fcc1c0bb', 2);

-- 2:
INSERT INTO public."carts" (id, user_id, created_at, updated_at, status) 
VALUES('bcd32d3a-7429-44bd-ac1c-c0606240482e', '3d16480e-119e-425b-824d-82dcb9a10f62', '2023-07-03', '2023-07-05', 'OPEN');

INSERT INTO public."cart_items" (id, cart_id, product_id, count) 
VALUES('1f05d5ed-da90-4f2e-b191-771367b5ab30', 'bcd32d3a-7429-44bd-ac1c-c0606240482e', '593e53d4-7a4d-4953-b4e7-109b6ad5c298', 24);

-- 3:
INSERT INTO public."carts" (id, user_id, created_at, updated_at, status) 
VALUES('1b2d3372-55d8-4de8-8edd-0fa7fcd1087d', '9c2cf4b6-fd8a-427d-8da7-88e8886dc4b8', '2023-07-05', '2023-07-06', 'OPEN');

INSERT INTO public."cart_items" (id, cart_id, product_id, count) 
VALUES('cdc52768-6f1b-46ea-978d-698f5583b4b2', '1b2d3372-55d8-4de8-8edd-0fa7fcd1087d', '5bb4ca7a-4e59-4544-97f0-00d534a05953', 3);

-- 4:
INSERT INTO public."carts" (id, user_id, created_at, updated_at, status) 
VALUES('40168445-9766-40d0-b100-18239a2ed6c0', '8504517c-ce8a-43a2-ab0e-315d2b11192d', '2023-06-26', '2023-07-02', 'ORDERED');

INSERT INTO public."cart_items" (id, cart_id, product_id, count) 
VALUES('2ba3cb5d-cf0d-493a-a2fc-d6e5b314b4cb', '40168445-9766-40d0-b100-18239a2ed6c0', '26258ffd-d634-438a-93c9-e5207d2fd225', 12);


-- Create items in "orders" table (valid only for ORDERED carts)

-- 1:
INSERT INTO public."orders" (id, user_id, cart_id, payment, delivery, comments, status, total) 
VALUES('886d2d0b-dbfd-4891-8e5a-c26d9d9edc5f', '8504517c-ce8a-43a2-ab0e-315d2b11192d', '40168445-9766-40d0-b100-18239a2ed6c0', '{"type":"string", "address":{"field": "test4"}, "creditCard":"some value"}', '{"type":"string", "address":{"field": "test4"}}', 'Order comment 4', 'APPROVED', 504);
