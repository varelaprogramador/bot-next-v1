"use server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function useMetadata() {
   const user = await currentUser();
   
     const metadata: {
       [key: string]: any;
     } = user?.privateMetadata as any;
     if (metadata?.subscription?.status !== "active") {
       redirect("/sign-in");
     }
   
    // Ensure metadata is always an object
    if (typeof metadata !== 'object' || metadata === null) {
        return {};
    }
    // Return the metadata object       
  return metadata;
}