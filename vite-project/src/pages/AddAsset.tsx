import React, { useState, useEffect } from "react";
import axios from "axios";

interface Field {
  name: string;
  type: string;
}

interface Category {
  table: string;
  fields: Field[];
}

interface AssetInput {
  table_name: string;
  data: { [key: string]: string };
}

const AddAsset: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [assetData, setAssetData] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hiddenFields = ['user_name', "user_name",
    "user_id",
    "email",
    "department",
    "location",
    "section",
    "date_of_return",
    "date_of_reassign",
    "date_of_update",
    "remarks", 'user_id', 'remarks','department','date_of_return','date_of_reassign','date_of_issued'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/get-categories", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setCategories(response.data);
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        setError("Failed to fetch categories.");
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    const selected = categories.find((cat) => cat.table === category);
    if (selected) {
      setFields(selected.fields);
      setAssetData({});
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    setAssetData({ ...assetData, [field]: e.target.value });
  };

  const getInputType = (type: string): string => {
    switch (type.toLowerCase()) {
      case "date":
        return "date";
      case "number":
      case "int":
      case "integer":
        return "number";
      case "boolean":
        return "checkbox";
      default:
        return "text";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) {
      setError("Please select a category.");
      return;
    }

    const assetInput: AssetInput = {
      table_name: selectedCategory,
      data: assetData,
    };

    try {
      await axios.post("http://127.0.0.1:8000/add-asset", assetInput, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setMessage("✅ Asset added successfully.");
      setError(null);
      setAssetData({});
    } catch (error: any) {
      console.error("Error adding asset:", error);
      setError(error.response?.data?.detail || "Failed to add asset.");
      setMessage(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
      <h1 className="text-2xl font-bold mb-4">➕ Add Asset</h1>

      {message && <div className="text-green-600 mb-4">{message}</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Select Category
          </label>
          <select
            id="category"
            value={selectedCategory || ""}
            onChange={handleCategoryChange}
            className="w-full border p-2 rounded-md"
            required
          >
            <option value="">-- Choose Category --</option>
            {categories.map((cat) => (
              <option key={cat.table} value={cat.table}>
                {cat.table}
              </option>
            ))}
          </select>
        </div>

        {fields.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mt-4 mb-2">Enter Asset Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fields
                .filter((field) => !hiddenFields.includes(field.name))
                .map((field) => (
                  <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium mb-1 capitalize">
                      {field.name.replace(/_/g, " ")}
                    </label>
                    <input
                      type={getInputType(field.type)}
                      id={field.name}
                      value={assetData[field.name] || ""}
                      onChange={(e) => handleFieldChange(e, field.name)}
                      className="w-full border px-3 py-2 rounded-md"
                      required
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          ➕ Add Asset
        </button>
      </form>
    </div>
  );
};

export default AddAsset;

