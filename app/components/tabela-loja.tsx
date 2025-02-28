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


import { createClient } from "@/lib/supabase/client";

import { MediaProps } from "../utils/media";
import { CreateMedia } from "./create-forms/produto-2";
import { CreateBanner } from "./create-forms/banner";

export const columns: ColumnDef<MediaProps>[] = [
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
    accessorKey: "nome",
    header: "nome",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("nome")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("nome")}
      </div>
    ),
  },
  {
    accessorKey: "url",
    header: "Url da foto",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={row.getValue("url")} // Exibe o valor completo ao passar o mouse
      >
        {row.getValue("url")}
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize flex gap-4"> <div className={`min-h-[5px] min-w-[10px] ${row.getValue("status") ? "bg-green-400" : "bg-red-400"}  rounded-full`} />{row.getValue("status") ? "ativo" : "inativo"}</div>
    ),
  },
  {
    accessorKey: "produtos",
    header: "Produtos",
    cell: ({ row }) => (
      <div
        className="truncate max-w-[150px]"
        title={JSON.stringify(row.getValue("produtos"))} // Exibe o valor completo (em formato JSON) ao passar o mouse
      >
        {JSON.stringify(row.getValue("produtos"))}
      </div>
    ),
  }

];

export function DataTableMediaCarousel({ data }: { data: MediaProps[] }) {
  const [itemsToDelete, setItemsToDelete] = React.useState<MediaProps[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const supabase = createClient();
  const handleConfirmCreate = async ({ data }: { data: MediaProps }) => {
    const { error } = await supabase.from("marca").insert(data);
    if (error) {
      console.error("Erro ao criar codigo:", error);
      console.log(data);
    } else {
      console.log("codigo criado com sucesso");
    }
  };
  const handleConfirmCreateBanner = async ({ data }: { data: MediaProps }) => {
    const { error } = await supabase.from("media-loja").insert(data);
    if (error) {
      console.error("Erro ao criar codigo:", error);
      console.log(data);
    } else {
      console.log("codigo criado com sucesso");
    }
  };
  const handleConfirmEdit = async ({ data }: { data: MediaProps }) => {
    const { error } = await supabase
      .from("marca")
      .update(data)
      .eq("id", data.id);
    if (error) {
      console.error("Erro ao atualizar registro:", error);
    } else {
      console.log("registro atualizado com sucesso");
    }
  };
  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("marca")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao deletar codigos:", error);
    } else {
      console.log("Codigo deletado com sucesso");
    }
  };
  const handleDeleteSelected = async () => {
    for (const item of itemsToDelete) {
      await handleDelete(item.id as string);
    }
    setItemsToDelete([]);
  };

  React.useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection);
    const selectedRows = selectedRowIds
      .map((id) => data[parseInt(id)])
      .filter(Boolean) as MediaProps[];

    setItemsToDelete(selectedRows);
  }, [rowSelection, data]);

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
        <CreateBanner onConfirmCreate={handleConfirmCreateBanner}></CreateBanner>
        <CreateMedia onConfirmCreate={handleConfirmCreate}></CreateMedia>
        <Button
          variant="destructive"
          onClick={handleDeleteSelected}
          disabled={itemsToDelete.length === 0}
        >
          Deletar em massa
        </Button>
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

                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete(row.getValue("id_codigo"))
                          }
                        >
                          Deletar
                        </DropdownMenuItem>
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
