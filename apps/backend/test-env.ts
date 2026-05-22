import { config } from "dotenv";
config();

console.log("GOOGLE_CLIENT_ID:", JSON.stringify(process.env.GOOGLE_CLIENT_ID));
console.log("GOOGLE_CLIENT_SECRET:", JSON.stringify(process.env.GOOGLE_CLIENT_SECRET));
console.log("Length ID:", process.env.GOOGLE_CLIENT_ID?.length || 0);
console.log("Length Secret:", process.env.GOOGLE_CLIENT_SECRET?.length || 0);