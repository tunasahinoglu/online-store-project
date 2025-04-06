
# Database Document Models

## Users Collection

```json
userID: {
    firstname: non-empty string,
    lastname: non-empty string,
    email: email address,
    active: false | true by default,
    role: "customer" | "productmanager" | "salesmanager" | "admin",
    address: {
        country: non-empty string,
        city: non-empty string,
        address: non-empty string
    },
    wishlist: [
        productID,
        ...
    ]
}
```

## Users/Basket Collection

```json
productID: {
    count: positive integer
}
```

## Users/Notifications Collection

```json
notificationID: {
    message: non-empty string,
    seen: false by default | true,
    date: timestamp
}
```

## Delivery Company Collection

```json
deliverycompanyID: {
    name: non-empty string,
    costs: [non-negative integer for standard cost, non-negative integer for express cost],
    email: email address
}
```

## Products Collection

```json
productID: {
    name: non-empty string,
    category: non-empty string,
    subcategory: non-empty string,
    serialnumber: non-empty string,
    image: non-empty string,
    price: non-negative integer,
    discount: integer between 0 and 100,
    stock: non-negative integer,
    popularity: non-negative integer,
    description: string,
    warranty: integer not less than -1, // in months and -1 means lifetime
    distributorname: non-empty string,
    features: {
        feature1: string,
        ...
    }
}
```

## Orders Collection

```json
orderID: {
    user: userID,
    firstname: non-empty string,
    lastname: non-empty string,
    totalcost: positive integer,
    totaldiscountedcost: non-negative integer,
    status: "processing" | "in-transit" | "delivered" | "cancelled" | "refunded",
    address: {
        country: non-empty string,
        city: non-empty string,
        address: non-empty string
    },
    delivery: {
        type: "standard" | "express",
        company: deliverycompanyID
    },
    notes: string,
    date: timestamp
}
```

## Orders/Products Collection

```json
productID: {
    name: non-empty string,
    price: positive integer,
    discount: integer between 0 and 100,
    count: positive integer
}
```

## Requests Collection

```json
requestID: {
    user: userID,
    firstname: non-empty string,
    lastname: non-empty string,
    revievew: false by default | true,
    approved: false by default | true,
    order: orderID,
    request: "refund",
    date: timestamp
}
```

## Comments Collection

```json
commentID: {
    user: userID,
    firstname: non-empty string,
    lastname: non-empty string,
    order: orderID,
    product: productID,
    rate: integer between 0 and 10,
    reviewed: false by default | true,
    approved: false by default | true,
    comment: string,
    date: timestamp
}
```

## Logs Collection

```json
logID: {
    data: document data,
    document: document path,
    method: "ADD" | "SET" | "DELETE",
    user: userID,
    date: timestamp
}
```