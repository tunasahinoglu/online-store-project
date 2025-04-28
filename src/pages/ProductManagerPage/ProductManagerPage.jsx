import React, { useState, useEffect } from "react";
import "./ProductManagerPage.css";
<<<<<<< HEAD
import { get, add, set, del } from "../../services/firebase/database.js"; //  Import backend functions
=======
import logo from '../../assets/teknosuLogo.jpg';
import { useNavigate } from "react-router-dom";
import { get, add, set, del } from '../../services/firebase/database.js';
>>>>>>> d2418526a9c306e216084954f5ed6dca2613b31a

function ProductManagerPage() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [comments, setComments] = useState([]);
<<<<<<< HEAD
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
=======
  const [categories, setCategories] = useState({});
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", model: "", serial: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "", subcategory: "" });
  const [draftStocks, setDraftStocks] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchComments();
    fetchInvoices();
  }, []);

  const fetchProducts = async () => {
    const data = await get("products");
    const formatted = data.map(doc => ({ id: doc.id, ...doc }));
    setProducts(formatted);
    const drafts = {};
    formatted.forEach(p => drafts[p.id] = p.stock);
    setDraftStocks(drafts);
  };

  const fetchInvoices = async () => {
    const data = await get("orders");
    const formatted = data.map(doc => ({ id: doc.id, ...doc }));
    setInvoices(formatted);
  };

  const fetchComments = async () => {
    const data = await get("comments");
    const formatted = data.map(doc => ({ id: doc.id, ...doc }));
    setComments(formatted);
  };

  const addProduct = async () => {
    const productData = {
      name: newProduct.name,
      category: newProduct.category,
      subcategory: newProduct.subcategory,
      serialnumber: newProduct.serial,
      image: "",
      price: Number(newProduct.price),
      discount: 0,
      stock: Number(newProduct.stock),
      popularity: 0,
      description: newProduct.description,
      warranty: parseInt(newProduct.warranty),
      distributorname: newProduct.distributor,
      features: {
        model: newProduct.model   // ✅ Correct: model is inside features
      }
    };
    await add("products", productData);
    fetchProducts();
    setNewProduct({ name: "", model: "", serial: "", description: "", stock: "", price: "", warranty: "", distributor: "", category: "", subcategory: "" });
  };

  const removeProduct = async (id) => {
    await del(`products/${id}`);
    fetchProducts();
  };

  const updateStock = async (id, newStock) => {
    await set(`products/${id}`, { stock: newStock });
    fetchProducts();
  };

  const updateDeliveryStatus = async (id, currentStatus) => {
    let newStatus = currentStatus;
    if (currentStatus === "processing") newStatus = "in-transit";
    else if (currentStatus === "in-transit") newStatus = "delivered";

    await set(`orders/${id}`, { status: newStatus });
    fetchInvoices();
  };

  const approveComment = async (id) => {
    await set(`comments/${id}`, { approved: true });
    fetchComments();
  };

  const disapproveComment = async (id) => {
    await del(`comments/${id}`);
    fetchComments();
  };

  const addCategory = () => {
    if (newCategory) {
      setCategories(prev => ({ ...prev, [newCategory]: [] }));
>>>>>>> d2418526a9c306e216084954f5ed6dca2613b31a
      setNewCategory("");
    }
  };

