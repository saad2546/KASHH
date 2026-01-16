import time
import os
from datetime import datetime, timedelta
from flask import jsonify

from google import genai
from google.genai import types
from google.api_core import exceptions


def _rule_based_inventory_insights(hospital_name: str, inventory: list):
    """
    Fallback insights when Gemini quota is exhausted.
    Generates deterministic, rule-based bullet points.
    """

    now = datetime.now()
    soon_cutoff = now + timedelta(days=30)

    urgent_restock = []
    low_stock = []
    expiry_risk = []

    for item in inventory:
        name = str(item.get("name", "Unknown"))
        stock = float(item.get("stock") or 0)
        min_stock = float(item.get("min_stock") or 0)
        unit = item.get("unit") or "units"
        expiry_date = item.get("expiry_date")

        # Restock checks
        if stock <= min_stock:
            reorder_qty = max(int(min_stock * 2 - stock), int(min_stock))
            urgent_restock.append((name, stock, min_stock, reorder_qty, unit))
        elif stock <= min_stock * 1.25:
            low_stock.append((name, stock, min_stock, unit))

        # Expiry checks
        if expiry_date:
            try:
                exp = datetime.fromisoformat(expiry_date)
                if now <= exp <= soon_cutoff:
                    days_left = (exp - now).days
                    expiry_risk.append((name, expiry_date, days_left))
            except Exception:
                pass

    insights = []

    # Urgent restock
    if urgent_restock:
        urgent_restock.sort(key=lambda x: (x[1] - x[2]))  # most negative shortage first
        insights.append("Urgent Restock Required:")
        for name, stock, min_stock, reorder_qty, unit in urgent_restock[:5]:
            insights.append(
                f"- {name}: Stock {int(stock)} ≤ Min {int(min_stock)} → reorder ~{reorder_qty} {unit}"
            )
    else:
        insights.append("No medicines currently below minimum stock threshold.")

    # Low stock warning
    if low_stock:
        insights.append("Low Stock Watchlist:")
        for name, stock, min_stock, unit in low_stock[:5]:
            insights.append(
                f"- {name}: Stock {int(stock)} nearing minimum ({int(min_stock)} {unit})"
            )

    # Expiry risk
    if expiry_risk:
        expiry_risk.sort(key=lambda x: x[2])  # soonest expiry first
        insights.append("Expiry Risk (≤30 days):")
        for name, exp, days_left in expiry_risk[:5]:
            insights.append(f"- {name}: expires on {exp} ({days_left} days left)")
    else:
        insights.append("No medicines expiring within the next 30 days.")

    insights.append("Tip: Review min_stock based on weekly emergency load and supplier lead time.")

    return insights


def generate_inventory_insights(request):
    """
    POST BODY:
    {
      "hospital_id": "....",
      "hospital_name": "City General Hospital",
      "inventory": [ ... ]
    }
    """

    try:
        data = request.get_json(silent=True) or {}
        hospital_name = data.get("hospital_name", "Hospital")
        inventory = data.get("inventory", [])

        if not inventory:
            return jsonify({"error": "No inventory provided"}), 400

        # Load Gemini key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            # If key missing, fallback too (better UX)
            fallback = _rule_based_inventory_insights(hospital_name, inventory)
            return jsonify({"insights": fallback, "fallback": True}), 200

        client = genai.Client(api_key=api_key)

        prompt = f"""
You are a hospital pharmacy inventory AI assistant.

Hospital: {hospital_name}

Your task:
1) Identify top medicines requiring urgent restocking (stock <= min_stock)
2) Suggest reorder quantities
3) Highlight expiry risks (expiring within 30 days)

Return concise bullet points.

Inventory JSON:
{inventory}
"""

        max_retries = 3
        base_delay = 2
        response_text = ""

        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-pro",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=300,
                    ),
                )
                response_text = response.text
                break

            except Exception as e:
                # RESOURCE_EXHAUSTED / 429 → fallback immediately (no logs)
                is_rate_limit = (
                    isinstance(e, exceptions.ResourceExhausted)
                    or "RESOURCE_EXHAUSTED" in str(e)
                    or "429" in str(e)
                )

                if is_rate_limit:
                    fallback = _rule_based_inventory_insights(hospital_name, inventory)
                    return jsonify({"insights": fallback, "fallback": True}), 200

                # Other errors: retry a couple times, then fail
                if attempt < max_retries - 1:
                    time.sleep(base_delay * (2 ** attempt))  # 2s, 4s
                    continue
                raise e

        text = (response_text or "").strip()

        if not text:
            fallback = _rule_based_inventory_insights(hospital_name, inventory)
            return jsonify({"insights": fallback, "fallback": True}), 200

        insights = [
            line.strip("-• ").strip()
            for line in text.split("\n")
            if line.strip()
        ]

        return jsonify({"insights": insights, "fallback": False}), 200

    except Exception:
        # If something unexpected happens, return fallback instead of 500.
        try:
            data = request.get_json(silent=True) or {}
            hospital_name = data.get("hospital_name", "Hospital")
            inventory = data.get("inventory", [])
            fallback = _rule_based_inventory_insights(hospital_name, inventory)
            return jsonify({"insights": fallback, "fallback": True}), 200
        except Exception:
            return jsonify({"error": "Failed to generate insights"}), 500
