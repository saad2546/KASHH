import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import getForecast from "../lib/forecast";
import "../App.css";

function formatLabel(iso, timeframe) {
  const d = new Date(iso);
  if (timeframe === "24h" || timeframe === "72h") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("24h");
  const data = useMemo(() => {
    // get mock forecast data and map into recharts-friendly format
    const f = getForecast(timeframe);
    return f.map((pt) => ({
      time: formatLabel(pt.time, timeframe),
      admissions: Math.round(pt.admissions),
      discharges: Math.round(pt.discharges),
    }));
  }, [timeframe]);

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <h1>Inflow vs Outflow Forecast</h1>
        <div className="timeframe-controls">
          <button
            className={`tf-btn ${timeframe === "24h" ? "active" : ""}`}
            onClick={() => setTimeframe("24h")}
          >
            Next 24 hours
          </button>
          <button
            className={`tf-btn ${timeframe === "72h" ? "active" : ""}`}
            onClick={() => setTimeframe("72h")}
          >
            Next 72 hours
          </button>
          <button
            className={`tf-btn ${timeframe === "7d" ? "active" : ""}`}
            onClick={() => setTimeframe("7d")}
          >
            Next 7 days
          </button>
        </div>
      </header>

      <main className="dashboard-chart">
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="admissions"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              name="Predicted Admissions"
            />
            <Line
              type="monotone"
              dataKey="discharges"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              name="Predicted Discharges"
            />
          </LineChart>
        </ResponsiveContainer>
      </main>

      <footer className="dashboard-note">
        <p>
          Showing <strong>{timeframe}</strong> forecast for number of patients (mocked data).
        </p>
      </footer>
    </div>
  );
}
