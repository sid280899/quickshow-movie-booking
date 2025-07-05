# 🎬 QuickShow – Movie Ticket Booking App

A modern, full-stack movie ticket booking application built with **React**, **Express**, **MongoDB**, and **Clerk Authentication**. Users can browse shows, book movie tickets via **Stripe**, and manage bookings. Admins can access an analytics dashboard with total bookings and revenue.

---

## 🔗 Live Links

- 🚀 **Frontend App**: [https://quickshow-rust.vercel.app](https://quickshow-rust.vercel.app)
- 🛠️ **Backend API**: [https://quickshow-server-livid.vercel.app](https://quickshow-server-livid.vercel.app)
- 📂 **GitHub Repo**: [QuickShow Movie Booking](https://github.com/sid280899/quickshow-movie-booking)

---

## 🧰 Tech Stack

### Frontend
- React 19
- React Router v7
- Clerk (Authentication)
- Axios
- Tailwind CSS
- React Hot Toast
- React Player
- Lucide React Icons

### Backend
- Express.js
- MongoDB (with Mongoose)
- Clerk (Express middleware)
- Stripe (Payments)
- Inngest (Background jobs for email notifications)
- Nodemailer
- Cloudinary (optional for images)
- Deployed via **Vercel**

---

## 🎯 Features

### 👥 User Side
- Secure Sign In / Sign Up using Clerk
- View and browse available shows with posters, trailers, and descriptions
- Book tickets by selecting seats and showtime
- Payment integration using Stripe
- Email confirmations for booking using Inngest + Nodemailer
- View past bookings and favorites
- Responsive and mobile-friendly UI

### 🔐 Admin Side
- Role-based access control using Clerk's `private_metadata.role = "admin"`
- View total shows, bookings, and revenue
- Monitor bookings in real-time
- Access protected dashboard route (`/admin`)

---

## 📸 Screenshots

> *Add screenshots inside `/screenshots` folder and replace paths below accordingly*

| Page | Preview |
|------|---------|
| 🏠 Home Page | ![Home](./client/public/screenshots/Ticket%20Booking%20-%20Home%20Page.png) |
| 🎬 Movie Detail Page | ![Movie Detail](./client/public/screenshots/Ticket%20Booking%20-%20Detail%20Page.png) |
| 🎟️ Seat Selection Page | ![Seat Selection](./client/public/screenshots/Ticket%20Booking%20-%20Seat%20Selection.png) |
| 📖 My Bookings Page | ![My Bookings](./client/public/screenshots/Ticket%20Booking%20-%20My%20Bookings.png) |
| 🛠️ Admin Dashboard | ![Admin Dashboard](./client/public/screenshots/Ticket%20Booking%20-%20Dashboard.png) |
| 📋 Admin Booking List Page | ![Admin Bookings](./client/public/screenshots/Ticket%20Booking%20-%20List%20Bookings.png) |
| 🎞️ Admin Movie List Page | ![Admin Movie List](./client/public/screenshots/Ticket%20Booking%20-%20List%20Show.png) |
| ➕ Add New Show Page | ![Add Show](./client/public/screenshots/Ticket%20Booking%20-%20Add%20Show.png) |

---

## ⚙️ Installation & Setup (Local Dev)

### 1. Clone Repo
```bash
git clone https://github.com/sid280899/quickshow-movie-booking.git
cd quickshow-movie-booking


```
### 2. Environment Variables
```bash
📁 client/.env
env
Copy code
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_BACKEND_URL=http://localhost:3000
📁 server/.env
env
Copy code
PORT=3000
MONGO_URI=your_mongo_uri
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_JWT_AZP=http://localhost:5173
STRIPE_SECRET_KEY=your_stripe_secret
FRONTEND_URL=http://localhost:5173
EMAIL_PASS=your_email_app_password
EMAIL_ID=your_email@example.com

```

### 3. Install dependencies
```bash
Backend

cd server
npm install

Frontend (in another terminal tab/window)

cd client
npm install

```

### 4. Run the app locally
```bash
# Start Backend
cd server
npm run server

# Start Frontend (in new terminal)
cd ../client
npm run dev

```