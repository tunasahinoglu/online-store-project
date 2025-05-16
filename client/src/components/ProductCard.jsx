function Card() {
    return (
        <div className="card" style={{ border: '1px solid red' }}>
            <img src="https://via.placeholder.com/150" alt="Product" />
            <h3>Product Name</h3>
            <p>Price: $10.00</p>
            <button>Add to Cart</button>
        </div>
    );
}

export default Card;