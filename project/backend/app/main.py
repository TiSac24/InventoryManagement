from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine
from app.models import models
from app.routers import products, customers, orders, dashboard

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

# Seed mock data if database is empty
from app.database.database import SessionLocal
def seed_data():
    db = SessionLocal()
    try:
        from app.models.models import Product, Customer, Order, OrderItem
        if db.query(Product).count() == 0:
            # Seed products
            products = [
                Product(name="MacBook Pro 16", sku="MAC-PRO-16", price=2499.99, stock_quantity=15),
                Product(name="iPhone 15 Pro", sku="IPHONE-15", price=999.99, stock_quantity=8),
                Product(name="Sony WH-1000XM5", sku="SONY-XM5", price=349.99, stock_quantity=2),
                Product(name="Mechanical Keyboard", sku="MECH-KEY", price=129.99, stock_quantity=0),
                Product(name="Logitech MX Master 3S", sku="MX-MASTER-3S", price=99.99, stock_quantity=24),
                Product(name="Dell UltraSharp 27", sku="DELL-U27", price=449.99, stock_quantity=12),
            ]
            db.add_all(products)
            db.commit()

            # Seed customers
            customers = [
                Customer(full_name="Sarah Connor", email="sarah@sky.net", phone="555-0199"),
                Customer(full_name="John Doe", email="john.doe@example.com", phone="555-0123"),
                Customer(full_name="Jane Smith", email="jane.smith@example.com", phone="555-0145"),
            ]
            db.add_all(customers)
            db.commit()

            # Seed orders
            p_mac = db.query(Product).filter(Product.sku == "MAC-PRO-16").first()
            p_iphone = db.query(Product).filter(Product.sku == "IPHONE-15").first()
            p_headphones = db.query(Product).filter(Product.sku == "SONY-XM5").first()
            p_mouse = db.query(Product).filter(Product.sku == "MX-MASTER-3S").first()

            c_sarah = db.query(Customer).filter(Customer.email == "sarah@sky.net").first()
            c_john = db.query(Customer).filter(Customer.email == "john.doe@example.com").first()

            order1 = Order(customer_id=c_sarah.id, total_amount=p_mac.price + p_mouse.price)
            db.add(order1)
            db.flush()
            db.add_all([
                OrderItem(order_id=order1.id, product_id=p_mac.id, quantity=1, unit_price=p_mac.price),
                OrderItem(order_id=order1.id, product_id=p_mouse.id, quantity=1, unit_price=p_mouse.price),
            ])

            order2 = Order(customer_id=c_john.id, total_amount=p_iphone.price + p_headphones.price * 2)
            db.add(order2)
            db.flush()
            db.add_all([
                OrderItem(order_id=order2.id, product_id=p_iphone.id, quantity=1, unit_price=p_iphone.price),
                OrderItem(order_id=order2.id, product_id=p_headphones.id, quantity=2, unit_price=p_headphones.price),
            ])

            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

seed_data()


app = FastAPI(
    title="Inventory & Order Management API",
    version="1.0.0",
    description="Production-ready REST API for managing products, customers, and orders.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
