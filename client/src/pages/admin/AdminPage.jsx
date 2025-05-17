import React, { useState, useEffect } from "react";
import { get, set } from '../../services/firebase/database';
import './AdminPage.css';
import logo from '../../assets/teknosuLogo.jpg';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from "../../services/firebase/connect.js";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  // Role check
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

  // Fetch users
  useEffect(() => {
    get("users").then(fetched => {
      const userList = fetched.map(obj => {
        const id = Object.keys(obj)[0];
        const data = obj[id];
        return { id, ...data };
      });
      setUsers(userList);
    });
  }, []);

  const handleRoleChange = async (id, newRole) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const updatedUser = { ...user, role: newRole };
    await set(`users/${id}`, updatedUser);
    setUsers(users.map(u => u.id === id ? updatedUser : u));
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
        <img src={logo} alt="Logo" style={{ height: '40px', marginRight: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', color: '#1f2937' }}>Admin Dashboard</h1>
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
          <div className="admin-container">
            <h2>Admin Role Management</h2>
            <div className="scroll-box">
              {users.map(user => (
                <div key={user.id} className="user-row">
                  <span>{user.email} - Current Role: {user.role || 'None'}</span>
                  <select
                    value={user.role || ''}
                    onChange={e => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="admin">Admin</option>
                    <option value="sales">Sales Manager</option>
                    <option value="product">Product Manager</option>
                    <option value="delivery">Delivery Staff</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
