import React, { useEffect, useState } from "react";
import axios from "axios";

type FieldType = {
  name: string;
  type: string;
};

const CreateCategory = () => {
  const [categoryName, setCategoryName] = useState("");
  const [fields, setFields] = useState<FieldType[]>([
    { name: "asset tag", type: "string" },
    { name: "asset code", type: "string" },
  ]);
  const [error, setError] = useState("");
  const [includeUserFields, setIncludeUserFields] = useState(false);
  const [includeUserFields2, setIncludeUserFields2] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [existingCategories, setExistingCategories] = useState<
    { table: string; fields: FieldType[] }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newFields, setNewFields] = useState<FieldType[]>([
    { name: "", type: "string" },
  ]);
  const [addFieldMessage, setAddFieldMessage] = useState("");
  const [activeTab, setActiveTab] = useState("create"); // "create" or "add"

  const predefinedUserFields: FieldType[] = [
    { name: "user_name", type: "string" },
    { name: "user_id", type: "string" },
    { name: "email", type: "string" },
    { name: "department", type: "string" },
    { name: "location", type: "string" },
    { name: "section", type: "string" },
    { name: "date_of_return", type: "date" },
    { name: "date_of_reassign", type: "date" },
    { name: "date_of_update", type: "date" },
    { name: "remarks", type: "string" },
  ];
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/get-categories", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setExistingCategories(response.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, []);

  const handleFieldChange = (
    index: number,
    key: keyof FieldType,
    value: string,
    isNew = false
  ) => {
    const updated = isNew ? [...newFields] : [...fields];
    updated[index][key] = value;
    isNew ? setNewFields(updated) : setFields(updated);
  };

  const addField = (isNew = false) => {
    const newField = { name: "", type: "string" };
    isNew ? setNewFields([...newFields, newField]) : setFields([...fields, newField]);
  };

  const handleIncludeFieldsChange = (isNewFields: boolean) => {
    if (isNewFields) {
      setIncludeUserFields2((prev) => {
        const newValue = !prev;
        if (newValue) {
          const updated = [...newFields, ...predefinedUserFields.filter(
            f => !newFields.some(existing => existing.name === f.name)
          )];
          setNewFields(updated);
        } else {
          const updated = newFields.filter(
            (f) => !predefinedUserFields.some((pf) => pf.name === f.name)
          );
          setNewFields(updated);
        }
        return newValue;
      });
    } else {
      setIncludeUserFields((prev) => {
        const newValue = !prev;
        if (newValue) {
          const updated = [...fields, ...predefinedUserFields.filter(
            f => !fields.some(existing => existing.name === f.name)
          )];
          setFields(updated);
        } else {
          const updated = fields.filter(
            (f) => !predefinedUserFields.some((pf) => pf.name === f.name)
          );
          setFields(updated);
        }
        return newValue;
      });
    }
  };
  
  const removeField = (index: number, isNew = false) => {
    const updated = (isNew ? newFields : fields).filter((_, i) => i !== index);
    isNew ? setNewFields(updated) : setFields(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || fields.some((f) => !f.name || !f.type)) {
      setError("Category name and all field names/types are required.");
      return;
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/create-category",
        {
          category_name: categoryName,
          fields,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setSuccessMessage(response.data.message);
      setError("");
      setCategoryName("");
      setFields([{ name: "asset tag", type: "string" }, { name: "asset code", type: "string" }]);
      
      // Refresh categories after creating a new one
      const categoriesResponse = await axios.get("http://127.0.0.1:8000/get-categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setExistingCategories(categoriesResponse.data);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
      setSuccessMessage("");
    }
  };

  const handleAddFieldsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || newFields.some((f) => !f.name || !f.type)) {
      setAddFieldMessage("Please select a category and provide valid fields.");
      return;
    }
  
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/add-fields",
        {
          category_name: selectedCategory,
          fields: newFields,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setAddFieldMessage(response.data.message);
      setNewFields([{ name: "", type: "string" }]);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("already exists")) {
        setAddFieldMessage(`Warning: ${detail}`);
      } else {
        setAddFieldMessage("Error: Failed to add fields");
      }
    }
  };

  const renderStatusMessage = (message: string, type: "success" | "error" | "info") => {
    if (!message) return null;
    
    const bgColor = 
      type === "success" ? "bg-green-50 border-green-500" : 
      type === "error" ? "bg-red-50 border-red-500" : 
      "bg-blue-50 border-blue-500";
    
    const textColor = 
      type === "success" ? "text-green-700" : 
      type === "error" ? "text-red-700" : 
      "text-blue-700";
      
    const icon = 
      type === "success" ? "✓" : 
      type === "error" ? "✕" : 
      "ℹ";
    
    return (
      <div className={`${bgColor} ${textColor} border-l-4 p-4 mb-4 rounded`}>
        <div className="flex items-center">
          <span className="font-medium mr-2">{icon}</span>
          <p>{message}</p>
        </div>
      </div>
    );
  };

  const renderFieldsSection = (
    fieldsArray: FieldType[], 
    isNewFields: boolean, 
    includeUserFieldsState: boolean
  ) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-700">Fields</h3>
          <button
            type="button"
            onClick={() => addField(isNewFields)}
            className="bg-white text-blue-600 border border-blue-600 px-3 py-1 rounded hover:bg-blue-50 text-sm flex items-center"
          >
            <span className="mr-1">+</span> Add Field
          </button>
        </div>
        
        <div className="space-y-2">
          {fieldsArray.map((field, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input
                type="text"
                value={field.name}
                onChange={(e) => handleFieldChange(index, "name", e.target.value, isNewFields)}
                placeholder="Field Name"
                className="p-2 border border-gray-300 rounded w-1/2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
              <select
                value={field.type}
                onChange={(e) => handleFieldChange(index, "type", e.target.value, isNewFields)}
                className="p-2 border border-gray-300 rounded w-1/3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="string">Text</option>
                <option value="integer">Number</option>
                <option value="date">Date</option>
              </select>
              <button
                type="button"
                onClick={() => removeField(index, isNewFields)}
                className="bg-white text-red-600 border border-red-600 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-50"
              >
                <span>×</span>
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <label className="inline-flex items-center space-x-2 text-gray-700">
            <input
              type="checkbox"
              checked={includeUserFieldsState}
              onChange={() => handleIncludeFieldsChange(isNewFields)}
              className="form-checkbox h-5 w-5 text-blue-600 rounded"
            />
            <span>Include user-related fields</span>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "create"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Create New Category
          </button>
          <button
            onClick={() => setActiveTab("add")}
            className={`px-6 py-4 text-sm font-medium ${
              activeTab === "add"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Add Fields to Category
          </button>
        </nav>
      </div>

      <div className="p-6">
        {/* Create Category Section */}
        {activeTab === "create" && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Create New Category</h2>
            </div>

            {error && renderStatusMessage(error, "error")}
            {successMessage && renderStatusMessage(successMessage, "success")}

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  id="categoryName"
                  type="text"
                  placeholder="e.g., Laptop, Desktop, Printer"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {renderFieldsSection(fields, false, includeUserFields)}

              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Fields Section */}
        {activeTab === "add" && (
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Add Fields to Existing Category</h2>
            </div>

            {addFieldMessage && renderStatusMessage(
              addFieldMessage, 
              addFieldMessage.startsWith("Warning") ? "error" : 
              addFieldMessage.startsWith("Error") ? "error" : "success"
            )}

            <form onSubmit={handleAddFieldsSubmit} className="space-y-6">
              <div>
                <label htmlFor="existingCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Category
                </label>
                <select
                  id="existingCategory"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select Existing Category --</option>
                  {existingCategories.map((cat) => (
                    <option key={cat.table} value={cat.table}>
                      {cat.table}
                    </option>
                  ))}
                </select>
              </div>

              {renderFieldsSection(newFields, true, includeUserFields2)}

              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium shadow-sm"
                >
                  Add Fields
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateCategory;