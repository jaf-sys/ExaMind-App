from config import app, db
from models import User, Room, RoomMember, Quiz, Question, Attempt, CheatingLog

from routes.auth import auth_bp
from routes.room import room_bp
from routes.quiz import quiz_bp
from routes.question import question_bp
from routes.attempt import attempt_bp
from routes.cheat import cheat_bp
from routes.ai import ai_bp
from routes.analytics import analytics_bp


app.register_blueprint(auth_bp)
app.register_blueprint(room_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(question_bp)
app.register_blueprint(attempt_bp)
app.register_blueprint(cheat_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(analytics_bp)

if __name__ == "__main__":
    with app.app_context():
        # Create all database tables
        db.create_all()
        
    app.run(
        debug=app.config["DEBUG"],
        host="0.0.0.0",
        port=5000
    )