import { db } from './src/db/db';
import { eq } from 'drizzle-orm';
import { users, accounts } from './src/db/auth-schema';

async function checkUser() {
  try {
    const userResult = await db.select().from(users).where(eq(users.email, 'elshenawy19@gmail.com'));
    console.log('User query result:', userResult);
    
    if (userResult.length > 0) {
      const user = userResult[0];
      console.log('Found user:', {
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      // Check if credential account exists
      const accountResult = await db.select().from(accounts)
        .where(eq(accounts.userId, user.id))
        .where(eq(accounts.provider, 'credential'));
      
      console.log('Credential account result:', accountResult);
      
      if (accountResult.length === 0) {
        console.log('No credential account found - needs to be created');
      } else {
        console.log('Credential account already exists');
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkUser();