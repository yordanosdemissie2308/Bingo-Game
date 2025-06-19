"use client";
import { useRouter } from "next/router";

const initialUsers = [
  {
    id: 1,
    name: "Alice",
    username: "alice123",
    password: "secret1",
    place: "New York",
    email: "alice@example.com",
    credit: 100,
    points: 50,
  },
  {
    id: 2,
    name: "Bob",
    username: "bob99",
    password: "secret2",
    place: "California",
    email: "bob@example.com",
    credit: 200,
    points: 80,
  },
];

export default function AdminUsers() {
  const goToUserDetail = (id: number) => {
    router.push(`/admin/users/${id}`);
  };
  const router = useRouter();

  return (
    <div style={{ padding: "2rem", maxWidth: "700px", margin: "auto" }}>
      <h1>Admin User Control</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {initialUsers.map(({ id, name, email }) => (
            <tr
              key={id}
              style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
              onClick={() => goToUserDetail(id)}
            >
              <td style={{ padding: "8px" }}>{name}</td>
              <td style={{ padding: "8px" }}>{email}</td>
              <td style={{ padding: "8px" }}>User</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
