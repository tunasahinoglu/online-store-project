import React from 'react';
import { useParams } from 'react-router-dom';
import './product_detail.css';
import { products } from '../../models/temp_product_db';

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
                    {product.stock > 0 ? (
                        <div className="buttons">
                            <button className="add-to-cart">Add to Cart</button>
                            <button className="buy-now">Buy Now</button>
                        </div>
                    ) : null}
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