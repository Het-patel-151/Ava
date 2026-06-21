import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Upload, Trash2, FileText, Image, File, Eye, X } from 'lucide-react';
import { fileApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import { formatBytes, formatRelativeTime } from '@/lib/utils';

interface UploadedFile { id: string; originalName: string; url: string; mimeType: string; size: number; summary?: string; createdAt: string; }

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) return <Image className="w-6 h-6 text-blue-400" />;
  if (mimeType === 'application/pdf') return <FileText className="w-6 h-6 text-red-400" />;
  return <File className="w-6 h-6 text-muted-foreground" />;
}

export default function FilesPage() {
  const qc = useQueryClient();
  const [preview, setPreview] = useState<UploadedFile | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => fileApi.list().then(r => r.data.data as UploadedFile[]),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => fileApi.upload(formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['files'] }); toast.success('File uploaded'); },
    onError: () => toast.error('Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fileApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['files'] }); toast.success('File deleted'); },
  });

  const onDrop = useCallback((accepted: File[]) => {
    accepted.forEach(file => {
      const fd = new FormData();
      fd.append('file', file);
      uploadMutation.mutate(fd);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024,
    accept: { 'image/*': [], 'application/pdf': [], 'text/*': [], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Files</h1>
        <p className="text-sm text-muted-foreground">Upload documents for AI analysis and Q&A</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-medium">{isDragActive ? 'Drop files here' : 'Drag & drop files here'}</p>
        <p className="text-sm text-muted-foreground mt-1">or click to browse — PDF, DOCX, images, TXT up to 10MB</p>
        {uploadMutation.isPending && <p className="text-sm text-primary mt-2 animate-pulse">Uploading…</p>}
      </div>

      {/* Files grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file, i) => (
            <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass border-border/50 hover:border-primary/30 transition-all group">
                <CardContent className="p-4 flex items-center gap-3">
                  <FileIcon mimeType={file.mimeType} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(file.createdAt)}</span>
                      {file.summary && <Badge variant="success" className="text-[10px] py-0">Analyzed</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" onClick={() => setPreview(file)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteMutation.mutate(file.id)} className="hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold truncate">{preview.originalName}</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setPreview(null)}><X className="w-4 h-4" /></Button>
            </div>
            {preview.mimeType.startsWith('image/') && <img src={preview.url} alt={preview.originalName} className="w-full rounded-xl" />}
            {preview.summary && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">AI Summary</p>
                <p className="text-sm">{preview.summary}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
