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
  const downloadUrl = `/api/sources/files/${fileUrl.split('/').pop()}`;

  // Use Office Online viewer for DOCX/PPTX via iframe
  // The file is served from our API, so we use a direct embed approach
  const encodedUrl = encodeURIComponent(
    typeof window !== 'undefined'
      ? `${window.location.origin}${downloadUrl}`
      : downloadUrl,
  );
  const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
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

      {/* Document display */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <iframe
          src={officeViewerUrl}
          className="w-full h-full border-0"
          style={{ minHeight: '700px' }}
          title={fileName}
          sandbox="allow-scripts allow-popups"
        />

        {/* Fallback download option */}
        <noscript>
          <div className="text-center py-12 px-4">
            <div className="flex justify-center mb-4">
              {getFileIcon(ext)}
            </div>
            <h4 className="font-medium text-lg">{fileName}</h4>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              The document viewer could not load. You can download the file to view it locally.
            </p>
            <Button className="mt-4" asChild>
              <a href={downloadUrl} download={fileName}>
                <Download className="h-4 w-4 mr-2" />
                Download {getFileLabel(ext)}
              </a>
            </Button>
          </div>
        </noscript>
      </div>
    </div>
  );
}
