import React, { useEffect, useState } from "react";
import axios from "axios";

interface Category {
  table: string;
  fields: { name: string; type: string }[];
}

interface ReassignFormPayload {
  table_name: string;
  identifier: string;
  user_name?: string;
  user_id?: string;
  email?: string;
  department?: string;
  location?: string;
  section?: string;
  date_of_return?: string;
  date_of_reassign?: string;
  date_of_update?: string;
  remarks?: string;
}

type ReassignFormEditableFields = Omit<
  ReassignFormPayload,
  "table_name" | "identifier"
>;

const reassignFields: {
  key: keyof ReassignFormEditableFields;
  label: string;
  type: string;
}[] = [
  { key: "user_name", label: "Username", type: "text" },
  { key: "user_id", label: "User ID", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "department", label: "Department", type: "text" },
  { key: "location", label: "Location", type: "text" },
  { key: "section", label: "Section", type: "text" },
  { key: "date_of_return", label: "Date of Return", type: "date" },
  { key: "date_of_reassign", label: "Date of Reassign", type: "date" },
  { key: "date_of_update", label: "Date of Update", type: "date" },
  { key: "remarks", label: "Remarks", type: "text" },
];

const ReassignForm: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [identifier, setIdentifier] = useState<string>("");
  const [payload, setPayload] = useState<ReassignFormEditableFields>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<Category[]>("http://127.0.0.1:8000/get-categories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => setCategories(res.data))
      .catch(() => setError("Failed to load categories"));
  }, []);

  const handleFieldChange = (
    key: keyof ReassignFormEditableFields,
    value: string
  ) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const camelToSnake = (str: string) =>
    str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!selectedCategory) {
      setError("Please select a category");
      return;
    }
    if (!identifier) {
      setError("Please enter asset tag or code");
      return;
    }

    const fullPayload: ReassignFormPayload = {
      ...payload,
      table_name: selectedCategory,
      identifier: identifier,
    };

    const transformedPayload = Object.fromEntries(
      Object.entries(fullPayload).filter(
        ([_, val]) => val !== undefined && val !== ""
      )
    );

    const snakeCasePayload = Object.fromEntries(
      Object.entries(transformedPayload).map(([key, value]) => [
        camelToSnake(key),
        value,
      ])
    );

    try {
      await axios.put("http://127.0.0.1:8000/reassign-asset", snakeCasePayload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      setMessage("✅ Asset reassigned successfully");
      setPayload({});
      setIdentifier("");
    } catch (e: any) {
      setError(e.response?.data?.detail || "Reassign failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
      <h1 className="text-2xl font-bold mb-6">🔄 Reassign</h1>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="w-full border p-2 rounded"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.table} value={cat.table}>
                {cat.table}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Asset Tag / Code
          </label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Enter asset tag or code"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Reassignment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reassignFields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  className="w-full border p-2 rounded"
                  value={(payload[field.key] as string) || ""}
                  onChange={(e) =>
                    handleFieldChange(field.key, e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Reassign Asset
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReassignForm;
