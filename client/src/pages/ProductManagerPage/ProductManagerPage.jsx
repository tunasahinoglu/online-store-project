import React, { useState, useEffect } from "react";
import "./ProductManagerPage.css";
import logo from '../../assets/teknosuLogo.jpg';
import { useNavigate } from "react-router-dom";
import { get, add, set, del } from '../../services/firebase/database.js';

function ProductManagerPage() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [comments, setComments] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "", category: "", subcategory: "", serialnumber: "", price: "", discount: 0,
    stock: "", popularity: 0, description: "", warranty: "", distributorname: "", features: {}
  });
  const [draftStocks, setDraftStocks] = useState({});

  const navigate = useNavigate();

  const fetchAll = () => {
    get("products").then((fetched) => {
      const list = fetched.map(obj => {
        const id = Object.keys(obj)[0];
        const data = obj[id];
        return { id, ...data };
      });
      setProducts(list);
      const drafts = {};
      list.forEach(p => drafts[p.id] = p.stock);
      setDraftStocks(drafts);
    });

    get("orders").then(fetched => {
      const list = fetched.map(obj => {
        const id = Object.keys(obj)[0];
        const data = obj[id];
        return { id, ...data };
      });
      setInvoices(list);
    });

    get("comments").then(fetched => {
      const list = fetched.map(obj => {
        const id = Object.keys(obj)[0];
        const data = obj[id];
        return { id, ...data };
      });
      setComments(list);
    });
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addProduct = async () => {
    const product = {
      name: newProduct.name,
      category: newProduct.category,
      subcategory: newProduct.subcategory,
      serialnumber: newProduct.serialnumber,
      image: "default.jpg",
      price: 0, // set to 0 as sales manager will handle it
      discount: 0,
      stock: newProduct.stock === "" ? 0 : parseInt(newProduct.stock),
      popularity: 0,
      description: newProduct.description || null,
      warranty: newProduct.warranty === "" ? -1 : parseInt(newProduct.warranty),
      distributorname: newProduct.distributorname,
      features: newProduct.features || {}
    };

    console.log("✅ Adding product:", product);

    await add("products", product);

    setNewProduct({
      name: "", category: "", subcategory: "", serialnumber: "", price: "", discount: 0,
      stock: "", popularity: 0, description: "", warranty: "", distributorname: "", features: {}
    });

    fetchAll();
  };

  const removeProduct = async (id) => {
    await del(`products/${id}`);
    setProducts(products.filter(p => p.id !== id));
  };

  const updateStock = async (id, newStock) => {
    if (!id || newStock === undefined || newStock === '') {
      console.warn("❌ Invalid updateStock call:", id, newStock);
      return;
    }

    const product = products.find(p => p.id === id);
    if (!product) return;

    const updatedProduct = {
      ...product,
      stock: newStock
    };

    await set(`products/${id}`, updatedProduct);
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const updateDeliveryStatus = async (id, currentStatus) => {
    let newStatus = currentStatus;
    if (currentStatus === "processing") newStatus = "in-transit";
    else if (currentStatus === "in-transit") newStatus = "delivered";

    await set(`orders/${id}`, { status: newStatus });
    setInvoices(invoices.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const approveComment = async (id) => {
    await set(`comments/${id}`, { approved: true, reviewed: true });
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  const disapproveComment = async (id) => {
    await set(`comments/${id}`, { approved: false, reviewed: true });
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  return (
    <div>
      <div className="app-bar">
        <img src={logo} alt="Logo" className="app-bar-logo" onClick={() => navigate('/')} />
      </div>
      <div className="product-page">
        <div className="product-container">
          <h1 className="product-title">Product Manager Dashboard</h1>

          {/* Add Product */}
          <section className="product-section">
            <h2 className="section-title">Add New Product</h2>
            <div className="product-row">
              <input type="text" placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input" />
              <input type="text" placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="input" />
              <input type="text" placeholder="Subcategory" value={newProduct.subcategory} onChange={(e) => setNewProduct({ ...newProduct, subcategory: e.target.value })} className="input" />
              <input type="text" placeholder="Serial Number" value={newProduct.serialnumber} onChange={(e) => setNewProduct({ ...newProduct, serialnumber: e.target.value })} className="input" />
              <input type="number" placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className="input" />
              <input type="text" placeholder="Warranty (months)" value={newProduct.warranty} onChange={(e) => setNewProduct({ ...newProduct, warranty: e.target.value })} className="input" />
              <input type="text" placeholder="Distributor" value={newProduct.distributorname} onChange={(e) => setNewProduct({ ...newProduct, distributorname: e.target.value })} className="input" />
              <input type="text" placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input" />
            </div>
            <button className="button" onClick={addProduct}>Add Product</button>
          </section>

          {/* Products & Stock */}
          <section className="product-section">
            <h2 className="section-title">Manage Products & Stocks</h2>
            <div className="scroll-box">
              {products.map((p) => (
                <div key={p.id} className="product-row">
                  <span>{p.name} - Stock: {p.stock} - Category: {p.category}</span>
                  <input
                    type="number"
                    min="0"
                    value={draftStocks[p.id] !== undefined ? draftStocks[p.id] : p.stock || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value);
                      setDraftStocks(prev => ({ ...prev, [p.id]: value }));
                    }}
                    className="input small"
                  />
                  <button
                    className="button small"
                    disabled={draftStocks[p.id] === '' || draftStocks[p.id] === undefined}
                    onClick={() => updateStock(p.id, draftStocks[p.id])}
                  >
                    Submit
                  </button>
                  <button className="button small" onClick={() => removeProduct(p.id)}>Remove</button>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Management */}
          <section className="product-section">
            <h2 className="section-title">Manage Deliveries</h2>
            <div className="scroll-box">
              {invoices.map((inv) => (
                <div key={inv.id} className="delivery-row">
                  <div style={{ flex: 1 }}>
                    <p><strong>Order ID:</strong> {inv.id}</p>
                    <p><strong>Customer:</strong> {inv.firstname} {inv.lastname}</p>
                    <p><strong>Address:</strong> {inv.address?.address}, {inv.address?.city}, {inv.address?.country}</p>
                    <p><strong>Status:</strong> {inv.status}</p>
                    <p><strong>Order Date:</strong> {inv.date ? String(inv.date) : "N/A"}</p>
                  </div>
                  {inv.status !== "delivered" && inv.status !== "cancelled" && (
                    <button className="button small" onClick={() => updateDeliveryStatus(inv.id, inv.status)}>Update Status</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Comment Moderation */}
          <section className="product-section">
            <h2 className="section-title">Manage Comments</h2>
            <div className="scroll-box">
              {comments
                .filter(c => c.reviewed === false)
                .map((c) => {
                  const product = products.find(p => p.id === c.product);
                  return (
                    <div key={c.id} className="comment-row">
                      <span>
                        <strong>Product:</strong> {product ? product.name : "Unknown"}
                        <br />
                        {c.comment}
                      </span>
                      <button
                        className="button small"
                        onClick={async () => {
                          await set(`comments/${c.id}`, { approved: true, reviewed: true });
                          setComments(prev => prev.filter(comment => comment.id !== c.id));
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="button small"
                        onClick={async () => {
                          await set(`comments/${c.id}`, { approved: false, reviewed: true });
                          setComments(prev => prev.filter(comment => comment.id !== c.id));
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProductManagerPage;
