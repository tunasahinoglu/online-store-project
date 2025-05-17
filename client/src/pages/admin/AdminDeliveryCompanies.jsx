import React, { useEffect, useState } from "react";
import { auth } from "../../services/firebase/connect";
import { add, get } from "../../services/firebase/database";
import { useNavigate, Link } from "react-router-dom";
import './AdminDeliveryCompanies.css';
import logo from '../../assets/teknosuLogo.jpg';

function AdminDeliveryCompanies() {
  const [userRole, setUserRole] = useState(null);
  const [deliveryCompanies, setDeliveryCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState({ name: '', email: '', costs: ['', ''] });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/login");
        return;
      }

      try {
        const allUsers = await get("users");
        const userId = user.uid;
        const userDataEntry = allUsers.find(obj => Object.keys(obj)[0] === userId);
        if (!userDataEntry) {
          navigate("/");
          return;
        }

        const userData = userDataEntry[userId];
        const role = userData.role;
        setUserRole(role);

        if (role !== "admin") {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

    useEffect(() => {
    const fetchDeliveryCompanies = async () => {
        try {
        const deliveryRes = await get("deliverycompanies");
        const deliveryItems = deliveryRes.map((doc) => {
            const id = Object.keys(doc)[0];
            return { id, ...doc[id] };
        });
        setDeliveryCompanies(deliveryItems);
        } catch (err) {
        console.error("Error loading delivery companies:", err);
        }
    };

    fetchDeliveryCompanies();
    }, []);

  const handleAddCompany = async () => {
  try {
    const message = await add("deliverycompanies", {
      name: newCompany.name,
      email: newCompany.email,
      costs: [
        parseFloat(newCompany.costs[0]),
        parseFloat(newCompany.costs[1])
      ]
    });

    if (message === "Successfully added") {
      setMessage("Company added successfully!");
      setDeliveryCompanies([...deliveryCompanies, {
        name: newCompany.name,
        email: newCompany.email,
        costs: newCompany.costs
      }]);
      setNewCompany({ name: '', email: '', costs: ['', ''] });
    } else {
      setMessage("Failed: " + message);
    }
  } catch (err) {
    console.error("Add Company Error:", err);
    setMessage("Something went wrong.");
  }
};

  const handleDelete = async (id) => {
    const response = await fetch(`/api/deliverycompanies/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": auth.currentUser ? await auth.currentUser.getIdToken() : ""
      }
    });

    const data = await response.json();
    setMessage(data.message);
    if (response.status === 200) {
      setDeliveryCompanies(deliveryCompanies.filter(c => c.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#ffffff', color: '#000000' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#f3f4f6',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #ccc'
      }}>
        <img src={logo} alt="Logo" style={{ height: '40px', marginRight: '1rem' }} onClick={() => navigate('/')}/>
        <h1 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Delivery Companies Management</h1>
      </header>

      {/* Content Area */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <nav style={{
          width: '220px',
          backgroundColor: '#1f2937',
          color: '#ffffff',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Link to="/productmanager" style={{ color: '#ffffff', textDecoration: 'none' }}>Product Managment</Link>
          <Link to="/sales" style={{ color: '#ffffff', textDecoration: 'none' }}>Sales Managment</Link>
          <Link to="/admin" style={{ color: '#ffffff', textDecoration: 'none' }}>Edit User Roles</Link>
          <Link to="/admin/delivery" style={{ color: '#ffffff', textDecoration: 'none' }}>Edit Delivery Companies</Link>
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem', backgroundColor: '#f9f9f9' }}>
          <h2 style={{ color: '#111827' }}>Add New Delivery Company</h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="Company Name"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Company Email"
              value={newCompany.email}
              onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
            />
            <input
              type="number"
              placeholder="Standard Cost"
              value={newCompany.costs[0]}
              onChange={(e) => setNewCompany({ ...newCompany, costs: [e.target.value, newCompany.costs[1]] })}
            />
            <input
              type="number"
              placeholder="Express Cost"
              value={newCompany.costs[1]}
              onChange={(e) => setNewCompany({ ...newCompany, costs: [newCompany.costs[0], e.target.value] })}
            />
            <button onClick={handleAddCompany}>Add Company</button>
          </div>

          <h2 style={{ marginTop: '2rem', color: '#111827' }}>Existing Companies</h2>
          {deliveryCompanies.map((company, index) => (
            <div key={index} className="company-row">
              <span><strong>{company.name}</strong> | {company.email} | Standard: {company.costs[0]}, Express: {company.costs[1]}</span>
              <button onClick={() => handleDelete(company.id)}>Delete</button>
            </div>
          ))}

          {message && <p style={{ marginTop: '1rem', color: '#065f46' }}>{message}</p>}
        </main>
      </div>
    </div>
  );
}

export default AdminDeliveryCompanies;
