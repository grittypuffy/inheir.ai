"use client"

import { ChatUI } from "@/lib/components/Chatbot";
import { CaseData, CaseTabs, Coordinates } from "@/lib/validators/types";
import { Button, Field, Input, SelectTabData, SelectTabEvent, Tab, TabList, Toast, ToastIntent, ToastPosition, ToastTitle, Toaster, useId, useToastController } from "@fluentui/react-components";
import { Map } from "maplibre-gl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";


export default function Page() {
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

  const pathName = usePathname();
  const case_id: string = pathName.split("/").pop() || "";
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedTab, setSelectedTab] = useState<CaseTabs>('chatbot');
  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as CaseTabs);
  }

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const getCaseData = async () => {
    if (case_id) {
      try {
        const res: Response = await fetch(`/api/v1/case/${case_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (res.ok) {
          const data: CaseData = await res.json();
          setCaseData(data);
          ToastMessage("Case data fetched successfully!");
        } else {
          const data: { message: string } = await res.json();
          ToastMessage(data.message, "error");
        }
        return;
      } catch (error) {
        ToastMessage("Failed to fetch case data. Please try again later.", "error");
        setIsLoading(false);
      }
    }
  }

  const map = useRef<Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: 0,
    longitude: 0,
  });

  // GIS analysis state
  const [gisInput, setGisInput] = useState("");
  const [gisLoading, setGisLoading] = useState(false);
  const [gisResult, setGisResult] = useState<any>(null);

  // GIS form submit handler
  const handleGisSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGisLoading(true);
    setGisResult(null);
    try {
      const res = await fetch("/api/v1/gis/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ address: gisInput })
      });
      if (res.ok) {
        const data = await res.json();
        setGisResult(data);
        if (data.coordinates && map.current) {
          map.current.flyTo({
            center: [data.coordinates.longitude, data.coordinates.latitude],
            zoom: 20
          });
        }
      } else {
        ToastMessage("Failed to analyze GIS data.", "error");
      }
    } catch (err) {
      ToastMessage("Error analyzing GIS data.", "error");
    } finally {
      setGisLoading(false);
    }
  };

  useEffect(() => {
    if (!caseData) {
      getCaseData().finally(() => {
        setIsLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    if (selectedTab === 'gis' && mapContainerRef.current) {
      map.current = new Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [0, 0],
        zoom: 1,
        maplibreLogo: false,
        attributionControl: false,
      });

      map.current.on('style.load', () => {
        map.current?.setProjection({
          type: 'globe',
        })
      })
    }
  }, [selectedTab]);

  return (
    <>
      <div className="flex w-full h-full">
        <Toaster toasterId={toasterId} />
        <div className="flex flex-col lg:flex-row w-full h-full">
          <div className="border-b-2 lg:border-b-0 lg:border-r-2 w-full lg:w-1/3 flex flex-col p-5 lg:p-8 gap-10 overflow-y-auto">
            <div>
              <h1 className="text-md lg:text-lg font-medium text-gray-600">Case Title</h1>

              <h1 className="text-xl lg:text-2xl font-semibold">
                {isLoading ? (
                  "Loading case data..."
                ) : caseData ? (
                  caseData.meta.title
                ) : (
                  "No case data available"
                )}
              </h1>
            </div>

            <div className="flex flex-col gap-3">
              <h1 className="text-md lg:text-lg font-medium text-gray-600">Case Details</h1>

              <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between">
                  <p className="text-md text-gray-500">Status:</p>
                  <p className="text-md font-medium">
                    {isLoading ? (
                      "Loading..."
                    ) : caseData ? (
                      caseData.meta.status
                    ) : (
                      "Status not available"
                    )}
                  </p>
                </div>

                <div className="flex flex-row justify-between">
                  <p className="text-md text-gray-500">Created at:</p>
                  <p className="text-md font-medium">
                    {isLoading ? (
                      "Loading..."
                    ) : caseData ? (
                      new Date(caseData.meta.created_at).toLocaleString()
                    ) : (
                      "Date not available"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-4 py-1">
                <div>
                  <h1 className="text-md lg:text-lg font-medium text-gray-600">Case Summary</h1>
                </div>
                <div>
                  {isLoading ? (
                    <p className="text-md text-gray-500">Loading case summary...</p>
                  ) : caseData?.summary?.summary ? (
                    <p className="text-md text-gray-700">
                      {caseData.summary.summary || "No summary available"}
                    </p>
                  ) : (
                    <p className="text-md text-gray-500">No summary available</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-md text-gray-500">Case Type:</p>
                  <p className="text-md text-gray-700">
                    {isLoading ? (
                      "Loading case summary..."
                    ) : caseData ? (
                      caseData.summary.case_type || "No summary available"
                    ) : (
                      "No summary available"
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-md text-gray-500">Entities:</p>
                  {isLoading ? (
                    <p className="text-md text-gray-700">
                      "Loading..."
                    </p>
                  ) : caseData?.summary?.entity ? (
                    caseData.summary.entity.map((entry, i) => (
                      <div key={i}>
                        <div className="flex flex-row justify-between">
                          <span className="font-semibold">{entry.name}:</span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="ml-2">{entry.entity_type}</span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="ml-2 text-gray-500">{entry.valid}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-md text-gray-700">
                      "No Entities available"
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-md text-gray-500">Assets:</p>
                  {isLoading ? (
                    <p className="text-md text-gray-700">
                      "Loading..."
                    </p>
                  ) : caseData?.summary?.asset ? (
                    caseData.summary.asset.map((entry, i) => (
                      <div key={i}>
                        <div className="flex flex-row justify-between">
                          <span className="font-semibold">Name: </span>
                          <span className="font-semibold">{entry.name}:</span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="ml-2">Asset Type:</span>
                          <span className="ml-2">{entry.asset_type}</span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="ml-2">Net Worth:</span>
                          <span className="ml-2 text-gray-500">{entry.net_worth}</span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="ml-2">Location:</span>
                          <span className="ml-2 text-gray-500">{entry.location}</span>
                        </div>

                        <div className="flex flex-row justify-between">
                          <span className="ml-2">Coordinates:</span>
                          <span className="ml-2 text-gray-500">{entry.coordinates}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-md text-gray-700">
                      "No Assets available"
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4 py-1">
                  <h1 className="text-md lg:text-lg font-medium text-gray-600">Documents</h1>
                  <div className="flex flex-col gap-2">
                    <h2>Main document:</h2>
                    <p className="text-md text-gray-700">
                      {isLoading ? (
                        "Loading documents..."
                      ) : caseData && caseData?.summary?.document ? (
                        <a href={caseData.summary.document} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{caseData.summary.document}</a>
                      ) : (
                        "No document available"
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-md text-gray-500">Supporting Documents:</h2>
                    <div>
                      {isLoading ? (
                        "Loading documents..."
                      ) : caseData?.summary?.supporting_documents && caseData.summary.supporting_documents.length > 0 ? (
                        caseData.summary.supporting_documents.map((doc, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{doc}</a>
                          </div>
                        ))
                      ) : (
                        <p className="text-md text-gray-700">No supporting documents available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 py-1">
                  <h1 className="text-md lg:text-lg font-medium text-gray-600">References</h1>
                  <div className="flex flex-col gap-2">
                    <div>
                      {isLoading ? (
                        "Loading references..."
                      ) : caseData?.summary?.references && caseData.summary.references.length > 0 ? (
                        caseData.summary.references.map((ref, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <p className="text-md text-gray-700">{ref}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-md text-gray-700">No references available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 py-1">
                  <h1 className="text-md lg:text-lg font-medium text-gray-600">Recommendations</h1>
                  <div className="flex flex-col gap-2">
                    <div>
                      {isLoading ? (
                        "Loading recommendations..."
                      ) : caseData?.summary?.recommendations && caseData.summary.recommendations.length > 0 ? (
                        caseData.summary.recommendations.map((ref, i) => (
                          <div key={i} className="flex flex-col gap-2">
                            <p className="text-md text-gray-700">{ref}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-md text-gray-700">No recommendations available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 py-1">
                  <h1 className="text-md lg:text-lg font-medium text-gray-600">Remarks</h1>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      {isLoading ? (
                        "Loading remarks..."
                      ) : caseData?.summary?.remarks ? (
                        <p className="text-md text-gray-700">{caseData.summary.remarks}</p>
                      ) : (
                        <p className="text-md text-gray-700">No references available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <div className="grid grid-rows-[auto_1fr] w-full h-full">
              <div className="w-full h-20 grid place-items-center bg-gray-100 border-b-2">
                <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
                  <Tab value={'chatbot'}>AI Assistant</Tab>
                  <Tab value={'documents'}>Documents Summary</Tab>
                  <Tab value={'gis'}>GIS</Tab>
                </TabList>
              </div>
              <div className="w-full h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <p className="text-md text-gray-500">Loading...</p>
                  </div>
                ) :
                  selectedTab === 'chatbot' ? (
                    <ChatUI caseId={case_id} />
                  ) : selectedTab === 'documents' ? (
                    <div className="flex items-center justify-center w-full h-full">
                      {caseData?.summary?.summary ? (
                        <></>
                      ) : (
                        <p className="text-md text-gray-500">No document summary available</p>
                      )}
                    </div>
                  ) : selectedTab === 'gis' ? (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <form className="flex flex-row items-center justify-center gap-3 w-full" onSubmit={handleGisSubmit}>
                        <Field className="">
                          <Input
                            type="text"
                            placeholder="Enter address"
                            appearance="underline"
                            value={gisInput}
                            onChange={e => setGisInput(e.target.value)}
                            disabled={gisLoading}
                          />
                        </Field>
                        <Button
                          type="submit"
                          appearance="primary"
                          className="mt-3"
                          disabled={gisLoading || !gisInput.trim()}
                        >
                          {gisLoading ? 'Analyzing...' : 'Search'}
                        </Button>
                      </form>
                      <div className="relative w-full h-full">
                        <div className="absolute w-full h-full" ref={mapContainerRef} />
                      </div>
                      {gisResult && (
                        <div className="mt-6 w-full max-w-lg bg-white rounded shadow p-4">
                          <h2 className="text-lg font-semibold mb-2">GIS Analysis Result</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div><b>Latitude:</b> {gisResult.coordinates?.latitude}</div>
                            <div><b>Longitude:</b> {gisResult.coordinates?.longitude}</div>
                            <div><b>Property Buying Risk:</b> {gisResult.property_buying_risk * 100}</div>
                            <div><b>Property Renting Risk:</b> {gisResult.property_renting_risk * 100}</div>
                            <div><b>Flood Risk:</b> {gisResult.flood_risk * 100}</div>
                            <div><b>Crime Rate:</b> {gisResult.crime_rate * 100}</div>
                            <div><b>Air Quality Index:</b> {gisResult.air_quality_index * 100}</div>
                            <div><b>Proximity to Amenities:</b> {gisResult.proximity_to_amenities * 100}</div>
                            <div><b>Transportation Score:</b> {gisResult.transportation_score * 100}</div>
                            <div><b>Neighborhood Rating:</b> {gisResult.neighborhood_rating * 100}</div>
                            <div><b>Environmental Hazards:</b> {gisResult.environmental_hazards * 100}</div>
                            <div><b>Economic Growth Potential:</b> {gisResult.economic_growth_potential * 100}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
