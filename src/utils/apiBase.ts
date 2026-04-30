export const API_BASE = process.env.NEXT_PUBLIC_API ?? (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://grocery-backend-jlmj.onrender.com');
