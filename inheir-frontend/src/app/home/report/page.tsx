"use client"

import { Field, Input, Textarea, Toast, Toaster, ToastIntent, ToastPosition, ToastTitle, useId, useToastController } from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const SubmitReport = () => {
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
    full_name: "",
    email: "",
    report: "",
    address: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const res: Response = await fetch(`/api/v1/report/create`, {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (res.ok) {
        const report_id: string = await res.json();
        ToastMessage("Successfully submitted report. Thank you for reporting.", "success");
        setTimeout(() => router.push(`/home`), 3000)
      } else {
        ToastMessage("Error creating case. Please try again.", "error");
      }
    } catch (error) {
      ToastMessage("An unexpected error occurred. Please try again.", "error");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-2xl md:1/2 max-w-2xl p-6 bg-white rounded-lg shadow">
        <Toaster toasterId={toasterId} />
        <h1 className="text-2xl font-bold mb-6 text-center">Submit a new report</h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Field label="Full Name">
              <Input
                type="text"
                id="full_name"
                name="full_name"
                required
                appearance="underline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.full_name}
                onChange={handleInputChange}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Email Address">
              <Input
                type="email"
                id="email"
                name="email"
                required
                appearance="underline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Field>
          </div>

          <div className="space-y-2">
            <Field label="Address" required>
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
            <Field label="Reason for reporting" required>
              <Textarea
                id="report"
                name="report"
                required
                maxHeight="8"
                appearance="outline"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.report}
                resize="vertical"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, report: e.target.value }))}
              />
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
            >
              Submit Report
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
      <SubmitReport />
    </>
  );
}
