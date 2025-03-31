const notFoundHandler = (req, res, next) => {
    const error = new Error('Request is not found');
    error.status = 404;
    next(error);
};
    
export default notFoundHandler;