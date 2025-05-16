import React, { useEffect, useState } from 'react';
import { Dialog } from '@mui/material';
import { get, set } from '../../services/firebase/database';
import { auth } from '../../services/firebase/connect';
import './notification_dialog.css';

function NotificationDialog({ open, onClose, onSeen }) {
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                const data = await get(`users/${user.uid}/notifications`);

                let merged = {};
                if (Array.isArray(data)) {
                    data.forEach(obj => {
                        if (typeof obj === 'object') {
                            merged = { ...merged, ...obj };
                        }
                    });
                } else {
                    merged = data;
                }

                const notificationsArray = Object.entries(merged).map(([id, notif]) => ({
                    id,
                    ...notif,
                }));

                notificationsArray.sort((a, b) => {
                    const dateA = a.date?.toDate?.() || new Date(a.date);
                    const dateB = b.date?.toDate?.() || new Date(b.date);
                    return dateB - dateA;
                });

                setNotifications(notificationsArray);
            }
        });

        return unsubscribe;
    }, []);


    const markAsSeen = async (notificationId) => {
        await set(`users/${currentUser.uid}/notifications/${notificationId}`, { seen: true });
        setNotifications((prev) => {
            const updated = prev.map((notif) =>
                notif.id === notificationId ? { ...notif, seen: true } : notif
            );
            if (onSeen) {
                const newUnseenCount = updated.filter(n => !n.seen).length;
                onSeen(newUnseenCount);
            }
            return updated;
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <div className="dialog-content">
                <h2 className="notification-header">Notifications</h2>
                <div className="notification-container">
                    {notifications.length === 0 ? (
                        <p>No notifications found.</p>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`notification-item ${notif.seen ? 'seen' : 'unseen'}`}
                            >
                                <p className="message">{notif.message}</p>
                                <p className="date">
                                    {notif.date?.toDate
                                        ? notif.date.toDate().toLocaleString()
                                        : new Date(notif.date).toLocaleString()}
                                </p>
                                {!notif.seen && (
                                    <button onClick={() => markAsSeen(notif.id)}>
                                        Mark as Seen
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Dialog>
    );
}

export default NotificationDialog;
