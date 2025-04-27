import React, { useState, useEffect } from "react";
import "./SalesManagerPage.css";
import { get, set } from "../../services/firebase/database.js";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";

export default function SalesManagerPage() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);

  const [priceInputs, setPriceInputs] = useState({});
  const [discount, setDiscount] = useState(10);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [invoiceDateSearch, setInvoiceDateSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loadingSelector, setLoadingSelector] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchInvoices();
    fetchRefundRequests();
  }, []);

  const fetchProducts = async () => {
    const data = await get("products");
    const parsed = data.map((doc) => {
      const id = Object.keys(doc)[0];
      const d = doc[id];
      return { id, ...d, pending: d.price == null };
    });
    setProducts(parsed);
  };

  const fetchInvoices = async () => {
    const data = await get("orders");
    const parsed = await Promise.all(data.map(async (doc) => {
      const id = Object.keys(doc)[0];
      const d = doc[id];
      const productsData = await get(`orders/${id}/products`);
      const products = productsData.map((p) => ({ data: () => Object.values(p)[0] }));
      return { id, data: () => d, products };
    }));
    setInvoices(parsed);
  };

  const fetchRefundRequests = async () => {
    const data = await get("requests", null, [["request", "==", "refund"]]);
    const parsed = data.map((doc) => {
      const id = Object.keys(doc)[0];
      const d = doc[id];
      return { id, ...d };
    });
    setRefundRequests(parsed);
  };

  const handlePriceChange = (id, value) => {
    setPriceInputs((prev) => ({ ...prev, [id]: value }));
  };

  const submitPrice = async (id) => {
    const price = parseFloat(priceInputs[id]);
    if (!isNaN(price)) {
      await set(`products/${id}`, { price });
      fetchProducts();
    }
  };

  const toggleProductSelection = (id) => {
    setSelectedProductIds((prev) => (
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    ));
  };

  const applyDiscount = async () => {
    await Promise.all(selectedProductIds.map((id) => set(`products/${id}`, { discount })));
    const updated = products.filter((p) => selectedProductIds.includes(p.id)).map((p) => ({
      ...p,
      originalPrice: p.price,
      discountPercent: discount,
      discountedPrice: p.price * (1 - discount / 100),
    }));
    setDiscountedProducts(updated);
    setShowSelector(false);
  };

  const downloadInvoicesAsPDF = (list) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 50;
    list.forEach((inv) => {
      const invData = inv.data();
      if (y + 150 > 750) { doc.addPage(); y = 50; }
      doc.setFontSize(18).text("INVOICE", 220, y, { underline: true });
      y += 30;
      doc.setFontSize(10).text(`Order ID: ${inv.id}`, 50, y); y += 15;
      doc.text(`Date: ${invData.date}`, 50, y); y += 20;
      y += 40;
    });
    doc.save("invoices.pdf");
  };

  const approveRefund = async (id) => {
    await set(`requests/${id}`, { approved: true });
    fetchRefundRequests();
  };

  const rejectRefund = async (id) => {
    await set(`requests/${id}`, { approved: false });
    fetchRefundRequests();
  };

  const filteredInvoices = invoices.filter(inv =>
    invoiceDateSearch ? inv.data().date === invoiceDateSearch : true
  );

  const calculateRevenue = () => {
    let total = 0, cost = 0;
    invoices.forEach(inv => inv.products.forEach(p => {
      const d = p.data();
      const pr = products.find(x => x.name === d.name);
      if (pr) {
        total += d.count * d.price;
        cost += d.count * (pr.cost ?? (pr.price * 0.5));
      }
    }));
    return { total, cost, profit: total - cost };
  };

  const getFilteredRevenue = () => {
    let total = 0, cost = 0;
    invoices.forEach(inv => {
      const date = new Date(inv.data().date);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      if ((!from || date >= from) && (!to || date <= to)) {
        inv.products.forEach(p => {
          const d = p.data();
          const pr = products.find(x => x.name === d.name);
          if (pr) {
            total += d.count * d.price;
            cost += d.count * (pr.cost ?? (pr.price * 0.5));
          }
        });
      }
    });
    return { total, cost, profit: total - cost };
  };

  const { total, cost, profit } = calculateRevenue();

  return (
    <div className="sales-page">
      <div className="sales-container">
        <h1 className="sales-title">Sales Manager Dashboard</h1>

        {/* Pending Product Approvals */}
        <section className="sales-section">
          <h2 className="section-title">Pending Product Approvals</h2>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ marginBottom: "1rem" }}
          />
          <div className="pending-box">
            <div className="pending-box-inner">
              {products.filter(p => p.pending && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} className="product-row">
                  <span>{p.name}</span>
                  <input
                    type="number"
                    placeholder="Set Price"
                    className="input"
                    value={priceInputs[p.id] || ""}
                    onChange={(e) => handlePriceChange(p.id, e.target.value)}
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
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="input"
          />
          <button className="button" onClick={() => setShowSelector(!showSelector)}>Select Products</button>
          <button className="button" onClick={applyDiscount}>Apply Discount</button>

          {showSelector && (
            <div className="slider-box">
              <div className="slider-box-inner">
                {products.filter(p => !p.pending).map(p => (
                  <div key={p.id}>
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={() => toggleProductSelection(p.id)}
                    />
                    {p.name} (${p.price})
                  </div>
                ))}
              </div>
            </div>
          )}

          {discountedProducts.length > 0 && (
            <div className="discount-list-box">
              <h3>Discounted Products:</h3>
              <ul>
                {discountedProducts.map(p => (
                  <li key={p.id}>{p.name} — {p.discountPercent}% off → ${p.discountedPrice.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Invoices Section */}
        <button className="button" onClick={() => downloadInvoicesAsPDF(filteredInvoices)}>Download Invoices as PDF</button>
        <section className="sales-section">
          <h2 className="section-title">Invoices</h2>
          <input
            type="date"
            value={invoiceDateSearch}
            onChange={(e) => setInvoiceDateSearch(e.target.value)}
            className="input"
          />
          <ul>
            {filteredInvoices.map(inv => (
              <li key={inv.id}>Order ID: {inv.id} — Date: {inv.data().date}</li>
            ))}
          </ul>
        </section>

        {/* Revenue Chart */}
        <section className="sales-section">
          <h2 className="section-title">Revenue Report</h2>
          <div className="revenue-filters">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={[getFilteredRevenue()]}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={() => "Revenue"} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#4caf50" />
                <Bar dataKey="cost" fill="#f44336" />
                <Bar dataKey="profit" fill="#2196f3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Refund Requests */}
        <section className="sales-section">
          <h2 className="section-title">Refund Requests</h2>
          {refundRequests.length === 0 ? (
            <p>No refund requests yet.</p>
          ) : (
            refundRequests.map(r => (
              <div key={r.id}>
                {r.reason}
                <button onClick={() => approveRefund(r.id)}>Approve</button>
                <button onClick={() => rejectRefund(r.id)}>Reject</button>
              </div>
            ))
          )}
        </section>

      </div>
    </div>
  );
}