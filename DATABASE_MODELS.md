# Models Documentation

---

## commentID (comments collection)
A document representing a comment made by a user on a product.

### Fields:
- `user` (`userID`): ID of the user who made the comment.
- `firstname` (`string`): First name of the user.
- `lastname` (`string`): Last name of the user.
- `order` (`orderID`): ID of the order related to this comment.
- `product` (`productID`): ID of the product the comment is about.
- `rate` (`number`): Rating of the product, between 0 and 10.
- `reviewed` (`boolean`): Whether the comment has been reviewed.
- `approved` (`boolean`): Whether the comment has been approved.
- `comment` (`string`): The comment text.
- `date` (`timestamp`): The timestamp when the comment was made.

---

## deliverycompanyID (deliverycompany collection)
A document representing a delivery company.

### Fields:
- `name` (`string`): Name of the delivery company.
- `costs` (`array`): Array of delivery costs (e.g., [5, 10]).
- `email` (`string`): Email address of the delivery company (e.g., `company@domain.com`).

---

## orderID (orders collection)
A document representing an order placed by a user.

### Fields:
- `user` (`userID`): ID of the user who placed the order.
- `firstname` (`string`): First name of the user.
- `lastname` (`string`): Last name of the user.
- `totalcost` (`number`): The total cost of the order.
- `totaldiscountedcost` (`number`): The total cost after applying discounts.
- `status` (`string`): The current status of the order: "processing", "in-transit", "delivered", "cancelled", or "refunded".
- `address` (`object`):
  - `country` (`string`): Country for the shipping address.
  - `city` (`string`): City for the shipping address.
  - `address` (`string`): Detailed address for shipping.
- `billingaddress` (`object`):
  - `country` (`string`): Country for the billing address.
  - `city` (`string`): City for the billing address.
  - `address` (`string`): Detailed address for billing.
- `delivery` (`object`):
  - `type` (`string`): Type of delivery, either "standard" or "express".
  - `company` (`deliverycompanyID`): ID of the delivery company handling the delivery.
- `notes` (`string`): Additional notes about the order.
- `date` (`timestamp`): The timestamp when the order was placed.

---

## productID (order/products collection)
A document representing a product within an order.

### Fields:
- `name` (`string`): Name of the product.
- `price` (`number`): Price of the product.
- `discount` (`number`): Discount percentage applied to the product (0-100).
- `count` (`number`): The quantity of this product in the order.

---

## productID (products collection)
A document representing a product available for purchase.

### Fields:
- `name` (`string`): Name of the product.
- `category` (`string`): Category of the product.
- `subcategory` (`string`): Subcategory of the product.
- `serialnumber` (`string`): Serial number of the product.
- `image` (`string`): URL or path to the product image.
- `price` (`number`): Price of the product.
- `discount` (`number`): Discount percentage (0-100).
- `stock` (`number`): Available stock of the product.
- `popularity` (`number`): Popularity rating of the product.
- `description` (`string`): Description of the product.
- `warranty` (`number`): Warranty duration (in years, or -1 for lifetime warranty).
- `distributorname` (`string`): Name of the product distributor.
- `features` (`object`): Object containing product features (e.g., `feature1: "description"`).

---

## requestID (orders collection)
A document representing a refund request related to an order.

### Fields:
- `user` (`userID`): ID of the user making the request.
- `firstname` (`string`): First name of the user.
- `lastname` (`string`): Last name of the user.
- `revievew` (`boolean`): Whether the user has submitted a review.
- `approved` (`boolean`): Whether the request has been approved.
- `order` (`orderID`): ID of the related order.
- `request` (`string`): The type of request, typically "refund".
- `date` (`timestamp`): The timestamp when the request was made.

---

## userID (users collection)
A document representing a user in the system.

### Fields:
- `firstname` (`string`): First name of the user.
- `lastname` (`string`): Last name of the user.
- `email` (`string`): Email address of the user.
- `role` (`string`): The role of the user, can be one of "customer", "productmanager", "salesmanager", or "admin".
- `address` (`object`):
  - `country` (`string`): Country for the user's address.
  - `city` (`string`): City for the user's address.
  - `address` (`string`): Detailed address.
- `wishlist` (`array`): Array of `productID` that the user has added to their wishlist.

---

## productID (users/basket collection)
A document representing a product in the user's basket.

### Fields:
- `count` (`number`): Quantity of the product in the basket.

---

## notificationID (users/notifications collection)
A document representing a notification for the user.

### Fields:
- `message` (`string`): The notification message.
- `seen` (`boolean`): Whether the notification has been seen by the user.
- `date` (`timestamp`): The timestamp when the notification was created.