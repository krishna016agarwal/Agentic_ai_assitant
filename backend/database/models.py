from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


# -----------------------------
# Employee / Customer
# -----------------------------
class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(String, primary_key=True)

    name = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(String)

    department = Column(String)
    designation = Column(String)
    status = Column(String)

    # Relationships
    accounts = relationship("Account", back_populates="employee")
    transactions = relationship("Transaction", back_populates="employee")
    kyc = relationship("KYC", uselist=False, back_populates="employee")


# -----------------------------
# Bank Accounts
# -----------------------------
class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)

    account_number = Column(String, unique=True)

    account_type = Column(String)        # Savings / Current

    balance = Column(Float, default=0)

    account_status = Column(String)      # Active / Closed

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id")
    )

    employee = relationship(
        "Employee",
        back_populates="accounts"
    )


# -----------------------------
# Transactions
# -----------------------------
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)

    transaction_id = Column(String, unique=True)

    amount = Column(Float)

    transaction_type = Column(String)    # Credit / Debit

    status = Column(String)              # Success / Failed

    description = Column(String)

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id")
    )

    employee = relationship(
        "Employee",
        back_populates="transactions"
    )


# -----------------------------
# KYC
# -----------------------------
class KYC(Base):
    __tablename__ = "kyc"

    id = Column(Integer, primary_key=True, autoincrement=True)

    aadhaar = Column(String)

    pan = Column(String)

    kyc_status = Column(String)

    employee_id = Column(
        String,
        ForeignKey("employees.employee_id"),
        unique=True
    )

    employee = relationship(
        "Employee",
        back_populates="kyc"
    )