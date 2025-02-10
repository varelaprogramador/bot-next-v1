'use server';
import { currentUser } from "@clerk/nextjs/server";

export async function getCurrentUserData() {
  const user = await currentUser();
  console.log(user)
  return user;
}
