from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.services.services import (
    create_product, get_products, get_product, update_product, delete_product
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductResponse, status_code=201)
def create(data: ProductCreate, db: Session = Depends(get_db)):
    return create_product(db, data)


@router.get("", response_model=List[ProductResponse])
def list_all(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_products(db, skip, limit)


@router.get("/{product_id}", response_model=ProductResponse)
def retrieve(product_id: int, db: Session = Depends(get_db)):
    return get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    return update_product(db, product_id, data)


@router.delete("/{product_id}", status_code=204)
def destroy(product_id: int, db: Session = Depends(get_db)):
    delete_product(db, product_id)
