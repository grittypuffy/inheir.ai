"use client"
import AppContainer from "@/lib/components/AppContainer";
import { protect, signOut } from "@/lib/utils";
import { Button, Toast, Toaster, ToastIntent, ToastPosition, ToastTitle, useId, useToastController } from "@fluentui/react-components";
import { setTimeout } from "node:timers";

const Dashboard = () => {
  const toasterId = useId("toaster-id")
  const { dispatchToast } = useToastController(toasterId)

  const ToastMessage = (message: string, intent: ToastIntent = "success", position: ToastPosition = "top-end") => {
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
      setTimeout(() => signOut(), 300)
    }
  }

  return (
    <AppContainer>
      <Toaster toasterId={toasterId} />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome to the Inheir.ai Dashboard!</h1>
        <Button onClick={logoutHandler}>
          Log out
        </Button>
      </div>
    </AppContainer>
  );
}

export default function Page() {
  return protect(Dashboard);
}
