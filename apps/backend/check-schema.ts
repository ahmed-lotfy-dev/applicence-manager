import { db } from './src/db/db';
import { sql, and, eq } from 'drizzle-orm';

async function checkVerificationTokensSchema() {
  try {
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'verification_tokens'
    `);
    
    console.log('Verification tokens columns:', columns.rows.map(c => c.column_name));
    
    const hasExpiresAt = columns.rows.some(c => c.column_name === 'expires_at');
    console.log('Has expires_at column:', hasExpiresAt);
    
    return hasExpiresAt;
  } catch (error) {
    console.error('Error checking schema:', error);
    return false;
  }
}

checkVerificationTokensSchema().then(hasColumn => {
  process.exit(hasColumn ? 0 : 1);
});