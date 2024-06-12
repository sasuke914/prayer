const mongoURI = 'mongodb+srv://takedaharuhito0914:6sz48025vy93FgPA@cluster0.dhkxph4.mongodb.net/prayer';
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key",
}

module.exports = { mongoURI, options, config }