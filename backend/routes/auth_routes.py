from flask import Blueprint, request, jsonify
from extensions import mongo, bcrypt
import jwt
import datetime
from config import JWT_SECRET

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')

        if not name or not email or not password:
            return jsonify({'message': 'All fields are required'}), 400

        existing_user = mongo.db.users.find_one({'email': email})
        if existing_user:
            return jsonify({'message': 'Email already registered'}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        user = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'role': 'user',
            'created_at': datetime.datetime.utcnow()
        }
        mongo.db.users.insert_one(user)

        return jsonify({'message': 'Registration successful'}), 201
    except Exception as e:
        print('Register error:', e)
        return jsonify({'message': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = mongo.db.users.find_one({'email': email})
        if not user:
            return jsonify({'message': 'Invalid email or password'}), 400

        if not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'message': 'Invalid email or password'}), 400

        token = jwt.encode({
            'userId': str(user['_id']),
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, JWT_SECRET, algorithm='HS256')

        return jsonify({
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    except Exception as e:
        print('Login error:', e)
        return jsonify({'message': str(e)}), 500