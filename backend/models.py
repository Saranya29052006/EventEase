from bson import ObjectId
from datetime import datetime

def user_schema(name, email, password, role='user'):
    return {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
        'created_at': datetime.utcnow()
    }

def event_schema(data, image_url=''):
    return {
        'title': data.get('title'),
        'description': data.get('description'),
        'date': data.get('date'),
        'time': data.get('time'),
        'venue': data.get('venue'),
        'category': data.get('category'),
        'totalSeats': int(data.get('totalSeats', 0)),
        'availableSeats': int(data.get('availableSeats', 0)),
        'price': float(data.get('price', 0)),
        'image': image_url,
        'created_at': datetime.utcnow()
    }

def booking_schema(user_id, event_id, ticket_count, total_price, booking_id):
    return {
        'userId': ObjectId(user_id),
        'eventId': ObjectId(event_id),
        'ticketCount': ticket_count,
        'totalPrice': total_price,
        'bookingId': booking_id,
        'status': 'confirmed',
        'created_at': datetime.utcnow()
    }