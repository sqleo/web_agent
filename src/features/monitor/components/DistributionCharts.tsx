"use client";

import { Column, Pie } from "@ant-design/charts";
import { Card, Col, Empty, Row, theme } from "antd";
import type { MonitorErrorItem } from "../types";

interface DistributionChartsProps {
  errors: MonitorErrorItem[];
  modelColumnData: any[];
}

const CHART_H = 300;

export function DistributionCharts({ errors, modelColumnData }: DistributionChartsProps) {
  const { token } = theme.useToken();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={10}>
        <Card title="错误类型分布" variant="borderless" style={{ background: token.colorFillSecondary }}>
          {errors.length === 0 ? (
            <Empty description="暂无错误数据" />
          ) : (
            <Pie
              data={errors}
              angleField="value"
              colorField="type"
              height={CHART_H}
              autoFit
              label={{
                text: (d: MonitorErrorItem) => `${d.type}: ${d.value}`,
                style: { fontSize: 11 },
              }}
              tooltip={{ title: "type", items: [{ field: "value" }] }}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} lg={14}>
        <Card title="模型维度（请求 / Tokens）" variant="borderless" style={{ background: token.colorFillSecondary }}>
          {modelColumnData.length === 0 ? (
            <Empty description="暂无模型数据" />
          ) : (
            <Column
              data={modelColumnData}
              xField="model"
              yField="value"
              seriesField="metric"
              group
              height={CHART_H}
              autoFit
              legend={{ position: "top" }}
            />
          )}
        </Card>
      </Col>
    </Row>
  );
}
