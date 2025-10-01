import { auth, currentUser } from "@clerk/nextjs/server";

export async function getCurrentUser() {
  return await currentUser();
}

export async function getCurrentUserId() {
  const { userId } = await auth();
  return userId;
}

export async function getUserProfile() {
  const user = await currentUser();
  if (!user) return null;

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
  };
}
