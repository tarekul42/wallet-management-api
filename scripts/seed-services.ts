import mongoose from "mongoose";
import { envVars } from "../src/config/env";
import { Service } from "../src/modules/service/service.model";

async function seedServices() {
  await mongoose.connect(envVars.DB_URL);
  console.log("Connected to MongoDB");

  // Check if services already exist
  const count = await Service.countDocuments();
  if (count > 0) {
    console.log(`Already have ${count} services — skipping`);
    await mongoose.disconnect();
    return;
  }

  await Service.deleteMany({});
  const services = [
    { title: "Electric Bill Pay", description: "Pay your monthly electricity bills securely and instantly.", image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80", category: "Utilities", rating: 4.8, location: "Global", price: "Variable", date: "24/7 Available", reviews: [
      { name: "Sarah Johnson", role: "Small Business Owner", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", rating: 5, date: "2 weeks ago", content: "Absolutely seamless experience! The transaction was processed instantly and the fees are incredibly low." },
      { name: "Marcus Chen", role: "Freelancer", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus", rating: 4, date: "1 month ago", content: "Very reliable service. The integration with my wallet was smooth and the customer support team was responsive." },
      { name: "Priya Patel", role: "Regular User", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya", rating: 5, date: "3 months ago", content: "I've recommended this to all my friends and family. The security features give me peace of mind." },
    ]},
    { title: "Mobile Recharge", description: "Instant top-up for all major mobile networks worldwide.", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80", category: "Telecom", rating: 4.9, location: "Global", price: "Starts at $1", date: "Instant", reviews: [] },
    { title: "Internet Services", description: "Renew your high-speed internet subscription with one click.", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80", category: "Utilities", rating: 4.7, location: "Multiple Countries", price: "Starts at $20", date: "Monthly", reviews: [] },
    { title: "Water Bill", description: "Hassle-free water bill payments for residential and commercial.", image: "https://images.unsplash.com/photo-1548932813-71ede5af229e?w=800&q=80", category: "Utilities", rating: 4.6, location: "Regional", price: "Variable", date: "24/7 Available", reviews: [] },
    { title: "Netflix Subscription", description: "Pay for your favorite streaming services using your wallet balance.", image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80", category: "Entertainment", rating: 4.9, location: "Global", price: "Starts at $9.99", date: "Instant", reviews: [] },
    { title: "Flight Booking", description: "Book domestic and international flights with exclusive discounts.", image: "https://images.unsplash.com/photo-1436491865332-7a61a109c055?w=800&q=80", category: "Travel", rating: 4.5, location: "Global", price: "Competitive", date: "Real-time", reviews: [] },
    { title: "Grocery Shopping", description: "Pay at your local supermarket using QR codes or wallet transfer.", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80", category: "Lifestyle", rating: 4.4, location: "Local", price: "Variable", date: "Daily", reviews: [] },
    { title: "Game Top-up", description: "Buy in-game currency for PUBG, Free Fire, and more.", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80", category: "Entertainment", rating: 4.9, location: "Global", price: "Starts at $0.99", date: "Instant", reviews: [] },
  ];
  await Service.create(services);
  console.log(`Created ${services.length} services`);
  await mongoose.disconnect();
  console.log("Done");
}

seedServices().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
