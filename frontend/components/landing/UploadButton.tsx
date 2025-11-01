'use client';

import React, { useRef } from 'react';

const UploadButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      alert(`File "${file.name}" selected. Upload functionality will be implemented here.`);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePolycamScan = () => {
    alert('Polycam scan will open. This feature will integrate with Polycam API for 3D scanning.');
  };

  return (
    <div className="h-full w-full card-military backdrop-blur-sm p-6 overflow-y-auto">
      <div className="flex flex-col items-center justify-center h-full gap-6">
        {/* Upload Files Section */}
        <div className="text-center">
          <button
            onClick={handleButtonClick}
            className="btn-military px-8 py-4 flex items-center gap-3 mx-auto"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Files
          </button>
          <p className="text-[#8B949E] text-sm mt-4 font-sans">
            Upload tank models, specifications, or documentation
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            multiple
            accept=".glb,.gltf,.obj,.json,.pdf,.txt"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-md">
          <div className="flex-1 h-px bg-white/8"></div>
          <span className="text-[#8B949E] text-xs font-sans">OR</span>
          <div className="flex-1 h-px bg-white/8"></div>
        </div>

        {/* Polycam Scan Section */}
        <div className="text-center">
          <button
            onClick={handlePolycamScan}
            className="btn-military px-8 py-4 flex items-center gap-3 mx-auto"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Scan with Polycam
          </button>
          <p className="text-[#8B949E] text-sm mt-4 font-sans">
            Scan parts or objects using Polycam 3D scanning
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadButton;

