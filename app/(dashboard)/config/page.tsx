"use client"
import {CreateUserDialog} from '@/app/components/create-forms/user';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
interface User {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: Array<{ emailAddress: string }>;
  createdAt: string;
}
const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/get-users');
        if (!response.ok) {
          throw new Error('Erro ao buscar os usuários');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err:any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);
   const handlerDelete = async (userID:any) => {
   if( window.confirm("Tem certeza que deseja excluir o produto")){
    const data ={
      
        "id":userID
      
    }
    try {
      const response = await fetch('/api/users/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data,null,2),
      });

      const result = await response.json();
      console.error('aceito:', result);
    } catch (error) {
      console.error('Erro de rede:', error);
     
    }}else{
return;
    }
       
    };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className='p-4 flex flex-col gap-4'>
      <h1 className='text-3xl font-semibold'>Lista de Usuários</h1>
      <Separator></Separator>
      
      <ul className='space-y-2 max-h-[400px] overflow-y-auto border rounded-sm'>
        {users.map((user,index) => (
          <div key={user.id} className={`flex justify-between items-center p-4 ${index%2?"bg-gray-100":"white"}`}>
          <div>{index+1} . {user.firstName} {user.lastName} ({user.emailAddresses[0]?.emailAddress}) </div><Button onClick={()=>handlerDelete(user.id)} variant={"destructive"}><Trash></Trash></Button>
          </div>
        ))}
      </ul>
      <CreateUserDialog></CreateUserDialog>
    </div>
  );
};

export default UserList;
