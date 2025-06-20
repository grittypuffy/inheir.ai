import { CreateCase } from '@/lib/components/CreateCaseForm';
import {
  Button,
  Link
} from '@fluentui/react-components';
import { useEffect, useState } from 'react';

export const Cases = () => {
  const [cases, setCases] = useState<any[]>([]);

  const getCases = async () => {
    const res: Response = await fetch('/api/v1/case/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      return data.cases || [];
    } else {
      console.error('Failed to fetch cases:', res.statusText);
      return [];
    }
  };

  useEffect(() => {
    getCases()
      .then((fetchedCases) => {
        console.log('Fetched cases:', fetchedCases.cases);
        if (Array.isArray(fetchedCases.cases)) {
          setCases(fetchedCases.cases);
          console.log('Fetched cases:', fetchedCases);
        } else {
          setCases([]);
        }
      })
      .catch((error) => {
        console.error('Error fetching cases:', error);
        setCases([]);
      });
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center w-full h-full">
        {cases.length > 0 ? (
          <div className="w-full px-3 py-2 flex flex-col gap-2">
            {cases.map((caseItem, i) => (
              <Link key={i} href={`/home/case/${caseItem.case_id}`} className="w-full block">
                <Button className="w-full">{caseItem.title}</Button>
              </Link>
            ))}
          </div>
        ) : (
          <h1 className="text-lg lg:text-xl font-bold">No Cases Available</h1>
        )}
        <div className="flex items-center justify-center mt-5">
          <CreateCase />
        </div>
      </div>
    </div>
  );
};
