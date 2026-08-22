import sys
import os

# Add the backend root directory to the python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.core.database import SessionLocal
from src.core.security import get_password_hash
from src.models import User, RoleEnum

def create_admin():
    print("--- Drishti AI Local Admin Setup ---")
    username = input("Enter admin username: ")
    password = input("Enter admin password: ")

    if not username or not password:
        print("Username and password are required.")
        sys.exit(1)

    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists. Updating role to Admin...")
            existing_user.role = RoleEnum.ADMIN
            existing_user.password_hash = get_password_hash(password)
        else:
            print(f"Creating new Admin user '{username}'...")
            hashed_password = get_password_hash(password)
            new_user = User(
                username=username,
                password_hash=hashed_password,
                role=RoleEnum.ADMIN
            )
            db.add(new_user)
        
        db.commit()
        print(f"Successfully configured '{username}' as Admin.")
    except Exception as e:
        print(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
