"use server";
import { clerkClient } from "@clerk/clerk-sdk-node";

/**
 * Busca o privateMetadata do usuário Clerk
 * @param userId - ID do usuário Clerk
 * @returns Objeto privateMetadata (ex: { subscription: { org, status } })
 */
export const getUserPrivateMetadata = async (userId: string) => {
  try {
    const user = await clerkClient.users.getUser(userId);
    return user.privateMetadata || {};
  } catch (error) {
    console.error("Erro ao buscar privateMetadata do usuário:", error);
    throw error;
  }
};
