const DocumentSummary = ({ summary }: { summary: string }) => {
  return (
    <div>
      <div>
        <h1 className="text-md lg:text-lg font-medium text-gray-600">Case Summary</h1>
      </div>
      <div className="flex flex-col gap-2">
        <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm lg:text-md text-gray-700">{summary}</p>
        </div>
      </div>
    </div>
  )
}
