from flask import Flask
from flask_cors import CORS
import cloudinary
import dns.resolver
from config import *
from extensions import mongo, bcrypt

dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4']

app = Flask(__name__)
app.url_map.strict_slashes = False
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

app.config["MONGO_URI"] = MONGO_URI
app.config["MONGO_CONNECT"] = False

mongo.init_app(app)
bcrypt.init_app(app)

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

from routes.auth_routes import auth_bp
from routes.event_routes import event_bp
from routes.booking_routes import booking_bp
from routes.page_routes import page_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(event_bp, url_prefix='/api/events')
app.register_blueprint(booking_bp, url_prefix='/api/bookings')
app.register_blueprint(page_bp)

if __name__ == '__main__':
    app.run(debug=True, port=5000)