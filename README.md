# AuraMarket - Premium Product Marketing & E-Commerce Platform

A production-ready Product Marketing platform featuring a high-converting customer storefront, instant single-product checkout, shopping cart with coupon support, live customer order tracking, and a comprehensive Admin Control Portal.

Built with **Node.js**, **Express**, **MongoDB**, and **Cloudinary**.

---

## 🚀 Key Features

### 🛍️ Customer Storefront (`public/index.html`)
- **Rich Modern Marketing Aesthetic**: Radiant dark mode design with glassmorphism, glowing accents, and smooth micro-interactions.
- **Visual Product Showcase**: Features real product imagery including luxury cosmetics, minimalist organic skincare, fresh gourmet harvest baskets, titanium smartwatches, and studio headphones.
- **Dual Order Workflows**:
  - **⚡ Instant 1-Click Single Product Order**: Customers can click *"Buy Now"* on any product card or quick view modal to place an order directly for that specific item without cart friction.
  - **🛒 Shopping Cart Checkout**: Add multiple items to the slide-out cart drawer, modify quantities, apply coupon codes (e.g. `MARKETING20` for 20% off), and checkout seamlessly.
- **Quick View Lightbox**: Inspect high-res product galleries, bullet-point highlights, verified customer reviews, and specifications.
- **Live Order Tracking**: Customers can track their order in real time using their Order ID (e.g. `ORD-741672`) or registered phone number with a 5-step visual delivery progress stepper.
- **Responsive Layout**: Designed for mobile, tablet, and desktop screens.

### 📊 Admin Portal (`public/admin.html`)
- **Real-Time KPI Dashboard**: Live sales revenue, total orders count, pending shipments count, and active catalog products count.
- **Customer Orders Pipeline**:
  - Filter orders by status (*Pending, Confirmed, Processing, Shipped, Delivered, Cancelled*).
  - Search orders by customer name, phone, or order reference ID.
  - **1-Click Status Update**: Instant dropdown to update delivery status.
  - **Printable Sales Invoice**: Formatted receipt modal ready for printing or PDF export.
  - Delete or archive orders.
- **Products Catalog Management**:
  - **✏️ Quick Price Edit**: Specifically designed 1-click price change modal to update current and strikethrough prices instantly.
  - **➕ Add New Product**: Add products with title, category, price, discount, inventory stock, marketing badge, and bullet points.
  - **☁️ Cloudinary Uploads**: Supports uploading image files directly to Cloudinary or entering image URLs.
  - **Reset/Seed Catalog**: One-click restore for sample showcase products.
- **System Diagnostics Panel**: Real-time monitoring of MongoDB connection state and Cloudinary API configuration.

---

## 🛠️ Technology Stack & Architecture

- **Backend**: Node.js & Express.js (`server.js`)
- **Database**: MongoDB (with automatic local JSON storage fallback in `data/local_db.json` when MongoDB is offline)
- **Media Storage**: Cloudinary SDK (with automatic fallback to `public/uploads/` if credentials are not configured)
- **Frontend**: Vanilla CSS (`public/css/style.css`, `public/css/admin.css`) & Vanilla JS (`public/js/app.js`, `public/js/admin.js`)
- **Static Placement**: All HTML, CSS, JS, and uploads are located inside the `public/` directory as requested.

---

## 📁 Directory Structure

```text
e:\ProductMarketingWebsite\
├── data\
│   └── local_db.json           # Local storage fallback & initial seed cache
├── public\
│   ├── css\
│   │   ├── style.css           # Customer storefront modern stylesheet
│   │   └── admin.css           # Admin dashboard stylesheet
│   ├── js\
│   │   ├── app.js              # Storefront catalog, cart, and tracking logic
│   │   └── admin.js            # Admin orders, products, and price editing logic
│   ├── uploads\                # Uploaded and seeded product images
│   │   ├── product1.png        # Luxury Cosmetics Collection
│   │   ├── product2.png        # SŌKE Minimalist Skincare Set
│   │   ├── product3.png        # Organic Gourmet Harvest Basket
│   │   ├── product4.jpg        # AeroTitanium Chrono Smartwatch
│   │   └── product5.jpg        # Aurora Noir Studio Headphones
│   ├── index.html              # Customer Marketing Storefront
│   └── admin.html              # Admin Control Hub
├── .env                        # Environment variables (MongoDB & Cloudinary)
├── .env.example                # Example configuration template
├── package.json                # Project dependencies and npm scripts
├── server.js                   # Express server, MongoDB & Cloudinary engine
└── README.md                   # Documentation
```

---

## ⚙️ Setup & Configuration

### 1. Environment Variables (`.env`)
Create or edit your `.env` file in the root directory:

```env
# Server Port
PORT=3000

# MongoDB Configuration (Local or MongoDB Atlas)
# Example Local: mongodb://127.0.0.1:27017/product_marketing
# Example Atlas: mongodb+srv://username:password@cluster0.mongodb.net/product_marketing
MONGODB_URI=mongodb://127.0.0.1:27017/product_marketing
MONGODB_DB=product_marketing

# Cloudinary Configuration (From https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note**: If MongoDB or Cloudinary credentials are not provided initially, the application will run in local mode with full functionality and zero downtime. Once you provide the credentials and restart, it seamlessly uses MongoDB and Cloudinary.

### 2. Start the Server
```bash
npm start
# or for development:
npm run dev
```

### 3. Access URLs
- **Customer Storefront**: [http://localhost:3000/](http://localhost:3000/)
- **Admin Management Portal**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🎟️ Demo Promo Codes
- `MARKETING20` : 20% discount on cart subtotal
- `WELCOME10`   : 10% discount on cart subtotal

---

## 🌐 Deploying to Render

This repository includes a [`render.yaml`](render.yaml) blueprint ready for 1-click cloud deployment:

1. Push your code to GitHub.
2. Sign in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Render automatically configures:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. *(Optional)* Add your **Environment Variables** in the Render Dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For cloud media hosting.
6. Click **Deploy Web Service** to get your live public `.onrender.com` URL!
