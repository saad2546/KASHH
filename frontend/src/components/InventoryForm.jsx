import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { useHospital } from "@/context/HospitalContext";

export default function InventoryForm() {
  const { hospital } = useHospital();

  const [formData, setFormData] = useState({
    name: "",
    category: "General",
    stock: "",
    min_stock: "",
    unit: "units",
    expiry_date: "",
  });

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "General",
      stock: "",
      min_stock: "",
      unit: "units",
      expiry_date: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hospital?.id) {
      toast.error("Hospital not loaded");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Medicine name is required");
      return;
    }

    try {
      await addDoc(collection(db, "hospitals", hospital.id, "inventory"), {
        name: formData.name.trim(),
        category: formData.category,
        stock: Number(formData.stock || 0),
        min_stock: Number(formData.min_stock || 0),
        unit: formData.unit || "units",
        expiry_date: formData.expiry_date || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Medicine added to inventory");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add medicine");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-6">Add Inventory Item</h3>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* MEDICINE NAME */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Medicine Name
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Paracetamol 500mg"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* CATEGORY */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
          >
            <option value="General">General</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Painkiller">Painkiller</option>
            <option value="Emergency">Emergency</option>
            <option value="ICU">ICU</option>
          </select>
        </div>

        {/* STOCK + MIN STOCK */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Stock
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="120"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Min Stock
            </label>
            <input
              type="number"
              name="min_stock"
              value={formData.min_stock}
              onChange={handleChange}
              placeholder="50"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            />
          </div>
        </div>

        {/* UNIT + EXPIRY */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            >
              <option value="units">Units</option>
              <option value="tablets">Tablets</option>
              <option value="bottles">Bottles</option>
              <option value="vials">Vials</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-900"
            />
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
        >
          <PlusCircle size={18} />
          Add Medicine
        </button>
      </form>
    </div>
  );
}
