import React from 'react';
import { useParams } from 'react-router-dom';
import './product_detail.css'; 

// Temp database
const products = {
    1: {
        name: "iPhone 15",
        category: "Electronics",
        subcategory: "Smartphones",
        serialnumber: "test",
        price: 1000,
        discount: 10,
        stock: 50,
        description: "test",
        warranty: 12, 
        distributername: "Apple",
        comments: ["comment1", "comment2"],
        features: {
            test: "test",
        },
        image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111339_sp818-mbp13touch-space-select-202005.png",
    },
    2: {
        name: "MacBook Pro",
        category: "Electronics",
        subcategory: "Laptops",
        serialnumber: "test",
        price: 2000,
        discount: 5,
        stock: 30,
        description: "test",
        warranty: 12, 
        distributername: "Apple",
        comments: ["comment1", "comment2"],
        features: {
            test: "test",
        },
        image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111339_sp818-mbp13touch-space-select-202005.png",
    },
    3: {
        name: "Samsung Galaxy S23",
        category: "Electronics",
        subcategory: "Smartphones",
        serialnumber: "test",
        price: 2000,
        discount: 5,
        stock: 0,
        description: "test",
        warranty: 12, 
        distributername: "Samsung",
        comments: ["comment1", "comment2"],
        features: {
            test: "test",
        },
        image: "https://cdsassets.apple.com/live/SZLF0YNV/images/sp/111339_sp818-mbp13touch-space-select-202005.png",
    },
};

function ProductDetail() {
    const { id } = useParams();
    const product = products[id];

    const discountedPrice = product.price - (product.price * product.discount) / 100;

    return (
        <div className="product-detail-container">
            <div className="product-detail">
                <div className="product-image">
                    <img src={product.image} alt={product.name} />
                </div>
                <div className="product-info">
                    <h1>{product.name}</h1>
                    <div className="category">
                        <span>{product.category} &gt; {product.subcategory}</span>
                    </div>
                    <div className="price">
                        <span className="original-price">${product.price}</span>
                        <span className="discounted-price">${discountedPrice.toFixed(2)}</span>
                        <span className="discount">({product.discount}% off)</span>
                    </div>
                    <p className="description">{product.description}</p>
                    <div className="stock">
                        {product.stock > 0 ? (
                            <span className="in-stock">In Stock</span>
                        ) : (
                            <span className="out-of-stock">Out of Stock</span>
                        )}
                    </div>
                    <div className="warranty">
                        <span>Warranty: {product.warranty === -1 ? "Lifetime" : `${product.warranty} months`}</span>
                    </div>
                    <div className="distributor">
                        <span>Sold by: {product.distributername}</span>
                    </div>
                    <button className="add-to-cart">Add to Cart</button>
                    <button className="buy-now">Buy Now</button>
                </div>
            </div>

            <div className="product-specifications">
                <h2>Features</h2>
                <ul>
                    {Object.entries(product.features).map(([key, value]) => (
                        <li key={key}>
                            <strong>{key}:</strong> {value}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="product-comments">
                <h2>Comments</h2>
                <ul>
                    {product.comments.map((comment, index) => (
                        <li key={index}>{comment}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default ProductDetail;