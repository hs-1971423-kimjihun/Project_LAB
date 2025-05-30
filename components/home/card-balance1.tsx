import { Card, CardBody } from "@heroui/react";
import React from "react";
import { Community } from "../icons/community";
import { SANSwitch } from "../icons/SANSwitch";
export const CardBalance1 = () => {
  return (
    <Card className="xl:max-w-sm bg-primary rounded-xl shadow-md px-3 w-full">
      <CardBody className="py-5 overflow-hidden">
        <div className="flex gap-2.5">
          <SANSwitch />
          <div className="flex flex-col">
            <span className="text-white">SAN Switch</span>
            <span className="text-white text-xs">21 SAN</span>
          </div>
        </div>
        <div className="flex gap-2.5 py-2 items-center">
          <span className="text-white text-xl font-semibold">Example</span>
          <span className="text-success text-xs">test</span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <div>
              <span className="font-semibold text-success text-xs">{"↓"}</span>
              <span className="text-xs text-white">12</span>
            </div>
            <span className="text-white text-xs">Cisco MDS</span>
          </div>

          <div>
            <div>
              <span className="font-semibold text-danger text-xs">{"↑"}</span>
              <span className="text-xs text-white">1</span>
            </div>
            <span className="text-white text-xs">Broadcom</span>
          </div>

          <div>
            <div>
              <span className="font-semibold text-danger text-xs">{"-"}</span>
              <span className="text-xs text-white">8</span>
            </div>
            <span className="text-white text-xs">Dell</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
