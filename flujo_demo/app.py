import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Depends, status, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from models import db, User, Category, CashFlow, ProyeccionLinea

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create SQLAlchemy engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI app
app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models (simplified for example)
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    hashed_password: str

# Authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Here you would fetch the user from the database
    # user = get_user(db, username=username)
    # if user is None:
    #     raise credentials_exception
    # return user
    return {"username": username}  # Simplified for now

@app.get("/")
def root():
    return {"message": "Grupo 11 Flujo FastAPI backend is running."}

@app.get("/index")
def index(request: Request, db: Session = Depends(get_db)):
    if 'user_id' not in request.session:
        return RedirectResponse(url="/login", status_code=302)
@app.route('/', methods=['GET'])
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user = User.query.get(session['user_id'])
    cash_flows = CashFlow.query.filter_by(user_id=user.id).order_by(CashFlow.date.desc()).all()
    categories = Category.query.filter_by(user_id=user.id).all()
    
    return render_template_string('''
    <h2>Cash Flow Management</h2>
    <a href="{{ url_for('add_cash_flow') }}">Add New Transaction</a> |
    <a href="{{ url_for('add_category') }}">Add Category</a> |
    <a href="{{ url_for('logout') }}">Logout</a>
    
    <h3>Recent Transactions</h3>
    <table border="1">
        <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Description</th>
        </tr>
        {% for cf in cash_flows %}
        <tr>
            <td>{{ cf.date }}</td>
            <td>{{ cf.type }}</td>
            <td>{{ cf.category.name }}</td>
            <td>{{ cf.amount }}</td>
            <td>{{ cf.description }}</td>
        </tr>
        {% endfor %}
    </table>
    ''', cash_flows=cash_flows, categories=categories)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            return redirect(url_for('index'))
        flash('Invalid username or password')
    return render_template_string('''
    <h2>Login</h2>
    <form method="post">
        Username: <input type="text" name="username" required><br>
        Password: <input type="password" name="password" required><br>
        <input type="submit" value="Login">
    </form>
    <a href="{{ url_for('register') }}">Register</a>
    ''')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('register'))
        
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        return redirect(url_for('login'))
    
    return render_template_string('''
    <h2>Register</h2>
    <form method="post">
        Username: <input type="text" name="username" required><br>
        Email: <input type="email" name="email" required><br>
        Password: <input type="password" name="password" required><br>
        <input type="submit" value="Register">
    </form>
    <a href="{{ url_for('login') }}">Login</a>
    ''')

@app.route('/add_cash_flow', methods=['GET', 'POST'])
def add_cash_flow():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        amount = float(request.form['amount'])
        description = request.form['description']
        date = datetime.strptime(request.form['date'], '%Y-%m-%d').date()
        type = request.form['type']
        category_id = int(request.form['category_id'])
        
        cash_flow = CashFlow(
            amount=amount,
            description=description,
            date=date,
            type=type,
            user_id=session['user_id'],
            category_id=category_id
        )
        db.session.add(cash_flow)
        db.session.commit()
        return redirect(url_for('index'))
    
    categories = Category.query.filter_by(user_id=session['user_id']).all()
    return render_template_string('''
    <h2>Add Transaction</h2>
    <form method="post">
        Amount: <input type="number" step="0.01" name="amount" required><br>
        Description: <input type="text" name="description"><br>
        Date: <input type="date" name="date" required><br>
        Type: <select name="type" required>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
        </select><br>
        Category: <select name="category_id" required>
            {% for category in categories %}
            <option value="{{ category.id }}">{{ category.name }}</option>
            {% endfor %}
        </select><br>
        <input type="submit" value="Add Transaction">
    </form>
    ''', categories=categories)

@app.route('/add_category', methods=['GET', 'POST'])
def add_category():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        name = request.form['name']
        type = request.form['type']
        
        category = Category(
            name=name,
            type=type,
            user_id=session['user_id']
        )
        db.session.add(category)
        db.session.commit()
        return redirect(url_for('index'))
    
    return render_template_string('''
    <h2>Add Category</h2>
    <form method="post">
        Name: <input type="text" name="name" required><br>
        Type: <select name="type" required>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
        </select><br>
        <input type="submit" value="Add Category">
    </form>
    ''')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/add_projection', methods=['GET', 'POST'])
def add_projection():
    if request.method == 'POST':
        fecha = request.form['fecha']
        utilizado = int(request.form['utilizado'])
        fase2 = int(request.form['linea_credito_fase2'])
        fase3 = int(request.form['linea_credito_fase3'])
        disponible = int(request.form['disponible'])

        proy = ProyeccionLinea(
            fecha=fecha,
            utilizado=utilizado,
            linea_credito_fase2=fase2,
            linea_credito_fase3=fase3,
            disponible=disponible
        )
        db.session.add(proy)
        db.session.commit()
        return redirect(url_for('add_projection'))

    return render_template_string('''
    <h2>Add Credit Line Projection</h2>
    <form method="post">
        Month (YYYY-MM-01): <input type="date" name="fecha" required><br>
        Utilizado: <input type="number" name="utilizado" required><br>
        Linea de credito fase 2: <input type="number" name="linea_credito_fase2" required><br>
        Linea de credito fase 3: <input type="number" name="linea_credito_fase3" required><br>
        Disponible: <input type="number" name="disponible" required><br>
        <input type="submit" value="Add">
    </form>
    ''')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 