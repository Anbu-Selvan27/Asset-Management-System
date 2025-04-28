import React, { useEffect, useState } from "react";
import axios from "axios";
interface Field {
  name: string;
  type: string;
}

interface Category {
  table: string;
  fields: Field[];
}

const ManageCategory: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [fields, setFields] = useState<Field[]>([]);
  const [notification, setNotification] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);



  const fetchFields = async()=>{
    const selectedCategoryData = categories.find((c) => c.table === selectedCategory);
    if (selectedCategoryData) {
      setFields(selectedCategoryData.fields);
      clearMessages();
    } else {
      setFields([]);
    }}


  useEffect(() => {
  fetchFields()
  }, [selectedCategory, categories]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/get-categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCategories(response.data);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Unable to retrieve categories. Please try again.");
    }
  };

  const clearMessages = () => {
    setNotification("");
    setErrorMessage("");
  };

  const handleFieldRemoval = async (fieldName: string) => {
    if (!window.confirm(`Please confirm removal of field "${fieldName}".`)) return;
    
    try {
      await axios.post(
        "http://127.0.0.1:8000/delete-field",
        {
          category_name: selectedCategory,
          field_name: fieldName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotification(`Field "${fieldName}" successfully removed`);
      setErrorMessage("");
      fetchFields();
      fetchCategories();

   
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Field removal unsuccessful. Please try again.");
      setNotification("");
    }
  };

  const handleCategoryRemoval = async () => {
    if (!window.confirm(`Are you certain you wish to remove the "${selectedCategory}" category? This action is irreversible.`)) return;
    
    try {
      await axios.post(
        "http://127.0.0.1:8000/delete-category",
        { category_name: selectedCategory },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotification(`Category "${selectedCategory}" successfully removed`);
      setErrorMessage("");
      setSelectedCategory("");
      setFields([]);
      setCategories(categories.filter((category) => category.table !== selectedCategory));
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || "Category removal unsuccessful. Please try again.");
      setNotification("");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Category Management</h1>

      {notification && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{notification}</div>}
      {errorMessage && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{errorMessage}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Category Selection</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Select Category --</option>
          {categories.map((category) => (
            <option key={category.table} value={category.table}>
              {category.table}
            </option>
          ))}
        </select>
      </div>

      {selectedCategory && (
        <div>
          <h2 className="text-lg font-semibold mt-6 mb-3">Field Configuration</h2>
          {fields.length === 0 ? (
            <p className="text-gray-600">No fields exist in this category.</p>
          ) : (
            <div className="flex flex-wrap gap-3 mb-6">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className="bg-gray-50 border border-gray-300 rounded px-4 py-2 flex items-center justify-between gap-3"
                >
                  <span className="capitalize text-gray-800">{field.name.replace("_", " ")}</span>
                  <button
                    onClick={() => handleFieldRemoval(field.name)}
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-400 px-3 py-1 rounded"
                    aria-label={`Remove field ${field}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleCategoryRemoval}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-400 px-4 py-2 rounded flex items-center"
            >
              <span className="mr-2">Remove Category</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategory;