import sys
import os

sys.path.append(os.path.abspath('.'))

from src.core.database import get_db, SessionLocal
from src.core.security import get_password_hash
from src.models import User, RoleEnum

def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            print("Admin user already exists.")
            return

        hashed_password = get_password_hash("1234")
        
        new_admin = User(
            username="admin", 
            password_hash=hashed_password, 
            role=RoleEnum.ADMIN
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print(f"Successfully created admin user with id: {new_admin.id}")
        
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
