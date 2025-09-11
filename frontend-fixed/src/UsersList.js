import React, { useEffect, useState } from "react";
import "./Auth.css"; // same black + red glow styles

function UsersList() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/api/users")
            .then((res) => res.json())
            .then((data) => setUsers(data))
            .catch((err) => console.error("Error fetching users:", err));
    }, []);

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ width: "80%", maxWidth: "900px" }}>
                <h2>Registered Users</h2>
                <table style={{ width: "100%", color: "white", borderCollapse: "collapse" }}>
                    <thead>
                    <tr>
                        <th style={{ borderBottom: "2px solid red", padding: "8px" }}>ID</th>
                        <th style={{ borderBottom: "2px solid red", padding: "8px" }}>Username</th>
                        <th style={{ borderBottom: "2px solid red", padding: "8px" }}>Email</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td style={{ padding: "8px", textAlign: "center" }}>{user.id}</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>{user.username}</td>
                            <td style={{ padding: "8px", textAlign: "center" }}>{user.email}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UsersList;

