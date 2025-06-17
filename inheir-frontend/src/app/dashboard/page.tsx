"use client"
import AppContainer from "@/lib/components/AppContainer";
import { Cases } from "@/lib/components/Cases";
import { getItem, isSignedOut, signOut } from "@/lib/utils";
import { Hamburger, NavDrawer, NavDrawerBody, NavDrawerFooter, NavDrawerHeader, NavSectionHeader, Toast, Toaster, ToastIntent, ToastPosition, ToastTitle, useId, useToastController } from "@fluentui/react-components";
import { ArrowExit20Regular } from "@fluentui/react-icons";
import { redirect } from "next/navigation";
import { setTimeout } from "node:timers";
import { useEffect, useState } from "react";

const Dashboard = () => {
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
      setTimeout(signOut, 300)
    }
  }

  const [isNavBar, setNavBar] = useState<boolean>(false);

  useEffect(() => {
    if (isSignedOut()) {
      redirect("/");
    }
    if (getItem("username")) {
      setUserName(getItem("username") || "User");
    }
  }, [])

  return (
    <AppContainer>
      <Toaster toasterId={toasterId} />
      <div className="flex flex-row border w-full min-h-screen">
        <div className="flex flex-col justify-items-start">
          <Hamburger
            size="large"
            onClick={() => setNavBar(!isNavBar)}
          />
        </div>
        <div className="flex flex-1 border bg-gray-400">
          <NavDrawer
            open={isNavBar}
          >
            <NavDrawerHeader
              className="border-b-4 border-r-4 border-dotted"
            >
              <div className="flex flex-col my-5 gap-y-3 flex-nowrap">
                <div>
                  <Hamburger
                    size="medium"
                    appearance="outline"
                    onClick={() => setNavBar(!isNavBar)}
                  />
                </div>
                <div>
                  <h1 className="text-lg lg:text-2xl font-semibold">Welcome to Inheir.ai</h1>
                  <span className="text-md lg:text-xl">{userName}</span>
                </div>
                <div onClick={logoutHandler}>
                  <span className="text-sm lg:text-lg text-red-400 hover:text-red-600 cursor-pointer">
                    Logout <ArrowExit20Regular />
                  </span>
                </div>
              </div>
            </NavDrawerHeader>
            <NavDrawerBody
              className="border-r-4 border-dotted"
            >
              <NavSectionHeader>
                <span className="text-lg lg:text-xl font-semibold">Cases</span>
              </NavSectionHeader>
              <Cases />
            </NavDrawerBody>
            <NavDrawerFooter
              className="border-t-4 border-r-4 border-dotted"
            >
              <div className="flex flex-col gap-y-2 m-3">
                <span className="text-sm lg:text-md text-gray-500">Version 1.0.0</span>
                <span className="text-sm lg:text-md text-gray-500">Copyright © 2025 Inheir.ai. All rights reserved.</span>
              </div>
            </NavDrawerFooter>
          </NavDrawer>
        </div>
      </div>
    </AppContainer>
  );
}

export default function Page() {
  return Dashboard();
}
