require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

connectDB();

const app = express();

app.use(helmet());
const allowedOrigins = [
	process.env.FRONTEND_URL,
	process.env.CLIENT_URL,
	"https://agency-funded-frontend.onrender.com",
	"http://localhost:5173",
]
	.filter(Boolean)
	.flatMap((value) => value.split(","))
	.map((value) => value.trim().replace(/\/+$/, ""));
app.use(cors({
	origin: (origin, callback) => {
		const normalizedOrigin = origin?.replace(/\/+$/, "");
		callback(null, !origin || allowedOrigins.includes(normalizedOrigin));
	},
	credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use("/api/", limiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ success: true, message: "Agency Funded API is running" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/accounts-catalog", require("./routes/accountTemplateRoutes")); // public templates + admin templates
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes")); // customer's purchased accounts
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/payment-methods", require("./routes/paymentMethodRoutes"));
app.use("/api/affiliate", require("./routes/affiliateRoutes"));
app.use("/api/payouts", require("./routes/payoutRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/cms", require("./routes/cmsRoutes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Agency Funded API listening on port ${PORT}`));

module.exports = app;
