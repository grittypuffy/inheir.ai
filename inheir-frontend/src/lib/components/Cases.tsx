import { Button, Link } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";

export const Cases = () => {
  const cases: any[] = [{
    case_id: "12345",
  }];

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center w-full h-full">
        {cases.length > 0 ? (
          <div className="w-full px-3 py-2 flex flex-col gap-2">
            {cases.map((caseItem, i) => (
              <Link
                key={i}
                href={`/home/case/${caseItem.case_id}`}
                className="w-full block"
              >
                <Button className="w-full">
                  {caseItem.case_id}
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <h1 className="text-lg lg:text-xl font-bold">No Cases Available</h1>
        )}
        <div className="flex items-center justify-center mt-5">
          <Button
            appearance="primary"
            className="flex items-center gap-2"
          >
            <Link
              as="a"
              href="/home/new/case"
            >
              <span className="text-white">
                Create New Case
              </span>
            </Link>
            <AddRegular />
          </Button>
        </div>
      </div>
    </div>
  );
}
