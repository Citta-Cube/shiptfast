// // middleware.js
// import { NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt';

// export async function middleware(request) {
//   const path = request.nextUrl.pathname;

//   // Define paths that are considered public
//   const publicPaths = ['/auth/signin', '/auth/signup', '/'];

//   // Check if the path is public
//   const isPublicPath = publicPaths.includes(path);

//   // Get the token
//   const token = await getToken({ 
//     req: request,
//     secret: process.env.NEXTAUTH_SECRET
//   });

//   // If the path is public and the user is logged in, redirect to dashboard
//   if (isPublicPath && token) {
//     return NextResponse.redirect(new URL('/dashboard', request.url));
//   }

//   // If the path is not public and the user is not logged in, redirect to login
//   if (!isPublicPath && !token) {
//     return NextResponse.redirect(new URL('/auth/signin', request.url));
//   }

//   // Otherwise, continue with the request
//   return NextResponse.next();
// }

// // Specify which paths the middleware should run on
// export const config = {
//   matcher: [
//     '/',
//     '/dashboard/:path*',
//     '/auth/signin',
//     '/auth/signup',
//   ],
// };