"use client"
import { SignInSchema, SignUpSchema } from "@/lib/validators/schema";
import { SignUpData } from "@/lib/validators/types";
import type { InputOnChangeData, SelectTabData, TabValue } from "@fluentui/react-components";
import { Button, Field, Input, Tab, TabList } from "@fluentui/react-components";
import React, { useEffect, useState } from "react";
import * as v from "valibot";

const AuthForm = () => {
  const [formType, setFormType] = useState<TabValue>('signup');
  const [formData, setFormData] = useState<SignUpData>({
    name: "",
    email: "",
    password: ""
  });

  const [validMsg, setValidMsg] = useState<{ [key: string]: string }>({
    name: "",
    email: "",
    password: ""
  });

  const resetFormData = () => {
    setFormData({
      name: "",
      email: "",
      password: ""
    });
    setValidMsg({
      name: "",
      email: "",
      password: ""
    });
  }

  const validateFormData = () => {
    const res = v.safeParse(formType === "signup" ? SignUpSchema : SignInSchema, formData);
    const newValidMsg: { [key: string]: string } = {
      name: "",
      email: "",
      password: ""
    };

    if (!res.success) {
      res.issues.forEach(issue => {
        if (issue.path) {
          issue.path.forEach((path) => {
            if (path.key === "name") {
              newValidMsg.name = issue.message;
            }
            if (path.key === "email") {
              newValidMsg.email = issue.message;
            }
            if (path.key === "password") {
              newValidMsg.password = issue.message;
            }
          });
        }
      });
    }
    setValidMsg(newValidMsg);
  }

  const onTabHandler = (_: SelectTabData, data: SelectTabData) => {
    setFormType(data.value);
    resetFormData();
  };

  const onSubmitHandler = (e: React.FormEvent) => {
    e.preventDefault()
    validateFormData();
  }

  const [focusState, setFocusState] = useState(false);
  const onFocusChange = (isFocused: boolean) => {
    setFocusState(isFocused);
  };

  useEffect(() => {
    if (focusState) {
      validateFormData();
    }
  }, [formData, focusState]);

  return (
    <div className="flex flex-col gap-5 items-center lg:justify-center surround w-full lg:w-1/3 bg-gray-100 border-t-4 border-b-4 border-dotted lg:border-l-4 lg:border-t-0 lg:border-b-0 lg:h-screen">
      <div>
        <TabList selectedValue={formType} onTabSelect={onTabHandler}>
          <Tab value={`signup`}>Sign Up</Tab>
          <Tab value={`signin`}>Sign In</Tab>
        </TabList>
      </div>
      <div className="flex flex-col w-fit p-6">
        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col gap-3 transition duration-500 ease-in-out"
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
        >
          {formType === 'signup' && (
            <div className="transition duration-300 ease-in-out transform translate-y-0 opacity-100 animate-fadeIn">
              <Field
                label="Name"
                validationState={validMsg.name ? "error" : "none"}
                validationMessage={validMsg.name}
              >
                <Input
                  value={formData.name}
                  onChange={(_: any, data: InputOnChangeData) => {
                    setFormData(prev => ({ ...prev, name: data.value }))
                  }}
                />
              </Field>
            </div>
          )}
          <Field
            label="Email"
            className="transition duration-300 ease-in-out transform translate-y-0 opacity-100 animate-fadeIn"
            validationState={validMsg.email ? "error" : "none"}
            validationMessage={validMsg.email}
          >
            <Input
              value={formData.email}
              onChange={(_: any, data: InputOnChangeData) => {
                setFormData(prev => ({ ...prev, email: data.value }))
              }}
            />
          </Field>
          <Field
            label="Password"
            className="transition duration-300 ease-in-out transform translate-y-0 opacity-100 animate-fadeIn"
            validationState={validMsg.password ? "error" : "none"}
            validationMessage={validMsg.password}
          >
            <Input
              value={formData.password}
              onChange={(_: any, data: InputOnChangeData) => {
                setFormData(prev => ({ ...prev, password: data.value }))
              }}
            />
          </Field>
          <Button type="submit" className="transition duration-250 ease-in-out transform hover:shadow-md">Submit</Button>
        </form>
      </div>
    </div>
  );
}

export default AuthForm;
