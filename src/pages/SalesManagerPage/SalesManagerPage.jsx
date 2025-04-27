import React, { useState } from "react";
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

const dummyRefunds = [
  {
    id: 201,
    invoiceId: "order101",
    productId: 3,
    quantity: 1,
    reason: "Defective keys",
  },
  {
    id: 202,
    invoiceId: "order102",
    productId: 4,
    quantity: 1,
    reason: "Screen flickering",
  },
];

const dummyInvoices = [
  {
    id: "order101",
    data: () => ({ date: "2025-04-10", deliverycost: 20, totaldiscountedcost: 430 }),
    products: [
      { data: () => ({ name: "Keyboard", count: 2, price: 50, discount: 0 }) },
      { data: () => ({ name: "Monitor", count: 1, price: 200, discount: 10 }) },
    ],
  },
  {
    id: "order102",
    data: () => ({ date: "2025-04-15", deliverycost: 15, totaldiscountedcost: 180 }),
    products: [
      { data: () => ({ name: "Monitor", count: 1, price: 200, discount: 10 }) },
    ],
  },
];

export default function SalesManagerPage() {
  const [products, setProducts] = useState([
    { id: 1, name: "Laptop", price: null, cost: 600, pending: true },
    { id: 2, name: "Mouse", price: null, cost: 20, pending: true },
    { id: 3, name: "Keyboard", price: 50, cost: 30, pending: false },
    { id: 4, name: "Monitor", price: 200, cost: 150, pending: false },
  ]);
  const [invoices, setInvoices] = useState(dummyInvoices);
  const [discount, setDiscount] = useState(10);
  const [showDiscountedList, setShowDiscountedList] = useState(false);
  const [discountedItems, setDiscountedItems] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceDateSearch, setInvoiceDateSearch] = useState("");
  const [priceInputs, setPriceInputs] = useState({});
  const [discountedProductData, setDiscountedProductData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refundRequests, setRefundRequests] = useState(dummyRefunds);
  const [receivedRefunds, setReceivedRefunds] = useState({});
  const [showRefundSection, setShowRefundSection] = useState(false);

    const navigate = useNavigate();

  const handlePriceChange = (id, value) => {
    setPriceInputs((prev) => ({ ...prev, [id]: value }));
  };

  const submitPrice = (id) => {
    const price = parseFloat(priceInputs[id]);
    if (!isNaN(price)) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, price, pending: false } : p))
      );
    }
  };

  const toggleProductSelection = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const removeProductFromSelection = (id) => {
    setSelectedProductIds((prev) => prev.filter((pid) => pid !== id));
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: null, pending: true } : p))
    );
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

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: discountedItem.originalPrice } : p))
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

  const calculateRevenue = () => {
    let total = 0;
    let cost = 0;
    invoices.forEach((invoice) => {
      invoice.products.forEach((prod) => {
        const p = prod.data();
        const product = products.find((pr) => pr.name === p.name);
        if (product) {
          total += p.count * p.price;
          cost += p.count * product.cost;
        }
      });
    });
    return { total, cost, profit: total - cost };
  };

  const getFilteredRevenue = () => {
    let total = 0;
    let cost = 0;
    invoices.forEach((invoice) => {
      const invDate = new Date(invoice.data().date);
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;

      if ((!from || invDate >= from) && (!to || invDate <= to)) {
        invoice.products.forEach((prod) => {
          const p = prod.data();
          const product = products.find((pr) => pr.name === p.name);
          if (product) {
            total += p.count * p.price;
            cost += p.count * product.cost;
          }
        });
      }
    });
    return {
      total: parseFloat(total.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      profit: parseFloat((total - cost).toFixed(2)),
    };
  };

  const downloadInvoicesAsPDF = (invoiceList) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 50; // current vertical position
  
    invoiceList.forEach((orderDocument) => {
      const orderData = orderDocument.data();
  
      // Estimate space needed for invoice header + footer + items
      const estimatedHeight = 130 + orderDocument.products.length * 20;
  
      if (y + estimatedHeight > 750) {
        doc.addPage();
        y = 50;
      }
  
      // Invoice header
      doc.setFont("helvetica", "normal");
      doc.setFontSize(18).text("INVOICE", 220, y, { underline: true });
      y += 30;
  
      doc.setFontSize(10);
      doc.text(`Order ID: ${orderDocument.id}`, 50, y);
      y += 15;
      doc.text(`Date: ${orderData.date}`, 50, y);
      y += 30;
  
      doc.setFontSize(12).text("Items Ordered", 50, y);
      y += 15;
      doc.setFont("helvetica", "bold");
      doc.text("No.", 50, y);
      doc.text("Product Name", 90, y);
      doc.text("Total Price", 340, y, { align: "right" });
      doc.text("Discounted Price", 450, y, { align: "right" });
      y += 10;
  
      doc.setLineWidth(0.5);
      doc.line(50, y, 550, y);
      y += 10;
  
      doc.setFont("helvetica", "normal");
  
      orderDocument.products.forEach((docData, i) => {
        const d = docData.data();
        const total = d.count * d.price;
        const discounted = (total * (100 - d.discount)) / 100;
  
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
  
        doc.text(`${i + 1}`, 50, y);
        doc.text(d.name, 90, y);
        doc.text(`$${total.toFixed(2)}`, 340, y, { align: "right" });
        doc.text(`$${discounted.toFixed(2)}`, 450, y, { align: "right" });
        y += 15;
      });
  
      y += 10;
      doc.line(50, y, 550, y);
      y += 20;
  
      doc.setFont("helvetica", "bold");
      doc.text(`Delivery Cost: $${orderData.deliverycost.toFixed(2)}`, 450, y, { align: "right" });
      y += 15;
      doc.text(`Total: $${orderData.totaldiscountedcost.toFixed(2)}`, 450, y, { align: "right" });
      y += 30; // add spacing before next invoice
    });
  
    doc.save("all_invoices.pdf");
  };
  
  

  const filteredInvoices = invoices.filter((inv) =>
    invoiceDateSearch ? inv.data().date === invoiceDateSearch : true
  );

  const { total, cost, profit } = calculateRevenue();

  return ( <div> <div className="app-bar">
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
              {products.filter((p) => p.pending && p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && <p>No pending products.</p>}
              {products.filter((p) => p.pending && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
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
                  {products.filter((p) => !p.pending && p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => {
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

        {/* Continue with invoices and revenue report */}
        <button className="button" onClick={() => downloadInvoicesAsPDF(dummyInvoices)}>
          Download Invoices as PDF
        </button>
        <section className="sales-section">
          <h2 className="section-title">Invoices</h2>
          <input
            type="date"
            value={invoiceDateSearch}
            onChange={(e) => setInvoiceDateSearch(e.target.value)}
            className="input"
            style={{ marginBottom: "1rem" }}
          />
          <ul className="invoice-list">
            {filteredInvoices.map((invoice) => (
              <li key={invoice.id} className="invoice-item">
                <strong>ID:</strong> {invoice.id} —
                <strong> Date:</strong> {invoice.data().date} —
                <strong> Total:</strong> $
                {invoice.products.reduce((sum, prod) => {
                  const p = prod.data();
                  return sum + p.count * p.price;
                }, 0).toFixed(2)}
              </li>
            ))}
          </ul>
        </section>

        <section className="sales-section">
          <h2 className="section-title">Revenue Report</h2>
          <div className="revenue-filters">
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

          <div style={{ width: "100%", height: 300, marginTop: "1rem" }}>
            <ResponsiveContainer>
              <BarChart
                data={[getFilteredRevenue()]}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={() => "Filtered Revenue"} />
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
            <p><strong>Total Sales:</strong> ${total.toFixed(2)}</p>
            <p><strong>Total Cost:</strong> ${cost.toFixed(2)}</p>
            <p><strong>Profit:</strong> ${profit.toFixed(2)}</p>
          </div>
        </section>
      </div>
    </div></div>
  );
}