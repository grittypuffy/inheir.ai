'use client';
import { setItems } from '@/lib/utils';
import { SignInSchema, SignUpSchema } from '@/lib/validators/schema';
import { SignUpData } from '@/lib/validators/types';
import type {
  CheckboxOnChangeData,
  InputOnChangeData,
  SelectTabData,
  SelectTabEvent,
  TabValue,
  ToastIntent,
  ToastPosition,
} from '@fluentui/react-components';
import {
  Button,
  Checkbox,
  Field,
  Input,
  Spinner,
  Tab,
  TabList,
  Toast,
  ToastBody,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
} from '@fluentui/react-components';
import { EyeOffRegular, EyeRegular } from '@fluentui/react-icons';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { setTimeout } from 'timers';
import * as v from 'valibot';

const AuthForm = () => {
  const router = useRouter();
  const [formType, setFormType] = useState<TabValue>('signup');
  const [formData, setFormData] = useState<SignUpData>({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  const [validMsg, setValidMsg] = useState<{ [key: string]: string }>({
    name: '',
    email: '',
    password: '',
  });

  const [focusState, setFocusState] = useState(false);
  const onFocusChange = (isFocused: boolean) => {
    setFocusState(isFocused);
  };

  const [isValidUserName, setIsValidUserName] = useState(false);
  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const EyeToggleButton = (showPassword: boolean) => {
    return !showPassword ? (
      <EyeRegular
        className="cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
        title="Hide Password"
      />
    ) : (
      <EyeOffRegular
        className="cursor-pointer"
        onClick={() => setShowPassword(!showPassword)}
        title="Show Password"
      />
    );
  };

  const resetFormData = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
    });
    setValidMsg({
      username: '',
      email: '',
      password: '',
      full_name: '',
    });
  };

  const resetValidMsg = () => {
    setValidMsg({
      username: '',
      email: '',
      password: '',
      full_name: '',
    });
  };

  const toasterId = useId('toaster-id');
  const { dispatchToast } = useToastController(toasterId);
  const ToastMessage = (
    { message, description }: { message: string; description?: string | undefined },
    intent: ToastIntent,
    position: ToastPosition = 'bottom-end'
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

  const onTabHandler = (_: SelectTabEvent, data: SelectTabData) => {
    setFormType(data.value);
    resetFormData();
    resetValidMsg();
    setIsValidUserName(false);
    setIsChecking(false);
    setIsLoading(false);
    setIsPolicyAccepted(false);
  };

  const validateFormData = () => {
    const res = v.safeParse(formType === 'signup' ? SignUpSchema : SignInSchema, formData);
    const newValidMsg: { [key: string]: string } = {
      username: '',
      email: '',
      password: '',
      full_name: '',
    };

    if (!res.success) {
      res.issues.forEach((issue) => {
        if (issue.path) {
          issue.path.forEach((path) => {
            if (path.key === 'username') {
              newValidMsg.username = issue.message;
            }
            if (path.key === 'email') {
              newValidMsg.email = issue.message;
            }
            if (path.key === 'password') {
              newValidMsg.password = issue.message;
            }
            if (path.key === 'full_name') {
              newValidMsg.full_name = issue.message;
            }
          });
        }
      });
    }
    setValidMsg((prev) => ({
      username: !isValidUserName ? newValidMsg.username : prev.username,
      email: newValidMsg.email,
      password: newValidMsg.password,
      full_name: newValidMsg.full_name,
    }));
    return res.success;
  };

  const signUpHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(async () => {
      if (validateFormData()) {
        ToastMessage({ message: 'Signing Up..', description: '' }, 'info');
        console.log(formData)
        const res: Response = await fetch('/api/v1/auth/sign_up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          ToastMessage(
            { message: 'Sign Up Failed', description: 'Incorrect credentials! Try again.' },
            'error'
          );
        } else {
          ToastMessage({ message: 'Sign Up Successful', description: 'Redirecting...' }, 'success');
          const res: Response = await fetch('/api/v1/auth/sign_in', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: formData.username, password: formData.password }),
            credentials: 'include'
          });
          if (!res.ok) {
            router.push('/');
          } else {
            setTimeout(() => {
              setItems([
                { key: 'username', value: formData.username },
                { key: 'full_name', value: formData.full_name },
                { key: 'email', value: formData.email },
              ]);

              router.push('/home');
            }, 800);
          }
        }
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      ToastMessage(
        {
          message: 'Sign Up Failed',
          description: 'Improper data! Please follow the format specified',
        },
        'error'
      );
    }, 500);
  };

  const signInHandler = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(async () => {
      if (validateFormData()) {
        ToastMessage({ message: 'Signing In..' }, 'info');
        const res: Response = await fetch('/api/v1/auth/sign_in', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
          credentials: 'include',
        });

        if (!res.ok) {
          ToastMessage(
            { message: 'Sign In Failed', description: 'Incorrect credentials! Try again.' },
            'error'
          );
        } else {
          ToastMessage({ message: 'Sign In Successful', description: 'Redirecting...' }, 'success');
          setTimeout(() => {
            setItems([{ key: 'username', value: formData.username }]);
            router.push('/home');
          }, 400);
        }
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      ToastMessage(
        { message: 'Sign In Failed', description: 'Incorrect credentials! Try again.' },
        'error'
      );
    }, 500);
  };

  const validateUserName = () => {
    setIsChecking(true);
    if (isValidUserName) {
      setTimeout(() => {
        setIsValidUserName(false);
        setIsChecking(false);
      }, 300);
    } else {
      setTimeout(async () => {
        const res: Response = await fetch(`/api/v1/auth/${formData.username}/valid`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          setValidMsg((prev) => ({ ...prev, username: 'Username is already taken' }));
          setIsChecking(false);
          return;
        }
        setValidMsg((prev) => ({
          ...prev,
          username: `Username "${formData.username}" is available`,
        }));
        setIsValidUserName(true);
        setIsChecking(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (focusState) {
      validateFormData();
    }
  }, [formData, focusState]);

  return (
    <div className="flex flex-col gap-5 items-center lg:justify-center surround w-full lg:w-3/8 bg-gray-100 border-t-4 border-b-4 border-dotted lg:border-l-6 lg:border-t-0 lg:border-b-0 lg:h-screen">
      <Toaster toasterId={toasterId} />
      <div>
        <TabList selectedValue={formType} onTabSelect={onTabHandler}>
          <Tab value={`signup`}>Sign Up</Tab>
          <Tab value={`signin`}>Sign In</Tab>
        </TabList>
      </div>
      <div
        className="flex flex-col w-full p-6 items-center gap-y-5"
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
      >
        {formType === 'signup' ? (
          <>
            <form
              onSubmit={validateUserName}
              className="flex flex-col gap-3 w-full max-w-md items-center"
            >
              <Field
                label="Username"
                validationState={isValidUserName ? 'success' : validMsg.username ? 'error' : 'none'}
                validationMessage={validMsg.username}
                className="w-full"
              >
                <Input
                  value={formData.username}
                  appearance="underline"
                  onChange={(_: any, data: InputOnChangeData) => {
                    setFormData((prev) => ({ ...prev, username: data.value }));
                  }}
                  disabled={isValidUserName}
                  className="w-full"
                  style={{ minWidth: '200px' }}
                />
              </Field>
              <Button
                type="submit"
                className="w-full max-w-xs hover:shadow-md"
                onClick={validateUserName}
                disabled={!formData.username.length || isChecking}
              >
                {isChecking ? (
                  <Spinner size="extra-small" />
                ) : isValidUserName ? (
                  'Change Username'
                ) : (
                  'Check Username'
                )}
              </Button>
            </form>
            {isValidUserName && (
              <form onSubmit={signUpHandler} className="flex flex-col gap-3 w-full max-w-md">
                <Field
                  label="Full Name"
                  validationState={validMsg.full_name ? 'error' : 'none'}
                  validationMessage={validMsg.full_name}
                  className="w-full"
                >
                  <Input
                    value={formData.full_name}
                    appearance="underline"
                    onChange={(_: any, data: InputOnChangeData) => {
                      setFormData((prev) => ({ ...prev, full_name: data.value }));
                    }}
                    disabled={isLoading}
                    className="w-full"
                    style={{ minWidth: '200px' }}
                  />
                </Field>
                <Field
                  label="Email"
                  validationState={validMsg.email ? 'error' : 'none'}
                  validationMessage={validMsg.email}
                  className="w-full"
                >
                  <Input
                    type="email"
                    value={formData.email}
                    appearance="underline"
                    onChange={(_: any, data: InputOnChangeData) => {
                      setFormData((prev) => ({ ...prev, email: data.value }));
                    }}
                    disabled={isLoading}
                    className="w-full"
                    style={{ minWidth: '200px' }}
                  />
                </Field>
                <Field
                  label="Password"
                  validationState={validMsg.password ? 'error' : 'none'}
                  validationMessage={validMsg.password}
                  className="w-full"
                >
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    contentAfter={EyeToggleButton(showPassword)}
                    value={formData.password}
                    appearance="underline"
                    onChange={(_: any, data: InputOnChangeData) => {
                      setFormData((prev) => ({ ...prev, password: data.value }));
                    }}
                    disabled={isLoading}
                    className="w-full"
                    style={{ minWidth: '200px' }}
                  />
                </Field>
                <Checkbox
                  label="This website requires cookies to function properly. I accept third-party cookies."
                  labelPosition="after"
                  onChange={(_: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
                    if (data.checked) {
                      setIsPolicyAccepted(true);
                    } else {
                      setIsPolicyAccepted(false);
                    }
                  }}
                />
                <Button
                  type="submit"
                  className="w-full max-w-xs mx-auto hover:shadow-md"
                  disabled={!isPolicyAccepted || isLoading}
                >
                  {isLoading ? <Spinner size="extra-small" /> : 'Submit'}
                </Button>
              </form>
            )}
          </>
        ) : (
          <div className="flex flex-col w-full max-w-md">
            <form onSubmit={signInHandler} className="flex flex-col gap-y-3 w-full items-center">
              <Field
                label="Username"
                validationState={isValidUserName ? 'success' : validMsg.username ? 'error' : 'none'}
                validationMessage={validMsg.username}
                className="w-full"
              >
                <Input
                  type="text"
                  value={formData.username}
                  appearance="underline"
                  onChange={(_: any, data: InputOnChangeData) => {
                    setFormData((prev) => ({ ...prev, username: data.value }));
                  }}
                  disabled={isLoading}
                  className="w-full"
                  style={{ minWidth: '200px' }}
                />
              </Field>
              <Field
                label="Password"
                validationState={validMsg.password ? 'error' : 'none'}
                validationMessage={validMsg.password}
                className="w-full"
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  contentAfter={EyeToggleButton(showPassword)}
                  value={formData.password}
                  appearance="underline"
                  onChange={(_: any, data: InputOnChangeData) => {
                    setFormData((prev) => ({ ...prev, password: data.value }));
                  }}
                  disabled={isLoading}
                  className="w-full"
                  style={{ minWidth: '200px' }}
                />
              </Field>
              <Checkbox
                label="This website requires cookies to function properly. I accept third-party cookies."
                labelPosition="after"
                onChange={(_: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
                  if (data.checked) {
                    setIsPolicyAccepted(true);
                  } else {
                    setIsPolicyAccepted(false);
                  }
                }}
              />
              <Button
                type="submit"
                className="w-full max-w-xs hover:shadow-md"
                disabled={!isPolicyAccepted || isLoading}
              >
                {isLoading ? <Spinner size="extra-small" /> : 'Submit'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
