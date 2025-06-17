"use client";

import { SetStateAction, useState } from "react";
import {
  Download,
  MoreHorizontal,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { createClientSupabaseClient } from "@/lib/supabase/client";

import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { VendasProps } from "@/app/utils/vendas";

interface DataTableVendasProps {
  data: VendasProps[];
  onVendaDeleted?: () => void;
}

export function DataTableVendas({ data, onVendaDeleted }: DataTableVendasProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof VendasProps;
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });
  const [selectedVenda, setSelectedVenda] = useState<VendasProps | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vendaToDelete, setVendaToDelete] = useState<VendasProps | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClientSupabaseClient();

  // Função para filtrar e ordenar os dados
  const filteredAndSortedData = data
    .filter((venda) => {
      const matchesSearch =
        venda.id_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venda.uuid?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter ? venda.status === statusFilter : true;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", {
        locale: ptBR,
      });
    } catch (error) {
      return dateString;
    }
  };

  // Função para formatar o valor em reais
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para gerar o comprovante
  const generateReceipt = (venda: VendasProps) => {
    // Create a temporary div to render our receipt
    const receiptDiv = document.createElement("div");
    receiptDiv.style.width = "400px";
    receiptDiv.style.padding = "20px";
    receiptDiv.style.fontFamily = "monospace";

    receiptDiv.style.position = "fixed";
    receiptDiv.style.flexDirection = "column";
    receiptDiv.style.display = "flex";
    receiptDiv.style.justifyContent = "center";
    receiptDiv.style.justifyItems = "center";
    receiptDiv.style.alignItems = "center";
    receiptDiv.style.fontFamily = "Courier New, monospace"; // Mais "nota fiscal"
    receiptDiv.style.color = "#000";

    receiptDiv.innerHTML = `
    <div style="text-align: center; ">
      <h2 style="margin: 0; font-size: 16px;">NEXTGIFTCARDS</h2>
      
      <p style="margin: 2px 0; font-size: 12px;">LOJA ONLINE</p>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <p style="margin: 0; font-size: 14px;"><strong>COMPROVANTE DE VENDA</strong></p>
      <div style="border-bottom: 1px dashed #000; margin: 10px 0;"></div>
    </div>
  
    <div style="font-size: 12px; line-height: 1.4;">
      <p><strong>ID:</strong> ${venda.uuid}</p>
      <p><strong>Cliente:</strong> ${venda.nome_cliente || venda.id_cliente}</p>
      <p><strong>Data:</strong> ${formatDate(venda.created_at)}</p>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <p style="font-weight: bold; margin-bottom: 5px;">DETALHES DO PRODUTO</p>
      <p><strong>ID do Produto:</strong> ${venda.detalhes_produto.id}</p>
      <p><strong>Nome:</strong> ${venda.detalhes_produto.nome}</p>
      <p><strong>Tipo:</strong> ${venda.detalhes_produto.tipo === "produto" ? "Produto" : "Combo"}</p>
      <p><strong>Valor Unitário:</strong> ${formatCurrency(venda.detalhes_produto.valor)}</p>
      <div style="border-top: 1px dashed #000; margin: 10px 0;"></div>
      <p><strong>Valor Total:</strong> ${formatCurrency(venda.valor)}</p>
      <p><strong>Status:</strong> ${venda.status}</p>
      ${venda.tipo_pagamento
        ? `<p><strong>Pagamento:</strong> ${venda.tipo_pagamento}</p>`
        : ""
      }
    </div>
  
    <div style="border-bottom: 1px dashed #000; margin: 15px 0;"></div>
  
    <div style="text-align: center; font-size: 11px;">
      <p style="margin: 4px 0;">Obrigado por comprar com a gente!</p>
      <p style="margin: 4px 0;">Documento sem valor fiscal</p>
      <p style="margin: 4px 0;">${new Date().toLocaleString("pt-BR")}</p>
    </div>
  `;

    // Add to document
    document.body.appendChild(receiptDiv);

    // Use html2canvas to convert to image
    import("html2canvas")
      .then((html2canvas) => {
        html2canvas.default(receiptDiv).then((canvas) => {
          // Remove the temporary div
          document.body.removeChild(receiptDiv);

          // Convert to PDF if requested
          import("jspdf")
            .then(({ jsPDF }) => {
              const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a5",
              });

              // Add the canvas as an image to the PDF
              const imgData = canvas.toDataURL("image/png");
              const imgWidth = 148; // A5 width in mm
              const imgHeight = (canvas.height * imgWidth) / canvas.width;

              pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
              pdf.save(`comprovante-${venda.uuid.substring(0, 8)}.pdf`);
            })
            .catch((err) => {
              console.error("Error loading jsPDF:", err);

              // Fallback to image download if PDF generation fails
              canvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `comprovante-${venda.uuid.substring(0, 8)}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              });
            });
        });
      })
      .catch((err) => {
        console.error("Error loading html2canvas:", err);
        alert("Não foi possível gerar o comprovante. Tente novamente.");
      });
  };

  // Função para renderizar o badge de status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
      case "concluida":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">Concluída</Badge>
        );
      case "pendente":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">Pendente</Badge>
        );
      case "cancelado":
        return <Badge className="bg-red-500 hover:bg-red-600">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Função para alternar a ordenação
  const toggleSort = (key: keyof VendasProps) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({
        key,
        direction: "asc",
      });
    }
  };

  // Função para abrir o modal de detalhes
  const openDetails = (venda: VendasProps) => {
    setSelectedVenda(venda);
    setIsDetailOpen(true);
  };

  // Função para abrir o diálogo de confirmação de exclusão
  const openDeleteDialog = (venda: VendasProps) => {
    setVendaToDelete(venda);
    setIsDeleteDialogOpen(true);
  };

  // Função para deletar a venda
  const handleDeleteVenda = async () => {
    if (!vendaToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("vendas")
        .delete()
        .eq("uuid", vendaToDelete.uuid);

      if (error) {
        throw error;
      }

      toast.success("Venda excluída com sucesso!");
      setIsDeleteDialogOpen(false);
      setVendaToDelete(null);
      onVendaDeleted?.();
    } catch (error) {
      console.error("Erro ao deletar venda:", error);
      toast.error("Erro ao excluir venda. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Obter todos os status únicos dos dados
  const uniqueStatuses = Array.from(new Set(data.map((venda) => venda.status)));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou cliente..."
              className="pl-8"
              value={searchTerm}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                setSearchTerm(e.target.value)
              }
            />
          </div>
          <Select
            value={statusFilter || "todos"}
            onValueChange={(value: any) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("id_cliente")}
                  >
                    Cliente
                    {sortConfig.key === "id_cliente" &&
                      (sortConfig.direction === "asc" ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("created_at")}
                  >
                    Data
                    {sortConfig.key === "created_at" &&
                      (sortConfig.direction === "asc" ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("valor")}
                  >
                    Valor
                    {sortConfig.key === "valor" &&
                      (sortConfig.direction === "asc" ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("status")}
                  >
                    Status
                    {sortConfig.key === "status" &&
                      (sortConfig.direction === "asc" ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("origin")}
                  >
                    Origem
                    {sortConfig.key === "origin" &&
                      (sortConfig.direction === "asc" ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggleSort("tipo_produto")}
                  >
                    Tipo
                    {sortConfig.key === "tipo_produto" &&
                      (sortConfig.direction === "asc" ? (
                        <SortAsc className="ml-1 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-1 h-4 w-4" />
                      ))}
                  </div>
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedData.map((venda) => (
                  <TableRow
                    key={venda.uuid}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetails(venda)}
                  >
                    <TableCell className="font-medium">
                      {venda.nome_cliente}
                    </TableCell>
                    <TableCell>
                      {format(new Date(venda.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{formatCurrency(venda.valor)}</TableCell>
                    <TableCell>{renderStatusBadge(venda.status)}</TableCell>
                    <TableCell className="font-medium">
                      {venda.origin || "Não informado"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {venda.tipo_produto === "produto" ? "Produto" : "Combo"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e: { stopPropagation: () => any }) =>
                            e.stopPropagation()
                          }
                        >
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e: { stopPropagation: () => void }) => {
                              e.stopPropagation();
                              openDetails(venda);
                            }}
                          >
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: { stopPropagation: () => void }) => {
                              e.stopPropagation();
                              generateReceipt(venda);
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Gerar comprovante
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e: { stopPropagation: () => void }) => {
                              e.stopPropagation();
                              openDeleteDialog(venda);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir venda
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal de detalhes */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda</DialogTitle>
            </DialogHeader>
            {selectedVenda && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      ID da Venda
                    </p>
                    <p className="text-sm">{selectedVenda.uuid}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      ID Cliente
                    </p>
                    <p className="text-sm">{selectedVenda.id_cliente}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Cliente
                    </p>
                    <p className="text-sm">{selectedVenda.nome_cliente}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Data
                    </p>
                    <p className="text-sm">
                      {formatDate(selectedVenda.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Valor
                    </p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(selectedVenda.valor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-1">
                      {renderStatusBadge(selectedVenda.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Forma de Pagamento
                    </p>
                    <p className="text-sm">
                      {selectedVenda.tipo_pagamento || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipo de Produto
                    </p>
                    <p className="text-sm">
                      {selectedVenda.tipo_produto === "produto" ? "Produto" : "Combo"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Detalhes do Produto
                    </p>
                    <div className="text-sm">
                      <p><strong>ID:</strong> {selectedVenda.detalhes_produto.id}</p>
                      <p><strong>Nome:</strong> {selectedVenda.detalhes_produto.nome}</p>
                      <p><strong>Valor:</strong> {formatCurrency(selectedVenda.detalhes_produto.valor)}</p>
                      <p><strong>Tipo:</strong> {selectedVenda.detalhes_produto.tipo}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button onClick={() => generateReceipt(selectedVenda)}>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar Comprovante
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                <br />
                <br />
                <strong>Venda:</strong> {vendaToDelete?.nome_cliente || vendaToDelete?.id_cliente}
                <br />
                <strong>Valor:</strong> {vendaToDelete ? formatCurrency(vendaToDelete.valor) : ""}
                <br />
                <strong>Data:</strong> {vendaToDelete ? formatDate(vendaToDelete.created_at) : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVenda}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
