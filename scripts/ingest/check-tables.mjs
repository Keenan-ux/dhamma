import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });
const t = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
console.log('tables:', t.map((r) => r.table_name).join(', '));
await sql.end();
