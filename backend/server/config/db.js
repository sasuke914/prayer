const mongoURI = 'mongodb://localhost:27017/prayer';
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",
    mongoUri: process.env.MONGODB_URI ||
        process.env.MONGO_HOST ||
        'mongodb://' + (process.env.IP || 'localhost') + ':' +
        (process.env.MONGO_PORT || '27017') +
        '/prayer'
}

module.exports = { mongoURI, options, config }