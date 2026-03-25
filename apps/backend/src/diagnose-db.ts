
import { db } from "./db/db";
import { managedApps, users } from "./db/auth-schema";

async function diagnose() {
  console.log("--- Backend Diagnosis ---");
  
  try {
    const apps = await db.select().from(managedApps);
    console.log("Managed Apps in DB:");
    apps.forEach(app => {
      console.log(` - ID: ${app.id}, Name: ${app.name}, Slug: ${app.slug}, UserID: ${app.userId}`);
    });
    
    if (apps.length === 0) {
      console.log("No apps found in managed_apps table.");
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    console.log(`Admin Email from .env: ${adminEmail}`);
    
    if (adminEmail) {
      const allUsers = await db.select().from(users);
      console.log(`Users in DB: ${allUsers.length}`);
      const admin = allUsers.find(u => u.email === adminEmail);
      if (admin) {
        console.log(`Admin account found! ID: ${admin.id}`);
      } else {
        console.log("Admin account NOT found in users table.");
        console.log("Available emails:", allUsers.map(u => u.email).join(", "));
      }
    }

    const activationAppName = process.env.ACTIVATION_APP_NAME;
    console.log(`Activation App Name from .env: ${activationAppName}`);

  } catch (error) {
    console.error("Diagnosis failed:", error);
  } finally {
    process.exit(0);
  }
}

diagnose();
