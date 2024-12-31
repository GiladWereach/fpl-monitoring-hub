import React from 'react';
import { Card } from "@/components/ui/card";
import { TestSuite } from '../types/scheduling';

interface ScheduleTestSuiteProps {
  suite: TestSuite;
}

export function ScheduleTestSuite({ suite }: ScheduleTestSuiteProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">{suite.name}</h3>
      <div className="space-y-4">
        {suite.tests.map((test, index) => (
          <div key={index} className="p-2 border rounded">
            <p className="font-medium">{test.name}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}