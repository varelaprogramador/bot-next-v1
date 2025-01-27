import * as React from "react";
import { Button } from "@/app/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface MenuActionsProps {
  uuid: string;
  onDelete: (uuid: string) => void;
  onEdit: (uuid: string) => void;
}

const MenuActions: React.FC<MenuActionsProps> = ({ uuid, onDelete, onEdit }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(uuid)}>Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(uuid)}>Deletar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MenuActions;
