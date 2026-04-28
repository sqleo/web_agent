"use client";

import { Area, Line } from "@ant-design/charts";
import { Card, Col, Empty, Row, theme } from "antd";

interface TrendChartsProps {
  reqTrendAxis: any[];
  tokenTrendAxis: any[];
  latencyTrendAxis: any[];
  successTrendAxis: any[];
  reqTrendEmpty: boolean;
  tokenTrendEmpty: boolean;
  latencyTrendEmpty: boolean;
  successTrendEmpty: boolean;
}

const CHART_H = 300;

const TOKEN_CATEGORY_COLOR: Record<string, string> = {
  输入缓存命中: "#52c41a",
  输入缓存未命中: "#faad14",
  "输出 Tokens": "#1677ff",
};

export function TrendCharts({
  reqTrendAxis,
  tokenTrendAxis,
  latencyTrendAxis,
  successTrendAxis,
  reqTrendEmpty,
  tokenTrendEmpty,
  latencyTrendEmpty,
  successTrendEmpty,
}: TrendChartsProps) {
  const { token } = theme.useToken();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card title="请求量趋势" variant="borderless" style={{ background: token.colorFillSecondary }}>
          {reqTrendEmpty ? (
            <Empty description="暂无数据" />
          ) : (
            <Line
              data={reqTrendAxis}
              xField="date"
              yField="value"
              seriesField="category"
              height={CHART_H}
              autoFit
              legend={{ position: "top" }}
              color={[token.colorPrimary, token.colorSuccess, token.colorWarning]}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title="Token 用量（堆叠）" variant="borderless" style={{ background: token.colorFillSecondary }}>
          {tokenTrendEmpty ? (
            <Empty description="暂无数据" />
          ) : (
            <Area
              data={tokenTrendAxis}
              xField="date"
              yField="value"
              seriesField="category"
              stack
              height={CHART_H}
              autoFit
              legend={{ position: "top" }}
              scale={{
                color: {
                  domain: [
                    "输入缓存命中",
                    "输入缓存未命中",
                    "输出 Tokens",
                  ],
                  range: [
                    TOKEN_CATEGORY_COLOR["输入缓存命中"],
                    TOKEN_CATEGORY_COLOR["输入缓存未命中"],
                    TOKEN_CATEGORY_COLOR["输出 Tokens"],
                  ],
                },
              }}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title="延迟趋势" variant="borderless" style={{ background: token.colorFillSecondary }}>
          {latencyTrendEmpty ? (
            <Empty description="暂无数据" />
          ) : (
            <Line
              data={latencyTrendAxis}
              xField="date"
              yField="value"
              seriesField="category"
              height={CHART_H}
              autoFit
              legend={{ position: "top" }}
            />
          )}
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title="成功率趋势" variant="borderless" style={{ background: token.colorFillSecondary }}>
          {successTrendEmpty ? (
            <Empty description="暂无数据" />
          ) : (
            <Line
              data={successTrendAxis}
              xField="date"
              yField="value"
              seriesField="category"
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
