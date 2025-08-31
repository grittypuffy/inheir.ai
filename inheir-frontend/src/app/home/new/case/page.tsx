"use client"

import { Field, Input, Toast, Toaster, ToastIntent, ToastPosition, ToastTitle, useId, useToastController } from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const CreateCase = () => {
  const router = useRouter();
  const toasterId = useId("toaster-id")
  const { dispatchToast } = useToastController(toasterId)
  const ToastMessage = (message: string, intent: ToastIntent = "success", position: ToastPosition = "bottom-end") => {
    dispatchToast(
      <>
        <Toast>
          <ToastTitle className="text-lg font-semibold">{message}</ToastTitle>
        </Toast>
      </>,
      {
        intent,
        position: position,
      });
  }

  const [formData, setFormData] = useState({
    title: "",
    address: "",
  });

  const [mainDocument, setMainDocument] = useState<File | null>(null);
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([]);

  const mainDocumentRef = useRef<HTMLInputElement>(null);
  const supportingDocumentsRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMainDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMainDocument(e.target.files[0]);
    }
  };

  const handleSupportingDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSupportingDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const removeSupportingDocument = (index: number) => {
    setSupportingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const resetMainDocument = () => {
    setMainDocument(null);
    if (mainDocumentRef.current) {
      mainDocumentRef.current.value = "";
    }
  };

  const clearSupportingDocuments = () => {
    setSupportingDocuments([]);
    if (supportingDocumentsRef.current) {
      supportingDocumentsRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const submitData = new FormData();
    if (mainDocument) {
      submitData.append("document", mainDocument);
    }
    supportingDocuments.forEach((file, _) => {
      submitData.append(`supporting_documents`, file);
    });
    try {
      const res: Response = await fetch(`/api/v1/case/create?title=${formData.title}&address=${formData.address}`, {
        method: 'POST',
        body: submitData,
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data:any = await res.json();
        const case_id = data.case_id;
        router.push(`/home/case/${case_id}`)
      } else {
        ToastMessage("Error creating case. Please try again.", "error");
      }
    } catch (error) {
      ToastMessage("An unexpected error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="min-w-14 md:1/2 max-w-2xl p-6 bg-white rounded-lg shadow">
        <Toaster toasterId={toasterId} />
        <h1 className="text-2xl font-bold mb-6 text-center">Create a New Case</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Field label="Case Title" required>
              <Input
                type="text"
                id="title"
                name="title"
                required
                appearance="underline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"

                value={formData.title}
                onChange={handleInputChange}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Case Address" required>
              <Input
                type="text"
                id="address"
                name="address"
                required
                appearance="underline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Main Document" required>
              <div className="flex flex-col w-full border-2 border-gray-300 border-dashed rounded-lg p-4 bg-gray-50">
                <input
                  ref={mainDocumentRef}
                  id="mainDocument"
                  type="file"
                  className="w-full"
                  required={!mainDocument}
                  onChange={handleMainDocumentChange}
                />
                <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                  <span>
                    {mainDocument
                      ? `Selected file: ${mainDocument.name}`
                      : "No file selected"}
                  </span>
                  {mainDocument && (
                    <button
                      type="button"
                      onClick={resetMainDocument}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      x
                    </button>
                  )}
                </div>
              </div>
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Supporting Documents (Optional)" required>
              <div className="flex flex-col w-full border-2 border-gray-300 border-dashed rounded-lg p-4 bg-gray-50">
                <input
                  ref={supportingDocumentsRef}
                  id="supportingDocuments"
                  type="file"
                  multiple
                  className="w-full"
                  onChange={handleSupportingDocumentsChange}
                />
                <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                  <span>Selected files: {supportingDocuments.length}</span>
                  {supportingDocuments.length > 0 && (
                    <button
                      type="button"
                      onClick={clearSupportingDocuments}
                      className="text-red-500 hover:text-red-700 focus:outline-none text-sm"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {supportingDocuments.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    <ul className="text-sm">
                      {supportingDocuments.map((file, index) => (
                        <li key={index} className="flex justify-between items-center py-1">
                          <span className="truncate max-w-xs">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeSupportingDocument(index)}
                            className="text-red-500 hover:text-red-700 focus:outline-none ml-2"
                          >
                            x
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Field>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Creating case...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <CreateCase />
    </>
  );
}
