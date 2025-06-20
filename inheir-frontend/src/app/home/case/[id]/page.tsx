"use client"

import { ChatUI } from "@/lib/components/Chatbot";
import { CaseData, CaseTabs } from "@/lib/validators/types";
import { Button, Field, Input, Link, SelectTabData, SelectTabEvent, Spinner, Tab, TabList, Toast, ToastIntent, ToastPosition, ToastTitle, Toaster, useId, useToastController } from "@fluentui/react-components";
import { InfoRegular } from "@fluentui/react-icons";
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

  const handleCaseStatus = async (inputStatus: string) => {
    await fetch(`/api/v1/case/${case_id}/${inputStatus}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ remarks: `Case ${inputStatus}ed successfully` }),
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const respMsg = await res.json();
          setCaseData(
            {
              ...caseData!,
              summary: {
                ...caseData!.summary,
                remarks: respMsg.message || `Case ${inputStatus}ed successfully`
              },
              meta: {
                ...caseData!.meta,
                status: inputStatus === 'resolve' ? 'Resolved' : 'Aborted',
              }
            });
          ToastMessage(`Case ${inputStatus}ed successfully`);
        } else {
          const data = await res.json();
          ToastMessage(data.message, "error");
        }
      })
      .catch((_) => {
        ToastMessage(`Failed to ${inputStatus} case. Please try again later.`, "error");
      });
  }

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
        zoom: 2,
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
            <div className="flex flex-col gap-3">
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

              {isLoading ? (
                <div className="flex items-center justify-center">
                  <p className="text-md text-gray-500">Loading...</p>
                </div>
              ) : caseData && caseData?.meta?.status === 'Open' ? (
                <div className="flex flex-row gap-x-3">
                  <Button appearance="primary" size="small" onClick={async () => await handleCaseStatus("resolve")}>
                    <span className="font-bold">Resolve Case</span>
                  </Button>
                  <Button appearance="secondary" size="small" onClick={async () => await handleCaseStatus("abort")}>
                    <span className="font-bold">Abort Case</span>
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-md text-gray-500 text-wrap font-normal">
                    This case is
                    <span className={`font-semibold ${caseData?.meta?.status === "Resolved" ? "text-blue-500" : "text-red-500"}`}> {caseData?.meta?.status} </span>
                    and cannot be modified.
                  </p>
                </div>
              )}
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
                  <div className="flex flex-col gap-2 flex-wrap">
                    {isLoading ? (
                      <p className="text-md text-gray-700">
                        "Loading documents..."
                      </p>
                    ) : caseData && caseData?.summary?.document ? (
                      <div className="flex justify-between">
                        <span>
                          Main Document:
                        </span>
                        <Link href={caseData.summary.document} target="_blank" rel="noopener noreferrer">
                          <Button appearance="primary" size="small">
                            View
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-md text-gray-700">
                        "No document available"
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-md text-gray-500">Supporting Documents:</h2>
                    <div>
                      {isLoading ? (
                        "Loading documents..."
                      ) : caseData?.summary?.supporting_documents && caseData.summary.supporting_documents.length > 0 ? (
                        <ol>
                          {caseData.summary.supporting_documents.map((doc, i) => (
                            <div key={i} className="flex flex-col gap-2">
                              <li className="flex justify-between">
                                Document {i + 1}
                                <Link href={doc} target="_blank" rel="noopener noreferrer">
                                  <Button appearance="primary" size="small">
                                    View
                                  </Button>
                                </Link>
                              </li>
                            </div>
                          ))}
                        </ol>
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
                  {/* <Tab value={'documents'}>Documents Summary</Tab> */}
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
                    <div className="flex flex-col w-full h-full">
                      <div className="w-full p-4 flex flex-col justify-center">
                        <form className="flex flex-col items-center justify-center gap-4 w-full px-6 py-4 bg-white/90 backdrop-filter backdrop-blur-sm shadow-md rounded-lg z-10 max-w-3xl mx-auto" onSubmit={handleGisSubmit}>
                          <div className="flex flex-row gap-2 w-full">
                            <Field className="w-full">
                              <Input
                                type="text"
                                placeholder="Enter address to analyze location data"
                                value={gisInput}
                                onChange={e => setGisInput(e.target.value)}
                                disabled={gisLoading}
                                className="focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                              />
                            </Field>
                            <Button
                              type="submit"
                              appearance="primary"
                              className="transition duration-200 shadow-sm hover:shadow-md"
                              disabled={gisLoading || !gisInput.trim()}
                            >
                              {gisLoading ?
                                <span className="flex justify-around gap-2 px-3">
                                  <Spinner size="extra-tiny" />
                                  <span className="animate-pulse">Analyzing</span>
                                </span> :
                                <span className="flex items-center gap-2">Search</span>
                              }
                            </Button>
                          </div>
                          <div className="flex flex-row items-center gap-2 text-gray-600">
                            <InfoRegular /><p className="text-sm text-gray-400 font-mono font-semibold">Kindly provide the officially government approved address for accurate results</p>
                          </div>
                        </form>
                      </div>
                      <div className="flex-grow w-full h-0">
                        <div className="w-full h-full" ref={mapContainerRef} />
                      </div>
                      {gisResult && (
                        <div className="w-full flex justify-center p-4">
                          <div className="w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-5 border border-gray-200 animate-fade-in transition-all duration-300">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-200">GIS Analysis Result</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                              <div className="flex flex-col p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"><span className="font-medium text-blue-700">Latitude:</span> <span className="text-gray-700">{gisResult.coordinates?.latitude}</span></div>
                              <div className="flex flex-col p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"><span className="font-medium text-blue-700">Longitude:</span> <span className="text-gray-700">{gisResult.coordinates?.longitude}</span></div>
                              <div className="flex flex-col p-2 bg-red-50 rounded-md hover:bg-red-100 transition-colors"><span className="font-medium text-red-700">Property Buying Risk:</span> <span className="text-gray-700">{gisResult.property_buying_risk * 100}</span></div>
                              <div className="flex flex-col p-2 bg-red-50 rounded-md hover:bg-red-100 transition-colors"><span className="font-medium text-red-700">Property Renting Risk:</span> <span className="text-gray-700">{gisResult.property_renting_risk * 100}</span></div>
                              <div className="flex flex-col p-2 bg-amber-50 rounded-md hover:bg-amber-100 transition-colors"><span className="font-medium text-amber-700">Flood Risk:</span> <span className="text-gray-700">{gisResult.flood_risk * 100}</span></div>
                              <div className="flex flex-col p-2 bg-amber-50 rounded-md hover:bg-amber-100 transition-colors"><span className="font-medium text-amber-700">Crime Rate:</span> <span className="text-gray-700">{gisResult.crime_rate * 100}</span></div>
                              <div className="flex flex-col p-2 bg-green-50 rounded-md hover:bg-green-100 transition-colors"><span className="font-medium text-green-700">Air Quality Index:</span> <span className="text-gray-700">{gisResult.air_quality_index * 100}</span></div>
                              <div className="flex flex-col p-2 bg-green-50 rounded-md hover:bg-green-100 transition-colors"><span className="font-medium text-green-700">Proximity to Amenities:</span> <span className="text-gray-700">{gisResult.proximity_to_amenities * 100}</span></div>
                              <div className="flex flex-col p-2 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"><span className="font-medium text-purple-700">Transportation Score:</span> <span className="text-gray-700">{gisResult.transportation_score * 100}</span></div>
                              <div className="flex flex-col p-2 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"><span className="font-medium text-purple-700">Neighborhood Rating:</span> <span className="text-gray-700">{gisResult.neighborhood_rating * 100}</span></div>
                              <div className="flex flex-col p-2 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"><span className="font-medium text-orange-700">Environmental Hazards:</span> <span className="text-gray-700">{gisResult.environmental_hazards * 100}</span></div>
                              <div className="flex flex-col p-2 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"><span className="font-medium text-orange-700">Economic Growth Potential:</span> <span className="text-gray-700">{gisResult.economic_growth_potential * 100}</span></div>
                            </div>
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
      </div >
    </>
  );
}
