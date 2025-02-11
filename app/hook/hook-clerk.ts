"use client"
import { currentUser } from "@clerk/nextjs/server";
import { useEffect, useState } from "react";
import { getCurrentUserData } from "./get-user";

interface Subscription {
    org?: string; 
    status?: string;
  }
  
  interface PrivateMetadata {
    subscription?: Subscription; // A chave 'subscription' pode ser undefined
  }
const useUserRole = ():Boolean => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
      const fetchUserRole = async () => {
        const userC = await getCurrentUserData(); // Fetch user data server-side
        if (userC && userC.privateMetadata) {
          const metadata = userC.privateMetadata as PrivateMetadata;
          console.log(metadata);
          const org = metadata?.subscription?.org;
          const isAdminRole = org === "admin";
          setIsAdmin(isAdminRole);
          console.log(isAdmin)
        }
      };
  
      fetchUserRole();
    }, [isAdmin]);
  
    return isAdmin;
};

export default useUserRole;