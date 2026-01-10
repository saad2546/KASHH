from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow frontend access

@app.route("/")
def health_check():
    return jsonify({"status": "Backend running"})


if __name__ == "__main__":
    app.run(debug=True)
