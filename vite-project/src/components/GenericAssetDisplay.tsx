import React from "react";

interface GenericAssetDisplayProps {
  asset: Record<string, any>;
}

const GenericAssetDisplay: React.FC<GenericAssetDisplayProps> = ({ asset }) => {
  return (
    <div className="p-4 bg-white shadow rounded mb-6">
      <h2 className="text-lg font-semibold mb-4 border-b pb-2">Asset Details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(asset).map(([key, value]) => (
          <div key={key} className="bg-gray-50 p-3 rounded">
            <p className="text-gray-500 text-xs uppercase tracking-wide">
              {key.replace(/_/g, " ")}
            </p>
            <p className="text-sm font-medium">
              {value && value !== "" ? value : "Not Provided"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GenericAssetDisplay;
