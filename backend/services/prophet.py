import pandas as pd
from prophet import Prophet
from flask import jsonify


def resolve_horizon(horizon):
    # Only predicting for 7 days (168 hours)
    return 168


def predict_patient_flow(request):
    """
    CSV required columns:
    timestamp, inflow, outflow
    """
    try:
        file = request.files.get("file")

        if not file:
            return jsonify({"error": "No file provided"}), 400

        df = pd.read_csv(file)

        if not all(col in df.columns for col in ["timestamp", "inflow", "outflow"]):
            return jsonify({"error": "CSV must contain timestamp, inflow, outflow"}), 400

        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
        df = df.dropna(subset=["timestamp"])
        df = df.sort_values("timestamp")

        # Prophet works best with consistent frequency
        # We'll resample to hourly (you may skip this if CSV is already hourly)
        df = df.set_index("timestamp").resample("H").mean().interpolate().reset_index()

        periods = resolve_horizon("7d")  # fixed 168 hours (7d)

        def get_forecast(target_col: str, periods: int):
            m_df = df[["timestamp", target_col]].rename(
                columns={"timestamp": "ds", target_col: "y"}
            )

            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                interval_width=0.8,  # 80% confidence band
            )
            model.fit(m_df)

            future = model.make_future_dataframe(periods=periods, freq="H")
            forecast = model.predict(future)

            return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]

        inflow_fc = get_forecast("inflow", periods).tail(periods)
        outflow_fc = get_forecast("outflow", periods).tail(periods)

        # Combine both forecasts
        result = pd.DataFrame()
        result["timestamp"] = inflow_fc["ds"].dt.strftime("%Y-%m-%d %H:%M:%S")

        # Inflow prediction + band
        result["predicted_inflow"] = inflow_fc["yhat"].clip(lower=0)
        result["predicted_inflow_lower"] = inflow_fc["yhat_lower"].clip(lower=0)
        result["predicted_inflow_upper"] = inflow_fc["yhat_upper"].clip(lower=0)

        # Outflow prediction + band
        result["predicted_outflow"] = outflow_fc["yhat"].clip(lower=0).values
        result["predicted_outflow_lower"] = outflow_fc["yhat_lower"].clip(lower=0).values
        result["predicted_outflow_upper"] = outflow_fc["yhat_upper"].clip(lower=0).values

        return jsonify(result.to_dict(orient="records"))

    except Exception as e:
        return jsonify({"error": str(e)}), 500
