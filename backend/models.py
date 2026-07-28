from config import db
from datetime import datetime

class User(db.Model):
    __tablename__ = "users"
    
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)  
    role = db.Column(db.String(20), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    rooms = db.relationship('RoomMember', backref='user', lazy=True)
    quizzes_created = db.relationship('Quiz', backref='creator', lazy=True)
    attempts = db.relationship('Attempt', backref='user', lazy=True)

class Room(db.Model):
    __tablename__ = "rooms"
    __table_args__ = {'extend_existing': True}
    
    room_id = db.Column(db.Integer, primary_key=True)
    room_name = db.Column(db.String(100), nullable=False)
    join_code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    is_active = db.Column(db.Boolean, default=True)
    
    members = db.relationship('RoomMember', backref='room', lazy=True, cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='room', lazy=True)

class RoomMember(db.Model):
    __tablename__ = "room_members"
    __table_args__ = (
        db.UniqueConstraint('room_id', 'user_id', name='unique_room_user'),  
        {'extend_existing': True}
    )
    
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.room_id", ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  
    joined_at = db.Column(db.DateTime, default=datetime.now)

class Quiz(db.Model):
    __tablename__ = "quiz"
    __table_args__ = {'extend_existing': True}
    
    quiz_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)  
    time_limit = db.Column(db.Integer, nullable=False, default=30)  
    room_id = db.Column(db.Integer, db.ForeignKey("rooms.room_id", ondelete='SET NULL'), nullable=True)
    is_self_assessment = db.Column(db.Boolean, default=False, index=True)
    topic = db.Column(db.String(100))
    attempts_allowed = db.Column(db.Integer, nullable=True, default=1)
    difficulty = db.Column(db.String(50))
    created_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    publish_at = db.Column(db.DateTime, nullable=True)
    start_time = db.Column(db.DateTime, nullable=True)
    end_time = db.Column(db.DateTime, nullable=True)
    is_published = db.Column(db.Boolean, default=False, index=True) 
    total_questions = db.Column(db.Integer, default=0)
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade='all, delete-orphan')
    attempts = db.relationship('Attempt', backref='quiz', lazy=True)

class Question(db.Model):
    __tablename__ = "questions"
    __table_args__ = {'extend_existing': True}
    
    question_id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.quiz_id", ondelete='CASCADE'), nullable=False, index=True)
    question_text = db.Column(db.String(500), nullable=False)
    question_image = db.Column(db.String(1000), nullable=True)
    code_snippet = db.Column(db.Text, nullable=True)
    language = db.Column(db.String(50), nullable=True)
    option_a = db.Column(db.String(500), nullable=False)
    option_a_image = db.Column(db.String(1000), nullable=True)
    option_b = db.Column(db.String(500), nullable=False)
    option_b_image = db.Column(db.String(1000), nullable=True)
    option_c = db.Column(db.String(500), nullable=False)
    option_c_image = db.Column(db.String(1000), nullable=True)
    option_d = db.Column(db.String(500), nullable=False)
    option_d_image = db.Column(db.String(1000), nullable=True)
    correct_option = db.Column(db.String(1), nullable=False)  
    source = db.Column(db.String(20), default="manual") 
    created_at = db.Column(db.DateTime, default=datetime.now)
 
    __table_args__ = (
        db.Index('idx_quiz_question', 'quiz_id', 'question_id'),
    )

class QuestionFeedback(db.Model):
    __tablename__ = "question_feedback"
    __table_args__ = {'extend_existing': True}
    
    feedback_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.question_id", ondelete='CASCADE'), nullable=False, index=True)
    explanation = db.Column(db.Text, nullable=True)
    learning_resource = db.Column(db.Text, nullable=True)
    difficulty_rating = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    question = db.relationship('Question', backref='feedback')

class Attempt(db.Model):
    __tablename__ = "attempts"
    __table_args__ = {'extend_existing': True}
    
    attempt_id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.quiz_id", ondelete='CASCADE'),nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False, default=0)
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    start_time = db.Column(db.DateTime, default=datetime.now)
    end_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='in_progress') 

    cheat_logs = db.relationship('CheatingLog', backref='attempt', lazy=True, cascade='all, delete-orphan')

    __table_args__ = (
        db.Index('idx_user_quiz_attempt', 'user_id', 'quiz_id', 'start_time'),
    )
    
class AttemptQuestion(db.Model):
    __tablename__ = "attempt_questions"
    __table_args__ = (
        db.UniqueConstraint('attempt_id', 'question_id', name='unique_attempt_question_per_attempt'),
        db.Index('idx_attempt_question', 'attempt_id', 'question_id'),
        {'extend_existing': True}
    )
    
    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("attempts.attempt_id", ondelete='CASCADE'), nullable=False, index=True)
    question_id = db.Column(db.Integer, db.ForeignKey("questions.question_id"), nullable=False)
    display_order = db.Column(db.Integer, nullable=False) 

    option_a_original_index = db.Column(db.Integer, nullable=False) 
    option_b_original_index = db.Column(db.Integer, nullable=False)  
    option_c_original_index = db.Column(db.Integer, nullable=False)  
    option_d_original_index = db.Column(db.Integer, nullable=False) 

    attempt = db.relationship('Attempt', backref=db.backref('randomized_questions', lazy=True, cascade='all, delete-orphan'))
    question = db.relationship('Question')
    
    def get_option_mapping(self):
        return {
            'A': chr(65 + self.option_a_original_index),
            'B': chr(65 + self.option_b_original_index),
            'C': chr(65 + self.option_c_original_index),
            'D': chr(65 + self.option_d_original_index)
        }
    
    def get_reverse_mapping(self):
        mapping = self.get_option_mapping()
        return {v: k for k, v in mapping.items()}

class CheatingLog(db.Model):
    __tablename__ = "cheating_logs"
    __table_args__ = {'extend_existing': True}
    
    log_id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey("attempts.attempt_id", ondelete='CASCADE'), nullable=False, index=True)
    event_type = db.Column(db.String(50), nullable=False, index=True)  
    timestamp = db.Column(db.DateTime, default=datetime.now)
    
    __table_args__ = (
        db.Index('idx_attempt_event', 'attempt_id', 'event_type'),
    )