"use client";

import type React from "react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  Download,
  Eye,
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export interface FileObject {
  name: string;
  size: number;
  type: string;
  url: string;
  qtd: number; // Número de itens para pastas
}

export default function GaleriaPage() {
  const [files, setFiles] = useState<FileObject[]>([]); // Estado para os arquivos
  const [filteredFiles, setFilteredFiles] = useState<FileObject[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileObject | null>(null); // Apenas 1 arquivo selecionado
  const [previewImage, setPreviewImage] = useState<FileObject | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("gallery");

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
      setActiveTab("gallery");
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
        setActiveTab("gallery");
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      if (selectedFile?.name === fileName) {
        console.log("Removendo arquivo1:", fileName);
        setSelectedFile(null);
      }

      if (previewImage?.name === fileName) {
        console.log("Removendo arquivo25:", fileName);
        setPreviewImage(null);
      }
      console.log("Removendo arquivo1:", fileName);

      const { data, error } = await supabase.storage
        .from("galeria")
        .remove([`/${fileName}`]);

      if (error) {
        console.error("Error removing file:", error);

        return;
      }

      console.log("File removed successfully:", data);
      console.log("Removendo arquivo:", fileName);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Função para selecionar apenas 1 imagem
  const handleSelectImage = (file: FileObject) => {
    setSelectedFile(file); // Seleciona a imagem
  };

  // Função para abrir o preview
  const handleOpenPreview = (file: FileObject, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImage(file);
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

  useEffect(() => {
    fetchFiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Galeria de Imagens</h1>
          <p className="text-muted-foreground">
            Gerencie suas imagens e arquivos
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
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
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="gallery">Galeria</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery">
          {filteredFiles.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredFiles.map((file) => (
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
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleOpenPreview(file, e)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
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
                  <div className="p-3">
                    <div className="truncate text-sm font-medium">
                      {file.name}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs h-6">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(file.url, "_blank");
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteFile(file.name);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Nenhuma imagem encontrada
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                {searchTerm
                  ? "Não encontramos nenhuma imagem com esse termo. Tente outra pesquisa."
                  : "Sua galeria está vazia. Faça upload de imagens para começar."}
              </p>
              <Button onClick={() => setActiveTab("upload")}>
                <Upload className="h-4 w-4 mr-2" />
                Fazer upload
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[400px]",
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
            <div className="flex flex-col items-center max-w-md mx-auto">
              <Upload
                className={cn(
                  "h-12 w-12 mb-6",
                  dragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <h3 className="font-medium text-xl mb-3">
                {dragActive
                  ? "Solte para fazer upload"
                  : "Arraste e solte sua imagem aqui"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
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
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar arquivo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={async () => {
                    await deleteFile(previewImage.name);
                    setPreviewImage(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewImage(null)}>
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFile(previewImage);
                    setPreviewImage(null);
                  }}
                >
                  Selecionar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
