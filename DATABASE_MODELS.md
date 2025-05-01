
# Database Document Models

## Users Collection

```jsonc
userID: {
    "firstname": "non-empty string",
    "lastname": "non-empty string",
    "email": "email address",
    "active": "false | true by default",
    "role": "customer | productmanager | salesmanager | admin",
    "address": {
        "country": "non-empty string",
        "city": "non-empty string",
        "address": "non-empty string"
    },
    "wishlist": [
        "productID",
        //...
    ]
}
```

## Users/Basket Collection

```jsonc
productID: {
    "count": "positive integer"
}
```

## Users/Notifications Collection

```jsonc
notificationID: {
    "message": "non-empty string",
    "seen": "false by default | true",
    "date": "timestamp"
}
```

## Delivery Company Collection

```jsonc
deliverycompanyID: {
    "name": "non-empty string",
    "costs": "[non-negative integer for standard cost, non-negative integer for express cost]",
    "email": "email address"
}
```

## Products Collection

```jsonc
productID: {
    "name": "non-empty string",
    "category": "non-empty string",
    "subcategory": "non-empty string",
    "serialnumber": "non-empty string",
    "image": "non-empty string",
    "price": "non-negative integer",
    "discount": "integer between 0 and 100",
    "stock": "non-negative integer",
    "popularity": "non-negative integer",
    "description": "non-empty string || null",
    "warranty": "integer not less than -1", // in months and -1 means lifetime
    "distributorname": "non-empty string",
    "features": {
        "feature1": "string",
        //...
    }
}
```

## Orders Collection

```jsonc
orderID: {
    "user": "userID",
    "firstname": "non-empty string",
    "lastname": "non-empty string",
    "totalcost": "positive integer", 
    "totaldiscountedcost": "non-negative integer",
    "deliverycost": "non-negative integer",
    "status": "processing | in-transit | delivered | cancelled | refunded",
    "address": {
        "country": "non-empty string",
        "city": "non-empty string",
        "address": "non-empty string"
    },
    "delivery": {
        "type": "standard | express",
        "name": "non-empty string",
        "company": "deliverycompanyID"
    },
    "notes": "non-empty string || null",
    "date": "timestamp",
    "deliverydate": "timestamp"
}
```

## Orders/Products Collection

```jsonc
productID: {
    "name": "non-empty string",
    "price": "positive integer",
    "discount": "integer between 0 and 100",
    "count": "positive integer"
}
```

## Requests Collection

```jsonc
requestID: {
    "user": "userID",
    "firstname": "non-empty string",
    "lastname": "non-empty string",
    "revievew": "false by default | true",
    "approved": "false by default | true",
    "order": "orderID",
    "request": "refund",
    "date": "timestamp"
}
```

## Comments Collection

```jsonc
commentID: {
    "user": "userID",
    "firstname": "non-empty string",
    "lastname": "non-empty string",
    "order": "orderID",
    "product": "productID",
    "rate": "integer between 0 and 10",
    "reviewed": "false by default | true",
    "approved": "false by default | true",
    "comment": "non-empty string || null",
    "date": "timestamp"
}
```

## Logs Collection

```jsonc
logID: {
    "olddata": "document data || null",
    "newdata": "document data || null",
    "document": "document path",
    "method": "ADD | SET | DELETE",
    "user": "userID",
    "date": "timestamp"
}
```