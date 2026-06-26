from flask import Blueprint, request, jsonify
from extensions import mongo
from bson import ObjectId
from datetime import datetime
from functools import wraps
import jwt
import random
import string
from config import JWT_SECRET

booking_bp = Blueprint('bookings', __name__)

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

def serialize_booking(booking, event=None, user=None):
    booking['_id'] = str(booking['_id'])
    booking['userId'] = str(booking['userId'])
    booking['eventId'] = str(booking['eventId'])
    if 'created_at' in booking:
        booking['created_at'] = str(booking['created_at'])
    if event:
        event['_id'] = str(event['_id'])
        if isinstance(event.get('date'), datetime):
            event['date'] = event['date'].isoformat()
        booking['eventId'] = event
    if user:
        booking['userId'] = {
            'name': user.get('name'),
            'email': user.get('email')
        }
    return booking

@booking_bp.route('/', methods=['POST'])
@token_required
def book_ticket():
    try:
        data = request.get_json()
        event_id = data.get('eventId')
        ticket_count = int(data.get('ticketCount', 1))
        event = mongo.db.events.find_one({'_id': ObjectId(event_id)})
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        if event['availableSeats'] < ticket_count:
            return jsonify({'message': 'Not enough seats available'}), 400
        total_price = event['price'] * ticket_count
        suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        booking_id = f"BK-{int(datetime.utcnow().timestamp() * 1000)}-{suffix}"
        booking = {
            'userId': ObjectId(request.user['userId']),
            'eventId': ObjectId(event_id),
            'ticketCount': ticket_count,
            'totalPrice': total_price,
            'bookingId': booking_id,
            'status': 'confirmed',
            'created_at': datetime.utcnow()
        }
        mongo.db.bookings.insert_one(booking)
        mongo.db.events.update_one(
            {'_id': ObjectId(event_id)},
            {'$inc': {'availableSeats': -ticket_count}}
        )
        booking['_id'] = str(booking['_id'])
        booking['userId'] = str(booking['userId'])
        booking['eventId'] = str(booking['eventId'])
        booking['created_at'] = str(booking['created_at'])
        return jsonify({'message': 'Booking confirmed!', 'booking': booking}), 201
    except Exception as e:
        print('Book ticket error:', e)
        return jsonify({'message': str(e)}), 500

@booking_bp.route('/mine', methods=['GET'])
@token_required
def get_my_bookings():
    try:
        bookings = list(mongo.db.bookings.find({'userId': ObjectId(request.user['userId'])}))
        result = []
        for b in bookings:
            event = mongo.db.events.find_one({'_id': b['eventId']})
            if event:
                result.append(serialize_booking(b, event))
            else:
                mongo.db.bookings.delete_one({'_id': b['_id']})
        return jsonify(result), 200
    except Exception as e:
        print('My bookings error:', e)
        return jsonify({'message': str(e)}), 500

@booking_bp.route('/all', methods=['GET'])
@token_required
def get_all_bookings():
    try:
        if request.user.get('role') != 'admin':
            return jsonify({'message': 'Access denied'}), 403
        bookings = list(mongo.db.bookings.find())
        result = []
        for b in bookings:
            event = mongo.db.events.find_one({'_id': b['eventId']})
            user = mongo.db.users.find_one({'_id': b['userId']})
            if event:
                result.append(serialize_booking(b, event, user))
            else:
                mongo.db.bookings.delete_one({'_id': b['_id']})
        return jsonify(result), 200
    except Exception as e:
        print('All bookings error:', e)
        return jsonify({'message': str(e)}), 500