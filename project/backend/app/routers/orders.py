from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.schemas import OrderCreate, OrderResponse
from app.services.services import (
    create_order, get_orders, get_order, delete_order
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=201)
def create(data: OrderCreate, db: Session = Depends(get_db)):
    return create_order(db, data)


@router.get("", response_model=List[OrderResponse])
def list_all(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_orders(db, skip, limit)


@router.get("/{order_id}", response_model=OrderResponse)
def retrieve(order_id: int, db: Session = Depends(get_db)):
    return get_order(db, order_id)


@router.delete("/{order_id}", status_code=204)
def destroy(order_id: int, db: Session = Depends(get_db)):
    delete_order(db, order_id)
