import React, { useState, useEffect } from "react";
import "./ProductManagerPage.css";
import { get, add, set, del } from "../../services/firebase/database.js"; //  Import backend functions

function ProductManagerPage() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", model: "", serial: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "" });
  const [draftStocks, setDraftStocks] = useState({});

  //  Load everything from Firestore on page load
  useEffect(() => {
    loadProducts();
    loadOrders();
    loadComments();
  }, []);

  const loadProducts = async () => {
    const data = await get("products");
    setProducts(data);
    setDraftStocks(
      Object.fromEntries(data.map((p) => [p.id, p.stock]))
    );
    const uniqueCategories = [...new Set(data.map((p) => p.category))];
    setCategories(uniqueCategories.filter((cat) => cat));
  };

  const loadOrders = async () => {
    const data = await get("orders");
    setInvoices(data);
  };

  const loadComments = async () => {
    const data = await get("comments");
    setComments(data);
  };

  // ✅ Add a new product
  const addProduct = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.serial) {
      alert("Name, Category, and Serial number are required.");
      return;
    }
    await add("products", {
      name: newProduct.name,
      model: newProduct.model,
      serialnumber: newProduct.serial,
      description: newProduct.description,
      stock: Number(newProduct.stock),
      price: Number(newProduct.price),
      warranty: Number(newProduct.warranty),
      distributorname: newProduct.distributor,
      category: newProduct.category,
      image: "", // You can later connect image upload
      features: {}
    });
    setNewProduct({ name: "", model: "", serial: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "" });
    await loadProducts();
  };

  //  Remove a product
  const removeProduct = async (id) => {
    await del(`products/${id}`);
    await loadProducts();
  };

  //  Update stock
  const updateStock = async (id, newStock) => {
    await set(`products/${id}`, { stock: newStock });
    await loadProducts();
  };

  //  Update order delivery status
  const updateDeliveryStatus = async (id) => {
    const order = invoices.find((inv) => inv.id === id);
    if (!order) return;
    const currentStatus = order.data().status;
    let newStatus = currentStatus;
    if (currentStatus === "Processing") newStatus = "In-transit";
    else if (currentStatus === "In-transit") newStatus = "Delivered";

    if (newStatus !== currentStatus) {
      await set(`orders/${id}`, { status: newStatus });
      await loadOrders();
    }
  };

  //  Approve comment
  const approveComment = async (id) => {
    await set(`comments/${id}`, { approved: true });
    await loadComments();
  };

  //  Disapprove (delete) comment
  const disapproveComment = async (id) => {
    await del(`comments/${id}`);
    await loadComments();
  };

  // Add category locally (no backend category table needed)
  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
  };

  return (
    <div className="product-page">
      <div className="product-container">
        <h1 className="product-title">Product Manager Dashboard</h1>

        {/* Manage Categories */}
        <section className="product-section">
          <h2 className="section-title">Manage Categories</h2>
          <div className="product-row">
            <input
              type="text"
              placeholder="New Category Name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="input"
            />
            <button className="button" onClick={addCategory}>Add Category</button>
          </div>
          <div className="scroll-box">
            <div className="category-box-inner">
              {categories.map((cat, idx) => (
                <div key={idx} className="category-row">
                  <span>{cat}</span>
                  <button className="button small" onClick={() => removeCategory(cat)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Add New Product */}
        <section className="product-section">
          <h2 className="section-title">Add New Product</h2>
          <div className="product-row">
            {[
              { placeholder: "Name", key: "name" },
              { placeholder: "Model", key: "model" },
              { placeholder: "Serial", key: "serial" },
              { placeholder: "Description", key: "description" },
              { placeholder: "Stock", key: "stock", small: true },
              { placeholder: "Price", key: "price", small: true },
              { placeholder: "Warranty", key: "warranty" },
              { placeholder: "Distributor", key: "distributor" },
              { placeholder: "Category", key: "category" },
            ].map((field) => (
              <input
                key={field.key}
                type={field.key === "stock" || field.key === "price" ? "number" : "text"}
                placeholder={field.placeholder}
                value={newProduct[field.key]}
                onChange={(e) => setNewProduct({ ...newProduct, [field.key]: e.target.value })}
                className={`input ${field.small ? "small" : ""}`}
              />
            ))}
          </div>
          <button className="button" onClick={addProduct}>Add Product</button>
        </section>

        {/* Manage Products */}
        <section className="product-section">
          <h2 className="section-title">Manage Products & Stocks</h2>
          <div className="scroll-box">
            {products.length === 0 && <p>No products available.</p>}
            {products.map((p) => (
              <div key={p.id} className="product-row">
                <span>{p.name} ({p.model}) - Stock: {p.stock} - Category: {p.category || "None"}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Update Stock"
                  className="input small"
                  value={draftStocks[p.id] ?? p.stock}
                  onChange={(e) => setDraftStocks({ ...draftStocks, [p.id]: parseInt(e.target.value) })}
                />
                <button
                  className="button small"
                  onClick={() => updateStock(p.id, draftStocks[p.id])}
                >
                  Submit
                </button>
                <button className="button small" onClick={() => removeProduct(p.id)}>Remove</button>
              </div>
            ))}
          </div>
        </section>

        {/* Manage Deliveries */}
        <section className="product-section">
          <h2 className="section-title">Manage Deliveries</h2>
          <div className="scroll-box">
            {invoices.map((inv) => (
              <div key={inv.id} className="delivery-row">
                <div style={{ flex: 1 }}>
                  <p><strong>Order ID:</strong> {inv.id}</p>
                  <p><strong>Customer:</strong> {inv.data().firstname} {inv.data().lastname}</p>
                  <p><strong>Address:</strong> {inv.data().address.address}, {inv.data().address.city}</p>
                  <p><strong>Status:</strong> {inv.data().status}</p>
                  <p><strong>Order Date:</strong> {inv.data().date}</p>
                </div>
                {inv.data().status !== "Delivered" && (
                  <button className="button small" onClick={() => updateDeliveryStatus(inv.id)}>
                    Update Status
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Manage Comments */}
        <section className="product-section">
          <h2 className="section-title">Manage Comments</h2>
          <div className="scroll-box">
            {comments.map((c) => (
              <div key={c.id} className="comment-row">
                <span>
                  {c.content} {c.approved && <span style={{ color: "green" }}>✅</span>}
                  <br />
                  <small>Product ID: {c.productId}</small> {/* ➡️ NEW LINE */}
                </span>
                {!c.approved && (
                  <button className="button small" onClick={() => approveComment(c.id)}>Approve</button>
                )}
                <button className="button small" onClick={() => disapproveComment(c.id)}>Disapprove</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProductManagerPage;
