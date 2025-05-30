import React from "react";
import Chart, { Props } from "react-apexcharts";

const state: Props["series"] = [
  {
    name: "대면점검",
    data: [31, 40, 28, 51, 42, 109, 100],
  },
  {
    name: "AI정기정검",
    data: [11, 32, 45, 32, 34, 52, 41],
  },
];

const options: Props["options"] = {
  chart: {
    type: "area",
    animations: {
      easing: "linear",
      speed: 300,
    },
    sparkline: {
      enabled: false,
    },
    brush: {
      enabled: false,
    },
    id: "basic-bar",
    foreColor: "hsl(var(--heroui-default-800))",
    stacked: true,
    toolbar: {
      show: false,
    },
  },

  xaxis: {
    categories: [601, 602, 603, 604, 605, 606, 607, 608, 609],
    labels: {
      // show: false,
      style: {
        colors: "hsl(var(--heroui-default-800))",
      },
    },
    axisBorder: {
      color: "hsl(var(--heroui-nextui-default-200))",
    },
    axisTicks: {
      color: "hsl(var(--heroui-nextui-default-200))",
    },
  },
  yaxis: {
    labels: {
      style: {
        // hsl(var(--heroui-content1-foreground))
        colors: "hsl(var(--heroui-default-800))",
      },
    },
  },
  tooltip: {
    enabled: false,
  },
  grid: {
    show: true,
    borderColor: "hsl(var(--heroui-default-200))",
    strokeDashArray: 0,
    position: "back",
  },
  stroke: {
    curve: "smooth",
    fill: {
      colors: ["red"],
    },
  },
  // @ts-ignore
  markers: false,
};

export const Steam = () => {
  return (
    <>
      <div className="w-full z-20">
        <div id="chart">
          <Chart options={options} series={state} type="area" height={425} />
        </div>
      </div>
    </>
  );
};
