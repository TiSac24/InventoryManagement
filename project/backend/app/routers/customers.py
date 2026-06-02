from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.schemas import CustomerCreate, CustomerResponse
from app.services.services import (
    create_customer, get_customers, get_customer, delete_customer
)

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=CustomerResponse, status_code=201)
def create(data: CustomerCreate, db: Session = Depends(get_db)):
    return create_customer(db, data)


@router.get("", response_model=List[CustomerResponse])
def list_all(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_customers(db, skip, limit)


@router.get("/{customer_id}", response_model=CustomerResponse)
def retrieve(customer_id: int, db: Session = Depends(get_db)):
    return get_customer(db, customer_id)


@router.delete("/{customer_id}", status_code=204)
def destroy(customer_id: int, db: Session = Depends(get_db)):
    delete_customer(db, customer_id)
