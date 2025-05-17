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

      const discounted = loaded.filter(p => p.discount && p.discount > 0);
      setDiscountedProductData(discounted);
      setShowDiscountedList(true);
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
      discount: 0
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

    const updated = newDiscounts.map((p) => ({
      ...p,
      discount: discount, // add discount field only
    }));

    updated.forEach((product) => {
      // Only update discount in the database, keep price intact
      const { price, ...rest } = product;
      set(`products/${product.id}`, { ...rest, price });
    });

    setProducts((prev) =>
      prev.map((p) => {
        const match = updated.find((u) => u.id === p.id);
        return match ? { ...p, discount: match.discount } : p; // update discount in state
      })
    );

    setDiscountedItems(updated);
    setDiscountedProductData((prev) => [...prev, ...updated]);
    setShowDiscountedList(true);
  };
  
  const generateInvoicePDF = (order) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 50;
  
    // Logo
    doc.addImage(logo, "JPEG", 50, y, 100, 40);
  
    // TeknoSU Address (static)
    doc.setFontSize(10).setFont("Helvetica").setTextColor(68);
    doc.text("TeknoSU", 520, y, { align: "right" });
    y += 15;
    doc.text("Orta, Tuzla", 520, y, { align: "right" });
    y += 15;
    doc.text("Istanbul, Turkey", 520, y, { align: "right" });
  
    // Title
    y = 140;
    doc.setFont("Helvetica-Bold").setFontSize(20).setTextColor(0);
    doc.text("Invoice", 50, y);
  
    y += 25;
    doc.setDrawColor(170).setLineWidth(1).line(50, y, 550, y);
    y += 20;
  
    const data = order;
  
    const drawField = (label, value, bold = false) => {
      doc.setFont("Helvetica").setFontSize(10);
      doc.text(label, 50, y);
      doc.setFont(bold ? "Helvetica-Bold" : "Helvetica");
      doc.text(value, 150, y);
      y += 15;
    };
  
    // Left-side Info
    drawField("User Number:", data.user || "-", true);
    drawField("Order Number:", data.id || "-", true);
    drawField("Billing Date:", new Date(data.date).toString(), false);
    drawField("Total Due:", `$${(data.totaldiscountedcost ?? 0).toFixed(2)}`, true);
    y += 10;
    drawField("Company Number:", data.delivery?.company || "-", true);
    drawField("Company Name:", data.delivery?.name || "-", false);
    drawField("Delivery Type:", data.delivery?.type || "-", false);
    drawField("Delivery Cost:", `$${(data.deliverycost ?? 0).toFixed(2)}`, false);
    y += 10;
    drawField("Notes:", data.notes || "-", false);
  
    // Right-side Address Blocks (aligned with User Number line)
    let addrY = 180;
    doc.setFont("Helvetica").setFontSize(10);
    doc.text("Delivery Address", 520, addrY, { align: "right", underline: true });
  
    addrY += 15;
    doc.setFont("Helvetica-Bold");
    doc.text(`${data.firstname} ${data.lastname}`, 520, addrY, { align: "right" });
  
    addrY += 15;
    doc.setFont("Helvetica");
    doc.text(data.address?.address || "-", 520, addrY, { align: "right" });
  
    addrY += 15;
    doc.text(`${data.address?.city || "-"}, ${data.address?.country || "-"}`, 520, addrY, { align: "right" });
  
    // Billing address
    addrY += 25;
    doc.setFont("Helvetica").setFontSize(10);
    doc.text("Billing Address", 520, addrY, { align: "right", underline: true });
  
    addrY += 15;
    doc.setFont("Helvetica-Bold");
    doc.text(`${data.firstname} ${data.lastname}`, 520, addrY, { align: "right" });
  
    addrY += 15;
    doc.setFont("Helvetica");
    doc.text(data.billingaddress?.address || "-", 520, addrY, { align: "right" });
  
    addrY += 15;
    doc.text(`${data.billingaddress?.city || "-"}, ${data.billingaddress?.country || "-"}`, 520, addrY, { align: "right" });
  
    // Table Header
    y += 15; // More space after Notes
    doc.setDrawColor(170).line(50, y, 550, y);
    y += 25;
  
    doc.setFont("Helvetica-Bold");
    doc.text("ID", 50, y);
    doc.text("Name", 180, y); // shifted slightly from 150 to prevent overlap
    doc.text("Quantity", 320, y, { align: "right" });
    doc.text("Discount", 420, y, { align: "right" });
    doc.text("Line Total", 550, y, { align: "right" });
    y += 10;
    doc.setDrawColor(170).line(50, y, 550, y);
    y += 10;
  
    // Table Rows
    doc.setFont("Helvetica").setFontSize(10);
    let subtotal = 0;
    (data.products || []).forEach((p) => {
      if (y >= 740) {
        doc.addPage();
        y = 50;
      }
  
      const qty = p.count ?? 0;
      const price = p.price ?? 0;
      const discount = p.discount ?? 0;
      const lineTotal = qty * price * (1 - discount / 100);
      subtotal += lineTotal;
  
      doc.text(p.id || "-", 50, y);
      doc.text(p.name || "-", 180, y); // same shift here
      doc.text(`${qty}`, 320, y, { align: "right" });
      doc.text(discount > 0 ? `${discount}%` : "-", 420, y, { align: "right" });
      doc.text(`$${lineTotal.toFixed(2)}`, 550, y, { align: "right" });
      y += 20;
      doc.setDrawColor(170).line(50, y, 550, y);
      y += 10;
    });
  
    // Totals
    doc.setFont("Helvetica-Bold");
    doc.text("Subtotal", 320, y, { align: "right" });
    doc.text(`$${subtotal.toFixed(2)}`, 550, y, { align: "right" });
    y += 20;
    doc.text("Delivery Cost", 320, y, { align: "right" });
    doc.text(`$${(data.deliverycost ?? 0).toFixed(2)}`, 550, y, { align: "right" });
    y += 25;
    doc.text("Total Due", 320, y, { align: "right" });
    doc.text(`$${(subtotal + (data.deliverycost ?? 0)).toFixed(2)}`, 550, y, { align: "right" });
  
    // Footer
    y = 765;
    doc.setFont("Helvetica").setFontSize(10).setTextColor(68);
    doc.text(
      "You may cancel your order while it is still being processed. Refunds are available within 30 days of delivery. Thank you for choosing TeknoSU.",
      50,
      y,
      { align: "center", width: 500 }
    );
  
    doc.save(`Order_id: ${data.id}.pdf`);
  };
  
  const downloadMultipleInvoices = async () => {
    for (let i = 0; i < deliveredInvoices.length; i++) {
      const invoice = deliveredInvoices[i];
  
      // Fetch products subcollection from /orders/{id}/products/
      const productDocs = await get(`orders/${invoice.id}/products`);
      const fullProducts = productDocs.map(obj => {
        const id = Object.keys(obj)[0];
        return { id, ...obj[id] };
      });
  
      invoice.products = fullProducts; // Attach to invoice
      await new Promise((resolve) => {
        setTimeout(() => {
          generateInvoicePDF(invoice); // Generate with accurate product info
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
                      {item.name} — Original Price: ${item.price.toFixed(2)} — {item.discount}% off → ${(item.price * (100 - item.discount) /100 ).toFixed(2)}
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