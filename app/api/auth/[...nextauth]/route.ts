import { auth } from 'next-auth';
import authOptions from './auth-options';

const handler = auth(authOptions);

export { handler as GET, handler as POST };