<<<<<<< HEAD
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
=======
  const addSubcategory = (category) => {
    if (newSubcategory && categories[category]) {
      setCategories(prev => ({
        ...prev,
        [category]: [...prev[category], newSubcategory]
      }));
      setNewSubcategory("");
    }
  };

  const removeCategory = (categoryToRemove) => {
    const updated = { ...categories };
    delete updated[categoryToRemove];
    setCategories(updated);
    setProducts(products.map(p => p.category === categoryToRemove ? { ...p, category: "" } : p));
  };

  return (
    <div>
      <div className="app-bar">
        <img src={logo} alt="Logo" className="app-bar-logo" onClick={() => navigate('/')} />
      </div>
      <div className="product-page">
        <div className="product-container">
          <h1 className="product-title">Product Manager Dashboard</h1>

          {/* Manage Categories */}
          <section className="product-section">
            <h2 className="section-title">Manage Categories</h2>
            <div className="product-row">
              <input type="text" placeholder="New Category Name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input" />
              <button className="button" onClick={addCategory}>Add Category</button>
            </div>
            <div className="scroll-box">
              {Object.keys(categories).map((cat, idx) => (
                <div key={idx} className="category-box-inner">
                  <div className="category-row">
                    <span><strong>{cat}</strong></span>
                    <button className="button small" onClick={() => removeCategory(cat)}>Remove Category</button>
                  </div>
                  <div className="product-row">
                    <input type="text" placeholder="New Subcategory" value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} className="input" />
                    <button className="button small" onClick={() => addSubcategory(cat)}>Add Subcategory</button>
                  </div>
                  {categories[cat].map((sub, i) => (
                    <div key={i} className="subcategory-row">
                      <span>- {sub}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Add New Product */}
          <section className="product-section">
            <h2 className="section-title">Add New Product</h2>
            <div className="product-row">
              <input type="text" placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input" />
              <input type="text" placeholder="Model" value={newProduct.model} onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })} className="input" />
              <input type="text" placeholder="Serial Number" value={newProduct.serial} onChange={(e) => setNewProduct({ ...newProduct, serial: e.target.value })} className="input" />
              <input type="text" placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input" />
              <input type="number" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="input small" />
              <input type="number" placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className="input small" />
              <input type="text" placeholder="Warranty (months)" value={newProduct.warranty} onChange={(e) => setNewProduct({ ...newProduct, warranty: e.target.value })} className="input" />
              <input type="text" placeholder="Distributor Name" value={newProduct.distributor} onChange={(e) => setNewProduct({ ...newProduct, distributor: e.target.value })} className="input" />
              <input type="text" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="input" />
              <input type="text" placeholder="Subcategory" value={newProduct.subcategory} onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })} className="input" />
            </div>
            <button className="button" onClick={addProduct}>Add Product</button>
          </section>

          {/* Manage Products & Stocks */}
          <section className="product-section">
            <h2 className="section-title">Manage Products & Stocks</h2>
            <div className="scroll-box">
              {products.map((p) => (
                <div key={p.id} className="product-row">
                  <span>{p.name || "Unknown"} (Serial: {p.serialnumber || "Unknown"}) - Stock: {p.stock ?? "Unknown"} - Category: {p.category || "None"}</span>
                  <input type="number" min="0" className="input small" value={draftStocks[p.id] ?? p.stock} onChange={(e) => setDraftStocks({ ...draftStocks, [p.id]: parseInt(e.target.value) })} />
                  <button className="button small" onClick={() => updateStock(p.id, draftStocks[p.id])}>Submit</button>
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
                    <p><strong>Customer:</strong> {inv.firstname} {inv.lastname}</p>
                    <p><strong>Address:</strong> {inv.address?.address || "Unknown"}, {inv.address?.city || "Unknown"}</p>
                    <p><strong>Status:</strong> {inv.status}</p>
                    <p><strong>Order Date:</strong> {inv.date}</p>
                  </div>
                  {inv.status !== "delivered" && (
                    <button className="button small" onClick={() => updateDeliveryStatus(inv.id, inv.status)}>Update Status</button>
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
                  <span><strong>Product:</strong> {c.product || "Unknown"}<br />{c.comment || "No comment"} {c.approved && <span style={{ color: "green" }}>✅</span>}</span>
                  {!c.approved && <button className="button small" onClick={() => approveComment(c.id)}>Approve</button>}
                  <button className="button small" onClick={() => disapproveComment(c.id)}>Disapprove</button>
                </div>
              ))}
            </div>
          </section>

        </div>
>>>>>>> d2418526a9c306e216084954f5ed6dca2613b31a
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default ProductManagerPage;
=======
export default ProductManagerPage;
>>>>>>> d2418526a9c306e216084954f5ed6dca2613b31a
