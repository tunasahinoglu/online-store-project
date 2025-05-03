import React, { useState, useEffect } from "react";
import "./SalesManagerPage.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import logo from '../../assets/teknosuLogo.jpg';
import { useNavigate } from "react-router-dom";
import { get, set } from '../../services/firebase/database.js';

export default function SalesManagerPage() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [discount, setDiscount] = useState(10);
  const [showDiscountedList, setShowDiscountedList] = useState(false);
  const [discountedItems, setDiscountedItems] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceInputs, setPriceInputs] = useState({});
  const [discountedProductData, setDiscountedProductData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const navigate = useNavigate();
  
  useEffect(() => {
    get("products").then((fetched) => {
      const loaded = fetched.map(obj => {
        const id = Object.keys(obj)[0];
        const data = obj[id];
        return { id, ...data };
      });
      setProducts(loaded);
    });
  
    get("orders").then((fetched) => {
      const loaded = fetched.map(obj => {
        const id = Object.keys(obj)[0];
        const data = obj[id];
        const date = new Date(data.date);
        return {
          id,
          ...data,
          date,
          products: Object.entries(data.products || {}).map(([key, p]) => ({
            id: key,
            ...p
          }))
        };
      });
      setInvoices(loaded);
    });
  }, []);
  
  const handlePriceChange = (id, value) => {
    setPriceInputs((prev) => ({ ...prev, [id]: value }));
  };
  
  const submitPrice = async (id) => {
    const price = parseFloat(priceInputs[id]);
    if (!isNaN(price)) {
      const product = products.find((p) => p.id === id);
      if (!product) return;
  
      const updatedProduct = { ...product, price };
      await set(`products/${id}`, updatedProduct);
  
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updatedProduct : p))
      );
      setPriceInputs((prev) => ({ ...prev, [id]: "" }));
    }
  };
  
  const toggleProductSelection = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };
  
  const removeProductFromSelection = (id) => {
    setSelectedProductIds((prev) => prev.filter((pid) => pid !== id));
    const product = products.find((p) => p.id === id);
    if (!product) return;
  
    const updatedProduct = { ...product, price: 0 };
    set(`products/${id}`, updatedProduct);
    setProducts((prev) => prev.map((p) => p.id === id ? updatedProduct : p));
    setPriceInputs((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setDiscountedProductData((prev) => prev.filter((item) => item.id !== id));
  };
  
  const removeDiscountFromProduct = (id) => {
    const discountedItem = discountedProductData.find((item) => item.id === id);
    if (!discountedItem) return;
  
    const updatedProduct = {
      ...products.find((p) => p.id === id),
      price: discountedItem.originalPrice
    };
    set(`products/${id}`, updatedProduct);
  
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? updatedProduct : p))
    );
  
    setDiscountedProductData((prev) => prev.filter((item) => item.id !== id));
  };
  
  const applyDiscount = () => {
    const newDiscounts = products.filter(
      (p) =>
        selectedProductIds.includes(p.id) &&
        p.price !== null &&
        !discountedProductData.find((d) => d.id === p.id)
    );
  
    const updated = newDiscounts.map((p) => {
      const original = p.price;
      const discountedPrice = (original * (100 - discount)) / 100;
      return {
        ...p,
        price: discountedPrice,
        originalPrice: original,
        discountPercent: discount,
      };
    });
  
    updated.forEach((product) => {
      set(`products/${product.id}`, product);
    });
  
    setProducts((prev) =>
      prev.map((p) => {
        const match = updated.find((u) => u.id === p.id);
        return match ? { ...p, price: match.price } : p;
      })
    );
  
    setDiscountedItems(updated);
    setDiscountedProductData((prev) => [...prev, ...updated]);
    setShowDiscountedList(true);
  };
  
  const generateInvoicePDF = (order) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 45;
  
    doc.addImage(logo, "JPEG", 50, y, 100, 40);
    y += 5;
    doc.setFontSize(10).setTextColor(68);
    doc.text("TeknoSU", 200, y, { align: "right" });
    y += 15;
    doc.text("Orta, Tuzla", 200, y, { align: "right" });
    y += 15;
    doc.text("Istanbul, Turkey", 200, y, { align: "right" });
  
    y = 140;
    doc.setFontSize(20).text("Invoice", 50, y);
    y += 15;
    doc.setLineWidth(1).setDrawColor(170);
    doc.line(50, y, 550, y);
    y += 20;
  
    const text = (label, value) => {
      doc.setFont("Helvetica").setFontSize(10);
      doc.text(label, 50, y);
      doc.setFont("Helvetica-Bold");
      doc.text(value, 150, y);
      y += 15;
    };
  
    const data = order;
    text("User Number:", data.user || "-");
    text("Order Number:", data.id || "-");
    text("Billing Date:", new Date(data.date).toString() || "-");
    text("Total Due:", `$${(data.totaldiscountedcost ?? 0).toFixed(2)}`);
    text("Company Number:", data.delivery?.company || "-");
    text("Company Name:", data.delivery?.name || "-");
    text("Delivery Type:", data.delivery?.type || "-");
    text("Delivery Cost:", `$${(data.deliverycost ?? 0).toFixed(2)}`);
    text("Notes:", data.notes || "-");
  
    y += 10;
    doc.setFont("Helvetica-Bold").text("Delivery Address", 200, y, { align: "right", underline: true });
    y += 15;
    doc.setFont("Helvetica-Bold").text(`${data.firstname} ${data.lastname}`, 200, y, { align: "right" });
    y += 15;
    doc.setFont("Helvetica").text(data.address?.address || "-", 200, y, { align: "right" });
    y += 15;
    doc.text(`${data.address?.city || ""}, ${data.address?.country || ""}`, 200, y, { align: "right" });
  
    y += 30;
    doc.setFont("Helvetica-Bold").text("Billing Address", 200, y, { align: "right", underline: true });
    y += 15;
    doc.setFont("Helvetica-Bold").text(`${data.firstname} ${data.lastname}`, 200, y, { align: "right" });
    y += 15;
    doc.setFont("Helvetica").text(data.billingaddress?.address || "-", 200, y, { align: "right" });
    y += 15;
    doc.text(`${data.billingaddress?.city || ""}, ${data.billingaddress?.country || ""}`, 200, y, { align: "right" });
  
    y += 30;
    doc.setLineWidth(1).setDrawColor(170).line(50, y, 550, y);
    y += 10;
    doc.setFont("Helvetica-Bold");
    doc.text("ID", 50, y);
    doc.text("Name", 150, y);
    doc.text("Qty", 300, y, { align: "right" });
    doc.text("Discount", 400, y, { align: "right" });
    doc.text("Line Total", 550, y, { align: "right" });
    y += 10;
    doc.setLineWidth(1).setDrawColor(170).line(50, y, 550, y);
    y += 10;
  
    doc.setFont("Helvetica").setFontSize(10);
    (data.products || []).forEach((p) => {
      if (y >= 750) {
        doc.addPage();
        y = 50;
      }
      const qty = p.count ?? 0;
      const price = p.price ?? 0;
      const discount = p.discount ?? 0;
      const original = qty * price;
      const discounted = original * (1 - discount / 100);
  
      doc.text(p.id || "-", 50, y);
      doc.text(p.name || "-", 150, y);
      doc.text(`${qty}`, 300, y, { align: "right" });
      doc.text(discount > 0 ? `${discount}%` : "-", 400, y, { align: "right" });
      doc.text(`$${discounted.toFixed(2)}`, 550, y, { align: "right" });
      y += 20;
      doc.setDrawColor(170).line(50, y, 550, y);
      y += 10;
    });
  
    doc.setFont("Helvetica");
    doc.text("Subtotal", 400, y, { align: "right" });
    doc.text(`$${((data.totaldiscountedcost ?? 0) - (data.deliverycost ?? 0)).toFixed(2)}`, 550, y, { align: "right" });
    y += 20;
    doc.text("Delivery Cost", 400, y, { align: "right" });
    doc.text(`$${(data.deliverycost ?? 0).toFixed(2)}`, 550, y, { align: "right" });
    y += 25;
    doc.setFont("Helvetica-Bold");
    doc.text("Total Due", 400, y, { align: "right" });
    doc.text(`$${(data.totaldiscountedcost ?? 0).toFixed(2)}`, 550, y, { align: "right" });
  
    doc.setFont("Helvetica").setFontSize(10).setTextColor(68);
    doc.text("You may cancel your order while it is still being processed. Refunds are available within 30 days of delivery. Thank you for choosing TeknoSU.", 50, 765, { align: "center", width: 500 });
  
    doc.save(`Order_id: ${data.id}.pdf`);
  };
  
  const downloadMultipleInvoices = async () => {
    for (let i = 0; i < deliveredInvoices.length; i++) {
      await new Promise((resolve) => {
        setTimeout(() => {
          generateInvoicePDF(deliveredInvoices[i]);
          resolve();
        }, 400);
      });
    }
  };  
  
  const filteredInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.date);
    const from = startDate ? new Date(startDate) : null;
    const to = endDate ? new Date(endDate) : null;
  
    if (isNaN(invDate)) return false;
  
    return (!from || invDate >= from) && (!to || invDate <= to);
  });  
  
  const deliveredInvoices = filteredInvoices.filter((inv) => inv.status === "delivered");

  const getFilteredRevenue = () => {
    let total = 0;
    let cost = 0;
  
    deliveredInvoices.forEach((invoice) => {
      total += invoice.totaldiscountedcost || 0;
      cost += (invoice.totalcost || 0) * 0.5;
    });
  
    return {
      total: parseFloat(total.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      profit: parseFloat((total - cost).toFixed(2)),
    };
  };
  

return (
  <div>
    <div className="app-bar">
      <img
        src={logo}
        alt="Logo"
        className="app-bar-logo"
        onClick={() => navigate('/')}
      />
    </div>
    <div className="sales-page">
      <div className="sales-container">
        <h1 className="sales-title">Sales Manager Dashboard</h1>

        {/* Pending Product Approvals */}
        <section className="sales-section">
          <h2 className="section-title">Pending Product Approvals</h2>
          <input
            type="text"
            placeholder="Search products..."
            className="input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: "1rem" }}
          />
          <div className="pending-box">
            <div className="pending-box-inner">
              {products.filter((p) => p.price === 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && <p>No pending products.</p>}
              {products.filter((p) => p.price === 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                <div key={p.id} className="product-row">
                  <span className="product-name">{p.name}</span>
                  <input
                    type="number"
                    placeholder="Set Price"
                    value={priceInputs[p.id] || ""}
                    onChange={(e) => handlePriceChange(p.id, e.target.value)}
                    className="input"
                  />
                  <button className="button" onClick={() => submitPrice(p.id)}>Submit</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Discount Section */}
        <section className="sales-section">
          <h2 className="section-title">Apply Discount</h2>
          <div className="discount-row">
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="input"
            />
            <button onClick={applyDiscount} className="button">Apply Discount</button>
            <button onClick={() => setShowSelector(!showSelector)} className="button">Select Products</button>
          </div>

          {showSelector && (
            <div className="slider-box">
              <div className="slider-box-inner">
                <h3>Select Products to Discount:</h3>
                <div className="product-selector">
                  {products.filter((p) => p.price > 0 && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
                    const alreadyDiscounted = discountedProductData.find((d) => d.id === product.id);
                    return (
                      <div key={product.id} className="selector-item">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          disabled={!!alreadyDiscounted}
                        />
                        {product.name} — ${product.price !== null ? product.price.toFixed(2) : "Not Priced"}
                        {selectedProductIds.includes(product.id) && (
                          <button
                            className="button"
                            style={{ marginLeft: "1rem" }}
                            onClick={() => removeProductFromSelection(product.id)}
                          >
                            ❌
                          </button>
                        )}
                        {alreadyDiscounted && (
                          <span style={{ color: "gray", marginLeft: "1rem" }}>(Discount Applied)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {showDiscountedList && (
            <div className="discount-list-box">
              <div className="discount-list-inner">
                <h3>Discount Applied To:</h3>
                <ul>
                  {discountedProductData.map((item) => (
                    <li key={item.id}>
                      {item.name} — Original Price: ${item.originalPrice.toFixed(2)} — {item.discountPercent}% off → ${item.price.toFixed(2)}
                      <button
                        className="button"
                        style={{ marginLeft: "1rem" }}
                        onClick={() => removeDiscountFromProduct(item.id)}
                      >
                        ❌
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Invoice Filter + Section */}
        <section className="sales-section">
          <h2 className="section-title">Invoices</h2>
          <div className="revenue-filters" style={{ marginBottom: "1rem" }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
              style={{ marginRight: "1rem" }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <ul className="invoice-list">
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id} className="invoice-item">
                <strong>ID:</strong> {invoice.id} —
                <strong> Date:</strong> {invoice.date.toString()} —
                <strong> Price:</strong> ${invoice.totalcost?.toFixed(2) ?? "N/A"} —
                <strong> Discounted Total:</strong> ${invoice.totaldiscountedcost?.toFixed(2) ?? "N/A"}
              </li>
            ))}
          </ul>
        </section>

        {/* Download Button */}
        <button className="button" onClick={downloadMultipleInvoices}>
          Download All Filtered Invoices (One PDF per Order)
        </button>

        {/* Revenue Report */}
        <section className="sales-section">
          <h2 className="section-title">Revenue Report</h2>

          <div style={{ width: "100%", height: 300, marginTop: "1rem" }}>
            <ResponsiveContainer>
              <BarChart
                data={[{ label: "Filtered Revenue", ...getFilteredRevenue() }]}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#4caf50" name="Revenue" />
                <Bar dataKey="cost" fill="#f44336" name="Cost" />
                <Bar dataKey="profit" fill="#2196f3" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="revenue-box" style={{ marginTop: "1rem" }}>
            <p><strong>Total Sales:</strong> ${getFilteredRevenue().total.toFixed(2)}</p>
            <p><strong>Total Cost:</strong> ${getFilteredRevenue().cost.toFixed(2)}</p>
            <p><strong>Profit:</strong> ${getFilteredRevenue().profit.toFixed(2)}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
);
  
  
}  