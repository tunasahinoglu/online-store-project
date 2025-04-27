import React, { useState, useEffect } from "react";
import "./ProductManagerPage.css";

const dummyProducts = [
  { id: 1, name: "Laptop", model: "XPS 13", serial: "12345", description: "Powerful laptop", stock: 10, price: 1200, warranty: "24", distributor: "Dell", category: "Electronics" },
  { id: 2, name: "Smartphone", model: "Galaxy S21", serial: "67890", description: "Latest phone", stock: 5, price: 800, warranty: "12", distributor: "Samsung", category: "Electronics" }
];

const dummyInvoices = [
  {
    id: "order101",
    data: () => ({
      user: "user123",
      firstname: "John",
      lastname: "Doe",
      totalcost: 500,
      totaldiscountedcost: 430,
      status: "Processing",
      address: {
        country: "USA",
        city: "New York",
        address: "123 Main St"
      },
      delivery: {
        type: "standard",
        company: "deliveryCo1"
      },
      notes: "Leave at front door",
      date: "2025-04-10",
      deliverydate: "2025-04-13"
    }),
    products: [
      { data: () => ({ name: "Keyboard", count: 2, price: 50, discount: 0 }) },
      { data: () => ({ name: "Monitor", count: 1, price: 200, discount: 10 }) },
    ],
  },
  {
    id: "order102",
    data: () => ({
      user: "user456",
      firstname: "Alice",
      lastname: "Smith",
      totalcost: 200,
      totaldiscountedcost: 180,
      status: "In-transit",
      address: {
        country: "USA",
        city: "Los Angeles",
        address: "456 Elm St"
      },
      delivery: {
        type: "express",
        company: "deliveryCo2"
      },
      notes: "Ring the bell once",
      date: "2025-04-15",
      deliverydate: "2025-04-17"
    }),
    products: [
      { data: () => ({ name: "Monitor", count: 1, price: 200, discount: 10 }) },
    ],
  },
];

const dummyComments = [
  { id: 1, productId: 1, content: "Amazing laptop!", approved: false },
  { id: 2, productId: 2, content: "Battery could be better.", approved: false }
];

function ProductManagerPage() {
  const [products, setProducts] = useState(dummyProducts);
  const [invoices, setInvoices] = useState(dummyInvoices);
  const [comments, setComments] = useState(dummyComments);
  const [categories, setCategories] = useState(["Electronics"]);
  const [newCategory, setNewCategory] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", model: "", serial: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "" });
  const [draftStocks, setDraftStocks] = useState({});

  useEffect(() => {
    const initialDrafts = {};
    dummyProducts.forEach(p => { initialDrafts[p.id] = p.stock; });
    setDraftStocks(initialDrafts);
  }, []);

  const addProduct = () => {
    const id = products.length + 1;
    const product = { id, ...newProduct, stock: Number(newProduct.stock), price: Number(newProduct.price) };
    setProducts([...products, product]);
    setDraftStocks({ ...draftStocks, [id]: product.stock });
    setNewProduct({ name: "", model: "", serial: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "" });
  };

  const removeProduct = (id) => {
    setProducts(products.filter(p => p.id !== id));
    const updatedDrafts = { ...draftStocks };
    delete updatedDrafts[id];
    setDraftStocks(updatedDrafts);
  };

  const updateStock = (id, newStock) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const updateDeliveryStatus = (id) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        const currentStatus = inv.data().status;
        let newStatus = currentStatus;
        if (currentStatus === "Processing") newStatus = "In-transit";
        else if (currentStatus === "In-transit") newStatus = "Delivered";

        return {
          ...inv,
          data: () => ({
            ...inv.data(),
            status: newStatus
          })
        };
      }
      return inv;
    }));
  };

  const approveComment = (id) => {
    setComments(comments.map(c => c.id === id ? { ...c, approved: true } : c));
  };

  const disapproveComment = (id) => {
    setComments(comments.filter(c => c.id !== id));
  };

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove) => {
    setCategories(categories.filter(cat => cat !== categoryToRemove));
    setProducts(products.map(p => p.category === categoryToRemove ? { ...p, category: "" } : p));
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
            <input type="text" placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input" />
            <input type="text" placeholder="Model" value={newProduct.model} onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })} className="input" />
            <input type="text" placeholder="Serial" value={newProduct.serial} onChange={(e) => setNewProduct({ ...newProduct, serial: e.target.value })} className="input" />
            <input type="text" placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input" />
            <input type="number" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="input small" />
            <input type="number" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="input small" />
            <input type="text" placeholder="Warranty" value={newProduct.warranty} onChange={(e) => setNewProduct({ ...newProduct, warranty: e.target.value })} className="input" />
            <input type="text" placeholder="Distributor" value={newProduct.distributor} onChange={(e) => setNewProduct({ ...newProduct, distributor: e.target.value })} className="input" />
            <input type="text" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="input" />
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