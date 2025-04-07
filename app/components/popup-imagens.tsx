"use client";

import type React from "react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface FileObject {
  name: string;
  size: number;
  type: string;
  url: string;
  qtd: number; // Número de itens para pastas
}

interface GaleriaPopupProps {
  defaultValue: string;
  sendData: (url: string) => void; // Função para enviar a URL da imagem selecionada
  onClose: () => void; // Função para fechar o popup
}

const GaleriaPopup: React.FC<GaleriaPopupProps> = ({
  sendData,
  onClose,
  defaultValue,
}) => {
  const [files, setFiles] = useState<FileObject[]>([]); // Estado para os arquivos
  const [filteredFiles, setFilteredFiles] = useState<FileObject[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null); // Apenas 1 arquivo selecionado
  const [nomeFile, setNomeFile] = useState<string | null>("");
  const [previewImage, setPreviewImage] = useState<FileObject | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const supabase = createClient();

  // Função para verificar se o tipo do arquivo é imagem
  const isImageFile = (type: string) => type.startsWith("image");

  // Função para carregar os arquivos
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from("galeria").list("");

      if (error) {
        console.error("Erro ao listar arquivos:", error);
      } else {
        console.log("Dados dos arquivos:", data);
      }

      if (data) {
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from("galeria").getPublicUrl(`/${file.name}`);

            return {
              name: file.name,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || "unknown",
              url: publicUrl,
              qtd: 0,
            };
          })
        );
        setFiles(filesWithUrls);
        setFilteredFiles(filesWithUrls);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  // Função de upload de arquivos
  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    try {
      setUploading(true);
      const file = event.target.files[0];
      const { error } = await supabase.storage
        .from("galeria")
        .upload(`/${file.name}`, file);
      if (error) throw error;

      // Recarregar os arquivos após o upload
      await fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  // Função para upload via drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      try {
        setUploading(true);
        const file = e.dataTransfer.files[0];
        const { error } = await supabase.storage
          .from("galeria")
          .upload(`/${file.name}`, file);
        if (error) throw error;

        await fetchFiles();
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from("galeria")
        .remove([`/${fileName}`]);

      if (error) throw error;

      await fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Função para selecionar apenas 1 imagem
  const handleSelectImage = (file: FileObject) => {
    setSelectedFile(file); // Seleciona a imagem
    setPreviewImage(file); // Abre o popup de preview ao selecionar
  };

  // Função para continuar após selecionar uma imagem
  const handleProceed = () => {
    setOpen(false);
    setPreviewImage(null);
    sendData(selectedFile?.url as string);
  };

  // Filtrar arquivos com base no termo de pesquisa
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter((file) =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchTerm, files]);

  // Configurar o arquivo selecionado baseado no `defaultValue`
  useEffect(() => {
    fetchFiles();
  }, []);

  // Configurar o estado de `selectedFile` no primeiro carregamento de arquivos
  useEffect(() => {
    if (defaultValue && files.length) {
      const file = files.find((file) => file.url === defaultValue);
      if (file) {
        setSelectedFile(file); // Seleciona automaticamente o arquivo com a URL padrão
      }
    }
  }, [files, defaultValue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => setOpen(!isOpen)}>
        <DialogTrigger asChild>
          <div className="relative">
            <Button
              variant="outline"
              className="w-full h-auto flex flex-col items-center justify-center p-4 border-dashed gap-2"
            >
              {defaultValue ? (
                <div className="relative w-full h-32 mb-2">
                  <Image
                    src={defaultValue || "/placeholder.svg"}
                    alt="Imagem selecionada"
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
              )}
              <span className="text-sm font-medium">
                {selectedFile ? "Alterar imagem" : "Selecionar imagem"}
              </span>
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Galeria de Imagens</DialogTitle>
            <DialogDescription>
              Selecione uma imagem da galeria ou faça upload de uma nova.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="gallery" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="gallery">Galeria</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="gallery" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar imagens..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[50vh]">
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => (
                      <Card
                        key={file.name}
                        className={cn(
                          "group relative overflow-hidden cursor-pointer transition-all hover:shadow-md border",
                          selectedFile?.name === file.name
                            ? "ring-2 ring-primary border-primary"
                            : ""
                        )}
                        onClick={() => handleSelectImage(file)}
                      >
                        {isImageFile(file.type) ? (
                          <div className="relative aspect-square w-full overflow-hidden bg-muted">
                            <Image
                              src={file.url || "/placeholder.svg"}
                              alt={file.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                            {selectedFile?.name === file.name && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center aspect-square bg-muted">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2">
                          <div className="truncate text-xs font-medium">
                            {file.name}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5"
                            >
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFile(file.name);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="font-medium">Nenhuma imagem encontrada</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchTerm
                          ? "Tente outro termo de pesquisa"
                          : "Faça upload de imagens para começar"}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="upload">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center h-[50vh]",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center max-w-xs mx-auto">
                  <Upload
                    className={cn(
                      "h-10 w-10 mb-4",
                      dragActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <h3 className="font-medium text-lg mb-2">
                    {dragActive
                      ? "Solte para fazer upload"
                      : "Arraste e solte sua imagem aqui"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Suporta PNG, JPG ou JPEG até 5MB
                  </p>
                  <div className="relative">
                    <Input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={uploadFile}
                      accept=".png,.jpg,.jpeg"
                      disabled={uploading}
                    />
                    <Button
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      disabled={uploading}
                      variant="outline"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        "Selecionar arquivo"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              onClick={handleProceed}
              disabled={!selectedFile}
              className="w-full sm:w-auto"
            >
              {selectedFile ? "Confirmar seleção" : "Selecione uma imagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      {previewImage && (
        <Dialog
          open={!!previewImage}
          onOpenChange={(open) => !open && setPreviewImage(null)}
        >
          <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {previewImage.name}
              </DialogTitle>
              <DialogDescription>
                {isImageFile(previewImage.type)
                  ? `Imagem ${(previewImage.size / 1024 / 1024).toFixed(2)} MB`
                  : `Arquivo ${(previewImage.size / 1024 / 1024).toFixed(
                      2
                    )} MB`}
              </DialogDescription>
            </DialogHeader>
            <div className="relative w-full h-[60vh] flex-grow bg-black/5 rounded-md overflow-hidden">
              {isImageFile(previewImage.type) ? (
                <Image
                  src={previewImage.url || "/placeholder.svg"}
                  alt={previewImage.name}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-20 w-20 text-muted-foreground" />
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between w-full">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(previewImage.url, "_blank")}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    deleteFile(previewImage.name);
                    setPreviewImage(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewImage(null)}>
                  Voltar para galeria
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFile(previewImage);
                    handleProceed();
                  }}
                >
                  Selecionar e concluir
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default GaleriaPopup;
