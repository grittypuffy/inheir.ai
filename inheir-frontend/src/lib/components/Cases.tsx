import { Button } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";

export const Cases = () => {
  const cases: any[] = [];

  return (
    <>
      <div className="flex flex-col items-center justify-center h-full">
        {cases.length > 0 ? (
          <ul className="list-disc">
            {cases.map((caseItem, index) => (
              <li key={index} className="my-2">
                {caseItem.title} - {caseItem.description}
              </li>
            ))}
          </ul>
        ) : (
          <h1 className="text-lg lg:text-xl font-bold">No Cases Available</h1>
        )}
        <div className="flex items-center justify-center mt-5">
          <Button appearance="primary" className="flex items-center gap-2">
            <span>Add New Case</span>
            <AddRegular />
          </Button>
        </div>
      </div>
    </>
  );
}
