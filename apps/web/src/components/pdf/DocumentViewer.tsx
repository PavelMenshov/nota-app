'use client';

import React from 'react';
import { FileText, Presentation, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  sourceId?: string;
  fileName: string;
  fileUrl: string;
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function getFileIcon(ext: string) {
  switch (ext) {
    case 'pptx':
    case 'ppt':
      return <Presentation className="h-16 w-16 text-orange-500" />;
    default:
      return <FileText className="h-16 w-16 text-blue-500" />;
  }
}

function getFileLabel(ext: string): string {
  switch (ext) {
    case 'docx':
    case 'doc':
      return 'Word Document';
    case 'pptx':
    case 'ppt':
      return 'PowerPoint Presentation';
    default:
      return 'Document';
  }
}

export default function DocumentViewer({ fileName, fileUrl }: DocumentViewerProps) {
  const ext = getFileExtension(fileName);
  const key = fileUrl.split('/').pop() || '';
  const downloadUrl = `/api/sources/files/${key}`;
  const isPptx = ext === 'pptx' || ext === 'ppt';

  // PPTX/PPT: Office viewer requires a public URL (ours is auth-protected), so show download-only message
  if (isPptx) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
          <span className="text-sm font-medium truncate max-w-48">{fileName}</span>
          <span className="text-xs text-muted-foreground">Presentation</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
            <a href={downloadUrl} download={fileName}>
              <Download className="h-3 w-3" />
              Download
            </a>
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-muted/30">
          <Presentation className="h-16 w-16 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Presentations cannot be previewed in the browser. Download the file to open it in PowerPoint or another app.
          </p>
          <Button asChild>
            <a href={downloadUrl} download={fileName}>
              <Download className="h-4 w-4 mr-2" />
              Download {fileName}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // DOCX: try Office viewer (may fail if URL is not public)
  const encodedUrl = encodeURIComponent(
    typeof window !== 'undefined' ? `${window.location.origin}${downloadUrl}` : downloadUrl,
  );
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
        <span className="text-sm font-medium truncate max-w-48">{fileName}</span>
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-xs text-muted-foreground">{getFileLabel(ext)}</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
          <a href={downloadUrl} download={fileName}>
            <Download className="h-3 w-3" />
            Download
          </a>
        </Button>
      </div>
      <div className="flex-1 overflow-auto bg-gray-100">
        <iframe
          src={officeViewerUrl}
          className="w-full h-full border-0"
          style={{ minHeight: '700px' }}
          title={fileName}
          sandbox="allow-scripts allow-popups"
        />
        <div className="hidden">
          <div className="text-center py-12 px-4">
            <div className="flex justify-center mb-4">{getFileIcon(ext)}</div>
            <p className="text-sm text-muted-foreground mt-2">Preview not available. Download to view locally.</p>
            <Button className="mt-4" asChild>
              <a href={downloadUrl} download={fileName}>
                <Download className="h-4 w-4 mr-2" /> Download
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
