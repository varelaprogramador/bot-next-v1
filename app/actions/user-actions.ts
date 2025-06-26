"use server";
import { clerkClient } from "@clerk/clerk-sdk-node";
export const getUsers = async () => {
  try {
    const usersList = await clerkClient.users.getUserList({
      orderBy: "-created_at",
    });
    const userListFormatter = usersList.data.map((user: any) => ({
      id: user.id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      emailAddresses:
        user.emailAddresses?.map((e: any) => ({
          emailAddress: e.emailAddress,
        })) || [],
      role: user.privateMetadata?.subscription?.org || "user",
      createdAt: user.createdAt || "",
    }));
    console.log(userListFormatter);
    return userListFormatter;
  } catch (error) {
    console.error("Erro ao obter todos os usuários:", error);
    throw new Error("Erro ao obter todos os usuários");
  }
};

export const createUser = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status: string;
  org: string;
}) => {
  const { firstName, lastName, email, password, status, org } = data;

  if (!firstName || !lastName || !email || !password) {
    throw new Error("Dados incompletos");
  }

  try {
    const newUser = await clerkClient.users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
      privateMetadata: {
        subscription: {
          org: org || "member",
          status: status || "active",
        },
      },
    });

    return newUser;
  } catch (error) {
    console.error("Erro detalhado ao criar novo usuário:", error);
    throw new Error(
      error instanceof Error ? error.message : "Erro ao criar novo usuário"
    );
  }
};

export async function deleteUser(id: string) {
  try {
    await clerkClient.users.deleteUser(id);
    return { message: "Usuário excluído com sucesso" };
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw new Error("Erro ao excluir usuário");
  }
}

export const editUser = async (
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    status?: string;
    org?: string;
  }
) => {
  try {
    const updatePayload: any = {};
    if (data.firstName) updatePayload.firstName = data.firstName;
    if (data.lastName) updatePayload.lastName = data.lastName;
    if (data.email) updatePayload.emailAddress = [data.email];
    if (data.password && data.password !== "")
      updatePayload.password = data.password;
    // status e org podem ser salvos em privateMetadata
    if (data.status || data.org) {
      updatePayload.privateMetadata = {};
      if (data.status)
        updatePayload.privateMetadata.subscription.status = data.status;
      if (data.org) updatePayload.privateMetadata.subscription.org = data.org;
    }
    const updatedUser = await clerkClient.users.updateUser(id, updatePayload);
    return updatedUser;
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    throw new Error("Erro ao editar usuário");
  }
};
