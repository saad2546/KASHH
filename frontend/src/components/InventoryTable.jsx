import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { useHospital } from "@/context/HospitalContext";

export default function InventoryTable({ items }) {
  const { hospital } = useHospital();

  const updateStock = async (itemId, currentStock, delta) => {
    if (!hospital?.id) return;

    const next = Math.max(0, Number(currentStock || 0) + delta);

    try {
      await updateDoc(doc(db, "hospitals", hospital.id, "inventory", itemId), {
        stock: next,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update stock");
    }
  };

  const removeItem = async (itemId) => {
    if (!hospital?.id) return;

    try {
      await deleteDoc(doc(db, "hospitals", hospital.id, "inventory", itemId));
      toast.success("Medicine deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete medicine");
    }
  };

  if (!items.length) {
    return (
      <div className="p-10 text-center text-slate-500">
        No medicines added yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {items.map((item) => {
        const stock = Number(item.stock || 0);
        const minStock = Number(item.min_stock || 0);
        const low = stock <= minStock;

        return (
          <div
            key={item.id}
            className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition ${
              low ? "bg-red-50/40" : ""
            }`}
          >
            {/* Left Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.category || "General"} • Expiry:{" "}
                    {item.expiry_date ? item.expiry_date : "N/A"}
                  </p>
                </div>

                {/* Low stock label */}
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    low
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {low ? "LOW STOCK" : "OK"}
                </span>
              </div>
            </div>

            {/* Stock controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateStock(item.id, stock, -1)}
                className="p-2 rounded-md border border-slate-200 hover:bg-white transition"
              >
                <Minus size={16} />
              </button>

              <div className="w-20 text-center">
                <p className="text-sm font-bold text-slate-900">
                  {stock}{" "}
                  <span className="text-xs text-slate-500 font-semibold">
                    {item.unit || "units"}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  min {minStock}
                </p>
              </div>

              <button
                onClick={() => updateStock(item.id, stock, +1)}
                className="p-2 rounded-md border border-slate-200 hover:bg-white transition"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Delete */}
            <button
              onClick={() => removeItem(item.id)}
              className="text-slate-400 hover:text-red-600 transition"
            >
              <Trash2 size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
