"use client"

import AppContainer from "@/lib/components/AppContainer";
import { Cases } from "@/lib/components/Cases";
import { clearItems, getItem, isSignedOut } from "@/lib/utils";
import { Button, Hamburger, NavDrawer, NavDrawerBody, NavDrawerFooter, NavDrawerHeader, NavSectionHeader, Toast, Toaster, ToastIntent, ToastPosition, ToastTitle, useId, useToastController } from "@fluentui/react-components";
import { ArrowExit20Regular, HomeFilled } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setTimeout } from "timers";
const Dashboard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
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

  const [userName, setUserName] = useState<string>("User");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const logoutHandler = async () => {
    const res: Response = await fetch('/api/v1/auth/sign_out', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
    ToastMessage("Logging out successfully!",)
    if (res.ok) {
      setTimeout(() => {
        clearItems();
        router.push("/");
      }, 300)
    }
  }

  const [isNavBar, setNavBar] = useState<boolean>(false);

  const [isPageLoading, setIsPageLoading] = useState<boolean>(true);
  useEffect(() => {
    if (isSignedOut()) {
      router.push("/");
    } else {
      setIsPageLoading(false);
    }

    if (getItem("username")) {
      setUserName(getItem("username") || "User");
    }

    // Fetch admin status
    fetch("/api/v1/case/is_admin", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.is_admin) setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false));
  }, [])

  return (
    <AppContainer>
      <Toaster toasterId={toasterId} />
      <div className="flex flex-col lg:flex-row w-full min-h-screen">
        <div className="w-full lg:w-1/32 border-b-2 lg:border-b-0 lg:border-r-2 bg-gray-300 flex items-center justify-center">
          <Hamburger
            size="large"
            onClick={() => setNavBar(!isNavBar)}
          />
        </div>
        <NavDrawer
          open={isNavBar}
        >
          <NavDrawerHeader
            className="border-b-2 border-r-2"
          >
            <div className="flex flex-col my-5 gap-y-3 flex-nowrap">
              <div className="flex flex-row justify-between">
                <Hamburger
                  size="medium"
                  appearance="primary"
                  shape="circular"
                  onClick={() => setNavBar(!isNavBar)}
                />
                <Button
                  onClick={() => router.push("/home")}
                  size="large"
                  shape="circular"
                >
                  <span className="flex items-center gap-x-2">
                    Home <HomeFilled fontSize={18} />
                  </span>
                </Button>
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-semibold">Welcome to Inheir.ai</h1>
                <span className="text-md lg:text-xl">{userName}</span>
              </div>
              <Button
                appearance="primary"
                size="medium"
                className="mb-2 w-full"
                style={{ minHeight: '40px' }}
                onClick={() => {
                  setNavBar(false);
                  router.push("/home/report");
                }}
              >
                Report Property
              </Button>
              {isAdmin && (
                <Button
                  appearance="secondary"
                  size="medium"
                  className="mb-2 w-full"
                  style={{ minHeight: '40px' }}
                  onClick={() => {
                    setNavBar(false);
                    router.push("/home/report/dashboard");
                  }}
                >
                  Report Dashboard
                </Button>
              )}
              <button
                onClick={logoutHandler}
                className="text-sm lg:text-lg text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-400 w-full"
                style={{ minHeight: '40px' }}
              >
                <span className="w-full flex items-center justify-center gap-2">
                  Logout <ArrowExit20Regular />
                </span>
              </button>
            </div>
          </NavDrawerHeader>
          <NavDrawerBody
            className="border-r-2"
          >
            <NavSectionHeader>
              <span className="text-lg lg:text-xl font-semibold">Cases</span>
            </NavSectionHeader>
            <Cases />
          </NavDrawerBody>
          <NavDrawerFooter
            className="border-t-2 border-r-2"
          >
            <div className="flex flex-col gap-y-2 m-3">
              <span className="text-sm lg:text-md text-gray-500">Version 1.0.0</span>
              <span className="text-sm lg:text-md text-gray-500">Copyright © 2025 Inheir.ai. All rights reserved.</span>
            </div>
          </NavDrawerFooter>
        </NavDrawer>
        <div className="flex flex-col w-full h-screen">
          {isPageLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <h1 className="text-lg font-bold">Loading...</h1>
            </div>
          ) : (
            <>
              {children}
            </>
          )}
        </div>
      </div>
    </AppContainer>
  );
}

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Dashboard>
      {children}
    </Dashboard>
  );
}
