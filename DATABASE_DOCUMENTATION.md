# API Documentation

## 1. `get`
**Description**:  
Fetches data from Firestore either from a document or a collection, based on the provided path.  
It allows filtering, sorting, and pagination using optional parameters.

**Parameters**:
- `path` (`string`): The Firestore path to the document or collection (e.g., `"users/1234"` or `"users"`).
- `selectConditions` (`array` | `null`): An optional array of fields to select, not used in the current version.
- `whereConditions` (`array` | `null`): Optional array of conditions for filtering the data (e.g., `[["field", "==", "value"]]`).
- `orderByConditions` (`array` | `null`): Optional array of sorting conditions (e.g., `[["field", "asc"]]`).
- `startAfterDocument` (`DocumentSnapshot` | `null`): Optional document snapshot for pagination (start after this document).
- `limitValue` (`number` | `null`): Optional number to limit the number of documents returned.

**Returns**:  
A `Promise` that resolves to an array of objects, where each object contains the document ID as the key and document data as the value.

---

## 2. `add`
**Description**:  
Sends a POST request to add new data to a specified path.

**Parameters**:
- `path` (`string`): The path where the data will be added.
- `body` (`object`): The data to be added.

**Returns**:  
A `Promise` that resolves to a message returned from the server.

---

## 3. `set`
**Description**:  
Sends a PUT request to update or set data at a specified path.

**Parameters**:
- `path` (`string`): The path where the data will be set.
- `body` (`object`): The data to be set.

**Returns**:  
A `Promise` that resolves to a message returned from the server.

---

## 4. `del`
**Description**:  
Sends a DELETE request to delete data at a specified path.

**Parameters**:
- `path` (`string`): The path to the data that should be deleted.

**Returns**:  
A `Promise` that resolves to a message returned from the server.