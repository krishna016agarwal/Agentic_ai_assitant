import random
import re

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from config.settings import settings
from database.models import Base, Employee, Account, Transaction, KYC

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)


# --------------------------------------------------
# Create Database + Demo Data
# --------------------------------------------------

def create_database():

    Base.metadata.create_all(engine)

    db = SessionLocal()

    employee = db.query(Employee).filter(
        Employee.employee_id == "EMP001"
    ).first()

    if employee is None:

        employee = Employee(
            employee_id="EMP001",
            name="Krishna Agarwal",
            email="krishna@gmail.com",
            phone="9876543210",
            address="Delhi",
            department="AI Team",
            designation="AI Intern",
            status="Active"
        )

        db.add(employee)
        db.commit()

        account = Account(
            account_number="1234567890",
            account_type="Savings",
            balance=25000,
            account_status="Active",
            employee_id="EMP001"
        )

        db.add(account)

        db.add_all([
            Transaction(
                transaction_id="TXN001",
                amount=500,
                transaction_type="Debit",
                status="Success",
                description="Amazon",
                employee_id="EMP001"
            ),
            Transaction(
                transaction_id="TXN002",
                amount=1200,
                transaction_type="Credit",
                status="Success",
                description="Salary",
                employee_id="EMP001"
            ),
            Transaction(
                transaction_id="TXN003",
                amount=700,
                transaction_type="Debit",
                status="Failed",
                description="UPI Payment",
                employee_id="EMP001"
            )
        ])

        db.add(
            KYC(
                aadhaar="987654321098",
                pan="ABCDE1234F",
                kyc_status="Completed",
                employee_id="EMP001"
            )
        )

        db.commit()

    db.close()


# --------------------------------------------------
# Database Tool
# --------------------------------------------------

async def database_tool(entity, operation, question):

    db = SessionLocal()

    employee_id = "EMP001"

    try:

        # -------------------------
        # CUSTOMER
        # -------------------------

        if entity == "customer":

            employee = db.query(Employee).filter(
                Employee.employee_id == employee_id
            ).first()

            if employee is None:
                return {
                    "success": False,
                    "error": "Employee not found"
                }

            # READ
            if operation == "read":

                return {
    "success": True,
    "data": {
        "employee_id": employee.employee_id,
        "name": employee.name,
        "email": employee.email,
        "phone": employee.phone,
        "address": employee.address,
        "department": employee.department,
        "designation": employee.designation,
        "status": employee.status
    }
}

            # UPDATE
            elif operation == "update":

                q = question.lower()

                updates = {}

                if "address" in q:

                    value = question.split("to")[-1].strip()

                    employee.address = value

                    updates["address"] = value

                elif "phone" in q:

                    phone = re.findall(r"\d{10}", question)

                    if phone:

                        employee.phone = phone[0]

                        updates["phone"] = phone[0]

                elif "email" in q:

                    email = re.findall(
                        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
                        question
                    )

                    if email:

                        employee.email = email[0]

                        updates["email"] = email[0]

                elif "name" in q:

                    value = question.split("to")[-1].strip()

                    employee.name = value

                    updates["name"] = value

                db.commit()

                return {
                    "success": True,
                    "message": "Employee updated successfully.",
                    "updated_fields": updates
                }

        # -------------------------
        # ACCOUNT
        # -------------------------

        elif entity == "account":

            if operation == "read":

                accounts = db.query(Account).filter(
                    Account.employee_id == employee_id
                ).all()

                data = []

                for acc in accounts:

                    data.append({
                        "account_number": acc.account_number,
                        "account_type": acc.account_type,
                        "balance": acc.balance,
                        "status": acc.account_status
                    })

                return {
                    "success": True,
                    "data": data
                }

            elif operation == "create":

                account = Account(

                    account_number=str(
                        random.randint(
                            1000000000,
                            9999999999
                        )
                    ),

                    account_type="Savings",

                    balance=0,

                    account_status="Active",

                    employee_id=employee_id
                )

                db.add(account)

                db.commit()

                return {
                    "success": True,
                    "message": "Savings account created successfully.",
                    "account_number": account.account_number
                }

        # -------------------------
        # TRANSACTIONS
        # -------------------------

        elif entity == "transaction":

            txns = db.query(Transaction).filter(
                Transaction.employee_id == employee_id
            ).all()

            data = []

            for txn in txns:

                data.append({
                    "transaction_id": txn.transaction_id,
                    "amount": txn.amount,
                    "type": txn.transaction_type,
                    "status": txn.status,
                    "description": txn.description
                })

            return {
                "success": True,
                "data": data
            }

        # -------------------------
        # KYC
        # -------------------------

        elif entity == "kyc":

            kyc = db.query(KYC).filter(
                KYC.employee_id == employee_id
            ).first()

            if kyc is None:

                return {
                    "success": False,
                    "error": "KYC not found"
                }

            return {
                "success": True,
                "data": {
                    "aadhaar": kyc.aadhaar,
                    "pan": kyc.pan,
                    "kyc_status": kyc.kyc_status
                }
            }

        return {
            "success": False,
            "error": "Unsupported operation."
        }

    finally:

        db.close()


if __name__ == "__main__":

    create_database()

    print("Database Created Successfully.")