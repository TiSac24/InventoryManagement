from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.models import Product, Customer, Order, OrderItem
from app.schemas.schemas import (
    ProductCreate, ProductUpdate,
    CustomerCreate,
    OrderCreate,
)


# ── Product services ──────────────────────────────────────────────────────────

def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"SKU '{data.sku}' already exists")
    return product


def get_products(db: Session, skip: int = 0, limit: int = 100) -> List[Product]:
    return db.query(Product).offset(skip).limit(limit).all()


def get_product(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def update_product(db: Session, product_id: int, data: ProductUpdate) -> Product:
    product = get_product(db, product_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"SKU '{data.sku}' already exists")
    return product


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()


# ── Customer services ─────────────────────────────────────────────────────────

def create_customer(db: Session, data: CustomerCreate) -> Customer:
    customer = Customer(**data.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail=f"Email '{data.email}' already exists")
    return customer


def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    return db.query(Customer).offset(skip).limit(limit).all()


def get_customer(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    db.delete(customer)
    db.commit()


# ── Order services ────────────────────────────────────────────────────────────

def create_order(db: Session, data: OrderCreate) -> Order:
    # Validate customer exists
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    total = Decimal("0.00")
    items_to_create = []

    # Validate stock and calculate total
    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=422,
                detail=f"Insufficient stock for '{product.name}'. "
                       f"Available: {product.stock_quantity}, Requested: {item.quantity}",
            )
        items_to_create.append((product, item.quantity, product.price))
        total += product.price * item.quantity

    order = Order(customer_id=data.customer_id, total_amount=total)
    db.add(order)
    db.flush()  # get order.id without committing

    for product, quantity, unit_price in items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
        )
        db.add(order_item)
        product.stock_quantity -= quantity

    db.commit()
    db.refresh(order)
    return order


def get_orders(db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_order(db: Session, order_id: int) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def delete_order(db: Session, order_id: int) -> None:
    order = get_order(db, order_id)
    # Restore stock
    for item in order.order_items:
        item.product.stock_quantity += item.quantity
    db.delete(order)
    db.commit()


# ── Dashboard service ─────────────────────────────────────────────────────────

def get_dashboard_stats(db: Session) -> dict:
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    from sqlalchemy import func
    revenue_row = db.query(func.sum(Order.total_amount)).scalar()
    total_revenue = revenue_row or Decimal("0.00")

    low_stock = (
        db.query(Product)
        .filter(Product.stock_quantity <= 10)
        .order_by(Product.stock_quantity.asc())
        .limit(10)
        .all()
    )

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "low_stock_products": low_stock,
    }
