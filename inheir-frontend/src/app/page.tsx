"use client"
import AppContainer from "@/lib/components/AppContainer";
import AuthForm from "@/lib/components/AuthForm";
import { Card } from "@/lib/components/Card";
import { FeatureData } from "@/lib/validators/types";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const features: FeatureData[] = [
  {
    title: "AI-Powered Legal Research",
    description: "Quickly find relevant case law and statutes using advanced AI algorithms.",
  },
  {
    title: "Comprehensive Database",
    description: "Access a vast collection of legal documents, cases, and statutes.",
  },
  {
    title: "GIS Integration",
    description: "Leverage geographic information systems to enhance your legal research.",
  },
  {
    title: "Document Analysis",
    description: "Analyze legal documents with AI to extract key information and insights.",
  },
  {
    title: "Secure and Private",
    description: "Your data is protected with industry-leading security measures.",
  },
  {
    title: "Chatbot Assistance",
    description: "Get instant answers to your legal questions with our AI chatbot.",
  }
];

export default function Default() {

  return (
    <AppContainer>
      <div className="flex flex-col-reverse lg:flex-row-reverse items-center justify-center min-h-screen">
        <AuthForm />
        <div className="surround flex flex-col justify-between gap-3">
          <div className="flex flex-col-reverse lg:justify-between lg:pl-20 lg:flex-row items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center lg:items-start gap-3">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Welcome to Inheir.ai</h1>
              <p className="text-lg">An AI-powered legal research assistant</p>
            </div>
            <div className="content-center flex items-center justify-center w-full lg:w-1/2">
              <DotLottieReact
                src="https://lottie.host/c203134d-7a12-4f88-ba8d-3c416a2b6463/88ImDgikGX.lottie"
                loop
                autoplay
                style={{ width: "300px", height: "300px" }}
              />
            </div>
          </div>
          <div className="flex flex-col w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
              {features.map((feature, i) => {
                return (
                  <Card feature={feature} key={i} />
                )
              }
              )}
            </div>
          </div>
          <div className="opacity-0 lg:opacity-100 flex items-end justify-center w-full lg:pt-10">
            <p className="text-sm text-gray-500">
              Copyright © 2025 Inheir.ai. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </AppContainer >
  );
};
