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
import { CodigosProps } from "@/app/utils/codigos";
import { CreateOrUpdateCodigo } from "./edit-form/codigo-edit";

import { createClient } from "@/lib/supabase/client";
import FileUpload from "./input-xsl";

export const columns: ColumnDef<CodigosProps>[] = [
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
    accessorKey: "id_codigo",
    header: "ID",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("id_codigo")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("id_codigo")}
      </div>
    ),
  },
  {
    accessorKey: "id_produto",
    header: "ID produto",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("id_produto")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("id_produto")}
      </div>
    ),
  },
  
  {
    accessorKey: "codigo",
    header: "codigo de resgate",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("codigo")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("codigo")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
];

export function DataTableCodigos({ data }: { data: CodigosProps[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
const supabase=createClient()
 const handleConfirmCreate = async ({ data }: { data: CodigosProps }) => {   
    const { error } = await supabase.from("codigos").insert(data);
    if (error) {
      console.error("Erro ao criar codigo:", error);
      console.log(data);
    } else {
      console.log("codigo criado com sucesso");
    }
 
  };

 
   const handleConfirmEdit = async ({ data }: { data: CodigosProps }) => {
    const { error } = await supabase
    .from("codigos")
    .update(data)
    .eq("id_codigo", data.id_codigo);
  if (error) {
    console.error("Erro ao atualizar registro:", error);
  } else {
    console.log("registro atualizado com sucesso");
  }
   
    };
    const handleDelete = async (id: string) => {
      const { error } = await supabase.from("codigos").delete().eq("id_codigo", id);
  
      if (error) {
        console.error("Erro ao deletar codigos:", error);
      } else {
        console.log("Codigo deletado com sucesso");
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
          placeholder="Filtre pela ID  do produto ..."
          value={
            (table.getColumn("id_produto")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("id_produto")?.setFilterValue(event.target.value)
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
        <CreateOrUpdateCodigo onConfirm={handleConfirmCreate}></CreateOrUpdateCodigo>
        <FileUpload />
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
                  <TableCell>
                                    <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <MoreHorizontal />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                             <CreateOrUpdateCodigo codigo={data.find(item=>item.id_codigo==row.getValue("id_codigo")) } onConfirm={handleConfirmEdit}></CreateOrUpdateCodigo>
                                              <DropdownMenuItem onClick={()=>handleDelete(row.getValue('id_codigo'))}>Deletar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                    </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
