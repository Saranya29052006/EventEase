from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
from datetime import datetime, timezone
import cloudinary.uploader
from functools import wraps
import jwt
from config import JWT_SECRET

event_bp = Blueprint('events', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'message': 'Token missing'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user = data
        except:
            return jsonify({'message': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

def serialize_event(event):
    event['_id'] = str(event['_id'])
    if 'created_at' in event:
        event['created_at'] = str(event['created_at'])
    if isinstance(event.get('date'), datetime):
        event['date'] = event['date'].isoformat()
    return event

@event_bp.route('/', methods=['GET'])
def get_events():
    try:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        expired = mongo.db.events.find({'date': {'$lt': today}})
        for ev in expired:
            mongo.db.bookings.delete_many({'eventId': ev['_id']})
            mongo.db.events.delete_one({'_id': ev['_id']})
        events = list(mongo.db.events.find({'date': {'$gte': today}}))
        return jsonify([serialize_event(e) for e in events]), 200
    except Exception as e:
        print('Get events error:', e)
        return jsonify({'message': str(e)}), 500

@event_bp.route('/<id>', methods=['GET'])
def get_event(id):
    try:
        event = mongo.db.events.find_one({'_id': ObjectId(id)})
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        if isinstance(event.get('date'), datetime):
            event_date = event['date'].replace(tzinfo=timezone.utc) if event['date'].tzinfo is None else event['date']
            if event_date < today:
                mongo.db.bookings.delete_many({'eventId': event['_id']})
                mongo.db.events.delete_one({'_id': event['_id']})
                return jsonify({'message': 'Event has expired'}), 404
        return jsonify(serialize_event(event)), 200
    except Exception as e:
        print('Get event error:', e)
        return jsonify({'message': str(e)}), 500

@event_bp.route('', methods=['POST'])
@event_bp.route('/', methods=['POST'])
@token_required
def add_event():
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'message': 'Access denied'}), 403

        image_url = ''

        if request.content_type and 'multipart/form-data' in request.content_type:
            if 'image' in request.files:
                file = request.files['image']
                upload_result = cloudinary.uploader.upload(file)
                image_url = upload_result.get('secure_url', '')
            data = request.form
        else:
            data = request.get_json(force=True)

        date_str = data.get('date')
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')

        event = {
            'title': data.get('title'),
            'description': data.get('description'),
            'date': date_obj,
            'time': data.get('time'),
            'venue': data.get('venue'),
            'category': data.get('category'),
            'totalSeats': int(data.get('totalSeats', 0)),
            'availableSeats': int(data.get('availableSeats', 0)),
            'price': float(data.get('price', 0)),
            'image': image_url,
            'created_at': datetime.utcnow()
        }
        mongo.db.events.insert_one(event)
        return jsonify(serialize_event(event)), 201
    except Exception as e:
        print('Add event error:', e)
        return jsonify({'message': str(e)}), 500

@event_bp.route('/<id>', methods=['PUT'])
@token_required
def update_event(id):
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'message': 'Access denied'}), 403
        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            upload_result = cloudinary.uploader.upload(file)
            image_url = upload_result.get('secure_url', '')
            data = request.form
        else:
            data = request.get_json()
        update_data = {
            'title': data.get('title'),
            'description': data.get('description'),
            'time': data.get('time'),
            'venue': data.get('venue'),
            'category': data.get('category'),
            'price': float(data.get('price', 0)),
            'availableSeats': int(data.get('availableSeats', 0))
        }
        if data.get('date'):
            update_data['date'] = datetime.strptime(data.get('date'), '%Y-%m-%d')
        if image_url:
            update_data['image'] = image_url
        mongo.db.events.update_one({'_id': ObjectId(id)}, {'$set': update_data})
        event = mongo.db.events.find_one({'_id': ObjectId(id)})
        return jsonify(serialize_event(event)), 200
    except Exception as e:
        print('Update event error:', e)
        return jsonify({'message': str(e)}), 500

@event_bp.route('/<id>', methods=['DELETE'])
@token_required
def delete_event(id):
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'message': 'Access denied'}), 403
        mongo.db.bookings.delete_many({'eventId': ObjectId(id)})
        mongo.db.events.delete_one({'_id': ObjectId(id)})
        return jsonify({'message': 'Event deleted'}), 200
    except Exception as e:
        print('Delete event error:', e)
        return jsonify({'message': str(e)}), 500