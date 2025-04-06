# Database Rules Documentation

## Users Collection:
- **get:**
    - User can read their own user profile
        - `get("users/{userId}")`
    - Admin can read all user profiles
        - `get("users")`
        - `get("users/{userId}")`

- **set:**
    - User can set their own user profile except for their email address, activation status, and role
        - `set("users/{userId}", { firstname: non-empty string, lastname: non-empty string, address: { country: non-empty string, city: non-empty string, address: non-empty string }, wishlist: [ productId, ... ] })`
    - Admin can set role of a user and ban/unban them
        - `set("users/{userId}", { role: "customer"/"productmanager"/"salesmanager"/"admin", active: boolean })`

## Users/Basket Collection:
- **get:**
    - User can read their own basket
        - `get("users/{userId}/basket")`

- **set:**
    - User can set a product in their own basket
        - `set("users/{userId}/basket/{productId}", { count: positive number })`

- **del:**
    - User can delete a product from their own basket
        - `del("users/{userId}/basket/{productId}")`

## Users/Notification Collection:
- **get:**
    - User can read their own notifications
        - `get("users/{userId}/notifications")`

- **set:**
    - User can set a notification as seen
        - `set("users/{userId}/notifications/{notificationId}", { seen: true })`

## Delivery Companies Collection:
- **get:**
    - Active User can read all delivery companies
        - `get("deliveryCompanies")`
        - `get("deliveryCompanies/{deliverycompanyId}")`

- **add:**
    - Admin can add a new delivery company
        - `add("deliveryCompanies", { name: non-empty string, costs: [non-negative number, non-negative number], email: email address })`

- **del:**
    - Admin can delete a delivery company
        - `del("deliveryCompanies/{deliverycompanyId}")`

## Products Collection:
- **get:**
    - Anyone can read all products
        - `get("products")`
        - `get("products/{productId}")`

- **add:**
    - Product Manager can add a new product
        - `add("products", { name: non-empty string, category: non-empty string, subcategory: non-empty string, serialnumber: non-empty string, image: non-empty string, stock: non-negative integer, description: string, warranty: integer not less than -1, distributorname: non-empty string, features: { featurename: string, ... } })`

- **set:**
    - Product Manager can set a product except its price and discount
        - `set("products/{productId}", { name: non-empty string, category: non-empty string, subcategory: non-empty string, serialnumber: non-empty string, image: non-empty string, stock: non-negative integer, description: string, warranty: integer not less than -1, distributorname: non-empty string, features: { featurename: string, ... } })`
    - Sales Manager can set price and discount of a product
        - `set("products/{productId}", { price: non-negative integer, discount: integer between 0 and 100 })`

- **del:**
    - Admin can delete a product
        - `del("products/{productId}")`
    - Product Manager can delete a product
        - `del("products/{productId}")`

## Orders Collection:
- **get:**
    - User can read their own orders
        - `get("orders", null, [["user", "==", auth.currentUser.accessToken]])`
        - `get("orders/{orderID}")`
    - Admin can read all orders
        - `get("orders")`
        - `get("orders/{orderID}")`
    - Product Manager can read all orders
        - `get("orders")`
        - `get("orders/{orderID}")`
    - Sales Manager can read all orders
        - `get("orders")`
        - `get("orders/{orderID}")`

- **add:**
    - Active User can add an order
        - `add("orders", { delivery: { type: "standard"/"express", company: deliverycompanyID }, notes: string })`

- **set:**
    - User can set status of their own order from "processing" to "cancelled"
        - `set("orders/{orderId}", { status: "cancelled" })`
    - Admin can set status of an order from "processing" to "cancelled"
        - `set("orders/{orderId}", { status: "cancelled" })`
    - Product Manager can set status of an order from "processing" to "in-transit", from "in-transit" to "delivered"
        - `set("orders/{orderId}", { status: "in-transit/delivered" })`

## Requests Collection:
- **get:**
    - User can read their own requests
        - `get("requests", null, [["user", "==", auth.currentUser.accessToken]])`
        - `get("requests/{requestId}")`
    - Admin can read all requests
        - `get("requests")`
        - `get("requests/{requestId}")`
    - Sales Manager can read all requests
        - `get("requests")`
        - `get("requests/{requestId}")`

- **add:**
    - User can add a new request
        - `add("requests", { request: "refund" })`

- **set:**
    - Sales Manager can approve/disapprove a request
        - `set("requests/{requestID}", { approved: true | false })`

## Comments Collection:
- **get:**
    - Anyone can read approved comments
        - `get("comments", null, [["approved", "==", "true"]])`
        - `get("comments/{commentID}")`
    - Admin can read all comments
        - `get("comments")`
        - `get("comments/{commentID}")`
    - User can read their own comments
        - `get("comments", null, [["user", "==", auth.currentUser.accessToken]])`
        - `get("comments/{commentID}")`
    - Product Manager can read all comments
        - `get("comments")`
        - `get("comments/{commentID}")`

- **add:**
    - Active User can add their own comment per order of a product after delivery
        - `add("comments", { order: orderID, product: productId, comment: string, rating: number })`

- **set:**
    - Admin can approve/disapprove a comment
        - `set("comments/{commentId}", { approved: true | false })`
    - Product Manager can approve/disapprove an unreviewed comment
        - `set("comments/{commentId}", { approved: true | false })`

## Logs Collection:
- **read:**
    - Admin can read all logs:
        - `get("logs")`
        - `get("logs/{logId}")`