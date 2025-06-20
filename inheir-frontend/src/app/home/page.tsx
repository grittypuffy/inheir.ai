"use client"

import CreateCase from "@/lib/components/CreateCaseForm";
import { getItem, isMobileDevice } from "@/lib/utils";
import { CaseMetaResponse, CaseResponse, CaseStatus } from "@/lib/validators/types";
import {
  Button,
  SelectTabData, SelectTabEvent,
  Tab, TabList, Toast,
  ToastBody,
  Toaster, ToastIntent, ToastPosition, ToastTitle,
  useId, useToastController
} from "@fluentui/react-components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const router = useRouter();
  const toasterId = useId("toaster-id")
  const { dispatchToast } = useToastController(toasterId)
  const ToastMessage = (
    { message, description }: { message: string; description?: string | undefined },
    intent: ToastIntent,
    position: ToastPosition = isMobileDevice() ? 'top' : 'bottom-end'
  ) => {
    dispatchToast(
      <>
        <Toast>
          <ToastTitle className="text-lg font-semibold">{message}</ToastTitle>
          <ToastBody className="text-sm">{description}</ToastBody>
        </Toast>
      </>,
      {
        intent,
        position,
      }
    );
  };

  const fullName = getItem("fullName") || "User";
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [cases, setCases] = useState<CaseResponse[]>([]);
  const [selectedTab, setSelectedTab] = useState<CaseStatus>('Open');

  const fetchCases = async () => {
    await fetch('/api/v1/case/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
      .then(async (res: Response) => {
        if (res.ok) {
          await res.json().then((data: { cases: CaseMetaResponse }) => {
            setIsFetching(false);
            setCases(data.cases.cases || []);
          });
        } else {
          setIsFetching(false);
          ToastMessage({ message: "Failed to fetch cases. Please try again later." }, "error");
        }
      })
      .catch((error) => {
        setIsFetching(false);
        console.error("Error fetching cases:", error);
        ToastMessage({ message: "An error occurred while fetching cases." }, "error");
      });
  }

  const renderCases = (status: CaseStatus) => {
    const filteredCases = cases.filter((caseItem) => caseItem.status === status);
    return (
      filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCases.map((caseItem, index) => (
            <div key={index} className="border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
              <h3 className="text-xl font-semibold text-gray-800 mb-2 text-wrap">{caseItem.title}</h3>
              <p className="text-sm text-gray-600 mb-4">Status: <span className={`font-medium ${caseItem.status === 'Open' ? 'text-green-600' :
                caseItem.status === 'Resolved' ? 'text-blue-600' : 'text-red-600'
                }`}>{caseItem.status}</span></p>
              <Button
                appearance="primary"
                onClick={() => {
                  ToastMessage({ message: `Navigating to case ${caseItem.title}`, description: "Please wait! redirecting..." }, "info", "bottom");
                  setTimeout(() => router.push(`/home/case/${caseItem.case_id}`), 500);
                }}
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                View Case
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-center py-12 text-gray-500 font-semibold text-lg">No cases available for {status} status.</p>
        </>
      )
    )
  }

  useEffect(() => {
    fetchCases();
  }, [])

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 md:p-10 lg:p-16 bg-gray-50">
      <Toaster toasterId={toasterId} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Greetings, <span className="text-blue-600">{fullName}</span></h1>
      </div>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-row w-full justify-between gap-3 items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Your cases</h1>
          <CreateCase />
        </div>
        <div className="mt-4">
          <div className="mt-4">
            <TabList
              className="bg-gray-100 rounded-lg p-1"
              onTabSelect={(_: SelectTabEvent, data: SelectTabData) => {
                setSelectedTab(data.value as CaseStatus);
              }}
            >
              <Tab value={'Open'} className="font-medium">Opened</Tab>
              <Tab value={'Resolved'} className="font-medium">Resolved</Tab>
              <Tab value={'Aborted'} className="font-medium">Aborted</Tab>
            </TabList>
          </div>
          <div className="mt-6 max-h-[70vh] overflow-y-auto px-1">
            {isFetching ? (
              <p className="text-center py-8 text-gray-500 animate-pulse">Loading cases...</p>
            ) : cases.length > 0 ?
              renderCases(selectedTab)
              : (
                <p className="text-center py-8 text-gray-500">No cases available.</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
