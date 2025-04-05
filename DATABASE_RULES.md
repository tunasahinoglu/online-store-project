# Rules Documentation

## Users:
- **get:**
    - Admin can read all user profiles
        - `get("users")`
        - `get("users/{userId}")`
    - User can read their own user profile
        - `get("users/{userId}")`

- **set:**
    - Admin can set role of a user and ban/unban them
        - `set("users/{userId}", { role: "customer"/"productmanager"/"salesmanager"/"admin", active: boolean })`
    - User can set their own user profile except for their email address, activation status, and role
        - `set("users/{userId}", { firstname: string, lastname: string, address: { country: string, city: string, address: string }, wishlist: [ productId, ... ] })`

## Basket:
- **get:**
    - User can read their own basket
        - `get("users/{userId}/basket")`

- **set:**
    - User can set a product in their own basket
        - `set("users/{userId}/basket/{productId}", { count: positive number })`

- **del:**
    - User can delete a product from their own basket
        - `del("users/{userId}/basket/{productId}")`

## Notification:
- **get:**
    - User can read their own notifications
        - `get("users/{userId}/notifications")`

- **set:**
    - User can set a notification as seen
        - `set("users/{userId}/notifications/{notificationId}", { seen: true })`

## Delivery Companies:
- **get:**
    - Active User can read all delivery companies
        - `get("deliveryCompanies")`
        - `get("deliveryCompanies/{deliverycompanyId}")`

- **add:**
    - Admin can add a new delivery company
        - `add("deliveryCompanies", { name: string, costs: [non-negative number, non-negative number], email: email address })`

- **del:**
    - Admin can delete a delivery company
        - `del("deliveryCompanies/{deliverycompanyId}")`

## Requests:
- **get:**
    - User can read their own requests
        - `get("requests", null, [["user", "==", auth.currentUser.accessToken]])`
        - `get("requests/{requestId}")`
    - Sales Manager can read all unreviewed requests
        - `get("requests", null, [["reviewed", "==", "false"]])`
        - `get("requests/{requestId}")`
    - Admin can read all requests
        - `get("requests")`
        - `get("requests/{requestId}")`

- **add:**
    - User can add a new request
        - `add("requests", { request: "refund" })`

## Orders:
- **get:**
    - User can read their own orders
        - `get("orders", null, [["user", "==", auth.currentUser.accessToken]])`
        - `get("orders/{orderID}")`
    - Sales Manager can read all orders
        - `get("orders")`
        - `get("orders/{orderID}")`
    - Product Manager can read all orders
        - `get("orders")`
        - `get("orders/{orderID}")`
    - Admin can read all orders
        - `get("orders")`
        - `get("orders/{orderID}")`

- **add:**
    - Active User can add an order
        - `add("orders", { delivery: { type: "standard"/"express", company: deliverycompanyID }, notes: string })`

- **set:**
    - Sales Manager can set status of an order from "delivered" to "refunded" if there is a refund request
        - `set("orders/{orderId}", { status: "refunded" })`
    - Product Manager can set status of an order from "processing" to "in-transit", from "in-transit" to "delivered"
        - `set("orders/{orderId}", { status: "in-transit/delivered" })`
    - User can set status of their own order from "processing" to "cancelled"
        - `set("orders/{orderId}", { status: "cancelled" })`
    - Admin can set status of an order from "processing" to "cancelled"
        - `set("orders/{orderId}", { status: "cancelled" })`

## Products:
- **get:**
    - Anyone can read all products
        - `get("products")`
        - `get("products/{productId}")`

- **add:**
    - Product Manager can add a new product
        - `add("products", { name: string, category: string, subcategory: string, serialnumber: string, image: string, stock: non-negative integer, description: string, warranty: integer not less than -1, distributorname: string, features: { featurename: string, ... } })`

- **set:**
    - Product Manager can set a product except its price and discount
        - `set("products/{productId}", { name: string, category: string, subcategory: string, serialnumber: string, image: string, stock: non-negative integer, description: string, warranty: integer not less than -1, distributorname: string, features: { featurename: string, ... } })`
    - Sales Manager can set price and discount of a product
        - `set("products/{productId}", { price: non-negative integer, discount: integer between 0 and 100 })`

- **del:**
    - Product Manager can delete a product
        - `del("products/{productId}")`
    - Admin can delete a product
        - `del("products/{productId}")`

## Comments:
- **get:**
    - Anyone can read approved comments
        - `get("comments", null, [["approved", "==", "true"]])`
        - `get("comments/{commentID}")`
    - User can read their own comments
        - `get("comments", null, [["user", "==", auth.currentUser.accessToken]])`
        - `get("comments/{commentID}")`
    - Product Manager can read all comments
        - `get("comments")`
        - `get("comments/{commentID}")`
    - Admin can read all comments
        - `get("comments")`
        - `get("comments/{commentID}")`

- **add:**
    - Active User can add their own comment if they have purchased the product
        - `add("comments", { order: orderID, product: productId, comment: string, rating: number })`

- **del:**
    - User can delete their own comment
        - `del("comments/{commentId}")`

- **set:**
    - Product Manager can approve/disapprove an unreviewed comment
        - `set("comments/{commentId}", { approved: true | false })`
    - Admin can approve/disapprove a comment
        - `set("comments/{commentId}", { approved: true | false })`

## Logs:
- **read:**
    - Admin can read all logs:
        - `get("logs")`
        - `get("logs/{logId}")`