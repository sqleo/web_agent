"use client";

import { ExportOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Select, Space, Typography, theme, App } from "antd";
import { useEffect, useState } from "react";
import { installVendor, patchVendorConfig } from "../api/vendors";
import type { Vendor } from "../types";
import {
  buildPatchVendorBody,
  capabilityFromDefaultModelType,
  modelTypeFromCapability,
} from "@/lib/vendor-config";

type VendorAddModalProps = {
  open: boolean;
  vendor: Vendor | null;
  /** 已安装时用于 PATCH 的 id，缺省用 code */
  installedVendorId?: string | number;
  isInstalled: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

function parseInstallId(data: unknown): string | number | undefined {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (o.id !== undefined) {
      return o.id as string | number;
    }
    if (o.vendor_id !== undefined) {
      return o.vendor_id as string | number;
    }
  }
  return undefined;
}

export function VendorAddModal({
  open,
  vendor,
  installedVendorId,
  isInstalled,
  onClose,
  onSuccess,
}: VendorAddModalProps) {
  const { token } = theme.useToken();
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm<Record<string, string>>();
  const [capability, setCapability] = useState<string>("LLM");
  const [submitting, setSubmitting] = useState(false);

  const fields = vendor?.config_schema?.fields ?? [];
  const caps = vendor?.capabilities ?? [];

  useEffect(() => {
    if (!open || !vendor) {
      return;
    }
    form.resetFields();
    const flds = vendor.config_schema?.fields ?? [];
    const c = vendor.capabilities ?? [];
    const cap = capabilityFromDefaultModelType(vendor.default_model_type, c);
    setCapability(cap);
    const initial: Record<string, string> = {};
    const hasMt = flds.some((f) => f.key === "model_type");
    for (const f of flds) {
      if (f.key === "model_type" && hasMt) {
        initial[f.key] = modelTypeFromCapability(cap);
      } else if (vendor.base_url && f.key === "base_url") {
        initial[f.key] = vendor.base_url;
      }
    }
    form.setFieldsValue(initial);
  }, [open, vendor, form]);

  const handleCapabilityChange = (cap: string) => {
    setCapability(cap);
    const flds = vendor?.config_schema?.fields ?? [];
    if (flds.some((f) => f.key === "model_type")) {
      form.setFieldValue("model_type", modelTypeFromCapability(cap));
    }
  };

  const handleOk = async () => {
    if (!vendor) {
      return;
    }
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const raw = form.getFieldsValue(true) as Record<string, string>;
    const body = buildPatchVendorBody(raw, fields);

    setSubmitting(true);
    try {
      if (!isInstalled) {
        const data = await installVendor(vendor.code);
        const newId = parseInstallId(data);
        const targetId = newId ?? vendor.code;
        await patchVendorConfig(targetId, body);
      } else {
        const targetId = installedVendorId ?? vendor.code;
        await patchVendorConfig(targetId, body);
      }
      onSuccess();
      onClose();
      form.resetFields();
    } catch (e) {
      const text = e instanceof Error ? e.message : "保存失败";
      messageApi.error(text);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  if (!vendor) {
    return null;
  }

  return (
    <Modal
      key={vendor.code}
      title={
        <Space size={8}>
          {vendor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded text-xs font-semibold"
              style={{ background: token.colorFillSecondary, color: token.colorText }}
            >
              {vendor.name.slice(0, 1)}
            </div>
          )}
          <Typography.Text strong>{vendor.name}</Typography.Text>
          {vendor.website_url ? (
            <a href={vendor.website_url} target="_blank" rel="noreferrer" aria-label="官网">
              <ExportOutlined />
            </a>
          ) : null}
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      width={520}
      destroyOnHidden
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={submitting} onClick={() => void handleOk()}>
            保存
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" className="!mt-2">
        {caps.length > 0 ? (
          <Form.Item label="模型类型（能力）" required>
            <Select
              value={capability}
              options={caps.map((c) => ({ label: c, value: c }))}
              onChange={(v) => handleCapabilityChange(String(v))}
            />
          </Form.Item>
        ) : null}

        {fields.map((f) => {
          const rules = f.required
            ? [{ required: true, message: `请填写${f.label}` }]
            : undefined;
          const placeholder =
            f.placeholder ??
            (f.field_type === "password" ? `请输入 ${f.label}` : undefined);

          if (f.field_type === "password") {
            return (
              <Form.Item key={f.key} name={f.key} label={f.label} rules={rules}>
                <Input.Password placeholder={placeholder} autoComplete="off" />
              </Form.Item>
            );
          }

          return (
            <Form.Item key={f.key} name={f.key} label={f.label} rules={rules}>
              <Input placeholder={placeholder} autoComplete="off" />
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
}
