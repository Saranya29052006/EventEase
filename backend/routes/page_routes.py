from flask import Blueprint, render_template

page_bp = Blueprint('pages', __name__)

@page_bp.route('/')
def index():
    return render_template('index.html')

@page_bp.route('/login')
def login():
    return render_template('login.html')

@page_bp.route('/register')
def register():
    return render_template('register.html')

@page_bp.route('/event')
def event():
    return render_template('event.html')

@page_bp.route('/booking')
def booking():
    return render_template('booking.html')

@page_bp.route('/mybookings')
def mybookings():
    return render_template('mybookings.html')

@page_bp.route('/admin')
def admin():
    return render_template('admin.html')