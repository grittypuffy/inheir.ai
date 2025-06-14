import { FluentProvider, ProgressBar, webLightTheme } from "@fluentui/react-components";
import { Suspense } from "react";

const AppContainer = (
  { children, }: Readonly<{ children: React.ReactNode }>
) => {
  return (
    <FluentProvider theme={webLightTheme}>
      <Suspense fallback={<ProgressBar thickness="large" />}>
        <div className="w-full min-h-screen mx-auto max-w-7xl overflow-x-hidden">
          {children}
        </div>
      </Suspense>
    </FluentProvider>
  )
}

export default AppContainer
