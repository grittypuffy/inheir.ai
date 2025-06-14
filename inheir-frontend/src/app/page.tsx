"use client"
import AppContainer from "@/lib/components/AppContainer";
import { Card } from "@/lib/components/Card";
import { FeatureData } from "@/lib/validators/types";
import { Button } from "@fluentui/react-components";
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
      <div className="min-h-screen surround border flex flex-col justify-start gap-3">
        <div className="flex flex-col-reverse lg:justify-center lg:flex-row-reverse items-left justify-start border w-full">
          <div className="flex flex-col items-center justify-center lg:items-start border gap-3">
            <h1 className="text-2xl font-bold text-center">Welcome to Inheir.ai</h1>
            <p className="text-lg text-center">An AI-powered legal research assistant</p>
            <Button appearance="primary">Get Started</Button>
          </div>
          <div className="border content-center flex items-center justify-center w-full lg:w-1/2">
            <DotLottieReact
              src="https://lottie.host/c6895877-2dd7-46da-a3b4-f5c3ab7563b1/8knctMy530.lottie"
              loop
              autoplay
              style={{ width: "350px", height: "350px" }}
            />
          </div>
        </div>
        <div className="flex flex-col flex-1  border w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ">
            {features.map((feature, i) => (
              <Card feature={feature} key={i} />
            ))}
          </div>
        </div>
      </div>
    </AppContainer >
  );
};
