"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { VendasProps } from "@/app/utils/vendas";
import MenuActions from "./menu-actions";
import { createClient } from "@/lib/supabase/client";
import { CreateOrUpdateVenda } from "./edit-form/vendas-edit";

export const columns: ColumnDef<VendasProps>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "uuid",
    header: "UUID",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("uuid")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("uuid")}
      </div>
    ),
  },
  {
    accessorKey: "id_cliente",
    header: "UUID comprador",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("id_cliente")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("id_cliente")}
      </div>
    ),
  },

  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data da venda
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rawDate = row.getValue("created_at");
      const formattedDate = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(rawDate as string));
      return (
        <div className="lowercase flex justify-center">{formattedDate}</div>
      );
    },
  },
  {
    accessorKey: "valor",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const Valor = parseFloat(row.getValue("valor"));

      // Format the Valor as a dollar Valor
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(Valor);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
];

export function DataTableVendas({ data}: { data: VendasProps[];}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
const supabase=createClient()
 const handleConfirmCreate = async ({ data }: { data: VendasProps }) => {
  console.log(data);
   
    const { error } = await supabase.from("vendas").insert(data);
    if (error) {
      console.error("Erro ao criar registro:", error);
    } else {
      console.log("registro criado com sucesso");
    }
 
  };

 
   const handleConfirmEdit = async ({ data }: { data: VendasProps }) => {
    const { error } = await supabase
    .from("vendas")
    .update(data)
    .eq("uuid", data.uuid);
  if (error) {
    console.error("Erro ao atualizar registro:", error);
  } else {
    console.log("registro atualizado com sucesso");
  }
   
    };
    const handleDelete = async (id: string) => {
      const { error } = await supabase.from("vendas").delete().eq("uuid", id);
  
      if (error) {
        console.error("Erro ao deletar registro de venda:", error);
      } else {
        console.log("Registro de venda deletado com sucesso");
      }
    };
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
         <div className="flex items-center py-4 gap-4">
              <Input
                placeholder="Filtre pelo UIID ..."
                value={
                  (table.getColumn("uuid")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("uuid")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              <CreateOrUpdateVenda onConfirm={handleConfirmCreate}></CreateOrUpdateVenda>
            </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  {/* Add the Delete button here */}
                  <TableCell>
                  <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                           <CreateOrUpdateVenda venda={data.find(item=>item.uuid==row.getValue("uuid")) } onConfirm={handleConfirmEdit}></CreateOrUpdateVenda>
                            <DropdownMenuItem onClick={()=>handleDelete(row.getValue('uuid'))}>Deletar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}