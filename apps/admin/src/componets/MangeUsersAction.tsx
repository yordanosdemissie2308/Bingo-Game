"use client";

import React, { useEffect, useState } from "react";
import { XCircle, Copy } from "lucide-react";
import {
  collection,
  setDoc,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./Firebase";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  uid?: string;
  username: string;
  email: string;
  role: string;
  points: number;
  folderAccess?: string[];
}

export const ManageUsersAction = () => {
  const [isAddUser, setIsAddUser] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    points: 0,
  });

  const [newUserCredentials, setNewUserCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const usersRef = collection(db, "users");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<User, "id">),
      }));
      setUsers(data);
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const uid = userCredential.user.uid;

      // 2. Add user info to Firestore with UID as document ID
      await setDoc(doc(db, "users", uid), {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        points: Number(formData.points),
        folderAccess:
          formData.role === "admin" ? ["app-admin", "user"] : ["user"],
      });

      // Save credentials to state to show modal
      setNewUserCredentials({
        email: formData.email,
        password: formData.password,
      });

      // Reset form & close add modal
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "user",
        points: 0,
      });
      setIsAddUser(false);

      // Redirect to dashboard with points as query param (optional)
      router.push(
        `/dashboard?points=${encodeURIComponent(formData.points.toString())}`
      );
    } catch (error: any) {
      console.error("Error adding user:", error);
      alert(`Failed to create user: ${error.message}`);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    const userRef = doc(db, "users", selectedUser.id);
    try {
      await updateDoc(userRef, {
        username: selectedUser.username,
        email: selectedUser.email,
        role: selectedUser.role,
        points: Number(selectedUser.points),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    const userRef = doc(db, "users", selectedUser.id);
    try {
      await deleteDoc(userRef);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-md p-6 w-full space-y-6">
      <h2 className="text-3xl font-bold text-indigo-700">Manage Users</h2>
      <p className="text-gray-600">View and manage user accounts.</p>

      <button
        onClick={() => setIsAddUser(true)}
        className="bg-indigo-600 text-white font-semibold py-2 px-5 rounded-full shadow hover:bg-indigo-700 transition-all duration-300"
      >
        + Add New User
      </button>

      {users.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Points</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{user.username}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2 capitalize text-indigo-600 font-semibold">
                    {user.role}
                  </td>
                  <td className="px-4 py-2">{user.points}</td>
                  <td className="px-4 py-2 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsEditing(false);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User View/Edit/Delete Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
            >
              <XCircle size={24} />
            </button>
            <h3 className="text-2xl font-bold text-indigo-700 mb-4">
              {isEditing ? "Edit User" : "User Information"}
            </h3>
            <div className="space-y-3 text-gray-800">
              <div>
                <label className="font-semibold">Username:</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={selectedUser.username}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        username: e.target.value,
                      })
                    }
                    className="w-full mt-1 p-2 border rounded"
                  />
                ) : (
                  <p>{selectedUser.username}</p>
                )}
              </div>

              <div>
                <label className="font-semibold">Email:</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        email: e.target.value,
                      })
                    }
                    className="w-full mt-1 p-2 border rounded"
                  />
                ) : (
                  <p>{selectedUser.email}</p>
                )}
              </div>

              <div>
                <label className="font-semibold">Role:</label>
                {isEditing ? (
                  <select
                    value={selectedUser.role}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        role: e.target.value,
                      })
                    }
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <p className="capitalize">{selectedUser.role}</p>
                )}
              </div>

              <div>
                <label className="font-semibold">Points:</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={selectedUser.points}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        points: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 p-2 border rounded"
                  />
                ) : (
                  <p>{selectedUser.points}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleUpdateUser}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg">
            <button
              onClick={() => setIsAddUser(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
            >
              <XCircle size={24} />
            </button>
            <h3 className="text-2xl font-bold text-indigo-700 mb-6">
              Add New User
            </h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full p-2 border rounded"
                required
              />
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full p-2 border rounded"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="number"
                placeholder="Points"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: Number(e.target.value) })
                }
                className="w-full p-2 border rounded"
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Show credentials modal after user creation */}
      {newUserCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setNewUserCredentials(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
              title="Close"
            >
              <XCircle size={24} />
            </button>
            <h3 className="text-xl font-bold text-indigo-700 mb-4">
              User Created Successfully
            </h3>
            <p className="mb-2">
              Send these credentials to the user so they can login:
            </p>

            <div className="mb-3">
              <strong>Email:</strong> <span>{newUserCredentials.email}</span>{" "}
              <button
                onClick={() => copyToClipboard(newUserCredentials.email)}
                className="inline-block ml-2 text-indigo-600 hover:text-indigo-800"
                title="Copy Email"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="mb-3">
              <strong>Password:</strong>{" "}
              <span>{newUserCredentials.password}</span>{" "}
              <button
                onClick={() => copyToClipboard(newUserCredentials.password)}
                className="inline-block ml-2 text-indigo-600 hover:text-indigo-800"
                title="Copy Password"
              >
                <Copy size={16} />
              </button>
            </div>
            <div className="mb-3">
              <strong>Login URL:</strong>{" "}
              <a
                href="http://localhost:3000/login"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline"
              >
                http://localhost:3000/login
              </a>{" "}
              <button
                onClick={() => copyToClipboard("http://localhost:3000/login")}
                className="inline-block ml-2 text-indigo-600 hover:text-indigo-800"
                title="Copy URL"
              >
                <Copy size={16} />
              </button>
            </div>

            <button
              onClick={() => setNewUserCredentials(null)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
