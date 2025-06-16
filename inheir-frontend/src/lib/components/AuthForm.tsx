"use client"
import { isSignedIn, redirectIfSignedIn, signIn } from "@/lib/utils";
import { SignInSchema, SignUpSchema } from "@/lib/validators/schema";
import { SignUpData } from "@/lib/validators/types";
import type { InputOnChangeData, SelectTabData, TabValue, ToastIntent, ToastPosition } from "@fluentui/react-components";
import { Button, Field, Input, Spinner, Tab, TabList, Toast, ToastBody, Toaster, ToastTitle, useId, useToastController } from "@fluentui/react-components";
import { setTimeout } from "node:timers";
import React, { useEffect, useState } from "react";
import * as v from "valibot";


const AuthForm = () => {
  const [formType, setFormType] = useState<TabValue>('signup');
  const [formData, setFormData] = useState<SignUpData>({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });

  const [validMsg, setValidMsg] = useState<{ [key: string]: string }>({
    name: "",
    email: "",
    password: ""
  });

  const [focusState, setFocusState] = useState(false);
  const onFocusChange = (isFocused: boolean) => {
    setFocusState(isFocused);
  };

  const [isValidUserName, setIsValidUserName] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetFormData = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      full_name: "",
    });
    setValidMsg({
      username: "",
      email: "",
      password: "",
      full_name: "",
    });
  }

  const resetValidMsg = () => {
    setValidMsg({
      username: "",
      email: "",
      password: "",
      full_name: "",
    });
  }

  const toasterId = useId("toaster-id");
  const { dispatchToast } = useToastController(toasterId);
  const ToastMessage = ({ message, description }: { message: string, description?: string | undefined }, intent: ToastIntent, position: ToastPosition = "bottom-end") => {
    dispatchToast(
      <>
        <Toast>
          <ToastTitle className="text-lg font-semibold">{message}</ToastTitle>
          <ToastBody className="text-sm">
            {description}
          </ToastBody>
        </Toast>
      </>,
      {
        intent,
        position,
      });
  }

  const onTabHandler = (_: SelectTabData, data: SelectTabData) => {
    setFormType(data.value);
    resetFormData();
    resetValidMsg();
    setIsValidUserName(false);
    setIsChecking(false);
    setIsLoading(false);
  };

  const validateFormData = () => {
    const res = v.safeParse(formType === "signup" ? SignUpSchema : SignInSchema, formData);
    const newValidMsg: { [key: string]: string } = {
      username: "",
      email: "",
      password: "",
      full_name: "",
    };

    if (!res.success) {
      res.issues.forEach(issue => {
        if (issue.path) {
          issue.path.forEach((path) => {
            if (path.key === "username") {
              newValidMsg.username = issue.message;
            }
            if (path.key === "email") {
              newValidMsg.email = issue.message;
            }
            if (path.key === "password") {
              newValidMsg.password = issue.message;
            }
            if (path.key === "full_name") {
              newValidMsg.full_name = issue.message;
            }
          });
        }
      });
    }
    setValidMsg(newValidMsg)
    return res.success;
  }

  const signUpHandler = async (e: React.FormEvent) => {
    e.preventDefault()
    ToastMessage({ message: "Signing Up..", description: "" }, "info")
    setIsLoading(true);
    setTimeout(async () => {
      if (validateFormData()) {
        const res: Response = await fetch('/api/v1/auth/sign_up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          ToastMessage({ message: "Sign Up Failed", description: "Incorrect credentials! Try again." }, "error");
        } else {
          ToastMessage({ message: "Sign Up Successful", description: "Redirecting..." }, "success");
          setTimeout(() => signIn(), 600);
        }
        setIsLoading(false);
      }
    }, 500)
  }

  const signInHandler = (e: React.FormEvent) => {
    e.preventDefault();
    ToastMessage({ message: "Signing In.." }, "info")
    setIsLoading(true);
    setTimeout(async () => {
      if (validateFormData()) {
        const res: Response = await fetch('/api/v1/auth/sign_in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          })
        });

        if (!res.ok) {
          ToastMessage({ message: "Sign In Failed", description: "Incorrect credentials! Try again." }, "error");
        } else {
          ToastMessage({ message: "Sign In Successful", description: "Redirecting..." }, "success");
          setTimeout(() => signIn(), 600);
        }
        setIsLoading(false);
      }
    }, 500);
  }

  const validateUserName = () => {
    if (isValidUserName) {
      setIsValidUserName(false);
      setValidMsg(prev => ({ ...prev, username: "" }));
      return;
    }
    setIsChecking(true);
    setTimeout(async () => {
      const res: Response = await fetch(`/api/v1/auth/${formData.username}/valid`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        setValidMsg(prev => ({ ...prev, username: "Username is already taken" }));
        setIsChecking(false);
        return;
      }
      setValidMsg(prev => ({ ...prev, username: `Username "${formData.username}" is available` }));
      setIsValidUserName(true);
      setIsChecking(false);
    }, 500);
  }

  useEffect(() => {
    if (isSignedIn()) {
      redirectIfSignedIn();
    }
    if (focusState) {
      validateFormData();
    }
  }, [formData, focusState]);

  return (
    <div className="flex flex-col gap-5 items-center lg:justify-center surround w-full lg:w-1/3 bg-gray-100 border-t-4 border-b-4 border-dotted lg:border-l-6 lg:border-t-0 lg:border-b-0 lg:h-screen">
      <Toaster toasterId={toasterId} />
      <div>
        <TabList selectedValue={formType} onTabSelect={onTabHandler}>
          <Tab value={`signup`}>Sign Up</Tab>
          <Tab value={`signin`}>Sign In</Tab>
        </TabList>
      </div>
      <div className="flex flex-col w-fit p-6">
        {formType === 'signup' ? (
          <form
            onSubmit={signUpHandler}
            className="flex flex-col gap-3 transition duration-500 ease-in-out"
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
          >
            <div className="flex flex-col w-full gap-3 transition duration-300 ease-in-out transform translate-y-0 opacity-100">
              <Field
                label="Username"
                validationState={isValidUserName ? "success" : validMsg.username ? "error" : "none"}
                validationMessage={validMsg.username}
              >
                <Input
                  value={formData.username}
                  appearance="underline"
                  className="w-full"
                  onChange={(_: any, data: InputOnChangeData) => {
                    setFormData(prev => ({ ...prev, username: data.value }))
                  }}
                  disabled={isValidUserName}
                />
              </Field>
              <Button
                className={`w-full transition duration-250 ease-in-out transform hover:shadow-md`}
                onClick={validateUserName}
                disabled={!formData.username.length || isChecking}
              >
                {isChecking ? (<Spinner size="extra-small" />) : isValidUserName ? "Change Username" : "Check Username"}
              </Button>
              {isValidUserName &&
                (
                  <>
                    <Field
                      label="Full Name"
                      validationState={validMsg.full_name ? "error" : "none"}
                      validationMessage={validMsg.full_name}
                    >
                      <Input
                        value={formData.full_name}
                        appearance="underline"
                        onChange={(_: any, data: InputOnChangeData) => {
                          setFormData(prev => ({ ...prev, full_name: data.value }))
                        }}
                      />
                    </Field>
                    <Field
                      label="Email"
                      validationState={validMsg.email ? "error" : "none"}
                      validationMessage={validMsg.email}
                    >
                      <Input
                        value={formData.email}
                        appearance="underline"
                        onChange={(_: any, data: InputOnChangeData) => {
                          setFormData(prev => ({ ...prev, email: data.value }))
                        }}
                      />
                    </Field>
                    <Field
                      label="Password"
                      validationState={validMsg.password ? "error" : "none"}
                      validationMessage={validMsg.password}
                    >
                      <Input
                        value={formData.password}
                        appearance="underline"
                        onChange={(_: any, data: InputOnChangeData) => {
                          setFormData(prev => ({ ...prev, password: data.value }))
                        }}
                      />
                    </Field>
                    <Button type="submit" className="transition duration-250 ease-in-out transform hover:shadow-md">
                      {isLoading ? (<Spinner size="extra-small" />) : "Submit"}
                    </Button>
                  </>
                )
              }
            </div>
          </form>
        ) : (
          <form
            onSubmit={signInHandler}
            className="flex flex-col gap-3 transition duration-500 ease-in-out"
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
          >
            <Field
              label="Username"
              validationState={isValidUserName ? "success" : validMsg.username ? "error" : "none"}
              validationMessage={validMsg.username}
            >
              <Input
                value={formData.username}
                appearance="underline"
                onChange={(_: any, data: InputOnChangeData) => {
                  setFormData(prev => ({ ...prev, username: data.value }))
                }}
              />
            </Field>
            <Field
              label="Password"
              validationState={validMsg.password ? "error" : "none"}
              validationMessage={validMsg.password}
            >
              <Input
                value={formData.password}
                appearance="underline"
                onChange={(_: any, data: InputOnChangeData) => {
                  setFormData(prev => ({ ...prev, password: data.value }))
                }}
              />
            </Field>
            <Button type="submit" className="transition duration-250 ease-in-out transform hover:shadow-md">
              {isLoading ? (<Spinner size="extra-small" />) : "Submit"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthForm;
